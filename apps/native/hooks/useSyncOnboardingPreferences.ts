import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { DEFAULT_USER_PREFERENCES, useSavePreferences } from "@/hooks/dating";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
import { GUEST_ONBOARDING_KEY } from "@/hooks/use-finish-onboarding";

export function useSyncOnboardingPreferences() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const segments = useSegments();
  const {
    genderPreference,
    appLanguage,
    chatLanguage,
    selectedCharacterId,
    setPendingChatId,
    setGuestOnboardingDone,
    reset,
  } = useOnboardingStore();
  const { language: currentAppLanguage } = useTranslation();
  const { chatLanguage: currentChatLanguage } = useChatLanguage();
  const { savePreferences } = useSavePreferences();
  const markOnboardingComplete = useMutation(api.user.markOnboardingComplete);
  const setUserLanguages = useMutation(
    api.features.preferences.queries.setUserLanguages,
  );
  const startConversation = useMutation(
    api.features.ai.mutations.startConversation,
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

      if (selectedCharacterId) {
        const conversationId = await startConversation({
          aiProfileId: selectedCharacterId,
          grantFreeMessages: true,
        });
        setPendingChatId(conversationId);
        await markOnboardingComplete();
        await AsyncStorage.setItem(GUEST_ONBOARDING_KEY, "1");
        setGuestOnboardingDone(true);
        reset();
        router.replace(`/(root)/(main)/chat/${conversationId}`);
        return;
      }

      await markOnboardingComplete();
      await AsyncStorage.setItem(GUEST_ONBOARDING_KEY, "1");
      setGuestOnboardingDone(true);
      reset();
    };

    void syncPreferences();
  }, [
    isAuthenticated,
    isOnOnboarding,
    genderPreference,
    selectedCharacterId,
    appLanguage,
    chatLanguage,
    currentAppLanguage,
    currentChatLanguage,
    savePreferences,
    markOnboardingComplete,
    setUserLanguages,
    startConversation,
    reset,
    router,
    setPendingChatId,
    setGuestOnboardingDone,
  ]);
}
