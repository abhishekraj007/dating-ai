"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { toast } from "sonner";

type GenerationJobStatus =
  | "queued"
  | "processing"
  | "awaiting_avatar_approval"
  | "completed"
  | "failed"
  | "cancelled";
type GenerationInput = {
  preferredGender?: "female" | "male";
  preferredOccupation?: string;
  preferredInterests?: string[];
  appearanceOverrides?: {
    skinTone?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    build?: string;
    outfit?: string;
    vibe?: string;
    expression?: string;
  };
  referenceSubjectDescriptor?: string;
  referenceImageUrl?: string;
  preferredLocation?: string;
  ethnicity?: string;
};

type ProfileGenerationOption = {
  value: string;
  label: string;
  emoji?: string;
};

type ProfileGenerationOptions = {
  genders: ProfileGenerationOption[];
  occupations: ProfileGenerationOption[];
  interests: ProfileGenerationOption[];
  appearance?: {
    skinTones: string[];
    hairColors: string[];
    hairStylesFemale: string[];
    hairStylesMale: string[];
    eyeColors: string[];
    buildsFemale: string[];
    buildsMale: string[];
    outfitsFemale: string[];
    outfitsMale: string[];
    vibes: string[];
    expressions: string[];
  };
};

type GenerationJob = {
  _id: string;
  status: GenerationJobStatus;
  source?: "manual" | "cron";
  errorMessage?: string;
  createdAt?: number;
  completedAt?: number;
  selectedGender?: "female" | "male";
  progress?: {
    currentStep: string;
    completedSteps: string[];
    stepModels?: {
      step: string;
      model: string;
    }[];
    message?: string;
    totalSteps: number;
    completedStepCount: number;
  };
  retriedAt?: number;
};

export function useCharacterGeneration() {
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );
  const isAdmin = userData?.profile?.isAdmin === true;
  const generateProfile = useMutation(
    (api as any).features.ai.profileGeneration.adminGenerateSystemProfile,
  );
  const retryFailedJob = useMutation(
    (api as any).features.ai.profileGeneration.adminRetryProfileGeneration,
  );
  const jobs = useQuery(
    (api as any).features.ai.profileGeneration.getProfileGenerationJobs,
    isAuthenticated && isAdmin ? { limit: 20 } : "skip",
  ) as GenerationJob[] | null | undefined;
  const generationOptions = useQuery(
    (api as any).features.ai.profileGeneration.getProfileGenerationOptions,
    isAuthenticated && isAdmin ? {} : "skip",
  ) as ProfileGenerationOptions | null | undefined;

  const analyzePhotoAction = useAction(
    (api as any).features.ai.profileGenerationActions.analyzeReferencePhoto,
  );
  const generateReferenceUploadUrl = useMutation(
    (api as any).uploads.generateReferencePhotoUploadUrl,
  );
  const syncUploadMetadata = useMutation(api.uploads.syncMetadata);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const runningCount =
    jobs?.filter(
      (job) => job.status === "queued" || job.status === "processing",
    ).length ?? 0;
  const completedCount =
    jobs?.filter((job) => job.status === "completed").length ?? 0;
  const failedJobs =
    jobs?.filter((job) => job.status === "failed" && !job.retriedAt) ?? [];
  const failedCount = failedJobs.length;

  const triggerGeneration = async (
    input?: GenerationInput,
  ): Promise<string | null> => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return null;
    }

    setIsGenerating(true);
    try {
      const result = (await generateProfile({
        preferredGender: input?.preferredGender,
        preferredOccupation: input?.preferredOccupation?.trim() || undefined,
        preferredInterests:
          input?.preferredInterests && input.preferredInterests.length > 0
            ? input.preferredInterests
            : undefined,
        appearanceOverrides: input?.appearanceOverrides,
        referenceSubjectDescriptor: input?.referenceSubjectDescriptor,
        referenceImageUrl: input?.referenceImageUrl,
        preferredLocation: input?.preferredLocation?.trim() || undefined,
        ethnicity: input?.ethnicity?.trim() || undefined,
      })) as { queued?: boolean; jobId?: string } | undefined;
      toast.success("Generating avatar — review when ready");
      return result?.jobId ?? null;
    } catch (error) {
      toast.error("Failed to queue character generation");
      console.error(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const retryGeneration = async (jobId: string) => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    try {
      await retryFailedJob({ jobId });
      toast.success("Retry queued");
    } catch (error) {
      toast.error("Failed to retry job");
      console.error(error);
    }
  };

  const analyzePhoto = async (file: File) => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return null;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"] as const;
    if (!validTypes.includes(file.type as any)) {
      toast.error("Only JPEG, PNG, or WebP images are supported");
      return null;
    }

    // 5 MB cap aligned with what the backend can accept. Uploading direct
    // to R2 sidesteps the 5 MiB Node-action args limit (base64 overhead
    // would otherwise bust it), but we still want a friendly guardrail
    // before even starting the upload.
    const MAX_REFERENCE_PHOTO_BYTES = 6 * 1024 * 1024;
    if (file.size > MAX_REFERENCE_PHOTO_BYTES) {
      toast.error("File size is too large, max allowed is 6 mb");
      return null;
    }

    setIsAnalyzingPhoto(true);
    try {
      // 1. Mint a signed R2 upload URL scoped to this admin.
      const { url, key } = (await generateReferenceUploadUrl({})) as {
        url: string;
        key: string;
      };

      // 2. PUT the file straight to R2 (no action-args size cap here).
      const uploadResp = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResp.ok) {
        throw new Error(`Upload failed: ${uploadResp.statusText}`);
      }

      // 3. Sync R2 metadata so the object is registered + validated.
      await syncUploadMetadata({ key });

      // 4. Hand the key to the Node action; only a short string crosses
      //    the args boundary, never the image bytes.
      const result = await analyzePhotoAction({ imageKey: key });

      toast.success("Photo analyzed — reference data extracted");
      return result;
    } catch (error) {
      toast.error("Failed to analyze reference photo");
      console.error(error);
      return null;
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  return {
    isGenerating,
    isAnalyzingPhoto,
    analyzePhoto,
    triggerGeneration,
    retryGeneration,
    runningCount,
    completedCount,
    failedCount,
    failedJobs,
    jobs: jobs ?? [],
    generationOptions: generationOptions ?? null,
    hasJobData: jobs !== undefined,
  };
}
