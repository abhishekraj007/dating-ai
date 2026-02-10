import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { authComponent } from "../../lib/betterAuth";

export const listSystemProfilesInternal = internalQuery({
  args: {
    gender: v.union(v.literal("female"), v.literal("male")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { gender, limit }) => {
    const profiles = await ctx.db
      .query("aiProfiles")
      .withIndex("by_status_and_gender", (q) =>
        q.eq("status", "active").eq("gender", gender),
      )
      .take(limit ?? 5000);

    return profiles.filter((profile) => !profile.isUserCreated);
  },
});

export const usernameExistsInternal = internalQuery({
  args: {
    username: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { username }) => {
    const existing = await ctx.db
      .query("aiProfiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    return !!existing;
  },
});

export const createProfileGenerationJobInternal = internalMutation({
  args: {
    source: v.union(v.literal("manual"), v.literal("cron")),
    triggeredByUserId: v.optional(v.string()),
  },
  returns: v.id("profileGenerationJobs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("profileGenerationJobs", {
      source: args.source,
      status: "queued",
      triggeredByUserId: args.triggeredByUserId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProfileGenerationJobInternal = internalMutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
    status: v.optional(
      v.union(v.literal("queued"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    ),
    selectedGender: v.optional(v.union(v.literal("female"), v.literal("male"))),
    attempts: v.optional(v.number()),
    createdProfileId: v.optional(v.id("aiProfiles")),
    errorMessage: v.optional(v.string()),
    retriedAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, { jobId, ...updates }) => {
    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(jobId, patch);
    return null;
  },
});

export const createSystemProfileInternal = internalMutation({
  args: {
    name: v.string(),
    username: v.string(),
    gender: v.union(v.literal("female"), v.literal("male")),
    age: v.number(),
    zodiacSign: v.string(),
    occupation: v.string(),
    bio: v.string(),
    interests: v.array(v.string()),
    personalityTraits: v.array(v.string()),
    relationshipGoal: v.string(),
    mbtiType: v.string(),
    communicationStyle: v.object({
      tone: v.string(),
      responseLength: v.string(),
      usesEmojis: v.boolean(),
      usesSlang: v.boolean(),
      flirtLevel: v.number(),
    }),
    avatarImageKey: v.string(),
    profileImageKeys: v.array(v.string()),
  },
  returns: v.id("aiProfiles"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiProfiles", {
      name: args.name,
      username: args.username,
      gender: args.gender,
      avatarImageKey: args.avatarImageKey,
      isUserCreated: false,
      status: "active",
      age: args.age,
      zodiacSign: args.zodiacSign,
      occupation: args.occupation,
      bio: args.bio,
      interests: args.interests,
      personalityTraits: args.personalityTraits,
      relationshipGoal: args.relationshipGoal,
      mbtiType: args.mbtiType,
      communicationStyle: args.communicationStyle,
      language: "en",
      profileImageKeys: args.profileImageKeys,
      createdAt: Date.now(),
    });
  },
});

export const enqueueCronProfileGeneration = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      "features/ai/profileGenerationActions:runSystemProfileGeneration" as any,
      {
        source: "cron",
      },
    );

    return null;
  },
});

export const adminGenerateSystemProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!userProfile?.isAdmin) {
      throw new ConvexError("Admin access required");
    }

    await ctx.scheduler.runAfter(
      0,
      "features/ai/profileGenerationActions:runSystemProfileGeneration" as any,
      {
        source: "manual",
        triggeredByUserId: user._id,
      },
    );

    return { queued: true };
  },
});

export const adminRetryProfileGeneration = mutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
  },
  handler: async (ctx, { jobId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!userProfile?.isAdmin) {
      throw new ConvexError("Admin access required");
    }

    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new ConvexError("Job not found");
    }

    if (job.status !== "failed") {
      throw new ConvexError("Only failed jobs can be retried");
    }

    if (job.retriedAt) {
      throw new ConvexError("This failed job has already been retried");
    }

    await ctx.scheduler.runAfter(
      0,
      "features/ai/profileGenerationActions:runSystemProfileGeneration" as any,
      {
        source: "manual",
        triggeredByUserId: user._id,
        preferredGender: job.selectedGender,
      },
    );

    await ctx.db.patch(job._id, {
      retriedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { queued: true };
  },
});

export const getProfileGenerationJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!userProfile?.isAdmin) {
      return null;
    }

    return await ctx.db
      .query("profileGenerationJobs")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit ?? 20);
  },
});
