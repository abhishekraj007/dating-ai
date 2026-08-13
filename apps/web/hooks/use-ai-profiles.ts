"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import type { AvatarImageRequest } from "@dating-ai/backend";

type Gender = "female" | "male";

interface UseAIProfilesOptions extends AvatarImageRequest {
  gender?: Gender;
  limit?: number;
  excludeExistingConversations?: boolean;
}

export function useAIProfiles(
  genderOrOptions?: Gender | UseAIProfilesOptions,
  limit?: number
) {
  const options: UseAIProfilesOptions =
    typeof genderOrOptions === "object"
      ? genderOrOptions
      : { gender: genderOrOptions, limit };

  const profiles = useQuery(api.features.ai.queries.getProfiles, {
    gender: options.gender,
    limit: options.limit,
    excludeExistingConversations: options.excludeExistingConversations,
    imageWidth: options.imageWidth,
    imageQuality: options.imageQuality,
  });

  return {
    profiles: profiles ?? [],
    isLoading: profiles === undefined,
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
      : "skip"
  );

  return {
    profile,
    isLoading: profile === undefined,
  };
}
