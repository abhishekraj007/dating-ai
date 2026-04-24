"use node";

import { v } from "convex/values";
import { generateText } from "ai";
import { action, internalAction } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import { r2 } from "../../uploads";
import { openRouterProvider } from "./aiProviders";
import {
  type Gender,
  ETHNICITIES,
  MAX_GENERATION_ATTEMPTS,
} from "./profileGenerationData";
import {
  IMAGE_ANALYSIS_MODEL,
  IS_DEV,
  JOB_PROGRESS_STEPS,
  MAX_AVATAR_ATTEMPTS,
  FALLBACK_TEMPLATE_MODEL,
} from "./profileGen/constants";
import type {
  AppearanceProfile,
  GenerationPreferences,
  JobProgressStep,
  ProfileCandidate,
  StepModelEntry,
} from "./profileGen/types";
import { GenerationFailureError } from "./profileGen/types";
import { buildCandidateDynamic } from "./profileGen/candidateLlm";
import {
  candidateFingerprint,
  isDuplicateCandidate,
} from "./profileGen/candidate";
import {
  buildCanonicalSubjectDescriptor,
  sampleAppearanceProfile,
} from "./profileGen/appearance";
import {
  generateAvatarForJob,
  runShowcaseAndPersistStage,
} from "./profileGen/stages";
import {
  createAndStoreGeneratedImage,
  imageGenerationModelName,
} from "./profileGen/images";
import { updateJobProgress, upsertStepModel } from "./profileGen/progress";
import {
  normalize,
  normalizeInterestPreferences,
  normalizePreferenceText,
  thresholdForAttempt,
  weightedGender,
} from "./profileGen/textUtils";
import { generateShowcasePrompts } from "./profileGen/showcase";

