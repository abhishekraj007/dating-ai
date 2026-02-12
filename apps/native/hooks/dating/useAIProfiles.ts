import { useQuery, usePaginatedQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";
import { useUserPreferences } from "./useForYou";

type Gender = "female" | "male";

interface UseAIProfilesOptions {
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
export function useExploreProfiles(initialNumItems: number = 20) {
  const { preferences } = useUserPreferences();
  const platform = getCurrentPlatform();

  // Extract only the allowed args to avoid sending system fields like _id, _creationTime
  const filterArgs = preferences
    ? {
        genderPreference: preferences.genderPreference,
        ageMin: preferences.ageMin,
        ageMax: preferences.ageMax,
        zodiacPreferences: preferences.zodiacPreferences,
        interestPreferences: preferences.interestPreferences,
      }
    : {};

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.features.preferences.queries.getExploreProfilesPaginated,
    {
      platform,
      ...filterArgs,
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

export function useAIProfile(profileId: string | undefined) {
  const profile = useQuery(
    api.features.ai.queries.getProfile,
    profileId ? { profileId: profileId as any } : "skip",
  );

  return {
    profile,
    isLoading: profile === undefined,
  };
}
