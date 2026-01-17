import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend";

type Gender = "female" | "male";

export function useUserCreatedProfiles(gender?: Gender) {
  const profiles = useQuery(api.features.ai.queries.getUserCreatedProfiles, {
    gender,
  });

  return {
    profiles: profiles ?? [],
    isLoading: profiles === undefined,
  };
}

export function useCreateAIProfile() {
  const createProfile = useMutation(api.features.ai.mutations.createAIProfile);

  return { createProfile };
}

export function useUpdateAIProfile() {
  const updateProfile = useMutation(api.features.ai.mutations.updateAIProfile);

  return { updateProfile };
}

export function useArchiveAIProfile() {
  const archiveProfile = useMutation(
    api.features.ai.mutations.archiveAIProfile
  );

  return { archiveProfile };
}
