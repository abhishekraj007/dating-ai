import { useEffect } from "react";
import { Image } from "expo-image";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { AvatarImageRequest } from "@dating-ai/backend";
import type { GenderPreference } from "@/stores/onboarding-store";

export const ONBOARDING_CHARACTER_LIMIT = 5;

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
  limit = ONBOARDING_CHARACTER_LIMIT,
  image?: AvatarImageRequest,
) {
  const platform = getCurrentPlatform();
  const characters = useQuery(
    api.features.ai.queries.getOnboardingCharacters,
    gender
      ? {
          gender,
          platform,
          limit,
          imageWidth: image?.imageWidth,
          imageQuality: image?.imageQuality,
        }
      : "skip",
  );

  useEffect(() => {
    if (!characters) {
      return;
    }

    const urls = characters
      .map((character) => character.avatarUrl)
      .filter((url): url is string => Boolean(url));

    if (urls.length === 0) {
      return;
    }

    void Image.prefetch(urls, { cachePolicy: "memory-disk" });
  }, [characters]);

  return {
    characters: characters ?? [],
    isLoading: gender !== null && characters === undefined,
  };
}
