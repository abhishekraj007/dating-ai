import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@dating-ai/backend";
import type { Id } from "@dating-ai/backend";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";

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
    },
  );

  return {
    profiles: profiles ?? [],
    isLoading: profiles === undefined,
  };
}

export function useUserPreferences() {
  const { isAuthenticated } = useConvexAuth();
  const convexPreferences = useQuery(
    api.features.preferences.queries.getUserPreferences,
  );

  const [localPreferences, setLocalPreferences] =
    useState<UserPreferences | null>(null);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  const loadLocalPreferences = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem("user_preferences");
      if (json) {
        setLocalPreferences(JSON.parse(json));
      }
    } catch (e) {
      console.error("Failed to load local preferences", e);
    } finally {
      setIsLoadingLocal(false);
    }
  }, []);

  // Reload local preferences when screen focuses (to catch updates from Filter screen)
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        loadLocalPreferences();
      }
    }, [isAuthenticated, loadLocalPreferences]),
  );

  return {
    preferences: isAuthenticated ? convexPreferences : localPreferences,
    isLoading: isAuthenticated
      ? convexPreferences === undefined
      : isLoadingLocal,
  };
}

/**
 * Hook to save user preferences.
 * Only saves to the database if the user is authenticated.
 * For unauthenticated users, the filter is applied locally without persistence.
 */
export function useSavePreferences() {
  const { isAuthenticated } = useConvexAuth();
  const savePreferencesMutation = useMutation(
    api.features.preferences.queries.saveUserPreferences,
  );

  const savePreferences = async (preferences: UserPreferences) => {
    // Only save to database if user is authenticated
    if (isAuthenticated) {
      return savePreferencesMutation(preferences);
    }

    // For unauthenticated users, save locally
    await AsyncStorage.setItem("user_preferences", JSON.stringify(preferences));
    return null;
  };

  return { savePreferences, isAuthenticated };
}

/**
 * Hook to record profile interactions (like/skip).
 * Returns requiresAuth: true if user needs to login to perform the action.
 */
export function useProfileInteraction() {
  const { isAuthenticated } = useConvexAuth();
  const recordInteraction = useMutation(
    api.features.preferences.queries.recordProfileInteraction,
  );

  const likeProfile = async (aiProfileId: Id<"aiProfiles">) => {
    if (!isAuthenticated) {
      return { requiresAuth: true };
    }
    await recordInteraction({ aiProfileId, action: "like" });
    return { requiresAuth: false };
  };

  const skipProfile = async (aiProfileId: Id<"aiProfiles">) => {
    if (!isAuthenticated) {
      return { requiresAuth: true };
    }
    await recordInteraction({ aiProfileId, action: "skip" });
    return { requiresAuth: false };
  };

  const superlikeProfile = async (aiProfileId: Id<"aiProfiles">) => {
    if (!isAuthenticated) {
      return { requiresAuth: true };
    }
    await recordInteraction({ aiProfileId, action: "superlike" });
    return { requiresAuth: false };
  };

  return {
    likeProfile,
    skipProfile,
    superlikeProfile,
    isAuthenticated,
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
    api.features.preferences.queries.hasCompletedOnboarding,
  );
  const completeOnboarding = useMutation(
    api.features.preferences.queries.completeOnboarding,
  );

  return {
    hasCompletedOnboarding: hasCompleted ?? false,
    isLoading: hasCompleted === undefined,
    completeOnboarding,
  };
}
