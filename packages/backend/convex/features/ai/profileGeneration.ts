import { ConvexError, v } from "convex/values";
import { z } from "zod";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { authComponent } from "../../lib/betterAuth";
import { r2 } from "../../uploads";
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
  ETHNICITIES,
} from "./profileGenerationData";
import {
  AWAITING_APPROVAL_TTL_MS,
  PROFILE_GENERATION_JOB_RETENTION_DAYS,
  PROFILE_OCCUPATION_OPTIONS,
} from "./profileGen/constants";
import { assertAdmin } from "./profileGen/adminGuards";
import { resolveCountryCode } from "./profileGen/candidate";

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
    preferredGender: v.optional(
      v.union(v.literal("female"), v.literal("male")),
    ),
    preferredOccupation: v.optional(v.string()),
    preferredInterests: v.optional(v.array(v.string())),
    preferredLocation: v.optional(v.string()),
    ethnicity: v.optional(v.string()),
    referenceSubjectDescriptor: v.optional(v.string()),
    referenceImageUrl: v.optional(v.string()),
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
      preferredLocation: args.preferredLocation,
      ethnicity: args.ethnicity,
      referenceSubjectDescriptor: args.referenceSubjectDescriptor,
      referenceImageUrl: args.referenceImageUrl,
      appearanceOverrides: args.appearanceOverrides,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProfileGenerationJobInternal = internalMutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
    status: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("processing"),
        v.literal("awaiting_avatar_approval"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
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

// --- Preview / approval pause plumbing ---

const previewCandidateValidator = v.object({
  name: v.string(),
  username: v.string(),
  gender: v.union(v.literal("female"), v.literal("male")),
  age: v.number(),
  zodiacSign: v.string(),
  occupation: v.string(),
  location: v.string(),
  countryCode: v.optional(v.string()),
  bio: v.string(),
  interests: v.array(v.string()),
  personalityTraits: v.array(v.string()),
  relationshipGoal: v.string(),
  mbtiType: v.string(),
  // Optional so pre-migration in-flight preview rows still validate.
  // All newly generated candidates populate this from the blueprint enum.
  ethnicity: v.optional(v.string()),
  communicationStyle: v.object({
    tone: v.string(),
    responseLength: v.string(),
    usesEmojis: v.boolean(),
    usesSlang: v.boolean(),
    flirtLevel: v.number(),
  }),
});

const previewAppearanceValidator = v.object({
  ageHint: v.number(),
  hair: v.string(),
  eyes: v.string(),
  skinTone: v.string(),
  skinCue: v.string(),
  build: v.string(),
  outfit: v.string(),
  signatureStyle: v.string(),
  vibe: v.string(),
  cityArchetype: v.string(),
  quirk: v.string(),
  expression: v.string(),
});

export const writePreviewAndPauseInternal = internalMutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
    selectedGender: v.union(v.literal("female"), v.literal("male")),
    attempts: v.number(),
    progress: v.object({
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
    preview: v.object({
      candidate: previewCandidateValidator,
      appearance: previewAppearanceValidator,
      subjectDescriptor: v.string(),
      isReferenceMode: v.boolean(),
      avatarImageKey: v.string(),
      avatarPrompt: v.string(),
      avatarAttempts: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "awaiting_avatar_approval",
      selectedGender: args.selectedGender,
      attempts: args.attempts,
      progress: args.progress,
      preview: args.preview,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updatePreviewAvatarInternal = internalMutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
    avatarImageKey: v.string(),
    avatarPrompt: v.string(),
    avatarAttempts: v.number(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job?.preview) {
      throw new ConvexError("Job has no preview to update");
    }
    await ctx.db.patch(args.jobId, {
      preview: {
        ...job.preview,
        avatarImageKey: args.avatarImageKey,
        avatarPrompt: args.avatarPrompt,
        avatarAttempts: args.avatarAttempts,
      },
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const mergePreviewCandidateInternal = internalMutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
    candidatePatch: v.object({
      name: v.optional(v.string()),
      age: v.optional(v.number()),
      occupation: v.optional(v.string()),
      location: v.optional(v.string()),
      bio: v.optional(v.string()),
      interests: v.optional(v.array(v.string())),
    }),
    status: v.optional(
      v.union(v.literal("processing"), v.literal("cancelled")),
    ),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job?.preview) {
      throw new ConvexError("Job has no preview to merge into");
    }
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args.candidatePatch)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(args.jobId, {
      preview: {
        ...job.preview,
        candidate: {
          ...job.preview.candidate,
          ...patch,
        },
      },
      status: args.status ?? job.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getProfileGenerationJobInternal = internalQuery({
  args: {
    jobId: v.id("profileGenerationJobs"),
  },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.get(jobId);
  },
});

export const getAdminShowcaseGenerationProfileInternal = internalQuery({
  args: {
    profileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { profileId }) => {
    await assertAdmin(ctx);

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new ConvexError("Profile not found");
    }
    if (profile.isUserCreated) {
      throw new ConvexError("Cannot admin-edit user-created profiles");
    }
    if (!profile.avatarImageKey) {
      throw new ConvexError("Profile needs an avatar reference first");
    }

    return profile;
  },
});

export const appendGeneratedShowcaseImageInternal = internalMutation({
  args: {
    profileId: v.id("aiProfiles"),
    imageKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { profileId, imageKey }) => {
    await assertAdmin(ctx);

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new ConvexError("Profile not found");
    }
    if (profile.isUserCreated) {
      throw new ConvexError("Cannot admin-edit user-created profiles");
    }
    if (!imageKey.startsWith(`aiProfiles/${profileId}/generated-showcase/`)) {
      throw new ConvexError("Invalid generated showcase image key");
    }

    const currentKeys = profile.profileImageKeys ?? [];
    if (currentKeys.length >= 10) {
      throw new ConvexError("Gallery image limit reached");
    }

    await ctx.db.patch(profileId, {
      profileImageKeys: [...currentKeys, imageKey],
    });
    return null;
  },
});

// Returns the canonical list of active interest values used by end-user
// filters. Profile generation uses this to constrain LLM output so that
// generated interests always match something a user can filter on.
export const listActiveInterestsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("filterOptions")
      .withIndex("by_type_active", (q) =>
        q.eq("type", "interest").eq("isActive", true),
      )
      .collect();
    rows.sort((a, b) => a.order - b.order);
    return rows
      .map((row) => row.value)
      .filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      );
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
    // Optional on the wire for migration safety; if omitted we derive it
    // from `location` before persisting the profile row.
    countryCode: v.optional(v.string()),
    bio: v.string(),
    interests: v.array(v.string()),
    personalityTraits: v.array(v.string()),
    relationshipGoal: v.string(),
    mbtiType: v.string(),
    // Constrained at the Zod blueprint layer (ETHNICITIES enum); kept as
    // a plain string here because Convex validators don't accept a union
    // of string literals of dynamic length. Required on the arg so every
    // system-created profile persists a canonical filter value.
    ethnicity: v.string(),
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
    const countryCode = resolveCountryCode(args.location, args.countryCode);
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
      countryCode,
      bio: args.bio,
      interests: args.interests,
      personalityTraits: args.personalityTraits,
      relationshipGoal: args.relationshipGoal,
      mbtiType: args.mbtiType,
      ethnicity: args.ethnicity,
      communicationStyle: args.communicationStyle,
      language: "en",
      profileImageKeys: args.profileImageKeys,
      createdAt: Date.now(),
    });
  },
});

