"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { toast } from "sonner";

export type PreviewCandidate = {
  name: string;
  username: string;
  gender: "female" | "male";
  age: number;
  zodiacSign: string;
  occupation: string;
  location: string;
  bio: string;
  interests: string[];
  personalityTraits: string[];
  relationshipGoal: string;
  mbtiType: string;
};

export type PreviewJob = {
  _id: string;
  status:
    | "queued"
    | "processing"
    | "awaiting_avatar_approval"
    | "completed"
    | "failed"
    | "cancelled";
  errorMessage?: string;
  progress?: {
    currentStep: string;
    message?: string;
  };
  preview?: {
    candidate: PreviewCandidate;
    subjectDescriptor: string;
    isReferenceMode: boolean;
    avatarImageKey: string;
    avatarPrompt: string;
    avatarAttempts: number;
  };
  previewAvatarUrl: string | null;
  createdProfileId?: string;
};

export type EditedCandidate = {
  name?: string;
  age?: number;
  occupation?: string;
  location?: string;
  bio?: string;
  interests?: string[];
};

export const MAX_AVATAR_ATTEMPTS = 5;

/**
 * Subscribes to a single paused profile-generation job and exposes
 * approve / regenerate / cancel actions.
 */
export function usePreviewApproval(jobId: string | null) {
  const job = useQuery(
    (api as any).features.ai.profileGeneration.getProfileGenerationJobForAdmin,
    jobId ? { jobId } : "skip",
  ) as PreviewJob | null | undefined;

  const regenerateAvatar = useMutation(
    (api as any).features.ai.profileGeneration.adminRegenerateAvatar,
  );
  const approveAvatar = useMutation(
    (api as any).features.ai.profileGeneration.adminApproveAvatar,
  );
  const cancelPreview = useMutation(
    (api as any).features.ai.profileGeneration.adminCancelPreview,
  );

  const regenerate = async (editedPrompt?: string) => {
    if (!jobId) return;
    try {
      await regenerateAvatar({
        jobId,
        editedPrompt: editedPrompt?.trim() || undefined,
      });
      toast.info("Regenerating avatar...");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to regenerate avatar";
      toast.error(message);
      console.error(error);
    }
  };

  const approve = async (edited?: EditedCandidate) => {
    if (!jobId) return;
    try {
      await approveAvatar({
        jobId,
        editedCandidate: edited,
      });
      toast.success("Approved — generating showcase images");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve preview";
      toast.error(message);
      console.error(error);
      throw error;
    }
  };

  const cancel = async () => {
    if (!jobId) return;
    try {
      await cancelPreview({ jobId });
      toast.info("Generation cancelled");
    } catch (error) {
      toast.error("Failed to cancel generation");
      console.error(error);
    }
  };

  return {
    job: job ?? null,
    isLoading: jobId !== null && job === undefined,
    regenerate,
    approve,
    cancel,
  };
}
