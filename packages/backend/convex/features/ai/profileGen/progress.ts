import { JOB_PROGRESS_STEPS } from "./constants";
import type { JobProgressStep, StepModelEntry } from "./types";

export async function updateJobProgress(
  ctx: any,
  jobId: string,
  currentStep: JobProgressStep | "failed" | "completed",
  completedSteps: JobProgressStep[],
  stepModels: StepModelEntry[],
  message?: string,
) {
  await ctx.runMutation(
    "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
    {
      jobId,
      progress: {
        currentStep,
        completedSteps,
        stepModels,
        message,
        totalSteps: JOB_PROGRESS_STEPS.length,
        completedStepCount: completedSteps.length,
      },
    },
  );
}

export function upsertStepModel(
  stepModels: StepModelEntry[],
  step: JobProgressStep,
  model: string,
): StepModelEntry[] {
  const next = stepModels.filter((entry) => entry.step !== step);
  next.push({ step, model });
  return next;
}