export const runSystemProfileGeneration = internalAction({
  args: {
    source: v.union(v.literal("manual"), v.literal("cron")),
    triggeredByUserId: v.optional(v.string()),
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
    // `features/ai/profileGenerationData.ts`). Cron passes a round-robin
    // value; manual passes the admin-selected value; reference mode passes
    // the vision model's enum pick.
    ethnicity: v.optional(v.string()),
    // When true, pause after the avatar is generated and write a
    // `preview` snapshot to the job row. Admin then approves to run
    // showcase + persist via `continueShowcaseAndPersist`. Cron path
    // leaves this as default (false) for end-to-end generation.
    pauseForApproval: v.optional(v.boolean()),
    // Optional: reuse a pre-created job row (manual path pre-creates it so
    // the client can subscribe to the id before the action starts).
    existingJobId: v.optional(v.id("profileGenerationJobs")),
  },
  handler: async (ctx, args) => {
    // The enum membership is re-validated inside the candidate LLM path
    // (via `coerceEthnicity`), so we only normalize whitespace here.
    const normalizedEthnicity = normalizePreferenceText(args.ethnicity);
    const normalizedPreferences: GenerationPreferences = {
      preferredOccupation: normalizePreferenceText(args.preferredOccupation),
      preferredInterests: normalizeInterestPreferences(args.preferredInterests),
      preferredLocation: normalizePreferenceText(args.preferredLocation),
      ethnicity: normalizedEthnicity as GenerationPreferences["ethnicity"],
    };

    const jobId: string =
      args.existingJobId ??
      ((await ctx.runMutation(
        "features/ai/profileGeneration:createProfileGenerationJobInternal" as any,
        {
          source: args.source,
          triggeredByUserId: args.triggeredByUserId,
          preferredGender: args.preferredGender,
          preferredOccupation: normalizedPreferences.preferredOccupation,
          preferredInterests: normalizedPreferences.preferredInterests,
          preferredLocation: normalizedPreferences.preferredLocation,
          ethnicity: normalizedEthnicity,
          referenceSubjectDescriptor: args.referenceSubjectDescriptor,
          referenceImageUrl: args.referenceImageUrl,
          appearanceOverrides: args.appearanceOverrides,
        },
      )) as string);
    let completedSteps: JobProgressStep[] = [];
    let stepModels: StepModelEntry[] = [];

    try {
      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          status: "processing",
          startedAt: Date.now(),
        },
      );
      await updateJobProgress(
        ctx,
        jobId,
        "candidate_generation",
        completedSteps,
        stepModels,
        "Generating a unique profile blueprint...",
      );

      const selectedGender = args.preferredGender ?? weightedGender();
      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          selectedGender,
        },
      );

      const appearance = sampleAppearanceProfile(
        selectedGender,
        args.appearanceOverrides ?? undefined,
      );

      // In reference mode, the LLM-provided descriptor replaces the
      // computed one, keeping all image prompts visually anchored to
      // the reference photo's style.
      const isReferenceMode = Boolean(args.referenceSubjectDescriptor);

      const existingProfiles = (await ctx.runQuery(
        "features/ai/profileGeneration:listSystemProfilesInternal" as any,
        {
          gender: selectedGender,
          limit: 5000,
        },
      )) as Array<{
        name: string;
        username?: string;
        gender: Gender;
        occupation?: string;
        bio?: string;
        interests?: string[];
        personalityTraits?: string[];
      }>;

      const existingUsernames = new Set(
        existingProfiles
          .map((profile) => profile.username)
          .filter((username): username is string => !!username)
          .map((username) => normalize(username)),
      );

      // Pull the canonical interest library once per job so the LLM schema,
      // prompt, and fallback template all agree on the same whitelist.
      // Empty (e.g. unseeded DB) falls back to the INTERESTS constant
      // inside the helpers via `allowedInterests.length === 0` branches.
      const allowedInterests = (await ctx.runQuery(
        "features/ai/profileGeneration:listActiveInterestsInternal" as any,
        {},
      )) as string[];

      let candidate: ProfileCandidate | null = null;
      let candidateModel = FALLBACK_TEMPLATE_MODEL;
      let attempts = 0;
      const seenCandidateFingerprints = new Set<string>();

      while (attempts < MAX_GENERATION_ATTEMPTS && !candidate) {
        attempts += 1;
        const generated = await buildCandidateDynamic(
          selectedGender,
          attempts,
          existingProfiles,
          existingUsernames,
          appearance,
          allowedInterests,
          normalizedPreferences,
        );
        const fingerprint = candidateFingerprint(generated.candidate);
        if (seenCandidateFingerprints.has(fingerprint)) {
          continue;
        }
        seenCandidateFingerprints.add(fingerprint);

        const semanticThreshold = thresholdForAttempt(attempts);
        const usernameAlreadyExists = (await ctx.runQuery(
          "features/ai/profileGeneration:usernameExistsInternal" as any,
          { username: generated.candidate.username },
        )) as boolean;
        if (usernameAlreadyExists) {
          continue;
        }
        if (
          !isDuplicateCandidate(
            generated.candidate,
            existingProfiles,
            semanticThreshold,
          )
        ) {
          candidate = generated.candidate;
          candidateModel = generated.model;
        }
      }

      if (!candidate) {
        throw new GenerationFailureError(
          "candidate_uniqueness_exhausted",
          `Failed to generate a unique profile candidate after ${MAX_GENERATION_ATTEMPTS} attempts`,
        );
      }
      stepModels = upsertStepModel(
        stepModels,
        "candidate_generation",
        candidateModel,
      );
      completedSteps = [...completedSteps, "candidate_generation"];
      stepModels = upsertStepModel(
        stepModels,
        "avatar_generation",
        imageGenerationModelName(IS_DEV),
      );
      await updateJobProgress(
        ctx,
        jobId,
        "avatar_generation",
        completedSteps,
        stepModels,
        `Profile blueprint generated in ${attempts} attempt${attempts > 1 ? "s" : ""}. Creating avatar...`,
      );

      const subjectDescriptor = isReferenceMode
        ? args.referenceSubjectDescriptor!
        : buildCanonicalSubjectDescriptor(candidate, appearance);

      const { avatarImageKey, avatarPrompt } = await generateAvatarForJob(ctx, {
        jobId,
        candidate,
        appearance,
        subjectDescriptor,
        isReferenceMode,
        referenceImageUrl: args.referenceImageUrl ?? null,
      });
      completedSteps = [...completedSteps, "avatar_generation"];

      // Manual-approval branch: snapshot the preview and pause here.
      // The admin UI resumes by calling `continueShowcaseAndPersist`.
      // Cron passes pauseForApproval=false (default) and skips this.
      if (args.pauseForApproval) {
        await ctx.runMutation(
          "features/ai/profileGeneration:writePreviewAndPauseInternal" as any,
          {
            jobId,
            selectedGender,
            attempts,
            progress: {
              currentStep: "awaiting_avatar_approval",
              completedSteps,
              stepModels,
              message:
                "Avatar generated. Awaiting admin review before showcase generation.",
              totalSteps: JOB_PROGRESS_STEPS.length,
              completedStepCount: completedSteps.length,
            },
            preview: {
              candidate,
              appearance,
              subjectDescriptor,
              isReferenceMode,
              avatarImageKey,
              avatarPrompt,
              avatarAttempts: 1,
            },
          },
        );
        return { success: true, jobId, paused: true };
      }

      const { createdProfileId } = await runShowcaseAndPersistStage(ctx, {
        jobId,
        candidate,
        appearance,
        subjectDescriptor,
        avatarImageKey,
        selectedGender,
        attempts,
        initialCompletedSteps: completedSteps,
        initialStepModels: stepModels,
      });

      return { success: true, jobId, createdProfileId };
    } catch (error) {
      const errorMessage =
        error instanceof GenerationFailureError
          ? `${error.code}: ${error.message}`
          : error instanceof Error
            ? `profile_creation_failed: ${error.message}`
            : "profile_creation_failed: Unknown error";

      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          status: "failed",
          errorMessage,
          progress: {
            currentStep: "failed",
            completedSteps,
            stepModels,
            message: errorMessage,
            totalSteps: JOB_PROGRESS_STEPS.length,
            completedStepCount: completedSteps.length,
          },
          completedAt: Date.now(),
        },
      );
      return { success: false, jobId };
    }
  },
});