/**
 * Scans every active system profile once and returns the ethnicity from the
 * `ETHNICITIES` enum that is currently the least-represented. This is the
 * supply-balance mechanism that keeps every filter bucket populated, so
 * users who filter the discover feed by e.g. "Korean" or "Middle Eastern"
 * always see something instead of an empty state.
 *
 * We prefer "least-represented" over strict round-robin because:
 *   - A real round-robin counter would need its own persisted state (another
 *     table) and would drift from the actual profile distribution after any
 *     admin-created / user-created / failed run.
 *   - Counting profiles per ethnicity is a single full-table scan on a
 *     small table (thousands, not millions); negligible cost when triggered
 *     once per cron tick.
 *   - It self-corrects: if the LLM keeps dropping into "White" when left
 *     ambiguous, this will push the next few crons toward the under-
 *     represented buckets until they catch up.
 *
 * Ties are broken by picking the ethnicity that appears earliest in
 * `ETHNICITIES`, which gives deterministic test behavior at empty DBs.
 */
async function pickUnderRepresentedEthnicity(ctx: {
  db: { query: any };
}): Promise<string> {
  const profiles = await ctx.db
    .query("aiProfiles")
    .withIndex("by_system_created_at", (q: any) => q.eq("isUserCreated", false))
    .collect();

  const counts = new Map<string, number>();
  for (const ethnicity of ETHNICITIES) counts.set(ethnicity, 0);

  for (const profile of profiles as Array<{ ethnicity?: string }>) {
    const ethnicity = profile.ethnicity;
    if (ethnicity && counts.has(ethnicity)) {
      counts.set(ethnicity, (counts.get(ethnicity) ?? 0) + 1);
    }
  }

  let picked: string = ETHNICITIES[0];
  let minCount = counts.get(picked) ?? 0;
  for (const ethnicity of ETHNICITIES) {
    const current = counts.get(ethnicity) ?? 0;
    if (current < minCount) {
      minCount = current;
      picked = ethnicity;
    }
  }
  return picked;
}

