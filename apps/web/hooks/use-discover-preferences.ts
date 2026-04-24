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
  ethnicityPreferences: string[];
}

type PersistedDiscoverPreferences = Omit<
  DiscoverUserPreferences,
  "ethnicityPreferences"
>;

export const DEFAULT_DISCOVER_PREFERENCES: DiscoverUserPreferences = {
  genderPreference: "female",
  ageMin: 18,
  ageMax: 99,
  zodiacPreferences: [],
  interestPreferences: [],
  ethnicityPreferences: [],
};

const USER_PREFERENCES_STORAGE_KEY = "user_preferences";
const DISCOVER_PREFERENCES_UPDATED_EVENT = "discover-preferences-updated";

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
    ethnicityPreferences: [...(preferences.ethnicityPreferences ?? [])],
  };
}

function toPersistedPreferences(
  preferences: DiscoverUserPreferences,
): PersistedDiscoverPreferences {
  const { ethnicityPreferences: _ethnicityPreferences, ...persisted } =
    preferences;

  return persisted;
}

function readStoredPreferences(): DiscoverUserPreferences | null {
  const storedValue = window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);

  return storedValue ? normalizePreferences(JSON.parse(storedValue)) : null;
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

    const syncLocalPreferences = () => {
      try {
        const parsedValue = readStoredPreferences();

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

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== USER_PREFERENCES_STORAGE_KEY) {
        return;
      }

      syncLocalPreferences();
    };

    const handlePreferencesUpdated = () => {
      syncLocalPreferences();
    };

    syncLocalPreferences();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      DISCOVER_PREFERENCES_UPDATED_EVENT,
      handlePreferencesUpdated,
    );

    return () => {
      isCancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        DISCOVER_PREFERENCES_UPDATED_EVENT,
        handlePreferencesUpdated,
      );
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

    void savePreferencesMutation(
      toPersistedPreferences(localPreferences),
    ).catch((error) => {
      console.error("Failed to sync local discover preferences", error);
      hasSyncedLocalPreferences.current = false;
    });
  }, [
    convexPreferences,
    isAuthenticated,
    localPreferences,
    savePreferencesMutation,
  ]);

  const authenticatedPreferencesSource =
    isAuthenticated && convexPreferences
      ? {
          ...convexPreferences,
          ethnicityPreferences: localPreferences?.ethnicityPreferences ?? [],
        }
      : (convexPreferences ?? localPreferences);

  const preferences = normalizePreferences(
    isAuthenticated ? authenticatedPreferencesSource : localPreferences,
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
    window.dispatchEvent(new Event(DISCOVER_PREFERENCES_UPDATED_EVENT));
    setLocalPreferences(normalizedPreferences);

    if (isAuthenticated) {
      await savePreferencesMutation(
        toPersistedPreferences(normalizedPreferences),
      );
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
