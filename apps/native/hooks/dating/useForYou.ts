import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import type { Id } from "@dating-ai/backend";

export type GenderPreference = "female" | "male" | "both";
export type InteractionAction = "like" | "skip" | "superlike";

export interface UserPreferences {
  genderPreference: GenderPreference;
  ageMin: number;
  ageMax: number;
  zodiacPreferences: string[];
  interestPreferences: string[];
}

export interface ForYouProfile {
  _id: Id<"aiProfiles">;
  name: string;
  age?: number;
  gender: "female" | "male";
  zodiacSign?: string;
  bio?: string;
  interests?: string[];
  avatarUrl: string | null;
}

/**
 * Hook to get profiles for the For You feed.
 */
export function useForYouProfiles(limit?: number) {
  const profiles = useQuery(
    api.features.preferences.queries.getForYouProfiles,
    {
      limit,
    }
  );

  return {
    profiles: profiles ?? [],
    isLoading: profiles === undefined,
  };
}

/**
 * Hook to get user preferences.
 */
export function useUserPreferences() {
  const preferences = useQuery(
    api.features.preferences.queries.getUserPreferences
  );

  return {
    preferences,
    isLoading: preferences === undefined,
  };
}

/**
 * Hook to save user preferences.
 */
export function useSavePreferences() {
  const savePreferences = useMutation(
    api.features.preferences.queries.saveUserPreferences
  );

  return { savePreferences };
}

/**
 * Hook to record profile interactions (like/skip).
 */
export function useProfileInteraction() {
  const recordInteraction = useMutation(
    api.features.preferences.queries.recordProfileInteraction
  );

  const likeProfile = async (aiProfileId: Id<"aiProfiles">) => {
    return recordInteraction({ aiProfileId, action: "like" });
  };

  const skipProfile = async (aiProfileId: Id<"aiProfiles">) => {
    return recordInteraction({ aiProfileId, action: "skip" });
  };

  const superlikeProfile = async (aiProfileId: Id<"aiProfiles">) => {
    return recordInteraction({ aiProfileId, action: "superlike" });
  };

  return {
    likeProfile,
    skipProfile,
    superlikeProfile,
  };
}

/**
 * Hook to get liked profiles.
 */
export function useLikedProfiles() {
  const profiles = useQuery(api.features.preferences.queries.getLikedProfiles);

  return {
    profiles: profiles ?? [],
    isLoading: profiles === undefined,
  };
}

/**
 * Hook to check onboarding status.
 */
export function useOnboardingStatus() {
  const hasCompleted = useQuery(
    api.features.preferences.queries.hasCompletedOnboarding
  );
  const completeOnboarding = useMutation(
    api.features.preferences.queries.completeOnboarding
  );

  return {
    hasCompletedOnboarding: hasCompleted ?? false,
    isLoading: hasCompleted === undefined,
    completeOnboarding,
  };
}