/**
 * Regenerates the avatar for a paused `awaiting_avatar_approval` job.
 * Honors optional `editedPrompt` overrides and enforces a hard attempt cap.
 * Deletes the previous R2 object immediately on success.
 */
export const regenerateAvatarAction = internalAction({
  args: {
    jobId: v.id("profileGenerationJobs"),
    editedPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = (await ctx.runQuery(
      "features/ai/profileGeneration:getProfileGenerationJobInternal" as any,
      { jobId: args.jobId },
    )) as any;

    if (!job) {
      throw new Error("Job not found");
    }
    if (job.status !== "awaiting_avatar_approval" || !job.preview) {
      throw new Error(
        `Job is not awaiting avatar approval (current status: ${job.status})`,
      );
    }
    if (job.preview.avatarAttempts >= MAX_AVATAR_ATTEMPTS) {
      throw new Error(
        `Avatar regeneration cap (${MAX_AVATAR_ATTEMPTS}) reached`,
      );
    }

    const previousAvatarKey = job.preview.avatarImageKey as string;

    try {
      const { avatarImageKey, avatarPrompt } = await generateAvatarForJob(ctx, {
        jobId: args.jobId,
        candidate: job.preview.candidate,
        appearance: job.preview.appearance,
        subjectDescriptor: job.preview.subjectDescriptor,
        isReferenceMode: job.preview.isReferenceMode,
        referenceImageUrl: job.referenceImageUrl ?? null,
        overridePrompt: normalizePreferenceText(args.editedPrompt),
      });

      await ctx.runMutation(
        "features/ai/profileGeneration:updatePreviewAvatarInternal" as any,
        {
          jobId: args.jobId,
          avatarImageKey,
          avatarPrompt,
          avatarAttempts: job.preview.avatarAttempts + 1,
        },
      );

      // Best-effort cleanup of the superseded avatar.
      if (previousAvatarKey && previousAvatarKey !== avatarImageKey) {
        try {
          await r2.deleteObject(ctx, previousAvatarKey);
        } catch (cleanupError) {
          console.warn(
            "Failed to delete previous avatar key",
            previousAvatarKey,
            cleanupError,
          );
        }
      }

      return { success: true, avatarImageKey };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "avatar regeneration failed";
      throw new Error(`avatar_regeneration_failed: ${message}`);
    }
  },
});

