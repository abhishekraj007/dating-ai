import { useQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";

type Gender = "female" | "male";

interface UseAIProfilesOptions {
  gender?: Gender;
  limit?: number;
  excludeExistingConversations?: boolean;
}

export function useAIProfiles(
  genderOrOptions?: Gender | UseAIProfilesOptions,
  limit?: number
) {
  // Support both old signature (gender, limit) and new options object
  const options: UseAIProfilesOptions =
    typeof genderOrOptions === "object"
      ? genderOrOptions
      : { gender: genderOrOptions, limit };

  const profiles = useQuery(api.features.ai.queries.getProfiles, {
    gender: options.gender,
    limit: options.limit,
    excludeExistingConversations: options.excludeExistingConversations,
  });

  return {
    profiles: profiles ?? [],
    isLoading: profiles === undefined,
  };
}

export function useAIProfile(profileId: string | undefined) {
  const profile = useQuery(
    api.features.ai.queries.getProfile,
    profileId ? { profileId: profileId as any } : "skip"
  );

  return {
    profile,
    isLoading: profile === undefined,
  };
}
