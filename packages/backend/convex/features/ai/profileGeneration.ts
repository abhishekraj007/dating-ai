import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { authComponent } from "../../lib/betterAuth";
import {
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES_FEMALE,
  HAIR_STYLES_MALE,
  EYE_COLORS,
  BUILDS_FEMALE,
  BUILDS_MALE,
  OUTFIT_STYLES_FEMALE,
  OUTFIT_STYLES_MALE,
  VIBES,
  EXPRESSIONS,
} from "./profileGenerationData";

const PROFILE_OCCUPATION_OPTIONS = [
  "Software Engineer",
  "Product Designer",
  "Data Scientist",
  "Marketing Manager",
  "Content Creator",
  "Photographer",
  "Nurse",
  "Doctor",
  "Teacher",
  "Lawyer",
  "Financial Analyst",
  "Chef",
  "Fitness Coach",
  "Architect",
  "Entrepreneur",
  "Sales Manager",
  "UX Researcher",
  "Project Manager",
  "HR Specialist",
  "Civil Engineer",
] as const;

const PROFILE_GENERATION_JOB_RETENTION_DAYS = 5;

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
    preferredGender: v.optional(v.union(v.literal("female"), v.literal("male"))),
    preferredOccupation: v.optional(v.string()),
    preferredInterests: v.optional(v.array(v.string())),
  },
  returns: v.id("profileGenerationJobs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("profileGenerationJobs", {
      source: args.source,
      status: "queued",
      triggeredByUserId: args.triggeredByUserId,
      preferredGender: args.preferredGender,
      preferredOccupation: args.preferredOccupation,
      preferredInterests: args.preferredInterests,
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
    progress: v.optional(
      v.object({
        currentStep: v.string(),
        completedSteps: v.array(v.string()),
        stepModels: v.optional(
          v.array(
            v.object({
              step: v.string(),
              model: v.string(),
            }),
          ),
        ),
        message: v.optional(v.string()),
        totalSteps: v.number(),
        completedStepCount: v.number(),
      }),
    ),
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
    location: v.string(),
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
      visibleOn: ["web", "ios", "android"],
      status: "active",
      age: args.age,
      zodiacSign: args.zodiacSign,
      occupation: args.occupation,
      location: args.location,
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

export const cleanupOldProfileGenerationJobsInternal = internalMutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
    cutoffTimestamp: v.number(),
  }),
  handler: async (ctx) => {
    const cutoffTimestamp =
      Date.now() - PROFILE_GENERATION_JOB_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const oldJobs = await ctx.db
      .query("profileGenerationJobs")
      .withIndex("by_created_at", (q) => q.lt("createdAt", cutoffTimestamp))
      .collect();

    let deletedCount = 0;
    for (const job of oldJobs) {
      if (job.status === "queued" || job.status === "processing") {
        continue;
      }
      await ctx.db.delete(job._id);
      deletedCount += 1;
    }

    return { deletedCount, cutoffTimestamp };
  },
});

export const adminGenerateSystemProfile = mutation({
  args: {
    preferredGender: v.optional(v.union(v.literal("female"), v.literal("male"))),
    preferredOccupation: v.optional(v.string()),
    preferredInterests: v.optional(v.array(v.string())),
    appearanceOverrides: v.optional(
      v.object({
        skinTone: v.optional(v.string()),
        hairColor: v.optional(v.string()),
        hairStyle: v.optional(v.string()),
        eyeColor: v.optional(v.string()),
        build: v.optional(v.string()),
        outfit: v.optional(v.string()),
        vibe: v.optional(v.string()),
        expression: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
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
        preferredGender: args.preferredGender,
        preferredOccupation: args.preferredOccupation,
        preferredInterests: args.preferredInterests,
        appearanceOverrides: args.appearanceOverrides,
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
        preferredGender: job.selectedGender ?? job.preferredGender,
        preferredOccupation: job.preferredOccupation,
        preferredInterests: job.preferredInterests,
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

export const getProfileGenerationOptions = query({
  args: {},
  handler: async (ctx) => {
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

    const interestOptions = await ctx.db
      .query("filterOptions")
      .withIndex("by_type_active", (q) =>
        q.eq("type", "interest").eq("isActive", true),
      )
      .collect();

    interestOptions.sort((a, b) => a.order - b.order);

    return {
      genders: [
        { value: "female" as const, label: "Female" },
        { value: "male" as const, label: "Male" },
      ],
      occupations: PROFILE_OCCUPATION_OPTIONS.map((occupation) => ({
        value: occupation,
        label: occupation,
      })),
      interests: interestOptions.map((option) => ({
        value: option.value,
        label: option.label,
        emoji: option.emoji ?? "",
      })),
      appearance: {
        skinTones: SKIN_TONES,
        hairColors: HAIR_COLORS,
        hairStylesFemale: HAIR_STYLES_FEMALE,
        hairStylesMale: HAIR_STYLES_MALE,
        eyeColors: EYE_COLORS,
        buildsFemale: BUILDS_FEMALE,
        buildsMale: BUILDS_MALE,
        outfitsFemale: OUTFIT_STYLES_FEMALE,
        outfitsMale: OUTFIT_STYLES_MALE,
        vibes: VIBES,
        expressions: EXPRESSIONS,
      },
    };
  },
});
