import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { GenderPreference } from "@/stores/onboarding-store";

type AppPlatform = "web" | "ios" | "android";

function getCurrentPlatform(): AppPlatform {
  const platform = process.env.EXPO_OS;
  if (platform === "ios" || platform === "android" || platform === "web") {
    return platform;
  }
  return "web";
}

export function useOnboardingCharacters(
  gender: GenderPreference | null,
  limit = 6,
) {
  const platform = getCurrentPlatform();
  const characters = useQuery(api.features.ai.queries.getOnboardingCharacters, {
    gender: gender ?? "both",
    platform,
    limit,
  });

  return {
    characters: characters ?? [],
    isLoading: characters === undefined,
  };
}