/**
 * Resumes a paused job by running the showcase + persist stage.
 * Accepts an optional `editedCandidate` with a narrow set of admin-editable
 * fields; validation happens in the calling mutation.
 */
export const continueShowcaseAndPersistAction = internalAction({
  args: {
    jobId: v.id("profileGenerationJobs"),
  },
  handler: async (ctx, args) => {
    const job = (await ctx.runQuery(
      "features/ai/profileGeneration:getProfileGenerationJobInternal" as any,
      { jobId: args.jobId },
    )) as any;

    if (!job) {
      throw new Error("Job not found");
    }
    if (!job.preview) {
      throw new Error("Job has no preview snapshot to resume from");
    }

    // Caller (adminApproveAvatar mutation) has already merged the edited
    // candidate + set status to "processing".
    const completedSteps = (job.progress?.completedSteps ?? [
      "candidate_generation",
      "avatar_generation",
    ]) as JobProgressStep[];
    const stepModels = (job.progress?.stepModels ?? []) as StepModelEntry[];

    try {
      const { createdProfileId } = await runShowcaseAndPersistStage(ctx, {
        jobId: args.jobId,
        candidate: job.preview.candidate,
        appearance: job.preview.appearance,
        subjectDescriptor: job.preview.subjectDescriptor,
        avatarImageKey: job.preview.avatarImageKey,
        selectedGender: job.selectedGender ?? job.preview.candidate.gender,
        attempts: job.attempts ?? 1,
        initialCompletedSteps: completedSteps,
        initialStepModels: stepModels,
      });

      return { success: true, createdProfileId };
    } catch (error) {
      const errorMessage =
        error instanceof GenerationFailureError
          ? `${error.code}: ${error.message}`
          : error instanceof Error
            ? `profile_creation_failed: ${error.message}`
            : "profile_creation_failed: Unknown error";

      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId: args.jobId,
          status: "failed",
          errorMessage,
          progress: {
            currentStep: "failed",
            completedSteps,
            stepModels,
            message: errorMessage,
            totalSteps: JOB_PROGRESS_STEPS.length,
            completedStepCount: completedSteps.length,
          },
          completedAt: Date.now(),
        },
      );
      return { success: false };
    }
  },
});

/**
 * Deletes R2 objects associated with a cancelled preview job.
 * Best-effort; logs failures but does not throw.
 */
export const cleanupPreviewR2Action = internalAction({
  args: {
    keys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    for (const key of args.keys) {
      if (!key) continue;
      try {
        await r2.deleteObject(ctx, key);
      } catch (error) {
        console.warn("cleanupPreviewR2Action: failed to delete", key, error);
      }
    }
    return null;
  },
});

type AdminShowcaseProfile = {
  _id: string;
  name: string;
  username?: string;
  gender: "female" | "male";
  age?: number;
  zodiacSign?: string;
  occupation?: string;
  location?: string;
  countryCode?: string;
  bio?: string;
  interests?: string[];
  personalityTraits?: string[];
  relationshipGoal?: string;
  mbtiType?: string;
  ethnicity?: string;
  communicationStyle?: {
    tone?: string;
    responseLength?: string;
    usesEmojis?: boolean;
    usesSlang?: boolean;
    flirtLevel?: number;
  };
  avatarImageKey?: string;
  profileImageKeys?: string[];
};

