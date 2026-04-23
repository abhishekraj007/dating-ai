import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../../_generated/server";
import { authComponent } from "../../lib/betterAuth";
import { buildAiProfileAvatarUrl } from "../../lib/aiProfileAvatar";

const appLanguageValidator = v.union(
  v.literal("en"),
  v.literal("es"),
  v.literal("fr"),
  v.literal("de"),
  v.literal("pt"),
  v.literal("hi"),
  v.literal("ja"),
  v.literal("ko"),
  v.literal("zh"),
  v.literal("ar"),
);

/**
 * Get user preferences for AI profile matching.
 */
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return preferences ?? null;
  },
});

/**
 * Get selected app language for the authenticated user.
 */
export const getUserAppLanguage = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return preferences?.appLanguage ?? null;
  },
});

/**
 * Save selected app language for the authenticated user.
 */
export const setUserAppLanguage = mutation({
  args: {
    appLanguage: appLanguageValidator,
  },
  handler: async (ctx, { appLanguage }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, {
        appLanguage,
        updatedAt: Date.now(),
      });
      return existingPreferences._id;
    }

    return await ctx.db.insert("userPreferences", {
      userId: user._id,
      appLanguage,
      genderPreference: "female",
      ageMin: 18,
      ageMax: 35,
      zodiacPreferences: [],
      interestPreferences: [],
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save/update user preferences.
 */
export const saveUserPreferences = mutation({
  args: {
    genderPreference: v.union(
      v.literal("female"),
      v.literal("male"),
      v.literal("both"),
    ),
    ageMin: v.number(),
    ageMax: v.number(),
    zodiacPreferences: v.array(v.string()),
    interestPreferences: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existingPreferences._id;
    }

    return await ctx.db.insert("userPreferences", {
      userId: user._id,
      ...args,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Record a profile interaction (like/skip).
 */
export const recordProfileInteraction = mutation({
  args: {
    aiProfileId: v.id("aiProfiles"),
    action: v.union(
      v.literal("like"),
      v.literal("skip"),
      v.literal("superlike"),
    ),
  },
  handler: async (ctx, { aiProfileId, action }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if interaction already exists
    const existingInteraction = await ctx.db
      .query("profileInteractions")
      .withIndex("by_user_and_profile", (q) =>
        q.eq("userId", user._id).eq("aiProfileId", aiProfileId),
      )
      .unique();

    if (existingInteraction) {
      // Update existing interaction
      await ctx.db.patch(existingInteraction._id, {
        action,
        createdAt: Date.now(),
      });
      return existingInteraction._id;
    }

    // Create new interaction
    return await ctx.db.insert("profileInteractions", {
      userId: user._id,
      aiProfileId,
      action,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get profiles for the "For You" feed based on user preferences.
 * Excludes profiles the user has already interacted with.
 * For unauthenticated users, returns profiles with default preferences.
 */
export const getForYouProfiles = query({
  args: {
    limit: v.optional(v.number()),
    platform: v.optional(
      v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    ),
  },
  handler: async (ctx, { limit = 20, platform }) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    // Default preferences
    let genderPreference: "female" | "male" | "both" = "female";
    let ageMin = 18;
    let ageMax = 99;
    let zodiacPreferences: string[] = [];
    let interestPreferences: string[] = [];
    let interactedProfileIds = new Set<string>();
    let conversationProfileIds = new Set<string>();
    let userId: string | null = null;

    // If user is authenticated, load their preferences and exclusions
    if (user) {
      userId = user._id;

      // Get user preferences
      const preferences = await ctx.db
        .query("userPreferences")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      // Override defaults with user preferences if set
      genderPreference = preferences?.genderPreference ?? "female";
      ageMin = preferences?.ageMin ?? 18;
      ageMax = preferences?.ageMax ?? 99;
      zodiacPreferences = preferences?.zodiacPreferences ?? [];
      interestPreferences = preferences?.interestPreferences ?? [];

      // Get all profile IDs the user has already interacted with
      const interactions = await ctx.db
        .query("profileInteractions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      interactedProfileIds = new Set(
        interactions.map((i) => i.aiProfileId.toString()),
      );

      // Get all profile IDs the user already has conversations with
      const conversations = await ctx.db
        .query("aiConversations")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      conversationProfileIds = new Set(
        conversations.map((c) => c.aiProfileId.toString()),
      );
    }

    // Query profiles based on gender preference
    const scanLimit = Math.max(limit * 6, 120);
    const allProfiles =
      genderPreference !== "both"
        ? await ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) =>
              q.eq("status", "active").eq("gender", genderPreference),
            )
            .order("desc")
            .take(scanLimit)
        : await ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) => q.eq("status", "active"))
            .order("desc")
            .take(scanLimit);

    // Filter profiles
    const filteredProfiles = allProfiles.filter((profile) => {
      // Only apply user-specific filters if authenticated
      if (user) {
        // Exclude already interacted profiles
        if (interactedProfileIds.has(profile._id.toString())) {
          return false;
        }

        // Exclude profiles user already has conversations with
        if (conversationProfileIds.has(profile._id.toString())) {
          return false;
        }

        // Exclude user's own created profiles
        if (profile.createdByUserId === userId) {
          return false;
        }
      }

      // Age filter (applies to all users)
      if (profile.age) {
        if (profile.age < ageMin || profile.age > ageMax) {
          return false;
        }
      }

      // Platform visibility filter.
      // Backward compatibility: missing visibleOn means visible on all platforms.
      if (
        platform &&
        profile.visibleOn &&
        profile.visibleOn.length > 0 &&
        !profile.visibleOn.includes(platform)
      ) {
        return false;
      }

      // Zodiac filter (if preferences set)
      if (zodiacPreferences.length > 0 && profile.zodiacSign) {
        if (!zodiacPreferences.includes(profile.zodiacSign)) {
          return false;
        }
      }

      // Interest filter (if preferences set) - match at least one
      if (interestPreferences.length > 0 && profile.interests) {
        const hasMatchingInterest = profile.interests.some((interest) =>
          interestPreferences.includes(interest),
        );
        if (!hasMatchingInterest) {
          return false;
        }
      }

      return true;
    });

    // Take limited number and generate signed URLs
    const limitedProfiles = filteredProfiles.slice(0, limit);

    return Promise.all(
      limitedProfiles.map(async (profile) => {
        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
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
 * Get user's liked profiles.
 */
export const getLikedProfiles = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const likes = await ctx.db
      .query("profileInteractions")
      .withIndex("by_user_and_action", (q) =>
        q.eq("userId", user._id).eq("action", "like"),
      )
      .collect();

    const profiles = await Promise.all(
      likes.map(async (like) => {
        const profile = await ctx.db.get(like.aiProfileId);
        if (!profile) return null;

        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
        );

        return {
          ...profile,
          avatarUrl,
          likedAt: like.createdAt,
        };
      }),
    );

    return profiles.filter(Boolean);
  },
});

/**
 * Get profiles for the Explore screen based on user preferences.
 * Does NOT exclude profiles the user has interacted with (unlike For You).
 * For unauthenticated users, returns profiles with default preferences.
 */
export const getExploreProfiles = query({
  args: {
    limit: v.optional(v.number()),
    platform: v.optional(
      v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    ),
    genderPreference: v.optional(
      v.union(v.literal("female"), v.literal("male"), v.literal("both")),
    ),
    ageMin: v.optional(v.number()),
    ageMax: v.optional(v.number()),
    zodiacPreferences: v.optional(v.array(v.string())),
    interestPreferences: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    {
      limit = 50,
      platform,
      genderPreference: overrideGender,
      ageMin: overrideAgeMin,
      ageMax: overrideAgeMax,
      zodiacPreferences: overrideZodiac,
      interestPreferences: overrideInterests,
    },
  ) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    // Default preferences
    let genderPreference: "female" | "male" | "both" = "female";
    let ageMin = 18;
    let ageMax = 99;
    let zodiacPreferences: string[] = [];
    let interestPreferences: string[] = [];
    let userId: string | null = null;

    // Filter precedence:
    // 1. Explicit arguments (overrides)
    // 2. Database preferences (if authenticated)
    // 3. Defaults

    // If user is authenticated, load their preferences
    if (user) {
      userId = user._id;

      // Get user preferences
      const preferences = await ctx.db
        .query("userPreferences")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      // Override defaults with user preferences if set
      if (preferences) {
        genderPreference = preferences.genderPreference;
        ageMin = preferences.ageMin;
        ageMax = preferences.ageMax;
        zodiacPreferences = preferences.zodiacPreferences;
        interestPreferences = preferences.interestPreferences;
      }
    }

    // Apply strict overrides if provided (e.g. from unauthenticated client state)
    if (overrideGender) genderPreference = overrideGender;
    if (overrideAgeMin !== undefined) ageMin = overrideAgeMin;
    if (overrideAgeMax !== undefined) ageMax = overrideAgeMax;
    if (overrideZodiac) zodiacPreferences = overrideZodiac;
    if (overrideInterests) interestPreferences = overrideInterests;

    // Query profiles based on gender preference
    const scanLimit = Math.max(limit * 5, 150);
    const allProfiles =
      genderPreference !== "both"
        ? await ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) =>
              q.eq("status", "active").eq("gender", genderPreference),
            )
            .order("desc")
            .take(scanLimit)
        : await ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) => q.eq("status", "active"))
            .order("desc")
            .take(scanLimit);

    // Filter profiles
    const filteredProfiles = allProfiles.filter((profile) => {
      // Exclude user's own created profiles
      if (user && profile.createdByUserId === userId) {
        return false;
      }

      // Age filter (applies to all users)
      if (profile.age) {
        if (profile.age < ageMin || profile.age > ageMax) {
          return false;
        }
      }

      // Platform visibility filter.
      // Backward compatibility: missing visibleOn means visible on all platforms.
      if (
        platform &&
        profile.visibleOn &&
        profile.visibleOn.length > 0 &&
        !profile.visibleOn.includes(platform)
      ) {
        return false;
      }

      // Zodiac filter (if preferences set)
      if (zodiacPreferences.length > 0 && profile.zodiacSign) {
        if (!zodiacPreferences.includes(profile.zodiacSign)) {
          return false;
        }
      }

      // Interest filter (if preferences set) - match at least one
      if (interestPreferences.length > 0 && profile.interests) {
        const hasMatchingInterest = profile.interests.some((interest) =>
          interestPreferences.includes(interest),
        );
        if (!hasMatchingInterest) {
          return false;
        }
      }

      return true;
    });

    // Take limited number and generate signed URLs
    const limitedProfiles = filteredProfiles.slice(0, limit);

    return Promise.all(
      limitedProfiles.map(async (profile) => {
        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
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
 * Paginated version of getExploreProfiles for infinite scroll.
 * Uses Convex cursor-based pagination with post-fetch filtering.
 */
export const getExploreProfilesPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    viewerKind: v.optional(
      v.union(v.literal("authenticated"), v.literal("anonymous")),
    ),
    platform: v.optional(
      v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    ),
    genderPreference: v.optional(
      v.union(v.literal("female"), v.literal("male"), v.literal("both")),
    ),
    ageMin: v.optional(v.number()),
    ageMax: v.optional(v.number()),
    zodiacPreferences: v.optional(v.array(v.string())),
    interestPreferences: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    {
      paginationOpts,
      viewerKind: _viewerKind,
      platform,
      genderPreference: overrideGender,
      ageMin: overrideAgeMin,
      ageMax: overrideAgeMax,
      zodiacPreferences: overrideZodiac,
      interestPreferences: overrideInterests,
    },
  ) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    let genderPreference: "female" | "male" | "both" | undefined;
    let ageMin: number | undefined;
    let ageMax: number | undefined;
    let zodiacPreferences: string[] = [];
    let interestPreferences: string[] = [];
    let userId: string | null = null;

    if (user) {
      userId = user._id;
      const preferences = await ctx.db
        .query("userPreferences")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      if (preferences) {
        genderPreference = preferences.genderPreference;
        ageMin = preferences.ageMin;
        ageMax = preferences.ageMax;
        zodiacPreferences = preferences.zodiacPreferences;
        interestPreferences = preferences.interestPreferences;
      }
    }

    if (overrideGender) genderPreference = overrideGender;
    if (overrideAgeMin !== undefined) ageMin = overrideAgeMin;
    if (overrideAgeMax !== undefined) ageMax = overrideAgeMax;
    if (overrideZodiac) zodiacPreferences = overrideZodiac;
    if (overrideInterests) interestPreferences = overrideInterests;

    const dbQuery =
      genderPreference && genderPreference !== "both"
        ? ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) =>
              q.eq("status", "active").eq("gender", genderPreference),
            )
            .order("desc")
        : ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) => q.eq("status", "active"))
            .order("desc");

    const result = await dbQuery.paginate(paginationOpts);

    const filteredPage = result.page.filter((profile) => {
      if (user && profile.createdByUserId === userId) return false;
      if (profile.age !== undefined && profile.age !== null) {
        if (ageMin !== undefined && profile.age < ageMin) return false;
        if (ageMax !== undefined && profile.age > ageMax) return false;
      }
      if (
        platform &&
        profile.visibleOn &&
        profile.visibleOn.length > 0 &&
        !profile.visibleOn.includes(platform)
      )
        return false;
      if (zodiacPreferences.length > 0 && profile.zodiacSign) {
        if (!zodiacPreferences.includes(profile.zodiacSign)) return false;
      }
      if (interestPreferences.length > 0 && profile.interests) {
        if (
          !profile.interests.some((interest) =>
            interestPreferences.includes(interest),
          )
        )
          return false;
      }
      return true;
    });

    const pageWithUrls = await Promise.all(
      filteredPage.map(async (profile) => {
        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
        );
        return { ...profile, avatarUrl };
      }),
    );

    return {
      ...result,
      page: pageWithUrls,
    };
  },
});

/**
 * Paginated version of getForYouProfiles for infinite scroll.
 * Uses Convex cursor-based pagination with post-fetch filtering.
 * Excludes profiles the user has already interacted with.
 */
export const getForYouProfilesPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    platform: v.optional(
      v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    ),
    genderPreference: v.optional(
      v.union(v.literal("female"), v.literal("male"), v.literal("both")),
    ),
    ageMin: v.optional(v.number()),
    ageMax: v.optional(v.number()),
    zodiacPreferences: v.optional(v.array(v.string())),
    interestPreferences: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    {
      paginationOpts,
      platform,
      genderPreference: requestedGenderPreference,
      ageMin: requestedAgeMin,
      ageMax: requestedAgeMax,
      zodiacPreferences: requestedZodiacPreferences,
      interestPreferences: requestedInterestPreferences,
    },
  ) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    let genderPreference: "female" | "male" | "both" = "female";
    let ageMin = 18;
    let ageMax = 99;
    let zodiacPreferences: string[] = [];
    let interestPreferences: string[] = [];
    let userId: string | null = null;

    if (user) {
      userId = user._id;

      const preferences = await ctx.db
        .query("userPreferences")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      genderPreference = preferences?.genderPreference ?? "female";
      ageMin = preferences?.ageMin ?? 18;
      ageMax = preferences?.ageMax ?? 99;
      zodiacPreferences = preferences?.zodiacPreferences ?? [];
      interestPreferences = preferences?.interestPreferences ?? [];
    }

    genderPreference = requestedGenderPreference ?? genderPreference;
    ageMin = requestedAgeMin ?? ageMin;
    ageMax = requestedAgeMax ?? ageMax;
    zodiacPreferences = requestedZodiacPreferences ?? zodiacPreferences;
    interestPreferences = requestedInterestPreferences ?? interestPreferences;

    const dbQuery =
      genderPreference !== "both"
        ? ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) =>
              q.eq("status", "active").eq("gender", genderPreference),
            )
            .order("desc")
        : ctx.db
            .query("aiProfiles")
            .withIndex("by_status_and_gender", (q) => q.eq("status", "active"))
            .order("desc");

    const result = await dbQuery.paginate(paginationOpts);

    const includeMask = await Promise.all(
      result.page.map(async (profile) => {
        if (user) {
          if (profile.createdByUserId === userId) return false;

          const [interaction, conversation] = await Promise.all([
            ctx.db
              .query("profileInteractions")
              .withIndex("by_user_and_profile", (q) =>
                q.eq("userId", user._id).eq("aiProfileId", profile._id),
              )
              .unique(),
            ctx.db
              .query("aiConversations")
              .withIndex("by_user_and_profile", (q) =>
                q.eq("userId", user._id).eq("aiProfileId", profile._id),
              )
              .unique(),
          ]);

          if (interaction || conversation) return false;
        }

        if (profile.age && (profile.age < ageMin || profile.age > ageMax))
          return false;
        if (
          platform &&
          profile.visibleOn &&
          profile.visibleOn.length > 0 &&
          !profile.visibleOn.includes(platform)
        )
          return false;
        if (zodiacPreferences.length > 0 && profile.zodiacSign) {
          if (!zodiacPreferences.includes(profile.zodiacSign)) return false;
        }
        if (interestPreferences.length > 0 && profile.interests) {
          if (
            !profile.interests.some((interest) =>
              interestPreferences.includes(interest),
            )
          )
            return false;
        }

        return true;
      }),
    );

    const filteredPage = result.page.filter((_, index) => includeMask[index]);

    const pageWithUrls = await Promise.all(
      filteredPage.map(async (profile) => {
        const avatarUrl = buildAiProfileAvatarUrl(
          profile._id,
          profile.avatarImageKey,
        );
        return { ...profile, avatarUrl };
      }),
    );

    return {
      ...result,
      page: pageWithUrls,
    };
  },
});

/**
 * Check if user has completed onboarding.
 */
export const hasCompletedOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return false;
    }

    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    return profile?.hasCompletedOnboarding ?? false;
  },
});

/**
 * Mark onboarding as complete.
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        hasCompletedOnboarding: true,
      });
    }
  },
});
