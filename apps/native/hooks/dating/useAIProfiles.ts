import { useQuery, usePaginatedQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";
import type { AvatarImageRequest, Id } from "@dating-ai/backend";
import { useConvexAuth } from "convex/react";
import { useEffectiveUserPreferences } from "./useForYou";

type Gender = "female" | "male";

interface UseAIProfilesOptions extends AvatarImageRequest {
  gender?: Gender;
  limit?: number;
  excludeExistingConversations?: boolean;
}

type AppPlatform = "web" | "ios" | "android";

function getCurrentPlatform(): AppPlatform {
  const platform = process.env.EXPO_OS;
  if (platform === "ios" || platform === "android" || platform === "web") {
    return platform;
  }
  return "web";
}

export function useAIProfiles(
  genderOrOptions?: Gender | UseAIProfilesOptions,
  limit?: number,
) {
  // Support both old signature (gender, limit) and new options object
  const options: UseAIProfilesOptions =
    typeof genderOrOptions === "object"
      ? genderOrOptions
      : { gender: genderOrOptions, limit };

  const platform = getCurrentPlatform();
  const profiles = useQuery(api.features.ai.queries.getProfiles, {
    gender: options.gender,
    limit: options.limit,
    excludeExistingConversations: options.excludeExistingConversations,
    platform,
    imageWidth: options.imageWidth,
    imageQuality: options.imageQuality,
  });

  return {
    profiles: profiles ?? [],
    isLoading: profiles === undefined,
  };
}

/**
 * Hook to get profiles for the Explore screen with user preference filtering.
 * Uses paginated query for infinite scroll.
 */
export function useExploreProfiles(
  initialNumItems: number = 20,
  image?: AvatarImageRequest,
) {
  const { isAuthenticated } = useConvexAuth();
  const { preferences } = useEffectiveUserPreferences();
  const platform = getCurrentPlatform();
  const genderPreference = preferences.genderPreference;
  const ageMin = preferences.ageMin;
  const ageMax = preferences.ageMax;
  const zodiacPreferences = [...preferences.zodiacPreferences].sort();
  const interestPreferences = [...preferences.interestPreferences].sort();

  const viewerKind = isAuthenticated ? "authenticated" : "anonymous";

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.features.preferences.queries.getExploreProfilesPaginated,
    {
      platform,
      viewerKind,
      genderPreference,
      ageMin,
      ageMax,
      zodiacPreferences,
      interestPreferences,
      imageWidth: image?.imageWidth,
      imageQuality: image?.imageQuality,
    },
    { initialNumItems },
  );

  return {
    profiles: results ?? [],
    isLoading,
    status,
    loadMore,
  };
}

export function useAIProfile(
  profileId: string | undefined,
  image?: AvatarImageRequest,
) {
  const profile = useQuery(
    api.features.ai.queries.getProfile,
    profileId
      ? {
          profileId: profileId as Id<"aiProfiles">,
          imageWidth: image?.imageWidth,
          imageQuality: image?.imageQuality,
        }
      : "skip",
  );

  return {
    profile,
    isLoading: profile === undefined,
  };
}
