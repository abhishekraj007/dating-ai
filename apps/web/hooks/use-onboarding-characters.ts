"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { DiscoverGenderPreference } from "@/lib/public-segments";

export function useOnboardingCharacters(
  gender: DiscoverGenderPreference | null,
  limit = 6,
) {
  const characters = useQuery(api.features.ai.queries.getOnboardingCharacters, {
    gender: gender ?? "both",
    platform: "web",
    limit,
  });

  return {
    characters: characters ?? [],
    isLoading: characters === undefined,
  };
}
