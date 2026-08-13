import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppLanguage } from "@/lib/i18n";
import type { Id } from "@dating-ai/backend";

export const ONBOARDING_STORAGE_KEY = "feelchat_onboarding";

export const GENDER_OPTIONS = [
  {
    value: "female",
    label: "Females",
    image: require("@/assets/images/onboarding/female.webp"),
  },
  {
    value: "male",
    label: "Males",
    image: require("@/assets/images/onboarding/male.webp"),
  },
  {
    value: "both",
    label: "All",
    image: require("@/assets/images/onboarding/everyone.jpg"),
  },
] as const;

export type GenderPreference = (typeof GENDER_OPTIONS)[number]["value"];

interface OnboardingState {
  genderPreference: GenderPreference | null;
  appLanguage: AppLanguage | null;
  chatLanguage: AppLanguage | null;
  selectedCharacterId: Id<"aiProfiles"> | null;
  pendingChatId: string | null;
  guestOnboardingDone: boolean;
  forceAuthRedirect: boolean;

  setGenderPreference: (gender: GenderPreference) => void;
  setAppLanguage: (language: AppLanguage) => void;
  setChatLanguage: (language: AppLanguage) => void;
  setSelectedCharacterId: (id: Id<"aiProfiles"> | null) => void;
  setPendingChatId: (id: string | null) => void;
  setGuestOnboardingDone: (done: boolean) => void;
  setForceAuthRedirect: (value: boolean) => void;
  reset: () => void;
  clearAll: () => void;
}

const initialState = {
  genderPreference: null as GenderPreference | null,
  appLanguage: null as AppLanguage | null,
  chatLanguage: null as AppLanguage | null,
  selectedCharacterId: null as Id<"aiProfiles"> | null,
  pendingChatId: null as string | null,
  guestOnboardingDone: false,
  forceAuthRedirect: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setGenderPreference: (gender) => set({ genderPreference: gender }),
      setAppLanguage: (language) => set({ appLanguage: language }),
      setChatLanguage: (language) => set({ chatLanguage: language }),
      setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
      setPendingChatId: (id) => set({ pendingChatId: id }),
      setGuestOnboardingDone: (done) => set({ guestOnboardingDone: done }),
      setForceAuthRedirect: (value) => set({ forceAuthRedirect: value }),
      reset: () =>
        set((state) => ({
          ...initialState,
          guestOnboardingDone: true,
          pendingChatId: state.pendingChatId,
          forceAuthRedirect: state.forceAuthRedirect,
        })),
      clearAll: () =>
        set((state) => ({
          ...initialState,
          forceAuthRedirect: state.forceAuthRedirect,
        })),
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        genderPreference: state.genderPreference,
        appLanguage: state.appLanguage,
        chatLanguage: state.chatLanguage,
        selectedCharacterId: state.selectedCharacterId,
        pendingChatId: state.pendingChatId,
        guestOnboardingDone: state.guestOnboardingDone,
      }),
    },
  ),
);
