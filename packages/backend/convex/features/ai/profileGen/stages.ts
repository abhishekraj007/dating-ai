import { r2 } from "../../../uploads";
import { type Gender, SHOWCASE_MIN_SUCCESS } from "../profileGenerationData";
import { IS_DEV, JOB_PROGRESS_STEPS, PROFILE_PERSIST_MODEL } from "./constants";
import type {
  AppearanceProfile,
  JobProgressStep,
  ProfileCandidate,
  ShowcaseSlotPrompt,
  StepModelEntry,
} from "./types";
import { GenerationFailureError } from "./types";
import {
  createAndStoreGeneratedImage,
  imageGenerationModelName,
} from "./images";
import {
  buildShowcasePrompts,
  materializeSlotPrompts,
  planShowcaseSlots,
  randomShowcaseCount,
} from "./showcase";
import { buildAvatarPrompt } from "./prompts";
import { updateJobProgress, upsertStepModel } from "./progress";
import { generateShowcaseVignettes } from "./vignettes";

/**
 * Runs the showcase-image generation pass + profile persistence.
 * Shared between the cron end-to-end path and the admin approve-preview path.
 * Throws on failure; caller is expected to mark the job failed with its own
 * accumulated progress state.
 */
export async function runShowcaseAndPersistStage(
  ctx: any,
  params: {
    jobId: string;
    candidate: ProfileCandidate;
    appearance: AppearanceProfile;
    subjectDescriptor: string;
    avatarImageKey: string;
    selectedGender: Gender;
    attempts: number;
    initialCompletedSteps: JobProgressStep[];
    initialStepModels: StepModelEntry[];
  },
): Promise<{ createdProfileId: string }> {
  const {
    jobId,
    candidate,
    appearance,
    subjectDescriptor,
    avatarImageKey,
    selectedGender,
    attempts,
  } = params;

  let completedSteps: JobProgressStep[] = [...params.initialCompletedSteps];
  let stepModels: StepModelEntry[] = [...params.initialStepModels];

  const avatarReferenceUrl = await r2.getUrl(avatarImageKey);
  const showcaseCount = randomShowcaseCount();

  // Plan slots first (scene selection + per-slot variation sampling).
  const slotPlans = planShowcaseSlots(candidate, appearance, showcaseCount);

  // Then try to enrich each slot with a bespoke LLM vignette. This is a
  // single batched call (one per profile, not per slot) targeting a cheap
  // model. Failures degrade gracefully to the sampled baselines.
  let vignettes: Awaited<ReturnType<typeof generateShowcaseVignettes>> = [];
  try {
    vignettes = await generateShowcaseVignettes(
      candidate,
      appearance,
      slotPlans,
    );
  } catch (error) {
    console.warn(
      "[profileGen.stages] Vignette generation threw; continuing with baseline plans.",
      error,
    );
    vignettes = slotPlans.map(() => null);
  }

  const initialPrompts = materializeSlotPrompts(
    slotPlans,
    candidate,
    appearance,
    subjectDescriptor,
    vignettes,
  );

  stepModels = upsertStepModel(
    stepModels,
    "showcase_generation",
    imageGenerationModelName(IS_DEV),
  );
  await updateJobProgress(
    ctx,
    jobId,
    "showcase_generation",
    completedSteps,
    stepModels,
    `Generating ${showcaseCount} showcase images in parallel...`,
  );

  // Slot-indexed storage preserves ordering (first slot -> first shot).
  const profileImageSlots: (string | null)[] = new Array(showcaseCount).fill(
    null,
  );
  const usedSceneIds = new Set<string>(
    initialPrompts.map((entry) => entry.sceneId),
  );
  let completedCount = 0;

  const runSlot = async (
    slotIndex: number,
    slot: ShowcaseSlotPrompt,
  ): Promise<void> => {
    const key = await createAndStoreGeneratedImage(
      ctx,
      slot.prompt,
      avatarReferenceUrl,
      `aiProfiles/generated/${jobId}/showcase`,
    );
    profileImageSlots[slotIndex] = key;
    completedCount += 1;
    await updateJobProgress(
      ctx,
      jobId,
      "showcase_generation",
      completedSteps,
      stepModels,
      `Showcase images: ${completedCount}/${showcaseCount} done`,
    );
  };

  const firstPass = await Promise.allSettled(
    initialPrompts.map((slot, index) => runSlot(index, slot)),
  );
  const failedSlotIndexes = firstPass
    .map((outcome, index) => (outcome.status === "rejected" ? index : -1))
    .filter((index) => index >= 0);

  if (failedSlotIndexes.length > 0) {
    const retryPrompts = buildShowcasePrompts(
      candidate,
      appearance,
      subjectDescriptor,
      failedSlotIndexes.length,
      usedSceneIds,
    );
    for (const retrySlot of retryPrompts) {
      usedSceneIds.add(retrySlot.sceneId);
    }
    await updateJobProgress(
      ctx,
      jobId,
      "showcase_generation",
      completedSteps,
      stepModels,
      `Retrying ${failedSlotIndexes.length} failed showcase slot${failedSlotIndexes.length > 1 ? "s" : ""}...`,
    );

    await Promise.allSettled(
      failedSlotIndexes.map((slotIndex, i) => {
        const retrySlot = retryPrompts[i];
        if (!retrySlot) return Promise.resolve();
        return runSlot(slotIndex, retrySlot);
      }),
    );
  }

  const profileImageKeys = profileImageSlots.filter(
    (key): key is string => typeof key === "string",
  );

  if (profileImageKeys.length < SHOWCASE_MIN_SUCCESS) {
    throw new GenerationFailureError(
      "image_generation_retry_exhausted",
      `Only ${profileImageKeys.length}/${showcaseCount} showcase images succeeded (minimum ${SHOWCASE_MIN_SUCCESS}).`,
    );
  }

  completedSteps = [...completedSteps, "showcase_generation"];
  stepModels = upsertStepModel(
    stepModels,
    "profile_persist",
    PROFILE_PERSIST_MODEL,
  );
  await updateJobProgress(
    ctx,
    jobId,
    "profile_persist",
    completedSteps,
    stepModels,
    "Saving generated profile...",
  );

  const createdProfileId = (await ctx.runMutation(
    "features/ai/profileGeneration:createSystemProfileInternal" as any,
    {
      ...candidate,
      avatarImageKey,
      profileImageKeys,
    },
  )) as string;
  completedSteps = [...completedSteps, "profile_persist"];

  await ctx.runMutation(
    "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
    {
      jobId,
      status: "completed",
      selectedGender,
      attempts,
      createdProfileId,
      progress: {
        currentStep: "completed",
        completedSteps,
        stepModels,
        message: "Profile generation completed successfully.",
        totalSteps: JOB_PROGRESS_STEPS.length,
        completedStepCount: completedSteps.length,
      },
      completedAt: Date.now(),
    },
  );

  return { createdProfileId };
}