function compactProfileText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function buildAdminShowcaseInputs(profile: AdminShowcaseProfile): {
  candidate: ProfileCandidate;
  appearance: AppearanceProfile;
  subjectDescriptor: string;
} {
  const age =
    typeof profile.age === "number" && profile.age >= 18 ? profile.age : 25;
  const occupation =
    compactProfileText(profile.occupation, 80) || "Creative Professional";
  const location = compactProfileText(profile.location, 80) || "New York, US";
  const interests =
    profile.interests && profile.interests.length > 0
      ? profile.interests.slice(0, 8)
      : ["coffee", "music", "travel"];
  const personalityTraits =
    profile.personalityTraits && profile.personalityTraits.length > 0
      ? profile.personalityTraits.slice(0, 8)
      : ["warm", "confident", "curious"];
  const ethnicity =
    profile.ethnicity &&
    (ETHNICITIES as readonly string[]).includes(profile.ethnicity)
      ? profile.ethnicity
      : ETHNICITIES[0];

  const candidate: ProfileCandidate = {
    name: compactProfileText(profile.name, 80) || "Profile",
    username: compactProfileText(profile.username, 80) || String(profile._id),
    gender: profile.gender,
    age,
    zodiacSign: compactProfileText(profile.zodiacSign, 40) || "Gemini",
    occupation,
    location,
    countryCode: compactProfileText(profile.countryCode, 4) || undefined,
    bio:
      compactProfileText(profile.bio, 360) ||
      `${profile.name} is ${occupation.toLowerCase()} with an easy, magnetic dating-app presence.`,
    interests,
    personalityTraits,
    relationshipGoal:
      compactProfileText(profile.relationshipGoal, 120) ||
      "meaningful connection",
    mbtiType: compactProfileText(profile.mbtiType, 12) || "ENFP",
    ethnicity: ethnicity as ProfileCandidate["ethnicity"],
    communicationStyle: {
      tone: profile.communicationStyle?.tone ?? "casual",
      responseLength: profile.communicationStyle?.responseLength ?? "medium",
      usesEmojis: profile.communicationStyle?.usesEmojis ?? false,
      usesSlang: profile.communicationStyle?.usesSlang ?? false,
      flirtLevel: profile.communicationStyle?.flirtLevel ?? 3,
    },
  };

  const appearance: AppearanceProfile = {
    ageHint: age,
    hair: "same hair as the reference image",
    eyes: "same eyes as the reference image",
    skinTone: "same skin tone as the reference image",
    skinCue: "natural realistic skin",
    build: "same body type as the reference image",
    outfit: "stylish contemporary outfit",
    signatureStyle: "premium dating profile style",
    vibe: "confident",
    cityArchetype: location,
    quirk: "natural candid energy",
    expression: "relaxed smile",
  };

  const subjectDescriptor =
    `the same adult ${profile.gender} from the reference image, ` +
    `around ${age}, ${occupation.toLowerCase()}`;

  return { candidate, appearance, subjectDescriptor };
}

async function generateAdminShowcasePrompt(
  profile: AdminShowcaseProfile,
  promptSuggestion?: string,
): Promise<string> {
  const { candidate, appearance, subjectDescriptor } =
    buildAdminShowcaseInputs(profile);
  const slotPrompt = (
    await generateShowcasePrompts(candidate, appearance, subjectDescriptor, 1, {
      promptSuggestion,
      onVignetteError: (error) => {
        console.warn(
          "[admin-showcase-generation] Vignette generation threw; falling back to baseline showcase prompt.",
          error,
        );
      },
    })
  )[0];

  if (!slotPrompt) {
    throw new Error("Failed to build showcase prompt");
  }
  return slotPrompt.prompt;
}

