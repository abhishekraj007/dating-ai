import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useSegments } from "expo-router";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { DEFAULT_USER_PREFERENCES, useSavePreferences } from "@/hooks/dating";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
/**
 * Hook to sync onboarding preferences to backend after user logs in.
 * Only syncs when user comes FROM auth screens (not while on onboarding).
 */
export function useSyncOnboardingPreferences() {
  const { isAuthenticated } = useConvexAuth();
  const segments = useSegments();
  const { genderPreference, appLanguage, chatLanguage, reset } =
    useOnboardingStore();
  const { language: currentAppLanguage } = useTranslation();
  const { chatLanguage: currentChatLanguage } = useChatLanguage();
  const { savePreferences } = useSavePreferences();
  const markOnboardingComplete = useMutation(api.user.markOnboardingComplete);
  const setUserLanguages = useMutation(
    api.features.preferences.queries.setUserLanguages,
  );
  const hasSynced = useRef(false);

  const isOnOnboarding = (segments as string[]).includes("(onboarding)");

  useEffect(() => {
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

        await setUserLanguages({
          appLanguage: appLanguage ?? currentAppLanguage,
          chatLanguage: chatLanguage ?? currentChatLanguage,
        });

        await savePreferences({
          genderPreference,
          ageMin: DEFAULT_USER_PREFERENCES.ageMin,
          ageMax: DEFAULT_USER_PREFERENCES.ageMax,
          zodiacPreferences: [],
          interestPreferences: [],
        });

        await markOnboardingComplete();

        reset();
      } catch (error) {
        console.error("Failed to sync onboarding preferences:", error);
        hasSynced.current = false;
      }
    };

    void syncPreferences();
  }, [
    isAuthenticated,
    isOnOnboarding,
    genderPreference,
    appLanguage,
    chatLanguage,
    currentAppLanguage,
    currentChatLanguage,
    savePreferences,
    markOnboardingComplete,
    setUserLanguages,
    reset,
  ]);
}