/**
 * Runs the avatar-generation step. Returns the stored R2 key and the
 * exact prompt used (so the preview UI can display / edit it).
 */
export async function generateAvatarForJob(
  ctx: any,
  params: {
    jobId: string;
    candidate: ProfileCandidate;
    appearance: AppearanceProfile;
    subjectDescriptor: string;
    isReferenceMode: boolean;
    referenceImageUrl?: string | null;
    overridePrompt?: string;
  },
): Promise<{ avatarImageKey: string; avatarPrompt: string }> {
  const {
    jobId,
    candidate,
    appearance,
    subjectDescriptor,
    isReferenceMode,
    referenceImageUrl,
    overridePrompt,
  } = params;

  const avatarPrompt =
    overridePrompt?.trim() ||
    (isReferenceMode
      ? `Create a different person photo inspired by given reference image, face should be slightly different, Change the outfit color (and pattern style if present).\n\n${buildAvatarPrompt(candidate, appearance, subjectDescriptor)}`
      : buildAvatarPrompt(candidate, appearance, subjectDescriptor));

  const avatarImageKey = await createAndStoreGeneratedImage(
    ctx,
    avatarPrompt,
    isReferenceMode ? (referenceImageUrl ?? null) : null,
    `aiProfiles/generated/${jobId}/avatar`,
    !isReferenceMode,
  );

  return { avatarImageKey, avatarPrompt };
}