export const adminGenerateMoreShowcaseImage = action({
  args: {
    profileId: v.id("aiProfiles"),
    promptSuggestion: v.optional(v.string()),
  },
  returns: v.object({
    imageKey: v.string(),
  }),
  handler: async (ctx, args) => {
    const profile = (await ctx.runQuery(
      internal.features.ai.profileGeneration
        .getAdminShowcaseGenerationProfileInternal,
      { profileId: args.profileId },
    )) as AdminShowcaseProfile;
    const promptSuggestion =
      compactProfileText(args.promptSuggestion, 140) || undefined;

    if (!profile.avatarImageKey) {
      throw new Error("Profile needs an avatar reference first");
    }
    if ((profile.profileImageKeys?.length ?? 0) >= 10) {
      throw new Error("Gallery image limit reached");
    }

    const referenceImageUrl = await r2.getUrl(profile.avatarImageKey);
    const prompt = await generateAdminShowcasePrompt(profile, promptSuggestion);
    const imageKey = await createAndStoreGeneratedImage(
      ctx,
      prompt,
      referenceImageUrl,
      `aiProfiles/${profile._id}/generated-showcase`,
    );

    await ctx.runMutation(
      internal.features.ai.profileGeneration
        .appendGeneratedShowcaseImageInternal,
      {
        profileId: args.profileId,
        imageKey,
      },
    );

    return { imageKey };
  },
});

/**
 * Analyze a reference photo using a vision model.
 * Returns a subject descriptor for image generation (the consistency anchor
 * reused across avatar + showcase prompts) and suggested profile fields.
 * The descriptor describes a NEW character inspired by the photo's style —
 * similar look but a subtly different face.
 */
