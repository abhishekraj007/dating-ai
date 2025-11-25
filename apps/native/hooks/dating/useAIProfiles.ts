import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend";

type Gender = "female" | "male";

export function useAIProfiles(gender?: Gender, limit?: number) {
  const profiles = useQuery(api.features.ai.queries.getProfiles, {
    gender,
    limit,
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

