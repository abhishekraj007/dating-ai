import { create } from "zustand";

// Static options - no need to fetch from backend for onboarding
// TODO: Replace placeholder images with actual assets
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

export const INTEREST_OPTIONS = [
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "movies", label: "Movies", emoji: "🎬" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "cooking", label: "Cooking", emoji: "🍳" },
  { value: "reading", label: "Reading", emoji: "📚" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "photography", label: "Photography", emoji: "📷" },
  { value: "art", label: "Art", emoji: "🎨" },
  { value: "dancing", label: "Dancing", emoji: "💃" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "nature", label: "Nature", emoji: "🌿" },
  { value: "pets", label: "Pets", emoji: "🐕" },
  { value: "fashion", label: "Fashion", emoji: "👗" },
  { value: "technology", label: "Technology", emoji: "💻" },
  { value: "yoga", label: "Yoga", emoji: "🧘" },
  { value: "coffee", label: "Coffee", emoji: "☕" },
  { value: "wine", label: "Wine", emoji: "🍷" },
] as const;

export type GenderPreference = (typeof GENDER_OPTIONS)[number]["value"];
export type Interest = (typeof INTEREST_OPTIONS)[number]["value"];

interface OnboardingState {
  // Selections
  genderPreference: GenderPreference | null;
  interests: string[];

  // Actions
  setGenderPreference: (gender: GenderPreference) => void;
  toggleInterest: (interest: string) => void;
  reset: () => void;

  // Getters
  getPreferences: () => {
    genderPreference: GenderPreference | null;
    interests: string[];
  };
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  // Initial state
  genderPreference: null,
  interests: [],

  // Actions
  setGenderPreference: (gender) => set({ genderPreference: gender }),

  toggleInterest: (interest) =>
    set((state) => ({
      interests: state.interests.includes(interest)
        ? state.interests.filter((i) => i !== interest)
        : [...state.interests, interest],
    })),

  reset: () => set({ genderPreference: null, interests: [] }),

  getPreferences: () => ({
    genderPreference: get().genderPreference,
    interests: get().interests,
  }),
}));
