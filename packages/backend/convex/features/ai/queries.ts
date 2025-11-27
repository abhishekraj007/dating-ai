import { v } from "convex/values";
import { query } from "../../_generated/server";
import { components } from "../../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { r2 } from "../../uploads";
import { authComponent } from "../../lib/betterAuth";

/**
 * Get all active AI profiles with optional gender filter.
 * Returns profiles with signed image URLs.
 * Can optionally exclude profiles the user already has conversations with.
 */
export const getProfiles = query({
  args: {
    gender: v.optional(v.union(v.literal("female"), v.literal("male"))),
    limit: v.optional(v.number()),
    excludeExistingConversations: v.optional(v.boolean()),
  },
  handler: async (ctx, { gender, limit, excludeExistingConversations }) => {
    let profilesQuery = ctx.db
      .query("aiProfiles")
      .withIndex("by_status_and_gender", (q) => {
        if (gender) {
          return q.eq("status", "active").eq("gender", gender);
        }
        return q.eq("status", "active");
      });

    let profiles = await profilesQuery.take(limit ?? 50);

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
          conversations.map((c) => c.aiProfileId.toString())
        );

        // Filter out profiles that already have conversations
        profiles = profiles.filter(
          (p) => !conversationProfileIds.has(p._id.toString())
        );
      }
    }

    // Generate signed URLs for avatars
    return Promise.all(
      profiles.map(async (profile) => {
        const avatarUrl = profile.avatarImageKey
          ? await r2.getUrl(profile.avatarImageKey)
          : null;
        return {
          ...profile,
          avatarUrl,
        };
      })
    );
  },
});

/**
 * Get a single AI profile by ID with all images.
 */
export const getProfile = query({
  args: {
    profileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.db.get(profileId);
    if (!profile || profile.status !== "active") {
      return null;
    }

    // Get signed URLs for all images
    const avatarUrl = profile.avatarImageKey
      ? await r2.getUrl(profile.avatarImageKey)
      : null;

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
    gender: v.optional(v.union(v.literal("female"), v.literal("male"))),
  },
  handler: async (ctx, { gender }) => {
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
        const avatarUrl = profile.avatarImageKey
          ? await r2.getUrl(profile.avatarImageKey)
          : null;
        return {
          ...profile,
          avatarUrl,
        };
      })
    );
  },
});

/**
 * Get user's conversations (chat list).
 */
export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
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

        const avatarUrl = profile.avatarImageKey
          ? await r2.getUrl(profile.avatarImageKey)
          : null;

        // Get last message from agent thread
        const messagesResult = await ctx.runQuery(
          components.agent.messages.listMessagesByThreadId,
          {
            threadId: conv.threadId,
            order: "desc",
            paginationOpts: { numItems: 1, cursor: null },
          }
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
      })
    ).then((results) => results.filter(Boolean));
  },
});

/**
 * Get a single conversation by ID.
 */
export const getConversation = query({
  args: {
    conversationId: v.id("aiConversations"),
  },
  handler: async (ctx, { conversationId }) => {
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

    const avatarUrl = profile.avatarImageKey
      ? await r2.getUrl(profile.avatarImageKey)
      : null;

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
        q.eq("userId", user._id).eq("aiProfileId", aiProfileId)
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

    return { ...paginated, streams };
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
        streams: { deltas: [], cursors: {} },
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

    return { ...paginated, streams };
  },
});

/**
 * Admin: Get all system-created AI profiles (not user-created).
 * Returns profiles with signed image URLs.
 */
export const getSystemProfiles = query({
  args: {},
  handler: async (ctx) => {
    // Get all profiles that are not user-created
    const profiles = await ctx.db.query("aiProfiles").collect();

    // Filter to only system profiles (not user-created)
    const systemProfiles = profiles.filter((p) => !p.isUserCreated);

    // Generate signed URLs for avatars and gallery images
    return Promise.all(
      systemProfiles.map(async (profile) => {
        const avatarUrl = profile.avatarImageKey
          ? await r2.getUrl(profile.avatarImageKey)
          : null;

        const profileImageUrls = profile.profileImageKeys
          ? await Promise.all(
              profile.profileImageKeys.map((key) => r2.getUrl(key))
            )
          : [];

        return {
          ...profile,
          avatarUrl,
          profileImageUrls,
        };
      })
    );
  },
});

/**
 * Get active quiz session for a conversation.
 */
export const getActiveQuiz = query({
  args: {
    conversationId: v.id("aiConversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      return null;
    }

    const quiz = await ctx.db
      .query("quizSessions")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", conversationId).eq("status", "active")
      )
      .first();

    return quiz;
  },
});

/**
 * Get quiz session by ID.
 */
export const getQuiz = query({
  args: {
    quizId: v.id("quizSessions"),
  },
  handler: async (ctx, { quizId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const quiz = await ctx.db.get(quizId);
    if (!quiz || quiz.userId !== user._id) {
      return null;
    }

    return quiz;
  },
});