export const analyzeReferencePhoto = action({
  // The image is uploaded directly to R2 by the client (via
  // `generateReferencePhotoUploadUrl`) and we only receive the resulting key
  // here. Sending the bytes through action args would trivially exceed the
  // 5 MiB Node-action args cap once base64-encoded, so we keep the payload
  // small by reading the object from storage inside the action.
  args: {
    imageKey: v.string(),
  },
  returns: v.object({
    subjectDescriptor: v.string(),
    suggestedGender: v.union(v.literal("female"), v.literal("male")),
    suggestedAge: v.number(),
    suggestedOccupation: v.optional(v.string()),
    suggestedVibe: v.optional(v.string()),
    suggestedExpression: v.optional(v.string()),
    suggestedLocation: v.optional(v.string()),
    // One of `ETHNICITIES`, or undefined if the vision model couldn't
    // determine it from the reference photo. Passed as a preference into
    // the candidate LLM so the generated name + bio stays coherent.
    ethnicity: v.optional(v.string()),
    referenceImageUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    // Admin-only: verify via query
    const userData: any = await ctx.runQuery(api.user.fetchUserAndProfile, {});
    if (!userData?.profile?.isAdmin) {
      throw new Error("Admin access required");
    }

    if (!openRouterProvider) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    // Defense-in-depth: the upload-URL mutation already scopes keys to this
    // prefix, but we re-check here so a future caller can't point us at an
    // arbitrary R2 object (e.g. another user's private upload).
    if (!args.imageKey.startsWith("aiProfiles/references/")) {
      throw new Error("Invalid reference image key");
    }

    const referenceImageUrl = await r2.getUrl(args.imageKey);

    const analysisPrompt = `You are an expert at creating image generation prompts for photorealistic portrait generation.

Analyze this reference photo and produce a "subject descriptor" — a single comma-separated natural-language string that describes this photo. The new person should share the same overall style, aesthetic, and vibe.

The subject descriptor MUST follow this exact structure (comma-separated parts):
"a {age}-year-old {woman/man}, {skin detail}, {hair length and color} hair, make hair style bit differnt, {eye shape} {eye color} eyes, {body build}, including chest size, stomach type, wearing {outfit description}, {style signature}"

Also extract these fields from the photo:
- "gender": "female" or "male"
- "age": estimated age as a number (18-35 range)
- "occupation": a plausible occupation that matches the person's style (optional)
- "vibe": overall aesthetic vibe in 1-3 words (e.g. "warm bohemian", "cool minimalist")
- "expression": the person's expression in 1-2 words
- "ethnicity": one of the following exact values based ONLY on clearly visible visual cues: ${ETHNICITIES.join(", ")}. Treat this as the most specific stored value: prefer a specific option (e.g. "Indian" or "Japanese") over the broader "Asian" bucket when clearly discernible. Use "Asian" only when the person appears broadly Asian but no more specific option is justified. If the background is ambiguous or unclear, set this to null. Do NOT stereotype or assume — only infer from obvious cues.
- "suggestedLocation": a plausible real city in "City, CC" format where someone of this apparent ethnic background and style would realistically live (e.g. "Tokyo, JP", "Lagos, NG", "São Paulo, BR", "Berlin, DE"). Pick a real major city. If ethnicity is null/ambiguous, pick a cosmopolitan city that suits the overall aesthetic. Use ISO 3166-1 alpha-2 country codes.

Return a JSON object with these fields:
{
  "subjectDescriptor": "the full comma-separated descriptor string",
  "gender": "female" or "male",
  "age": number,
  "occupation": "string or null",
  "vibe": "string or null",
  "expression": "string or null",
  "ethnicity": "one of [${ETHNICITIES.join(", ")}] or null",
  "suggestedLocation": "City, CC or null"
}

Return ONLY valid JSON, no markdown fences.`;

    // Pass the signed R2 URL directly to the vision model instead of
    // inlining the bytes as a data URL. The AI SDK forwards URL strings
    // to providers that can fetch them, and OpenRouter's image inputs
    // accept remote URLs - so we avoid materializing the (potentially
    // multi-MB) image in memory here.
    const result = await generateText({
      model: openRouterProvider.chat(IMAGE_ANALYSIS_MODEL),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: referenceImageUrl,
            },
            { type: "text", text: analysisPrompt },
          ],
        },
      ],
    });

    const text = result.text.trim();
    const jsonStr = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse vision model response as JSON");
    }

    if (
      typeof parsed.subjectDescriptor !== "string" ||
      !parsed.subjectDescriptor
    ) {
      throw new Error("Vision model did not return a valid subjectDescriptor");
    }

    const gender =
      parsed.gender === "male" ? ("male" as const) : ("female" as const);
    const age =
      typeof parsed.age === "number" && parsed.age >= 18 && parsed.age <= 50
        ? parsed.age
        : 25;

    const sanitizeShortString = (
      value: unknown,
      maxLength: number,
    ): string | undefined => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === "null") return undefined;
      return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
    };

    // Vision model is prompted to pick from `ETHNICITIES` verbatim. We
    // additionally gate on the enum here so any drift (model returns
    // "Southeast Asian" instead of "Asian", etc.) becomes `undefined`
    // rather than being written to the job row. The candidate LLM will
    // then pick its own coherent value from the full enum.
    const ethnicityRaw = sanitizeShortString(parsed.ethnicity, 40);
    const ethnicity =
      ethnicityRaw && (ETHNICITIES as readonly string[]).includes(ethnicityRaw)
        ? ethnicityRaw
        : undefined;

    return {
      subjectDescriptor: parsed.subjectDescriptor,
      suggestedGender: gender,
      suggestedAge: age,
      suggestedOccupation:
        typeof parsed.occupation === "string" ? parsed.occupation : undefined,
      suggestedVibe: typeof parsed.vibe === "string" ? parsed.vibe : undefined,
      suggestedExpression:
        typeof parsed.expression === "string" ? parsed.expression : undefined,
      suggestedLocation: sanitizeShortString(parsed.suggestedLocation, 60),
      ethnicity,
      referenceImageUrl,
    };
  },
});
