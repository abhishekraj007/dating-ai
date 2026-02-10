"use client";

import { useState } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { toast } from "sonner";

type GenerationJobStatus = "queued" | "processing" | "completed" | "failed";

type GenerationJob = {
  _id: string;
  status: GenerationJobStatus;
  source?: "manual" | "cron";
  errorMessage?: string;
  createdAt?: number;
  completedAt?: number;
  selectedGender?: "female" | "male";
  retriedAt?: number;
};

export function useCharacterGeneration() {
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(api.user.fetchUserAndProfile, isAuthenticated ? {} : "skip");
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

  const [isGenerating, setIsGenerating] = useState(false);

  const runningCount =
    jobs?.filter(
      (job) => job.status === "queued" || job.status === "processing",
    ).length ?? 0;
  const completedCount =
    jobs?.filter((job) => job.status === "completed").length ?? 0;
  const failedJobs =
    jobs?.filter((job) => job.status === "failed" && !job.retriedAt) ?? [];
  const failedCount = failedJobs.length;

  const triggerGeneration = async () => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("Admin access required");
      return;
    }

    setIsGenerating(true);
    try {
      await generateProfile({});
      toast.success("Character generation queued");
    } catch (error) {
      toast.error("Failed to queue character generation");
      console.error(error);
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

  return {
    isGenerating,
    triggerGeneration,
    retryGeneration,
    runningCount,
    completedCount,
    failedCount,
    failedJobs,
    jobs: jobs ?? [],
    hasJobData: jobs !== undefined,
  };
}
