import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { authComponent } from "../../lib/betterAuth";
import { r2 } from "../../uploads";

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

    // Return default preferences if none exist
    if (!preferences) {
      return {
        genderPreference: "female" as const,
        ageMin: 18,
        ageMax: 35,
        zodiacPreferences: [],
        interestPreferences: [],
      };
    }

    return preferences;
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
      v.literal("both")
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
      v.literal("superlike")
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
        q.eq("userId", user._id).eq("aiProfileId", aiProfileId)
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
 */
export const getForYouProfiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20 }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    // Get user preferences
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Default preferences if not set
    const genderPreference = preferences?.genderPreference ?? "female";
    const ageMin = preferences?.ageMin ?? 18;
    const ageMax = preferences?.ageMax ?? 99;
    const zodiacPreferences = preferences?.zodiacPreferences ?? [];
    const interestPreferences = preferences?.interestPreferences ?? [];

    // Get all profile IDs the user has already interacted with
    const interactions = await ctx.db
      .query("profileInteractions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const interactedProfileIds = new Set(
      interactions.map((i) => i.aiProfileId.toString())
    );

    // Get all profile IDs the user already has conversations with
    const conversations = await ctx.db
      .query("aiConversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const conversationProfileIds = new Set(
      conversations.map((c) => c.aiProfileId.toString())
    );

    // Query profiles based on gender preference
    let profilesQuery = ctx.db.query("aiProfiles");

    if (genderPreference !== "both") {
      profilesQuery = ctx.db
        .query("aiProfiles")
        .withIndex("by_status_and_gender", (q) =>
          q.eq("status", "active").eq("gender", genderPreference)
        );
    } else {
      profilesQuery = ctx.db
        .query("aiProfiles")
        .withIndex("by_status_and_gender", (q) => q.eq("status", "active"));
    }

    const allProfiles = await profilesQuery.collect();

    // Filter profiles
    const filteredProfiles = allProfiles.filter((profile) => {
      // Exclude already interacted profiles
      if (interactedProfileIds.has(profile._id.toString())) {
        return false;
      }

      // Exclude profiles user already has conversations with
      if (conversationProfileIds.has(profile._id.toString())) {
        return false;
      }

      // Exclude user's own created profiles
      if (profile.createdByUserId === user._id) {
        return false;
      }

      // Age filter
      if (profile.age) {
        if (profile.age < ageMin || profile.age > ageMax) {
          return false;
        }
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
          interestPreferences.includes(interest)
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
        q.eq("userId", user._id).eq("action", "like")
      )
      .collect();

    const profiles = await Promise.all(
      likes.map(async (like) => {
        const profile = await ctx.db.get(like.aiProfileId);
        if (!profile) return null;

        const avatarUrl = profile.avatarImageKey
          ? await r2.getUrl(profile.avatarImageKey)
          : null;

        return {
          ...profile,
          avatarUrl,
          likedAt: like.createdAt,
        };
      })
    );

    return profiles.filter(Boolean);
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
