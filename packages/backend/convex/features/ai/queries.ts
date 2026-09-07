import { v } from "convex/values";
import { query, type QueryCtx } from "../../_generated/server";
import type { Doc } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { r2 } from "../../uploads";
import { authComponent } from "../../lib/betterAuth";
import {
  avatarImageQueryArgs,
  buildAiProfileAvatarUrl,
} from "../../lib/aiProfileAvatar";
import { getPremiumAccessSnapshot } from "../premium/guards";
import {
  ETHNICITIES,
  ethnicityMatchesFilters,
  type Ethnicity,
} from "./profileGenerationData";
import {
  isReservedPublicProfileUsername,
  normalizePublicProfileUsername,
} from "./publicProfileUsernames";
import { activeProfilesDiscoverQuery } from "./discoverQuery";
import {
  buildMediaFailedContent,
  buildMediaProcessingContent,
  buildMediaResponseContent,
} from "./chatMediaPlaceholders";

function sanitizeStructuredMessage(
  value: string | undefined,
  allowProtectedMedia: boolean,
) {
  if (!value || allowProtectedMedia) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed?.type === "image_response" && typeof parsed === "object") {
      const sanitized = { ...parsed };
      delete sanitized.imageUrl;
      return JSON.stringify(sanitized);
    }
    if (parsed?.type === "video_response" && typeof parsed === "object") {
      const sanitized = { ...parsed };
      delete sanitized.videoUrl;
      delete sanitized.posterUrl;
      return JSON.stringify(sanitized);
    }
  } catch {
    // Plain text content should be returned unchanged.
  }

  return value;
}

function sanitizeAgentMessage<T extends { text?: string; parts?: Array<any> }>(
  message: T,
  allowProtectedMedia: boolean,
) {
  if (allowProtectedMedia) {
    return message;
  }

  return {
    ...message,
    text: sanitizeStructuredMessage(message.text, allowProtectedMedia),
    parts: message.parts?.map((part) => ({
      ...part,
      text:
        typeof part?.text === "string"
          ? sanitizeStructuredMessage(part.text, allowProtectedMedia)
          : part?.text,
      output:
        typeof part?.output === "string"
          ? sanitizeStructuredMessage(part.output, allowProtectedMedia)
          : part?.output,
    })),
  };
}

type WebVisibleProfile = {
  visibleOn?: Array<"web" | "ios" | "android">;
};

function isVisibleOnWeb(profile: WebVisibleProfile) {
  if (!profile.visibleOn || profile.visibleOn.length === 0) {
    return true;
  }

  return profile.visibleOn.includes("web");
}

/**
 * Get all active AI profiles with optional gender filter.
 * Returns profiles with signed image URLs.
 * Can optionally exclude profiles the user already has conversations with.
 */
export const getProfiles = query({
  args: {
    ...avatarImageQueryArgs,
    gender: v.optional(v.union(v.literal("female"), v.literal("male"))),
    limit: v.optional(v.number()),
    excludeExistingConversations: v.optional(v.boolean()),
    platform: v.optional(
      v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    ),
  },
  handler: async (
    ctx,
    {
      gender,
      limit,
      excludeExistingConversations,
      platform,
      imageWidth,
      imageQuality,
    },
  ) => {
    let profilesQuery = ctx.db
      .query("aiProfiles")
      .withIndex("by_status_and_gender", (q) => {
        if (gender) {
          return q.eq("status", "active").eq("gender", gender);
        }
        return q.eq("status", "active");
      });

    let profiles = await profilesQuery.order("desc").take(limit ?? 50);

    // Optionally filter out profiles the user already has conversations with
    if (excludeExistingConversations) {
      const user = await authComponent.safeGetAuthUser(ctx);
      if (user) {
        // Get all conversations for this user
        const conversations = await ctx.db
          .query("aiConversations")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const conversationProfileIds = new Set(
          conversations.map((c) => c.aiProfileId.toString()),
        );

        // Filter out profiles that already have conversations
        profiles = profiles.filter(
          (p) => !conversationProfileIds.has(p._id.toString()),
        );
      }
    }

    const visibleProfiles = profiles.filter((profile) => {
      if (!platform) return true;
      // Backward compatibility: if unset, assume visible everywhere.
      if (!profile.visibleOn || profile.visibleOn.length === 0) return true;
      return profile.visibleOn.includes(platform);
    });

    // Generate signed URLs for avatars
    return Promise.all(
      visibleProfiles.map(async (profile) => {
        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
          { imageWidth, imageQuality },
        );
        return {
          ...profile,
          avatarUrl,
        };
      }),
    );
  },
});

