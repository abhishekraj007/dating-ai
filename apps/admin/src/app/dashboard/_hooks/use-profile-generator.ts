"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { toast } from "sonner";

export function useProfileGenerator() {
  const generateProfile = useMutation(
    (api as any).features.ai.profileGeneration.adminGenerateSystemProfile,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerProfileGeneration = async () => {
    setIsGenerating(true);
    try {
      await generateProfile({});
      toast.success("Profile generation job queued");
    } catch (error) {
      toast.error("Failed to queue profile generation");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    triggerProfileGeneration,
  };
}