export const enqueueCronProfileGeneration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ethnicity = await pickUnderRepresentedEthnicity(ctx);

    await ctx.scheduler.runAfter(
      0,
      "features/ai/profileGenerationActions:runSystemProfileGeneration" as any,
      {
        source: "cron",
        ethnicity,
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
    expiredPreviews: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const cutoffTimestamp =
      now - PROFILE_GENERATION_JOB_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const oldJobs = await ctx.db
      .query("profileGenerationJobs")
      .withIndex("by_created_at", (q) => q.lt("createdAt", cutoffTimestamp))
      .collect();

    let deletedCount = 0;
    for (const job of oldJobs) {
      if (
        job.status === "queued" ||
        job.status === "processing" ||
        job.status === "awaiting_avatar_approval"
      ) {
        continue;
      }
      await ctx.db.delete(job._id);
      deletedCount += 1;
    }

    // Sweep preview-paused jobs that the admin never approved/cancelled.
    // Mark them as cancelled and schedule R2 cleanup of the avatar.
    const awaitingCutoff = now - AWAITING_APPROVAL_TTL_MS;
    const stalePreviews = await ctx.db
      .query("profileGenerationJobs")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_avatar_approval"))
      .collect();

    let expiredPreviews = 0;
    for (const job of stalePreviews) {
      if (job.updatedAt >= awaitingCutoff) continue;

      const avatarKey = job.preview?.avatarImageKey;
      await ctx.db.patch(job._id, {
        status: "cancelled",
        errorMessage: "Preview expired without admin approval",
        completedAt: now,
        updatedAt: now,
      });
      if (avatarKey) {
        await ctx.scheduler.runAfter(
          0,
          "features/ai/profileGenerationActions:cleanupPreviewR2Action" as any,
          { keys: [avatarKey] },
        );
      }
      expiredPreviews += 1;
    }

    return { deletedCount, cutoffTimestamp, expiredPreviews };
  },
});

export const adminGenerateSystemProfile = mutation({
  args: {
    preferredGender: v.optional(
      v.union(v.literal("female"), v.literal("male")),
    ),
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
    referenceSubjectDescriptor: v.optional(v.string()),
    referenceImageUrl: v.optional(v.string()),
    preferredLocation: v.optional(v.string()),
    // Preferred ethnicity (member of `ETHNICITIES` in
    // `features/ai/profileGenerationData.ts`).
    ethnicity: v.optional(v.string()),
    // Defaults to true for the characters page preview flow. The dashboard
    // quick-generate button opts out by passing false.
    pauseForApproval: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await assertAdmin(ctx);

    // Default: pause for admin approval. The characters page Sheet
    // subscribes to the returned `jobId` via `getProfileGenerationJobForAdmin`
    // and resumes via `adminApproveAvatar` / `adminCancelPreview`. The
    // dashboard quick-generate button opts out by passing `false`.
    const pauseForApproval = args.pauseForApproval ?? true;

    // Pre-create the job row when pausing so the client can subscribe to
    // the id before the scheduled action runs. When not pausing, skip the
    // pre-create — the action will create its own row (cron-compatible).
    const existingJobId = pauseForApproval
      ? ((await ctx.runMutation(
          "features/ai/profileGeneration:createProfileGenerationJobInternal" as any,
          {
            source: "manual",
            triggeredByUserId: user._id,
            preferredGender: args.preferredGender,
            preferredOccupation: args.preferredOccupation,
            preferredInterests: args.preferredInterests,
            preferredLocation: args.preferredLocation,
            ethnicity: args.ethnicity,
            referenceSubjectDescriptor: args.referenceSubjectDescriptor,
            referenceImageUrl: args.referenceImageUrl,
            appearanceOverrides: args.appearanceOverrides,
          },
        )) as any)
      : undefined;

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
        referenceSubjectDescriptor: args.referenceSubjectDescriptor,
        referenceImageUrl: args.referenceImageUrl,
        preferredLocation: args.preferredLocation,
        ethnicity: args.ethnicity,
        pauseForApproval,
        existingJobId,
      },
    );

    return { queued: true, jobId: existingJobId ?? null };
  },
});

