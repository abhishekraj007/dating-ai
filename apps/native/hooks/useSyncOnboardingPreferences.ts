import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useSegments } from "expo-router";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSavePreferences } from "@/hooks/dating";

/**
 * Hook to sync onboarding preferences to backend after user logs in.
 * Only syncs when user comes FROM auth screens (not while on onboarding).
 */
export function useSyncOnboardingPreferences() {
  const { isAuthenticated } = useConvexAuth();
  const segments = useSegments();
  const { genderPreference, reset } = useOnboardingStore();
  const { savePreferences } = useSavePreferences();
  const markOnboardingComplete = useMutation(api.user.markOnboardingComplete);
  const hasSynced = useRef(false);

  // Check if user is on onboarding screens
  const isOnOnboarding = (segments as string[]).includes("(onboarding)");

  useEffect(() => {
    // Only sync if:
    // 1. User is authenticated
    // 2. User is NOT currently on onboarding screens (came from auth)
    // 3. We have gender preference stored
    // 4. We haven't already synced this session
    if (
      !isAuthenticated ||
      isOnOnboarding ||
      !genderPreference ||
      hasSynced.current
    ) {
      return;
    }

    const syncPreferences = async () => {
      try {
        hasSynced.current = true;

        // Save preferences to backend
        await savePreferences({
          genderPreference,
          ageMin: 18,
          ageMax: 35,
          zodiacPreferences: [],
          interestPreferences: [],
        });

        // Mark onboarding as complete
        await markOnboardingComplete();

        // Clear the store
        reset();
      } catch (error) {
        console.error("Failed to sync onboarding preferences:", error);
        hasSynced.current = false; // Allow retry
      }
    };

    syncPreferences();
  }, [
    isAuthenticated,
    isOnOnboarding,
    genderPreference,
    savePreferences,
    markOnboardingComplete,
    reset,
  ]);
}
