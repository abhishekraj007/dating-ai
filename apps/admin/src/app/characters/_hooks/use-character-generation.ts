"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { toast } from "sonner";

type GenerationJobStatus = "queued" | "processing" | "completed" | "failed";
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

  const triggerGeneration = async (input?: GenerationInput) => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    setIsGenerating(true);
    try {
      await generateProfile({
        preferredGender: input?.preferredGender,
        preferredOccupation: input?.preferredOccupation?.trim() || undefined,
        preferredInterests:
          input?.preferredInterests && input.preferredInterests.length > 0
            ? input.preferredInterests
            : undefined,
        appearanceOverrides: input?.appearanceOverrides,
        referenceSubjectDescriptor: input?.referenceSubjectDescriptor,
        referenceImageUrl: input?.referenceImageUrl,
      });
      toast.success("Character generation queued");
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return null;
    }

    setIsAnalyzingPhoto(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );

      const result = await analyzePhotoAction({
        imageBase64: base64,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
      });

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
