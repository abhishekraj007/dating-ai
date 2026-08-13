import { useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { Id } from "@dating-ai/backend";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { DEFAULT_USER_PREFERENCES, useSavePreferences } from "@/hooks/dating";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";

export const GUEST_ONBOARDING_KEY = "feelchat_guest_onboarding_done";

export function useFinishOnboarding() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
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
  const {
    genderPreference,
    appLanguage,
    chatLanguage,
    setSelectedCharacterId,
    setPendingChatId,
    setGuestOnboardingDone,
    reset,
  } = useOnboardingStore();
  const [isFinishing, setIsFinishing] = useState(false);

  const markGuestDone = async () => {
    await AsyncStorage.setItem(GUEST_ONBOARDING_KEY, "1");
    setGuestOnboardingDone(true);
  };

  const finishWithCharacter = async (characterId: Id<"aiProfiles">) => {
    setSelectedCharacterId(characterId);

    if (!isAuthenticated) {
      router.replace("/(root)/(auth)");
      return;
    }

    setIsFinishing(true);
    const resolvedAppLanguage = appLanguage ?? currentAppLanguage;
    const resolvedChatLanguage = chatLanguage ?? currentChatLanguage;
    const resolvedGender = genderPreference ?? "female";

    await setUserLanguages({
      appLanguage: resolvedAppLanguage,
      chatLanguage: resolvedChatLanguage,
    });

    await savePreferences({
      genderPreference: resolvedGender,
      ageMin: DEFAULT_USER_PREFERENCES.ageMin,
      ageMax: DEFAULT_USER_PREFERENCES.ageMax,
      zodiacPreferences: [],
      interestPreferences: [],
    });

    const conversationId = await startConversation({
      aiProfileId: characterId,
      grantFreeMessages: true,
    });

    await markOnboardingComplete();
    await markGuestDone();
    setPendingChatId(conversationId);
    reset();
  };

  const browseWithoutChat = async () => {
    await markGuestDone();
    if (isAuthenticated && genderPreference) {
      await savePreferences({
        genderPreference,
        ageMin: DEFAULT_USER_PREFERENCES.ageMin,
        ageMax: DEFAULT_USER_PREFERENCES.ageMax,
        zodiacPreferences: [],
        interestPreferences: [],
      });
      await markOnboardingComplete();
    }
    router.replace("/(root)/(main)");
  };

  return {
    isFinishing,
    finishWithCharacter,
    browseWithoutChat,
    markGuestDone,
  };
}
