import type { Ethnicity, Gender } from "../profileGenerationData";

export type GenerationFailureCode =
  | "candidate_uniqueness_exhausted"
  | "profile_model_generation_failed"
  | "image_download_retry_exhausted"
  | "image_generation_retry_exhausted"
  | "profile_creation_failed";

export class GenerationFailureError extends Error {
  constructor(
    public readonly code: GenerationFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "GenerationFailureError";
  }
}

export type ProfileCandidate = {
  name: string;
  username: string;
  gender: Gender;
  age: number;
  zodiacSign: string;
  occupation: string;
  location: string;
  countryCode?: string;
  bio: string;
  interests: string[];
  personalityTraits: string[];
  relationshipGoal: string;
  mbtiType: string;
  // Canonical ethnicity value, constrained to `ETHNICITIES` in
  // `profileGenerationData.ts`. Populated on every generation path (LLM
  // blueprint, template fallback, reference-mode vision analysis) so it can
  // be persisted on `aiProfiles` and used for filter queries.
  ethnicity: Ethnicity;
  communicationStyle: {
    tone: string;
    responseLength: string;
    usesEmojis: boolean;
    usesSlang: boolean;
    flirtLevel: number;
  };
};

export type GenerationPreferences = {
  preferredOccupation?: string;
  preferredInterests?: string[];
  preferredLocation?: string;
  // When set, constrains the generated profile to this ethnicity. Must be
  // a member of `ETHNICITIES`. Admin/manual flow and cron rotation both use
  // this; reference-mode passes through the vision model's enum pick.
  ethnicity?: Ethnicity;
};

export type JobProgressStep =
  | "candidate_generation"
  | "avatar_generation"
  | "showcase_generation"
  | "profile_persist";

export type StepModelEntry = {
  step: JobProgressStep;
  model: string;
};

export type CandidateBuildResult = {
  candidate: ProfileCandidate;
  model: string;
};

export type AppearanceProfile = {
  ageHint: number;
  hair: string;
  eyes: string;
  skinTone: string;
  skinCue: string;
  build: string;
  outfit: string;
  signatureStyle: string;
  vibe: string;
  cityArchetype: string;
  quirk: string;
  expression: string;
};

export type AppearanceOverrides = {
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  build?: string;
  outfit?: string;
  vibe?: string;
  expression?: string;
};

export type ShowcaseSlotPrompt = {
  sceneId: string;
  prompt: string;
};

// --- Showcase scene planning ---

export type ShowcaseCategory =
  | "indoor_cozy"
  | "outdoor_urban"
  | "social"
  | "activity"
  | "travel"
  | "creative"
  | "night_social"
  | "selfie";

/**
 * A resolved per-slot plan: the scene has been picked and every variation axis
 * (action / setting / composition / lighting / style / accent prop / season /
 * time-of-day) has been sampled. The LLM vignette step sees this plan and
 * produces a bespoke vignette for each slot; the prompt builder then splices
 * the vignette fields back into this baseline template.
 */
export type ShowcaseSlotPlan = {
  sceneId: string;
  category: ShowcaseCategory;
  action: string;
  setting: string;
  composition: string;
  lighting: string;
  style: string;
  accentProp: string;
  season: string;
  timeOfDay: string;
  requireDaylight?: boolean;
};

/**
 * LLM-authored per-slot variation. All fields are optional so we can gracefully
 * fall back to the `ShowcaseSlotPlan` baseline when the LLM call fails or the
 * model omits a field.
 */
export type SceneVignette = {
  action?: string;
  settingDetail?: string;
  prop?: string;
  wardrobeAccent?: string;
  emotionalBeat?: string;
  timeOfDay?: string;
};
