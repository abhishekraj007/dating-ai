import {
  type Gender,
  HAIR_COLORS,
  HAIR_STYLES_FEMALE,
  HAIR_STYLES_MALE,
  BUILDS_FEMALE,
  BUILDS_MALE,
  OUTFIT_STYLES_FEMALE,
  OUTFIT_STYLES_MALE,
  STYLE_SIGNATURES_FEMALE,
  STYLE_SIGNATURES_MALE,
  EYE_COLORS,
  EYE_SHAPES,
  SKIN_TONES,
  SKIN_CUES,
  VIBES,
  CITY_ARCHETYPES,
  QUIRKS,
  EXPRESSIONS,
  LOCATIONS_BY_ARCHETYPE,
} from "../profileGenerationData";
import type {
  AppearanceOverrides,
  AppearanceProfile,
  ProfileCandidate,
} from "./types";
import { randomItem } from "./textUtils";

export function sampleAppearanceProfile(
  gender: Gender,
  overrides?: AppearanceOverrides,
): AppearanceProfile {
  const hairColor = overrides?.hairColor || randomItem(HAIR_COLORS);
  const hairStyle =
    overrides?.hairStyle ||
    (gender === "female"
      ? randomItem(HAIR_STYLES_FEMALE)
      : randomItem(HAIR_STYLES_MALE));
  const build =
    overrides?.build ||
    (gender === "female" ? randomItem(BUILDS_FEMALE) : randomItem(BUILDS_MALE));
  const outfit =
    overrides?.outfit ||
    (gender === "female"
      ? randomItem(OUTFIT_STYLES_FEMALE)
      : randomItem(OUTFIT_STYLES_MALE));
  const signatureStyle =
    gender === "female"
      ? randomItem(STYLE_SIGNATURES_FEMALE)
      : randomItem(STYLE_SIGNATURES_MALE);

  // Weighted toward 22-29 but allow 20-34.
  const ageRoll = Math.random();
  let ageHint: number;
  if (ageRoll < 0.75) {
    ageHint = 22 + Math.floor(Math.random() * 8); // 22..29
  } else if (ageRoll < 0.9) {
    ageHint = 20 + Math.floor(Math.random() * 2); // 20..21
  } else {
    ageHint = 30 + Math.floor(Math.random() * 5); // 30..34
  }

  const hair = hairStyle.includes("hair")
    ? hairStyle.replace(/\bhair\b/, `${hairColor} hair`)
    : `${hairStyle} (${hairColor})`;

  return {
    ageHint,
    hair,
    eyes: overrides?.eyeColor
      ? `${randomItem(EYE_SHAPES)} ${overrides.eyeColor} eyes`
      : `${randomItem(EYE_SHAPES)} ${randomItem(EYE_COLORS)} eyes`,
    skinTone: overrides?.skinTone || randomItem(SKIN_TONES),
    skinCue: randomItem(SKIN_CUES),
    build,
    outfit,
    signatureStyle,
    vibe: overrides?.vibe || randomItem(VIBES),
    cityArchetype: randomItem(CITY_ARCHETYPES),
    quirk: randomItem(QUIRKS),
    expression: overrides?.expression || randomItem(EXPRESSIONS),
  };
}

export function locationForArchetype(archetype: string): string {
  const pool = LOCATIONS_BY_ARCHETYPE[archetype];
  if (pool && pool.length > 0) {
    return randomItem(pool);
  }
  // Fallback: pick from any archetype's locations.
  const allLocations = Object.values(LOCATIONS_BY_ARCHETYPE).flat();
  return randomItem(allLocations);
}

export function genderNoun(gender: Gender): string {
  return gender === "female" ? "woman" : "man";
}

export function buildCanonicalSubjectDescriptor(
  candidate: Pick<ProfileCandidate, "gender" | "age">,
  appearance: AppearanceProfile,
): string {
  // Natural-prose descriptor reused verbatim across avatar + every showcase,
  // which is the single biggest lever for character consistency on
  // nano-banana-2 and seedream-5-lite.
  return [
    `a ${candidate.age}-year-old ${genderNoun(candidate.gender)}`,
    appearance.skinTone,
    appearance.skinCue,
    `${appearance.hair}`,
    appearance.eyes,
    appearance.build,
    `wearing ${appearance.outfit}`,
    appearance.signatureStyle,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}
