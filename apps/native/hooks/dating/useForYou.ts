import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { usePaginatedQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";
import type { Id } from "@dating-ai/backend";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback, useRef } from "react";
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
  avatarImageKey?: string;
  avatarUrl: string | null;
}

type AppPlatform = "web" | "ios" | "android";

function getCurrentPlatform(): AppPlatform {
  const platform = process.env.EXPO_OS;
  if (platform === "ios" || platform === "android" || platform === "web") {
    return platform;
  }
  return "web";
}

/**
 * Hook to get profiles for the For You feed.
 * Uses paginated query for infinite loading.
 */
export function useForYouProfiles(initialNumItems: number = 20) {
  const platform = getCurrentPlatform();
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.features.preferences.queries.getForYouProfilesPaginated,
    {
      platform,
    },
    { initialNumItems },
  );
  const seenProfileIdsRef = useRef(new Set<string>());
  const removedProfileIdsRef = useRef(new Set<string>());
  const [profiles, setProfiles] = useState<ForYouProfile[]>([]);

  useEffect(() => {
    if (!results || results.length === 0) {
      return;
    }

    setProfiles((currentProfiles) => {
      let hasChanges = false;
      const nextProfiles = [...currentProfiles];

      for (const profile of results as ForYouProfile[]) {
        const profileId = String(profile._id);

        if (
          seenProfileIdsRef.current.has(profileId) ||
          removedProfileIdsRef.current.has(profileId)
        ) {
          continue;
        }

        seenProfileIdsRef.current.add(profileId);
        nextProfiles.push(profile);
        hasChanges = true;
      }

      return hasChanges ? nextProfiles : currentProfiles;
    });
  }, [results]);

  const removeProfile = useCallback((profileId: Id<"aiProfiles">) => {
    const normalizedProfileId = String(profileId);
    removedProfileIdsRef.current.add(normalizedProfileId);
    seenProfileIdsRef.current.add(normalizedProfileId);

    setProfiles((currentProfiles) =>
      currentProfiles.filter((profile) => profile._id !== profileId),
    );
  }, []);

  const restoreProfile = useCallback((profile: ForYouProfile) => {
    const profileId = String(profile._id);
    removedProfileIdsRef.current.delete(profileId);
    seenProfileIdsRef.current.add(profileId);

    setProfiles((currentProfiles) => {
      if (currentProfiles.some((current) => current._id === profile._id)) {
        return currentProfiles;
      }

      return [profile, ...currentProfiles];
    });
  }, []);

  return {
    profiles,
    isLoading: profiles.length === 0 && isLoading,
    status,
    loadMore,
    removeProfile,
    restoreProfile,
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