export const adminRetryProfileGeneration = mutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
  },
  handler: async (ctx, { jobId }) => {
    const user = await assertAdmin(ctx);

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

// Narrow Zod schema for the only fields the admin is allowed to edit
// at the preview stage. Everything else is either server-generated
// (username) or structural and kept from the original LLM output.
const editedCandidateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    age: z.number().int().min(18).max(50).optional(),
    occupation: z.string().trim().min(1).max(80).optional(),
    location: z.string().trim().min(1).max(60).optional(),
    bio: z.string().trim().min(40).max(240).optional(),
    interests: z
      .array(z.string().trim().min(1).max(40))
      .min(4)
      .max(7)
      .optional(),
  })
  .strict();

export const adminRegenerateAvatar = mutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
    editedPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.status !== "awaiting_avatar_approval") {
      throw new ConvexError(
        `Job is not awaiting avatar approval (current status: ${job.status})`,
      );
    }

    await ctx.scheduler.runAfter(
      0,
      "features/ai/profileGenerationActions:regenerateAvatarAction" as any,
      {
        jobId: args.jobId,
        editedPrompt: args.editedPrompt,
      },
    );

    return { scheduled: true };
  },
});

export const adminApproveAvatar = mutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
    editedCandidate: v.optional(
      v.object({
        name: v.optional(v.string()),
        age: v.optional(v.number()),
        occupation: v.optional(v.string()),
        location: v.optional(v.string()),
        bio: v.optional(v.string()),
        interests: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.status !== "awaiting_avatar_approval" || !job.preview) {
      throw new ConvexError(
        `Job is not awaiting avatar approval (current status: ${job.status})`,
      );
    }

    // Validate the narrow set of editable fields.
    const parse = editedCandidateSchema.safeParse(args.editedCandidate ?? {});
    if (!parse.success) {
      throw new ConvexError(
        `Invalid edited candidate: ${parse.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ")}`,
      );
    }
    const edited = parse.data;

    const patch: Record<string, unknown> = {};
    if (edited.name !== undefined) patch.name = edited.name;
    if (edited.age !== undefined) patch.age = edited.age;
    if (edited.occupation !== undefined) patch.occupation = edited.occupation;
    if (edited.location !== undefined) {
      patch.location = edited.location;
      patch.countryCode =
        resolveCountryCode(edited.location) ?? job.preview.candidate.countryCode;
    }
    if (edited.bio !== undefined) patch.bio = edited.bio;
    if (edited.interests !== undefined) patch.interests = edited.interests;

    await ctx.db.patch(args.jobId, {
      status: "processing",
      preview: {
        ...job.preview,
        candidate: {
          ...job.preview.candidate,
          ...patch,
        },
      },
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      0,
      "features/ai/profileGenerationActions:continueShowcaseAndPersistAction" as any,
      { jobId: args.jobId },
    );

    return { scheduled: true };
  },
});

export const adminCancelPreview = mutation({
  args: {
    jobId: v.id("profileGenerationJobs"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (
      job.status !== "awaiting_avatar_approval" &&
      job.status !== "queued" &&
      job.status !== "processing"
    ) {
      // Nothing to cancel for completed/failed/cancelled jobs.
      return { cancelled: false };
    }

    const avatarKey = job.preview?.avatarImageKey;

    await ctx.db.patch(args.jobId, {
      status: "cancelled",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (avatarKey) {
      await ctx.scheduler.runAfter(
        0,
        "features/ai/profileGenerationActions:cleanupPreviewR2Action" as any,
        { keys: [avatarKey] },
      );
    }

    return { cancelled: true };
  },
});

export const getProfileGenerationJobForAdmin = query({
  args: {
    jobId: v.id("profileGenerationJobs"),
  },
  handler: async (ctx, { jobId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;

    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();
    if (!userProfile?.isAdmin) return null;

    const job = await ctx.db.get(jobId);
    if (!job) return null;

    let previewAvatarUrl: string | null = null;
    if (job.preview?.avatarImageKey) {
      try {
        previewAvatarUrl = await r2.getUrl(job.preview.avatarImageKey);
      } catch {
        previewAvatarUrl = null;
      }
    }

    return {
      ...job,
      previewAvatarUrl,
    };
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
