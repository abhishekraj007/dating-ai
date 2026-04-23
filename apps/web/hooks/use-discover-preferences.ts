"use client";

import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import {
  segmentFromGenderPreference,
  type DiscoverGenderPreference,
} from "@/lib/public-segments";

export interface DiscoverUserPreferences {
  genderPreference: DiscoverGenderPreference;
  ageMin: number;
  ageMax: number;
  zodiacPreferences: string[];
  interestPreferences: string[];
}

export const DEFAULT_DISCOVER_PREFERENCES: DiscoverUserPreferences = {
  genderPreference: "female",
  ageMin: 18,
  ageMax: 99,
  zodiacPreferences: [],
  interestPreferences: [],
};

const USER_PREFERENCES_STORAGE_KEY = "user_preferences";

function normalizePreferences(
  preferences: Partial<DiscoverUserPreferences> | null | undefined,
): DiscoverUserPreferences | null {
  if (!preferences) {
    return null;
  }

  return {
    genderPreference:
      preferences.genderPreference ??
      DEFAULT_DISCOVER_PREFERENCES.genderPreference,
    ageMin: preferences.ageMin ?? DEFAULT_DISCOVER_PREFERENCES.ageMin,
    ageMax: preferences.ageMax ?? DEFAULT_DISCOVER_PREFERENCES.ageMax,
    zodiacPreferences: [...(preferences.zodiacPreferences ?? [])],
    interestPreferences: [...(preferences.interestPreferences ?? [])],
  };
}

export function useDiscoverPreferences() {
  const { isAuthenticated } = useConvexAuth();
  const convexPreferences = useQuery(
    api.features.preferences.queries.getUserPreferences,
  );
  const savePreferencesMutation = useMutation(
    api.features.preferences.queries.saveUserPreferences,
  );
  const [localPreferences, setLocalPreferences] =
    useState<DiscoverUserPreferences | null>(null);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const hasSyncedLocalPreferences = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const loadLocalPreferences = () => {
      try {
        const storedValue = window.localStorage.getItem(
          USER_PREFERENCES_STORAGE_KEY,
        );
        const parsedValue = storedValue
          ? normalizePreferences(JSON.parse(storedValue))
          : null;

        if (!isCancelled) {
          setLocalPreferences(parsedValue);
        }
      } catch (error) {
        console.error("Failed to load local discover preferences", error);
        if (!isCancelled) {
          setLocalPreferences(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLocal(false);
        }
      }
    };

    loadLocalPreferences();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      !isAuthenticated ||
      convexPreferences === undefined ||
      convexPreferences !== null ||
      !localPreferences ||
      hasSyncedLocalPreferences.current
    ) {
      return;
    }

    hasSyncedLocalPreferences.current = true;

    void savePreferencesMutation(localPreferences).catch((error) => {
      console.error("Failed to sync local discover preferences", error);
      hasSyncedLocalPreferences.current = false;
    });
  }, [
    convexPreferences,
    isAuthenticated,
    localPreferences,
    savePreferencesMutation,
  ]);

  const preferences = normalizePreferences(
    isAuthenticated
      ? (convexPreferences ?? localPreferences)
      : localPreferences,
  );
  const effectivePreferences = preferences ?? DEFAULT_DISCOVER_PREFERENCES;

  const savePreferences = async (
    preferencesToSave: DiscoverUserPreferences,
  ) => {
    const normalizedPreferences = normalizePreferences(preferencesToSave);

    if (!normalizedPreferences) {
      return;
    }

    window.localStorage.setItem(
      USER_PREFERENCES_STORAGE_KEY,
      JSON.stringify(normalizedPreferences),
    );
    setLocalPreferences(normalizedPreferences);

    if (isAuthenticated) {
      await savePreferencesMutation(normalizedPreferences);
    }
  };

  const setGenderPreference = async (
    genderPreference: DiscoverGenderPreference,
  ) => {
    await savePreferences({
      ...effectivePreferences,
      genderPreference,
    });
  };

  return {
    preferences,
    effectivePreferences,
    hasStoredPreferences: preferences !== null,
    isLoading:
      convexPreferences === undefined ||
      (isLoadingLocal && localPreferences === null),
    savePreferences,
    setGenderPreference,
    preferredSegment: segmentFromGenderPreference(
      effectivePreferences.genderPreference,
    ),
  };
}