const onboardingCharacterValidator = v.object({
  _id: v.id("aiProfiles"),
  name: v.string(),
  gender: v.union(v.literal("female"), v.literal("male")),
  age: v.union(v.number(), v.null()),
  avatarUrl: v.union(v.string(), v.null()),
  tagline: v.string(),
  occupation: v.union(v.string(), v.null()),
  personalityTraits: v.array(v.string()),
  isTrending: v.boolean(),
});

export const getOnboardingCharacters = query({
  args: {
    ...avatarImageQueryArgs,
    gender: v.optional(
      v.union(v.literal("female"), v.literal("male"), v.literal("both")),
    ),
    platform: v.optional(
      v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(onboardingCharacterValidator),
  handler: async (ctx, { gender, platform, limit, imageWidth, imageQuality }) => {
    const takeCount = Math.min(limit ?? 6, 12);
    const genderFilter = gender === "both" ? undefined : gender;
    const profiles = await activeProfilesDiscoverQuery(ctx, genderFilter).take(
      40,
    );

    const visibleProfiles = profiles.filter((profile) => {
      if (!platform) {
        return true;
      }
      if (!profile.visibleOn || profile.visibleOn.length === 0) {
        return true;
      }
      return profile.visibleOn.includes(platform);
    });

    const trendingProfiles = visibleProfiles.filter(
      (profile) => profile.isTrending === true,
    );
    const pool =
      trendingProfiles.length > 0 ? trendingProfiles : visibleProfiles;

    return pool.slice(0, takeCount).map((profile) => {
      const taglineSource =
        profile.occupation ??
        profile.bio ??
        profile.relationshipGoal ??
        profile.personalityTraits?.[0] ??
        "Ready to talk whenever you are.";

      return {
        _id: profile._id,
        name: profile.name,
        gender: profile.gender,
        age: profile.age ?? null,
        avatarUrl: buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
          { imageWidth, imageQuality },
        ),
        tagline: taglineSource,
        occupation: profile.occupation ?? null,
        personalityTraits: profile.personalityTraits ?? [],
        isTrending: profile.isTrending === true,
      };
    });
  },
});

export const getPublicProfiles = query({
  args: {
    ...avatarImageQueryArgs,
    gender: v.optional(v.union(v.literal("female"), v.literal("male"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiProfiles"),
      _creationTime: v.number(),
      name: v.string(),
      username: v.union(v.string(), v.null()),
      gender: v.union(v.literal("female"), v.literal("male")),
      age: v.union(v.number(), v.null()),
      avatarUrl: v.union(v.string(), v.null()),
      tagline: v.string(),
      interests: v.array(v.string()),
      occupation: v.union(v.string(), v.null()),
      zodiacSign: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, { gender, limit, imageWidth, imageQuality }) => {
    const profiles = await activeProfilesDiscoverQuery(ctx, gender).take(
      limit ?? 24,
    );

    return profiles
      .filter(isVisibleOnWeb)
      .map((profile) => {
        const taglineSource =
          profile.bio ??
          profile.relationshipGoal ??
          profile.occupation ??
          profile.interests?.[0] ??
          "Start a conversation and see where it goes.";

        return {
          _id: profile._id,
          _creationTime: profile._creationTime,
          name: profile.name,
          username: profile.username ?? null,
          gender: profile.gender,
          age: profile.age ?? null,
          avatarUrl: buildAiProfileAvatarUrl(
            profile._id,
            profile.avatarImageKey,
            { imageWidth, imageQuality },
          ),
          tagline: taglineSource,
          interests: profile.interests ?? [],
          occupation: profile.occupation ?? null,
          zodiacSign: profile.zodiacSign ?? null,
        };
      });
  },
});

export const getPublicSitemapProfiles = query({
  args: {},
  returns: v.array(
    v.object({
      username: v.string(),
      gender: v.union(v.literal("female"), v.literal("male")),
      lastModified: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("aiProfiles")
      .withIndex("by_status_and_gender", (q) => q.eq("status", "active"))
      .order("desc")
      .take(2000);

    return profiles
      .filter(isVisibleOnWeb)
      .flatMap((profile) => {
        const username = normalizePublicProfileUsername(profile.username ?? "");

        if (isReservedPublicProfileUsername(username)) {
          return [];
        }

        return [
          {
            username,
            gender: profile.gender,
            lastModified: profile.createdAt ?? profile._creationTime,
          },
        ];
      });
  },
});

export const getPublicProfilesPaginated = query({
  args: {
    ...avatarImageQueryArgs,
    genderPreference: v.optional(
      v.union(v.literal("female"), v.literal("male"), v.literal("both")),
    ),
    ageMin: v.optional(v.number()),
    ageMax: v.optional(v.number()),
    zodiacPreferences: v.optional(v.array(v.string())),
    interestPreferences: v.optional(v.array(v.string())),
    ethnicityPreferences: v.optional(v.array(v.string())),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    {
      genderPreference,
      ageMin,
      ageMax,
      zodiacPreferences,
      interestPreferences,
      ethnicityPreferences,
      paginationOpts,
      imageWidth,
      imageQuality,
    },
  ) => {
    const normalizedEthnicityPreferences = (ethnicityPreferences ?? []).filter(
      (ethnicity): ethnicity is Ethnicity =>
        (ETHNICITIES as readonly string[]).includes(ethnicity),
    );

    const profilesQuery = activeProfilesDiscoverQuery(
      ctx,
      genderPreference ?? "both",
    );

    const result = await profilesQuery.paginate(paginationOpts);

    return {
      ...result,
      page: result.page
        .filter((profile) => {
          if (!profile.visibleOn || profile.visibleOn.length === 0) {
            // Backward compatibility: if unset, assume visible on web.
          } else if (!profile.visibleOn.includes("web")) {
            return false;
          }

          if (profile.age !== undefined && profile.age !== null) {
            if (ageMin !== undefined && profile.age < ageMin) return false;
            if (ageMax !== undefined && profile.age > ageMax) return false;
          }

          if (
            zodiacPreferences &&
            zodiacPreferences.length > 0 &&
            profile.zodiacSign &&
            !zodiacPreferences.includes(profile.zodiacSign)
          ) {
            return false;
          }

          if (
            interestPreferences &&
            interestPreferences.length > 0 &&
            profile.interests &&
            !profile.interests.some((interest) =>
              interestPreferences.includes(interest),
            )
          ) {
            return false;
          }

          if (
            normalizedEthnicityPreferences.length > 0 &&
            !ethnicityMatchesFilters(
              profile.ethnicity as Ethnicity | undefined,
              normalizedEthnicityPreferences,
            )
          ) {
            return false;
          }

          return true;
        })
        .map((profile) => {
          const taglineSource =
            profile.bio ??
            profile.relationshipGoal ??
            profile.occupation ??
            profile.interests?.[0] ??
            "Start a conversation and see where it goes.";

          return {
            _id: profile._id,
            _creationTime: profile._creationTime,
            name: profile.name,
            username: profile.username ?? null,
            gender: profile.gender,
            age: profile.age ?? null,
            avatarUrl: buildAiProfileAvatarUrl(
              profile._id,
              profile.avatarImageKey,
              { imageWidth, imageQuality },
            ),
            tagline: taglineSource,
            interests: profile.interests ?? [],
            occupation: profile.occupation ?? null,
            zodiacSign: profile.zodiacSign ?? null,
          };
        }),
    };
  },
});

export const getPublicProfileByUsername = query({
  args: {
    ...avatarImageQueryArgs,
    username: v.string(),
  },
  handler: async (ctx, { username, imageWidth, imageQuality }) => {
    const normalizedUsername = normalizePublicProfileUsername(username);
    if (isReservedPublicProfileUsername(normalizedUsername)) {
      return null;
    }

    const profile = await ctx.db
      .query("aiProfiles")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .order("desc")
      .first();

    if (!profile || profile.status !== "active") {
      return null;
    }

    if (
      profile.visibleOn &&
      profile.visibleOn.length > 0 &&
      !profile.visibleOn.includes("web")
    ) {
      return null;
    }

    const avatarUrl = buildAiProfileAvatarUrl(
      profile._id,
      profile.avatarImageKey,
      { imageWidth, imageQuality },
    );

    return {
      ...profile,
      avatarUrl,
      profileImageKeys: profile.profileImageKeys ?? [],
    };
  },
});

export const getProfileImageUrl = query({
  args: {
    profileId: v.id("aiProfiles"),
    imageKey: v.string(),
  },
  handler: async (ctx, { profileId, imageKey }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const premiumState = await getPremiumAccessSnapshot(ctx);
    if (!premiumState.isPremium) {
      return null;
    }

    const profile = await ctx.db.get(profileId);
    if (
      !profile ||
      profile.status !== "active" ||
      !(profile.profileImageKeys ?? []).includes(imageKey)
    ) {
      return null;
    }

    try {
      return await r2.getUrl(imageKey);
    } catch {
      return null;
    }
  },
});

/**
 * Get a single AI profile by ID with all images.
 */
export const getProfile = query({
  args: {
    ...avatarImageQueryArgs,
    profileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { profileId, imageWidth, imageQuality }) => {
    const profile = await ctx.db.get(profileId);
    if (!profile || profile.status !== "active") {
      return null;
    }

    // Get signed URLs for all images
    const avatarUrl = buildAiProfileAvatarUrl(
      profile._id,
      profile.avatarImageKey,
      { imageWidth, imageQuality },
    );

    const profileImageUrls = profile.profileImageKeys
      ? await Promise.all(profile.profileImageKeys.map((key) => r2.getUrl(key)))
      : [];

    return {
      ...profile,
      avatarUrl,
      profileImageUrls,
    };
  },
});

/**
 * Get user's created AI profiles.
 */
export const getUserCreatedProfiles = query({
  args: {
    ...avatarImageQueryArgs,
    gender: v.optional(v.union(v.literal("female"), v.literal("male"))),
  },
  handler: async (ctx, { gender, imageWidth, imageQuality }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    let profiles = await ctx.db
      .query("aiProfiles")
      .withIndex("by_user", (q) => q.eq("createdByUserId", user._id))
      .collect();

    // Filter by gender if specified
    if (gender) {
      profiles = profiles.filter((p) => p.gender === gender);
    }

    // Filter out archived profiles
    profiles = profiles.filter((p) => p.status !== "archived");

    // Generate signed URLs
    return Promise.all(
      profiles.map(async (profile) => {
        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
          { imageWidth, imageQuality },
        );
        return {
          ...profile,
          avatarUrl,
        };
      }),
    );
  },
});

/**
 * Get user's conversations (chat list).
 */
export const getUserConversations = query({
  args: {
    ...avatarImageQueryArgs,
  },
  handler: async (ctx, { imageWidth, imageQuality }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const conversations = await ctx.db
      .query("aiConversations")
      .withIndex("by_user_and_last_message", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Enrich with profile data and last message
    return Promise.all(
      conversations.map(async (conv) => {
        const profile = await ctx.db.get(conv.aiProfileId);
        if (!profile) return null;

        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
          { imageWidth, imageQuality },
        );

        // Get last message from agent thread
        const messagesResult = await ctx.runQuery(
          components.agent.messages.listMessagesByThreadId,
          {
            threadId: conv.threadId,
            order: "desc",
            paginationOpts: { numItems: 1, cursor: null },
          },
        );

        const lastMessage = messagesResult.page[0];

        return {
          ...conv,
          profile: {
            _id: profile._id,
            name: profile.name,
            avatarUrl,
          },
          lastMessage: lastMessage
            ? {
              content:
                typeof lastMessage.text === "string" ? lastMessage.text : "",
              createdAt: lastMessage._creationTime,
            }
            : null,
        };
      }),
    ).then((results) => results.filter(Boolean));
  },
});

/**
 * Get a single conversation by ID.
 */
export const getConversation = query({
  args: {
    ...avatarImageQueryArgs,
    conversationId: v.id("aiConversations"),
  },
  handler: async (ctx, { conversationId, imageWidth, imageQuality }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      return null;
    }

    const profile = await ctx.db.get(conversation.aiProfileId);
    if (!profile) {
      return null;
    }

    const avatarUrl = buildAiProfileAvatarUrl(
      profile._id,
      profile.avatarImageKey,
      { imageWidth, imageQuality },
    );

    return {
      ...conversation,
      profile: {
        ...profile,
        avatarUrl,
      },
    };
  },
});

/**
 * Get conversation by AI profile ID (for checking if conversation exists).
 */
export const getConversationByProfile = query({
  args: {
    aiProfileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { aiProfileId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_user_and_profile", (q) =>
        q.eq("userId", user._id).eq("aiProfileId", aiProfileId),
      )
      .first();

    return conversation;
  },
});

/**
 * List messages in a conversation with streaming support.
 * Uses the Agent component's message system.
 */
export const getMessages = query({
  args: {
    conversationId: v.id("aiConversations"),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, { conversationId, paginationOpts, streamArgs }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const premiumState = await getPremiumAccessSnapshot(ctx);
    const allowProtectedMedia = premiumState.isPremium;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      return null;
    }

    // Create args object for Agent component
    const agentArgs = {
      threadId: conversation.threadId,
      paginationOpts,
      streamArgs,
    };

    // Fetch regular messages using Agent component
    const paginated = await listUIMessages(ctx, components.agent, agentArgs);

    // Fetch streaming deltas for real-time updates
    const streams = await syncStreams(ctx, components.agent, agentArgs);

    return {
      ...paginated,
      page: paginated.page.map((message) =>
        sanitizeAgentMessage(message, allowProtectedMedia),
      ),
      streams,
    };
  },
});

/**
 * List messages by threadId for use with useUIMessages hook.
 * Validates that the user owns the conversation associated with this thread.
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const premiumState = await getPremiumAccessSnapshot(ctx);
    const allowProtectedMedia = premiumState.isPremium;

    // Verify the user owns the conversation with this thread
    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .first();

    // If thread doesn't exist (e.g., after clear chat), return empty result
    // This prevents errors during the transition to a new thread
    if (!conversation || conversation.userId !== user._id) {
      return {
        page: [],
        continueCursor: "",
        isDone: true,
        streams: { kind: "deltas" as const, deltas: [], cursors: {} },
      };
    }

    // Create args object for Agent component
    const agentArgs = {
      threadId,
      paginationOpts,
      streamArgs,
    };

    // Fetch regular messages using Agent component
    const paginated = await listUIMessages(ctx, components.agent, agentArgs);

    // Fetch streaming deltas for real-time updates
    const streams = await syncStreams(ctx, components.agent, agentArgs);

    return {
      ...paginated,
      page: paginated.page.map((message) =>
        sanitizeAgentMessage(message, allowProtectedMedia),
      ),
      streams,
    };
  },
});

const ADMIN_PROFILE_STATUSES = ["active", "pending", "archived"] as const;

async function queryAdminSystemProfiles(
  ctx: QueryCtx,
  args: {
    statusFilter?: (typeof ADMIN_PROFILE_STATUSES)[number];
    genderFilter?: "female" | "male";
    trendingOnly: boolean;
    scanLimit: number;
  },
) {
  const { statusFilter, genderFilter, trendingOnly, scanLimit } = args;

  if (trendingOnly) {
    const statuses = statusFilter
      ? [statusFilter]
      : [...ADMIN_PROFILE_STATUSES];
    const pages: Doc<"aiProfiles">[][] = [];

    for (const status of statuses) {
      if (genderFilter) {
        pages.push(
          await ctx.db
            .query("aiProfiles")
            .withIndex("by_status_gender_trending_created", (q) =>
              q
                .eq("status", status)
                .eq("gender", genderFilter)
                .eq("isTrending", true),
            )
            .order("desc")
            .take(scanLimit),
        );
      } else {
        pages.push(
          await ctx.db
            .query("aiProfiles")
            .withIndex("by_status_trending_created", (q) =>
              q.eq("status", status).eq("isTrending", true),
            )
            .order("desc")
            .take(scanLimit),
        );
      }
    }

    return pages
      .flat()
      .sort((left, right) => right._creationTime - left._creationTime)
      .slice(0, scanLimit);
  }

  if (statusFilter && genderFilter) {
    return await ctx.db
      .query("aiProfiles")
      .withIndex("by_status_and_gender", (q) =>
        q.eq("status", statusFilter).eq("gender", genderFilter),
      )
      .order("desc")
      .take(scanLimit);
  }

  if (statusFilter) {
    return await ctx.db
      .query("aiProfiles")
      .withIndex("by_system_status_created_at", (q) =>
        q.eq("isUserCreated", false).eq("status", statusFilter),
      )
      .order("desc")
      .take(scanLimit);
  }

  if (genderFilter) {
    return await ctx.db
      .query("aiProfiles")
      .withIndex("by_gender", (q) => q.eq("gender", genderFilter))
      .order("desc")
      .take(scanLimit);
  }

  return await ctx.db
    .query("aiProfiles")
    .withIndex("by_system_created_at", (q) => q.eq("isUserCreated", false))
    .order("desc")
    .take(scanLimit);
}

/**
 * Admin: Get all system-created AI profiles (not user-created).
 * Returns profiles with signed image URLs.
 */
export const getSystemProfiles = query({
  args: {
    ...avatarImageQueryArgs,
    genderFilter: v.optional(v.union(v.literal("female"), v.literal("male"))),
    search: v.optional(v.string()),
    statusFilter: v.optional(
      v.union(v.literal("active"), v.literal("pending"), v.literal("archived")),
    ),
    trendingFilter: v.optional(v.boolean()),
    recentOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!userProfile?.isAdmin) {
      throw new Error("Admin access required");
    }

    const limit = Math.max(1, Math.min(args.limit ?? 80, 200));
    const search = args.search?.trim().toLowerCase();
    const hasSearch = Boolean(search);
    const recentCutoff = Date.now() - 24 * 60 * 60 * 1000;
    const scanLimit = Math.max(limit * (hasSearch ? 8 : 2), 160);

    const profiles = await queryAdminSystemProfiles(ctx, {
      statusFilter: args.statusFilter,
      genderFilter: args.genderFilter,
      trendingOnly: args.trendingFilter === true,
      scanLimit,
    });

    const filteredProfiles = profiles.filter((profile) => {
      if (profile.isUserCreated) return false;

      if (args.genderFilter && profile.gender !== args.genderFilter) {
        return false;
      }

      if (args.trendingFilter === true && profile.isTrending !== true) {
        return false;
      }

      if (args.trendingFilter === false && profile.isTrending === true) {
        return false;
      }

      if (args.recentOnly) {
        const createdAt = profile.createdAt ?? profile._creationTime;
        if (createdAt < recentCutoff) return false;
      }

      if (!hasSearch) return true;

      const haystack = [
        profile.name,
        profile.occupation ?? "",
        profile.bio ?? "",
        ...(profile.interests ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search!);
    });

    const systemProfiles = filteredProfiles.slice(0, limit);

    // Generate signed URLs for avatars and gallery images
    return Promise.all(
      systemProfiles.map(async (profile) => {
        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
          { imageWidth: args.imageWidth, imageQuality: args.imageQuality },
        );

        const profileImageUrls = profile.profileImageKeys
          ? await Promise.all(
            profile.profileImageKeys.map((key) => r2.getUrl(key)),
          )
          : [];

        return {
          ...profile,
          avatarUrl,
          profileImageUrls,
        };
      }),
    );
  },
});

/**
 * Authoritative media delivery state for a conversation.
 * Used by chat UI to replace hallucinated agent JSON with real request data.
 */
export const listConversationMediaDeliveries = query({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.array(
    v.object({
      requestId: v.string(),
      responseMessageId: v.optional(v.string()),
      createdAt: v.number(),
      content: v.string(),
    }),
  ),
  handler: async (ctx, { conversationId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const deliveries: {
      requestId: string;
      responseMessageId?: string;
      createdAt: number;
      content: string;
    }[] = [];

    const images = await ctx.db
      .query("chatImages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    for (const image of images) {
      if (image.status === "completed" && image.imageKey) {
        deliveries.push({
          requestId: image._id,
          responseMessageId: image.responseMessageId,
          createdAt: image._creationTime,
          content: buildMediaResponseContent("image", {
            requestId: image._id,
            prompt: image.prompt,
            imageKey: image.imageKey,
          }),
        });
        continue;
      }

      if (image.status === "failed") {
        deliveries.push({
          requestId: image._id,
          responseMessageId: image.responseMessageId,
          createdAt: image._creationTime,
          content: buildMediaFailedContent(
            "image",
            image._id,
            "Oops, I couldn't take that photo right now. My camera seems to be acting up! Can you ask me something else instead?",
          ),
        });
        continue;
      }

      if (image.status === "pending" || image.status === "processing") {
        deliveries.push({
          requestId: image._id,
          responseMessageId: image.responseMessageId,
          createdAt: image._creationTime,
          content: buildMediaProcessingContent("image", image._id, image.prompt),
        });
      }
    }

    const videos = await ctx.db
      .query("chatVideos")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    for (const video of videos) {
      if (video.status === "completed" && video.videoKey) {
        deliveries.push({
          requestId: video._id,
          responseMessageId: video.responseMessageId,
          createdAt: video._creationTime,
          content: buildMediaResponseContent("video", {
            requestId: video._id,
            prompt: video.prompt,
            videoKey: video.videoKey,
            posterKey: video.posterKey,
          }),
        });
        continue;
      }

      if (video.status === "failed") {
        deliveries.push({
          requestId: video._id,
          responseMessageId: video.responseMessageId,
          createdAt: video._creationTime,
          content: buildMediaFailedContent(
            "video",
            video._id,
            "Sorry, I couldn't record that video right now. My camera seems to be acting up! Can you ask me something else instead?",
          ),
        });
        continue;
      }

      if (video.status === "pending" || video.status === "processing") {
        deliveries.push({
          requestId: video._id,
          responseMessageId: video.responseMessageId,
          createdAt: video._creationTime,
          content: buildMediaProcessingContent("video", video._id, video.prompt),
        });
      }
    }

    deliveries.sort((a, b) => a.createdAt - b.createdAt);
    return deliveries;
  },
});

/**
 * Get a fresh signed URL for a chat image using its permanent imageKey.
 * Used when displaying images in chat to avoid expired URL issues.
 */
export const getChatImageUrl = query({
  args: {
    imageKey: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { imageKey }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    // Verify the imageKey belongs to this user's chat images.
    // imageKey format: chatImages/{userId}/{profileId}/{requestId}.{ext}
    const keyParts = imageKey.split("/");
    if (
      keyParts[0] !== "chatImages" ||
      keyParts.length < 4 ||
      keyParts[1] !== user._id
    ) {
      return null;
    }

    // Cross-check the chatImages table: a completed row owned by this user
    // must exist. This prevents any residual path where someone crafts a key
    // with the right prefix but no corresponding DB record.
    const chatImage = await ctx.db
      .query("chatImages")
      .withIndex("by_image_key", (q) => q.eq("imageKey", imageKey))
      .first();

    if (
      !chatImage ||
      chatImage.userId !== user._id ||
      chatImage.status !== "completed"
    ) {
      return null;
    }

    try {
      const signedUrl = await r2.getUrl(imageKey);
      return signedUrl;
    } catch {
      return null;
    }
  },
});

/**
 * Get a fresh signed URL for a chat video using its permanent videoKey.
 */
export const getChatVideoUrl = query({
  args: {
    videoKey: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { videoKey }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const keyParts = videoKey.split("/");
    if (
      keyParts[0] !== "chatVideos" ||
      keyParts.length < 4 ||
      keyParts[1] !== user._id
    ) {
      return null;
    }

    const chatVideo = await ctx.db
      .query("chatVideos")
      .withIndex("by_video_key", (q) => q.eq("videoKey", videoKey))
      .first();

    if (
      !chatVideo ||
      chatVideo.userId !== user._id ||
      chatVideo.status !== "completed"
    ) {
      return null;
    }

    try {
      const signedUrl = await r2.getUrl(videoKey);
      return signedUrl;
    } catch {
      return null;
    }
  },
});

/**
 * Get a fresh signed URL for a chat video poster using its permanent posterKey.
 */
export const getChatVideoPosterUrl = query({
  args: {
    posterKey: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { posterKey }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const keyParts = posterKey.split("/");
    if (
      keyParts[0] !== "chatVideoPosters" ||
      keyParts.length < 4 ||
      keyParts[1] !== user._id
    ) {
      return null;
    }

    const chatVideo = await ctx.db
      .query("chatVideos")
      .withIndex("by_poster_key", (q) => q.eq("posterKey", posterKey))
      .first();

    if (
      !chatVideo ||
      chatVideo.userId !== user._id ||
      chatVideo.status !== "completed"
    ) {
      return null;
    }

    try {
      const signedUrl = await r2.getUrl(posterKey);
      return signedUrl;
    } catch {
      return null;
    }
  },
});
