import { useQuery, usePaginatedQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";
import { useConvexAuth } from "convex/react";
import { DEFAULT_USER_PREFERENCES, useUserPreferences } from "./useForYou";

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
  const { isAuthenticated } = useConvexAuth();
  const { preferences } = useUserPreferences();
  const platform = getCurrentPlatform();
  const genderPreference =
    preferences?.genderPreference ?? DEFAULT_USER_PREFERENCES.genderPreference;
  const ageMin = preferences?.ageMin ?? DEFAULT_USER_PREFERENCES.ageMin;
  const ageMax = preferences?.ageMax ?? DEFAULT_USER_PREFERENCES.ageMax;
  const zodiacPreferences = [...(preferences?.zodiacPreferences ?? [])].sort();
  const interestPreferences = [
    ...(preferences?.interestPreferences ?? []),
  ].sort();

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
