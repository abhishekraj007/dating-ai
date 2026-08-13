"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { AvatarImageRequest } from "@dating-ai/backend";
import type { DiscoverGenderPreference } from "@/lib/public-segments";

export function useOnboardingCharacters(
  gender: DiscoverGenderPreference | null,
  limit = 6,
  image?: AvatarImageRequest,
) {
  const characters = useQuery(api.features.ai.queries.getOnboardingCharacters, {
    gender: gender ?? "both",
    platform: "web",
    limit,
    imageWidth: image?.imageWidth,
    imageQuality: image?.imageQuality,
  });

  return {
    characters: characters ?? [],
    isLoading: characters === undefined,
  };
}
