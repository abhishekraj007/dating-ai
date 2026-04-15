import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { authComponent } from "../../lib/betterAuth";
import { r2 } from "../../uploads";

/**
 * Get AI profiles by gender filter
 */
export const getAIProfiles = query({
  args: {
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    includeUserCreated: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let profiles;

    if (args.gender !== undefined) {
      profiles = await ctx.db
        .query("aiProfiles")
        .withIndex("by_gender_and_status", (q) =>
          q
            .eq("gender", args.gender as "male" | "female")
            .eq("status", "active")
        )
        .collect();
    } else {
      profiles = await ctx.db
        .query("aiProfiles")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect();
    }

    // Filter user-created if needed
    if (!args.includeUserCreated) {
      profiles = profiles.filter((p) => !p.isUserCreated);
    }

    // Add avatar URLs
    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        let avatarUrl = null;
        if (profile.avatarImageKey) {
          try {
            avatarUrl = await r2.getUrl(profile.avatarImageKey);
          } catch (error) {
            console.error("Error getting avatar URL:", error);
          }
        }
        return { ...profile, avatarUrl };
      })
    );

    return enriched;
  },
});

/**
 * Get user's custom created AI characters
 */
export const getUserCreatedProfiles = query({
  args: {
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    let profiles = await ctx.db
      .query("aiProfiles")
      .withIndex("by_created_by_user_id", (q) =>
        q.eq("createdByUserId", user._id)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Filter by gender if provided
    if (args.gender) {
      profiles = profiles.filter((p) => p.gender === args.gender);
    }

    // Add avatar URLs
    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        let avatarUrl = null;
        if (profile.avatarImageKey) {
          try {
            avatarUrl = await r2.getUrl(profile.avatarImageKey);
          } catch (error) {
            console.error("Error getting avatar URL:", error);
          }
        }
        return { ...profile, avatarUrl };
      })
    );

    return enriched;
  },
});

/**
 * Get single AI profile by ID with image URLs
 */
export const getAIProfileWithImages = query({
  args: {
    profileId: v.id("aiProfiles"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    // Get image URLs from R2

    let avatarUrl = null;
    if (profile.avatarImageKey) {
      try {
        avatarUrl = await r2.getUrl(profile.avatarImageKey);
      } catch (error) {
        console.error("Error getting avatar URL:", error);
      }
    }

    const profileImageUrls: string[] = [];
    for (const key of profile.profileImageKeys) {
      try {
        const url = await r2.getUrl(key);
        profileImageUrls.push(url);
      } catch (error) {
        console.error("Error getting profile image URL:", error);
      }
    }

    return {
      ...profile,
      avatarUrl,
      profileImageUrls,
    };
  },
});

/**
 * Get AI profile by ID with image URLs and conversation data
 */
export const getAIProfile = query({
  args: {
    profileId: v.id("aiProfiles"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    // Get image URLs from R2
    let avatarUrl = null;
    if (profile.avatarImageKey) {
      try {
        avatarUrl = await r2.getUrl(profile.avatarImageKey);
      } catch (error) {
        console.error("Error getting avatar URL:", error);
      }
    }

    const profileImageUrls: string[] = [];
    for (const key of profile.profileImageKeys) {
      try {
        const url = await r2.getUrl(key);
        profileImageUrls.push(url);
      } catch (error) {
        console.error("Error getting profile image URL:", error);
      }
    }

    // Get conversation if user is logged in
    let conversation = null;
    if (user) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_user_id_and_ai_profile_id", (q) =>
          q.eq("userId", user._id).eq("aiProfileId", args.profileId)
        )
        .first();
    }

    return {
      ...profile,
      avatarUrl,
      profileImageUrls,
      conversation,
    };
  },
});

/**
 * Create a user's custom AI character
 */
export const createAIProfile = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    zodiacSign: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.string(),
    interests: v.array(v.string()),
    personalityTraits: v.array(v.string()),
    avatarImageKey: v.optional(v.string()),
    profileImageKeys: v.array(v.string()),
    language: v.optional(v.string()),
    voiceType: v.optional(v.string()),
  },
  returns: v.id("aiProfiles"),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Deduct credits for AI character creation (10 credits for image generation)
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!profile || (profile.credits ?? 0) < 10) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(profile._id, {
      credits: (profile.credits ?? 0) - 10,
    });

    // Create AI profile
    const profileId = await ctx.db.insert("aiProfiles", {
      name: args.name,
      age: args.age,
      gender: args.gender,
      zodiacSign: args.zodiacSign,
      occupation: args.occupation,
      bio: args.bio,
      interests: args.interests,
      personalityTraits: args.personalityTraits,
      avatarImageKey: args.avatarImageKey,
      profileImageKeys: args.profileImageKeys,
      language: args.language,
      voiceType: args.voiceType,
      isUserCreated: true,
      createdByUserId: user._id,
      status: "active",
      createdAt: Date.now(),
    });

    return profileId;
  },
});

/**
 * Get user's credits
 */
export const getUserCredits = query({
  args: {},
  returns: v.union(v.number(), v.null()),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;

    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    return profile?.credits ?? 0;
  },
});
