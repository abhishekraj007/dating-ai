"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { r2 } from "../../uploads";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { generateImageWithFallback } from "./imageGeneration";
import {
  type Gender,
  type AvatarShotStyle,
  type ShowcaseScene,
  FEMALE_WEIGHT,
  SEMANTIC_SIMILARITY_THRESHOLD,
  MAX_GENERATION_ATTEMPTS,
  SHOWCASE_MIN_COUNT,
  SHOWCASE_MAX_COUNT,
  SHOWCASE_MIN_SUCCESS,
  FIRST_NAMES,
  LAST_NAMES,
  OCCUPATIONS,
  INTERESTS,
  PERSONALITY_TRAITS,
  ZODIAC_SIGNS,
  RELATIONSHIP_GOALS,
  MBTI_TYPES,
  HAIR_COLORS,
  HAIR_STYLES_FEMALE,
  HAIR_STYLES_MALE,
  EYE_COLORS,
  EYE_SHAPES,
  SKIN_TONES,
  SKIN_CUES,
  BUILDS_FEMALE,
  BUILDS_MALE,
  STYLE_SIGNATURES_FEMALE,
  STYLE_SIGNATURES_MALE,
  VIBES,
  CITY_ARCHETYPES,
  QUIRKS,
  EXPRESSIONS,
  AVATAR_SHOT_STYLES,
  SHOWCASE_SCENES,
  BANNED_BIO_PHRASES,
  STOPWORDS,
  INLINE_NEGATIVES,
} from "./profileGenerationData";

type GenerationFailureCode =
  | "candidate_uniqueness_exhausted"
  | "profile_model_generation_failed"
  | "image_download_retry_exhausted"
  | "image_generation_retry_exhausted"
  | "profile_creation_failed";

class GenerationFailureError extends Error {
  constructor(
    public readonly code: GenerationFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "GenerationFailureError";
  }
}

const AI_GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1/ai";
const PROFILE_GENERATION_MODEL =
  process.env.PROFILE_GENERATION_MODEL ?? "google/gemini-3-flash";
const PROFILE_GENERATION_FALLBACK_MODELS = (
  process.env.PROFILE_GENERATION_FALLBACK_MODELS ??
  "google/gemini-2.5-flash,openai/gpt-4.1-mini,anthropic/claude-3-5-haiku-latest"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const isDev = process.env.CONVEX_CLOUD_URL?.includes("cheery-akita") ?? false;
const aiGatewayApiKey = process.env.AI_GATEWAY_API_KEY;
const aiGatewayProvider = aiGatewayApiKey
  ? createGateway({
      apiKey: aiGatewayApiKey,
      baseURL: AI_GATEWAY_BASE_URL,
    })
  : null;

type ProfileCandidate = {
  name: string;
  username: string;
  gender: Gender;
  age: number;
  zodiacSign: string;
  occupation: string;
  bio: string;
  interests: string[];
  personalityTraits: string[];
  relationshipGoal: string;
  mbtiType: string;
  communicationStyle: {
    tone: string;
    responseLength: string;
    usesEmojis: boolean;
    usesSlang: boolean;
    flirtLevel: number;
  };
};

type GenerationPreferences = {
  preferredOccupation?: string;
  preferredInterests?: string[];
};

type StepModelEntry = {
  step: JobProgressStep;
  model: string;
};

type CandidateBuildResult = {
  candidate: ProfileCandidate;
  model: string;
};

type AppearanceProfile = {
  ageHint: number;
  hair: string;
  eyes: string;
  skinTone: string;
  skinCue: string;
  build: string;
  signatureStyle: string;
  vibe: string;
  cityArchetype: string;
  quirk: string;
  expression: string;
};

type JobProgressStep =
  | "candidate_generation"
  | "avatar_generation"
  | "showcase_generation"
  | "profile_persist";

const JOB_PROGRESS_STEPS: JobProgressStep[] = [
  "candidate_generation",
  "avatar_generation",
  "showcase_generation",
  "profile_persist",
];
const FALLBACK_TEMPLATE_MODEL = "fallback/static-template";
const PROFILE_PERSIST_MODEL = "convex-db";

const profileBlueprintSchema = z.object({
  name: z.string().min(3).max(64),
  username: z.string().min(3).max(40).optional(),
  age: z.number().int().min(20).max(34),
  zodiacSign: z.string().min(3).max(16),
  occupation: z.string().min(2).max(80),
  bio: z.string().min(40).max(420),
  interests: z.array(z.string().min(2).max(40)).min(4).max(7),
  personalityTraits: z.array(z.string().min(2).max(40)).min(3).max(6),
  relationshipGoal: z.string().min(8).max(120),
  mbtiType: z.string().min(4).max(4).optional(),
  communicationStyle: z
    .object({
      tone: z.string().optional(),
      responseLength: z.string().optional(),
      usesEmojis: z.boolean().optional(),
      usesSlang: z.boolean().optional(),
      flirtLevel: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
});

function randomItem<T>(items: T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) {
    throw new GenerationFailureError(
      "profile_creation_failed",
      "Cannot select an item from an empty list",
    );
  }
  return item;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i];
    const target = copy[j];
    if (current === undefined || target === undefined) {
      continue;
    }
    copy[i] = target;
    copy[j] = current;
  }
  return copy;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): Set<string> {
  const cleaned = normalize(text);
  if (!cleaned) return new Set();
  return new Set(cleaned.split(" ").filter((token) => token.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function weightedGender(): Gender {
  return Math.random() < FEMALE_WEIGHT ? "female" : "male";
}

function buildUsername(name: string, existing: Set<string>): string {
  const base = normalize(name).replace(/\s+/g, "_");
  if (!existing.has(base)) return base;

  for (let i = 0; i < 20; i += 1) {
    const candidate = `${base}_${Math.floor(100 + Math.random() * 900)}`;
    if (!existing.has(candidate)) return candidate;
  }

  return `${base}_${crypto.randomUUID().slice(0, 8)}`;
}

function sanitizeUsername(raw: string): string {
  return normalize(raw)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function uniqueList(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

function uniqueModelList(models: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const model of models) {
    const normalized = model.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function normalizePreferenceText(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeInterestPreferences(
  interests: string[] | undefined,
): string[] | undefined {
  if (!interests || interests.length === 0) return undefined;
  const normalized = uniqueList(
    interests.map((interest) => interest.trim()),
    5,
  );
  return normalized.length > 0 ? normalized : undefined;
}

function sampleAppearanceProfile(gender: Gender): AppearanceProfile {
  const hairColor = randomItem(HAIR_COLORS);
  const hairStyle =
    gender === "female"
      ? randomItem(HAIR_STYLES_FEMALE)
      : randomItem(HAIR_STYLES_MALE);
  const build =
    gender === "female" ? randomItem(BUILDS_FEMALE) : randomItem(BUILDS_MALE);
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
    eyes: `${randomItem(EYE_SHAPES)} ${randomItem(EYE_COLORS)} eyes`,
    skinTone: randomItem(SKIN_TONES),
    skinCue: randomItem(SKIN_CUES),
    build,
    signatureStyle,
    vibe: randomItem(VIBES),
    cityArchetype: randomItem(CITY_ARCHETYPES),
    quirk: randomItem(QUIRKS),
    expression: randomItem(EXPRESSIONS),
  };
}

function genderNoun(gender: Gender): string {
  return gender === "female" ? "woman" : "man";
}

function buildCanonicalSubjectDescriptor(
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
    appearance.signatureStyle,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

type ImagePromptInput = {
  subjectDescriptor: string;
  action: string;
  setting: string;
  composition: string;
  lighting: string;
  style: string;
  expression?: string;
  vibe?: string;
  cityArchetype?: string;
  withReferenceClause: boolean;
};

function buildImagePromptCore(input: ImagePromptInput): string {
  const realismCues =
    "Visible skin texture, natural pores, subtle facial asymmetry, non-retouched skin, authentic everyday look";

  const settingWithContext = [
    input.setting,
    input.cityArchetype ? `in a ${input.cityArchetype}` : null,
    input.vibe ? `${input.vibe} aesthetic` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const parts: string[] = [
    `Photorealistic portrait of ${input.subjectDescriptor}`,
    input.expression ? `with ${input.expression}` : null,
    input.action,
    settingWithContext,
    input.composition,
    input.lighting,
    input.style,
    realismCues,
  ].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  let prompt = parts.join(". ");
  if (!prompt.endsWith(".")) prompt += ".";

  if (input.withReferenceClause) {
    prompt += ` Using the reference image as the same person, preserve face shape, skin tone, freckles and marks, eyebrow shape, eye color and shape, hair color, length and texture, and overall body type exactly. Only change outfit, pose, setting, and lighting as described above.`;
  }

  prompt += ` ${INLINE_NEGATIVES}`;
  return prompt;
}

function pickShowcaseScenes(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  count: number,
  excludeIds: Set<string> = new Set(),
): ShowcaseScene[] {
  const candidateInterestSet = new Set(
    candidate.interests.map((i) => i.toLowerCase()),
  );

  const vibeLower = appearance.vibe.toLowerCase();

  const pool = SHOWCASE_SCENES.filter((scene) => !excludeIds.has(scene.id));

  // Prefer scenes with matching interests or vibe affinity.
  const preferred: ShowcaseScene[] = [];
  const rest: ShowcaseScene[] = [];
  for (const scene of pool) {
    const interestMatch =
      scene.interestAffinity &&
      scene.interestAffinity.some((i) =>
        candidateInterestSet.has(i.toLowerCase()),
      );
    const vibeMatch =
      scene.vibeAffinity &&
      scene.vibeAffinity.some((v) => v.toLowerCase() === vibeLower);
    if (interestMatch || vibeMatch) {
      preferred.push(scene);
    } else {
      rest.push(scene);
    }
  }

  // Pet scene only eligible ~25% of the time.
  const filterPet = (scenes: ShowcaseScene[]): ShowcaseScene[] =>
    scenes.filter((scene) => scene.id !== "with_pet" || Math.random() < 0.25);

  const ordered = [
    ...shuffle(filterPet(preferred)),
    ...shuffle(filterPet(rest)),
  ];
  return ordered.slice(0, count);
}

function buildShowcasePromptFromScene(
  scene: ShowcaseScene,
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
): string {
  return buildImagePromptCore({
    subjectDescriptor,
    action: scene.buildAction(candidate),
    setting: scene.setting,
    composition: scene.composition,
    lighting: scene.lighting,
    style: scene.style,
    vibe: appearance.vibe,
    cityArchetype: appearance.cityArchetype,
    withReferenceClause: true,
  });
}

function getBioOpenings(
  profiles: Array<{ bio?: string }>,
  maxCount: number,
  wordsPerOpening: number,
): string[] {
  const out: string[] = [];
  for (const profile of profiles) {
    if (!profile.bio) continue;
    const words = profile.bio.trim().split(/\s+/).slice(0, wordsPerOpening);
    if (words.length === 0) continue;
    out.push(words.join(" "));
    if (out.length >= maxCount) break;
  }
  return out;
}

function bioHasBannedPhrase(bio: string): boolean {
  const lower = bio.toLowerCase();
  return BANNED_BIO_PHRASES.some((phrase) => lower.includes(phrase));
}

function toCandidateFromBlueprint(
  blueprint: z.infer<typeof profileBlueprintSchema>,
  gender: Gender,
  existingUsernames: Set<string>,
  preferences?: GenerationPreferences,
): ProfileCandidate {
  const sanitizedProvidedUsername = blueprint.username
    ? sanitizeUsername(blueprint.username)
    : "";
  const username =
    sanitizedProvidedUsername &&
    !existingUsernames.has(sanitizedProvidedUsername)
      ? sanitizedProvidedUsername
      : buildUsername(blueprint.name, existingUsernames);

  const normalizedMbti = (
    blueprint.mbtiType ?? randomItem(MBTI_TYPES)
  ).toUpperCase();
  const zodiac = ZODIAC_SIGNS.includes(blueprint.zodiacSign)
    ? blueprint.zodiacSign
    : randomItem(ZODIAC_SIGNS);

  const tone = blueprint.communicationStyle?.tone;
  const responseLength = blueprint.communicationStyle?.responseLength;

  const generatedInterests = uniqueList(blueprint.interests, 5);
  const preferredInterests = preferences?.preferredInterests ?? [];
  const mergedInterests = uniqueList(
    [...preferredInterests, ...generatedInterests],
    5,
  );

  return {
    name: blueprint.name.trim(),
    username,
    gender,
    age: blueprint.age,
    zodiacSign: zodiac,
    occupation: preferences?.preferredOccupation ?? blueprint.occupation.trim(),
    bio: blueprint.bio.trim(),
    interests: mergedInterests,
    personalityTraits: uniqueList(blueprint.personalityTraits, 4),
    relationshipGoal: blueprint.relationshipGoal.trim(),
    mbtiType: /^[EI][NS][FT][JP]$/i.test(normalizedMbti)
      ? normalizedMbti
      : randomItem(MBTI_TYPES),
    communicationStyle: {
      tone:
        tone &&
        [
          "gen-z",
          "formal",
          "flirty",
          "intellectual",
          "casual",
          "sarcastic",
        ].includes(tone)
          ? tone
          : randomItem(["casual", "flirty", "gen-z"]),
      responseLength:
        responseLength && ["short", "medium", "long"].includes(responseLength)
          ? responseLength
          : randomItem(["short", "medium"]),
      usesEmojis:
        blueprint.communicationStyle?.usesEmojis ?? Math.random() < 0.65,
      usesSlang: blueprint.communicationStyle?.usesSlang ?? Math.random() < 0.5,
      flirtLevel:
        blueprint.communicationStyle?.flirtLevel ??
        2 + Math.floor(Math.random() * 3),
    },
  };
}

async function generateCandidateWithLLM(
  gender: Gender,
  attempt: number,
  existingProfiles: Array<{
    name: string;
    username?: string;
    gender: Gender;
    bio?: string;
  }>,
  existingUsernames: Set<string>,
  appearance: AppearanceProfile,
  preferences?: GenerationPreferences,
): Promise<CandidateBuildResult> {
  if (!aiGatewayApiKey || !aiGatewayProvider) {
    throw new GenerationFailureError(
      "profile_model_generation_failed",
      "AI_GATEWAY_API_KEY is not set",
    );
  }

  const sameGenderProfiles = existingProfiles.filter(
    (profile) => profile.gender === gender,
  );
  const recentSameGenderNames = sameGenderProfiles
    .slice(0, 80)
    .map((profile) => profile.name);
  const recentBioOpenings = getBioOpenings(
    sameGenderProfiles.slice(0, 60),
    30,
    6,
  );

  const recentUsernames = Array.from(existingUsernames).slice(0, 120);

  const strategyHint =
    attempt <= 4
      ? "Keep results highly distinct and avoid common stereotype templates."
      : attempt <= 8
        ? "Increase novelty strongly: different occupation, interests and personality wording."
        : "Maximize uniqueness aggressively while still realistic and natural.";
  const preferenceHints = [
    preferences?.preferredOccupation
      ? `- occupation must be exactly: ${preferences.preferredOccupation}`
      : null,
    preferences?.preferredInterests && preferences.preferredInterests.length > 0
      ? `- include these interests exactly (at least first 2): ${preferences.preferredInterests.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Generate one unique ${gender} dating profile that reads like a real person's, not AI-written.

Soft persona seed (use naturally, do not quote literally):
- age around ${appearance.ageHint} (allowed range 20-34)
- lives in a ${appearance.cityArchetype}
- overall style/aesthetic: ${appearance.vibe}
- personal quirk to weave in subtly: ${appearance.quirk}

Hard requirements:
- age integer between 20 and 34
- occupation: specific and believable (prefer non-generic roles)
- bio: 2-3 short sentences, 60-240 chars total
- interests: 4-7 specific items (not vague nouns)
- personalityTraits: 3-6 short adjectives
- relationshipGoal: one short natural phrase
- name must be a believable first + last name
- username is optional; if provided, lowercase letters/numbers/underscores only

Bio style rules (strict):
- Do NOT begin the bio with the person's name, "Hey", "Looking for", or the occupation.
- Must include one concrete, specific detail: a place, an object, a habit, a food, a book, a song - something tangible.
- Avoid these buzzwords entirely: ${BANNED_BIO_PHRASES.join(", ")}.
- Short sentence fragments and lowercase are fine; avoid corporate-polished tone.
- Do not describe physical appearance in the bio - that is handled elsewhere.

Uniqueness rules:
- Do not reuse any of these existing names: ${recentSameGenderNames.join(", ") || "none"}
- Do not reuse these usernames: ${recentUsernames.join(", ") || "none"}
- Do not start the bio with any of these recent opening phrases: ${recentBioOpenings.join(" | ") || "none"}

${preferenceHints ? `User-selected constraints (must honor exactly):\n${preferenceHints}\n` : ""}
Attempt strategy: ${strategyHint}

Required JSON shape:
{
  "name": "string",
  "username": "string optional",
  "age": 24,
  "zodiacSign": "string",
  "occupation": "string",
  "bio": "string",
  "interests": ["string"],
  "personalityTraits": ["string"],
  "relationshipGoal": "string",
  "mbtiType": "string optional",
  "communicationStyle": {
    "tone": "string optional",
    "responseLength": "string optional",
    "usesEmojis": boolean,
    "usesSlang": boolean,
    "flirtLevel": 3
  }
}`;

  const modelsToTry = uniqueModelList([
    PROFILE_GENERATION_MODEL,
    ...PROFILE_GENERATION_FALLBACK_MODELS,
  ]);
  const modelErrors: string[] = [];

  for (const modelName of modelsToTry) {
    console.log("Trying model:", modelName);
    try {
      const result = await generateText({
        model: aiGatewayProvider(modelName),
        experimental_output: Output.object({
          schema: profileBlueprintSchema,
        }),
        temperature: 1.05,
        system:
          "You generate highly unique, human-sounding dating profile blueprints. Write like a real person, not a copywriter. Return valid structured output only.",
        prompt,
      });
      const blueprint = result.experimental_output;
      if (bioHasBannedPhrase(blueprint.bio)) {
        throw new Error(
          `bio_contains_banned_phrase: "${blueprint.bio.slice(0, 80)}..."`,
        );
      }
      return {
        candidate: toCandidateFromBlueprint(
          blueprint,
          gender,
          existingUsernames,
          preferences,
        ),
        model: modelName,
      };
    } catch (error) {
      console.error("Model generation failed:", modelName, error);
      const message =
        error instanceof Error ? error.message : "Unknown model error";
      modelErrors.push(`${modelName}: ${message}`);
    }
  }

  throw new GenerationFailureError(
    "profile_model_generation_failed",
    `Model generation failed for all candidates. ${modelErrors.join(" | ")}`,
  );
}

async function buildCandidateDynamic(
  gender: Gender,
  attempt: number,
  existingProfiles: Array<{
    name: string;
    username?: string;
    gender: Gender;
    bio?: string;
  }>,
  existingUsernames: Set<string>,
  appearance: AppearanceProfile,
  preferences?: GenerationPreferences,
): Promise<CandidateBuildResult> {
  try {
    return await generateCandidateWithLLM(
      gender,
      attempt,
      existingProfiles,
      existingUsernames,
      appearance,
      preferences,
    );
  } catch (error) {
    // Fallback preserves availability if model/API is unavailable.
    console.error(
      "[profileGeneration] LLM candidate generation failed:",
      error,
    );
    return {
      candidate: buildCandidate(
        gender,
        existingUsernames,
        appearance,
        preferences,
      ),
      model: FALLBACK_TEMPLATE_MODEL,
    };
  }
}

function buildCandidate(
  gender: Gender,
  existingUsernames: Set<string>,
  appearance: AppearanceProfile,
  preferences?: GenerationPreferences,
): ProfileCandidate {
  const firstName = randomItem(FIRST_NAMES[gender]);
  const lastName = randomItem(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const username = buildUsername(name, existingUsernames);
  const interestPool = shuffle(INTERESTS);
  const interests = uniqueList(
    [...(preferences?.preferredInterests ?? []), ...interestPool],
    5,
  );
  const personalityTraits = shuffle(PERSONALITY_TRAITS).slice(0, 4);
  const occupation =
    preferences?.preferredOccupation ?? randomItem(OCCUPATIONS[gender]);
  const age = appearance.ageHint;
  const zodiacSign = randomItem(ZODIAC_SIGNS);
  const [interestA = "coffee", interestB = "music", interestC = "books"] =
    interests;

  const bio = `just moved to a ${appearance.cityArchetype}, still learning its good corners. ${interestA.toLowerCase()} on weekdays, ${interestB.toLowerCase()} on weekends, and always a ${interestC.toLowerCase()} in my bag. ${appearance.quirk}.`;

  return {
    name,
    username,
    gender,
    age,
    zodiacSign,
    occupation,
    bio,
    interests,
    personalityTraits,
    relationshipGoal: randomItem(RELATIONSHIP_GOALS),
    mbtiType: randomItem(MBTI_TYPES),
    communicationStyle: {
      tone: randomItem(["casual", "flirty", "gen-z"]),
      responseLength: randomItem(["short", "medium"]),
      usesEmojis: Math.random() < 0.65,
      usesSlang: Math.random() < 0.5,
      flirtLevel: 2 + Math.floor(Math.random() * 3),
    },
  };
}

function profileSignature(profile: {
  name: string;
  occupation?: string;
  bio?: string;
  interests?: string[];
  personalityTraits?: string[];
}): Set<string> {
  const tokens = tokenize(
    [
      profile.name,
      profile.occupation ?? "",
      profile.bio ?? "",
      ...(profile.interests ?? []),
      ...(profile.personalityTraits ?? []),
    ].join(" "),
  );
  const filtered = new Set<string>();
  for (const token of tokens) {
    if (!STOPWORDS.has(token)) filtered.add(token);
  }
  return filtered;
}

function isDuplicateCandidate(
  candidate: ProfileCandidate,
  existingProfiles: Array<{
    name: string;
    username?: string;
    gender: Gender;
    occupation?: string;
    bio?: string;
    interests?: string[];
    personalityTraits?: string[];
  }>,
  semanticThreshold: number,
): boolean {
  const candidateName = normalize(candidate.name);
  const candidateUsername = normalize(candidate.username);
  const candidateSignature = profileSignature(candidate);

  for (const profile of existingProfiles) {
    if (profile.gender !== candidate.gender) {
      continue;
    }

    if (normalize(profile.name) === candidateName) {
      return true;
    }

    if (profile.username && normalize(profile.username) === candidateUsername) {
      return true;
    }

    const similarity = jaccardSimilarity(
      candidateSignature,
      profileSignature(profile),
    );
    if (similarity >= semanticThreshold) {
      return true;
    }
  }

  return false;
}

function candidateFingerprint(candidate: ProfileCandidate): string {
  return normalize(
    [
      candidate.name,
      candidate.gender,
      candidate.occupation,
      candidate.bio,
      ...candidate.interests,
      ...candidate.personalityTraits,
    ].join("|"),
  );
}

function thresholdForAttempt(attempt: number): number {
  // Phase 1: strict matching, Phase 2/3: progressively relaxed semantic gate.
  if (attempt <= 4) return SEMANTIC_SIMILARITY_THRESHOLD;
  if (attempt <= 8) return 0.5;
  return 0.6;
}

function buildAvatarPrompt(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
): string {
  const shot = randomItem(AVATAR_SHOT_STYLES);
  return buildImagePromptCore({
    subjectDescriptor,
    action: `the kind of everyday profile photo someone would actually use - ${candidate.occupation.toLowerCase()}, relaxed and real`,
    setting: shot.setting,
    composition: shot.composition,
    lighting: shot.lighting,
    style: shot.style,
    expression: appearance.expression,
    vibe: appearance.vibe,
    cityArchetype: appearance.cityArchetype,
    withReferenceClause: false,
  });
}

function randomShowcaseCount(): number {
  return (
    SHOWCASE_MIN_COUNT +
    Math.floor(Math.random() * (SHOWCASE_MAX_COUNT - SHOWCASE_MIN_COUNT + 1))
  );
}

type ShowcaseSlotPrompt = {
  sceneId: string;
  prompt: string;
};

function buildShowcasePrompts(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
  count: number,
  excludeIds: Set<string> = new Set(),
): ShowcaseSlotPrompt[] {
  const scenes = pickShowcaseScenes(candidate, appearance, count, excludeIds);
  return scenes.map((scene) => ({
    sceneId: scene.id,
    prompt: buildShowcasePromptFromScene(
      scene,
      candidate,
      appearance,
      subjectDescriptor,
    ),
  }));
}

function shouldRetryImageFetch(status: number): boolean {
  return status === 404 || status === 408 || status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImageWithRetry(
  imageUrl: string,
  maxAttempts = 4,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        const retryable = shouldRetryImageFetch(response.status);
        if (!retryable || attempt === maxAttempts) {
          throw new GenerationFailureError(
            "image_download_retry_exhausted",
            `download_retry_exhausted status=${response.status} attempts=${attempt} url=${imageUrl}`,
          );
        }
        await sleep(300 * attempt + Math.floor(Math.random() * 250));
        continue;
      }

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      return {
        bytes: new Uint8Array(buffer),
        contentType: response.headers.get("content-type") || "image/webp",
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown fetch error");
      if (attempt === maxAttempts) {
        break;
      }
      await sleep(300 * attempt + Math.floor(Math.random() * 250));
    }
  }

  throw (
    lastError ??
    new GenerationFailureError(
      "image_download_retry_exhausted",
      "download_retry_exhausted unknown_error",
    )
  );
}

function getImageExtension(contentType: string): string {
  return contentType.includes("png")
    ? "png"
    : contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : "webp";
}

async function createAndStoreGeneratedImage(
  ctx: Parameters<typeof r2.store>[0],
  prompt: string,
  referenceImageUrl: string | null,
  keyPrefix: string,
): Promise<string> {
  let lastError: Error | null = null;

  for (
    let generationAttempt = 1;
    generationAttempt <= 2;
    generationAttempt += 1
  ) {
    const imageResult = await generateImageWithFallback({
      prompt,
      aspectRatio: "3:4",
      referenceImageUrls: referenceImageUrl ? [referenceImageUrl] : [],
      isDev,
      devWidth: 768,
      devHeight: 1024,
    });
    if (!imageResult.success) {
      lastError = new GenerationFailureError(
        "image_generation_retry_exhausted",
        `image_generation_failed attempt=${generationAttempt} reason=${imageResult.error}`,
      );
      continue;
    }

    try {
      const downloaded = await downloadImageWithRetry(imageResult.imageUrl);
      const ext = getImageExtension(downloaded.contentType);
      const key = `${keyPrefix}/${crypto.randomUUID()}.${ext}`;
      await r2.store(ctx, downloaded.bytes, key);
      return key;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new GenerationFailureError(
              "image_generation_retry_exhausted",
              "image_processing_failed",
            );
    }
  }

  throw (
    lastError ??
    new GenerationFailureError(
      "image_generation_retry_exhausted",
      "image_generation_retry_exhausted",
    )
  );
}

async function updateJobProgress(
  ctx: any,
  jobId: string,
  currentStep: JobProgressStep | "failed" | "completed",
  completedSteps: JobProgressStep[],
  stepModels: StepModelEntry[],
  message?: string,
) {
  await ctx.runMutation(
    "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
    {
      jobId,
      progress: {
        currentStep,
        completedSteps,
        stepModels,
        message,
        totalSteps: JOB_PROGRESS_STEPS.length,
        completedStepCount: completedSteps.length,
      },
    },
  );
}

function upsertStepModel(
  stepModels: StepModelEntry[],
  step: JobProgressStep,
  model: string,
): StepModelEntry[] {
  const next = stepModels.filter((entry) => entry.step !== step);
  next.push({ step, model });
  return next;
}

function imageGenerationModelName(isDev: boolean): string {
  return isDev
    ? "picsum.photos (dev)"
    : "google/nano-banana-2 -> bytedance/seedream-5-lite -> qwen/qwen-image-edit-2511";
}

export const runSystemProfileGeneration = internalAction({
  args: {
    source: v.union(v.literal("manual"), v.literal("cron")),
    triggeredByUserId: v.optional(v.string()),
    preferredGender: v.optional(
      v.union(v.literal("female"), v.literal("male")),
    ),
    preferredOccupation: v.optional(v.string()),
    preferredInterests: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const normalizedPreferences: GenerationPreferences = {
      preferredOccupation: normalizePreferenceText(args.preferredOccupation),
      preferredInterests: normalizeInterestPreferences(args.preferredInterests),
    };

    const jobId = (await ctx.runMutation(
      "features/ai/profileGeneration:createProfileGenerationJobInternal" as any,
      {
        source: args.source,
        triggeredByUserId: args.triggeredByUserId,
        preferredGender: args.preferredGender,
        preferredOccupation: normalizedPreferences.preferredOccupation,
        preferredInterests: normalizedPreferences.preferredInterests,
      },
    )) as string;
    let completedSteps: JobProgressStep[] = [];
    let stepModels: StepModelEntry[] = [];

    try {
      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          status: "processing",
          startedAt: Date.now(),
        },
      );
      await updateJobProgress(
        ctx,
        jobId,
        "candidate_generation",
        completedSteps,
        stepModels,
        "Generating a unique profile blueprint...",
      );

      const selectedGender = args.preferredGender ?? weightedGender();
      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          selectedGender,
        },
      );

      const appearance = sampleAppearanceProfile(selectedGender);

      const existingProfiles = (await ctx.runQuery(
        "features/ai/profileGeneration:listSystemProfilesInternal" as any,
        {
          gender: selectedGender,
          limit: 5000,
        },
      )) as Array<{
        name: string;
        username?: string;
        gender: Gender;
        occupation?: string;
        bio?: string;
        interests?: string[];
        personalityTraits?: string[];
      }>;

      const existingUsernames = new Set(
        existingProfiles
          .map((profile) => profile.username)
          .filter((username): username is string => !!username)
          .map((username) => normalize(username)),
      );
      let candidate: ProfileCandidate | null = null;
      let candidateModel = FALLBACK_TEMPLATE_MODEL;
      let attempts = 0;
      const seenCandidateFingerprints = new Set<string>();

      while (attempts < MAX_GENERATION_ATTEMPTS && !candidate) {
        attempts += 1;
        const generated = await buildCandidateDynamic(
          selectedGender,
          attempts,
          existingProfiles,
          existingUsernames,
          appearance,
          normalizedPreferences,
        );
        const fingerprint = candidateFingerprint(generated.candidate);
        if (seenCandidateFingerprints.has(fingerprint)) {
          continue;
        }
        seenCandidateFingerprints.add(fingerprint);

        const semanticThreshold = thresholdForAttempt(attempts);
        const usernameAlreadyExists = (await ctx.runQuery(
          "features/ai/profileGeneration:usernameExistsInternal" as any,
          { username: generated.candidate.username },
        )) as boolean;
        if (usernameAlreadyExists) {
          continue;
        }
        if (
          !isDuplicateCandidate(
            generated.candidate,
            existingProfiles,
            semanticThreshold,
          )
        ) {
          candidate = generated.candidate;
          candidateModel = generated.model;
        }
      }

      if (!candidate) {
        throw new GenerationFailureError(
          "candidate_uniqueness_exhausted",
          `Failed to generate a unique profile candidate after ${MAX_GENERATION_ATTEMPTS} attempts`,
        );
      }
      stepModels = upsertStepModel(
        stepModels,
        "candidate_generation",
        candidateModel,
      );
      completedSteps = [...completedSteps, "candidate_generation"];
      stepModels = upsertStepModel(
        stepModels,
        "avatar_generation",
        imageGenerationModelName(isDev),
      );
      await updateJobProgress(
        ctx,
        jobId,
        "avatar_generation",
        completedSteps,
        stepModels,
        `Profile blueprint generated in ${attempts} attempt${attempts > 1 ? "s" : ""}. Creating avatar...`,
      );

      const subjectDescriptor = buildCanonicalSubjectDescriptor(
        candidate,
        appearance,
      );

      const avatarImageKey = await createAndStoreGeneratedImage(
        ctx,
        buildAvatarPrompt(candidate, appearance, subjectDescriptor),
        null,
        `aiProfiles/generated/${jobId}/avatar`,
      );
      completedSteps = [...completedSteps, "avatar_generation"];

      const avatarReferenceUrl = await r2.getUrl(avatarImageKey);
      const showcaseCount = randomShowcaseCount();
      const initialPrompts = buildShowcasePrompts(
        candidate,
        appearance,
        subjectDescriptor,
        showcaseCount,
      );

      stepModels = upsertStepModel(
        stepModels,
        "showcase_generation",
        imageGenerationModelName(isDev),
      );
      await updateJobProgress(
        ctx,
        jobId,
        "showcase_generation",
        completedSteps,
        stepModels,
        `Generating ${showcaseCount} showcase images in parallel...`,
      );

      // Slot-indexed storage preserves ordering (first slot -> first shot).
      const profileImageSlots: (string | null)[] = new Array(
        showcaseCount,
      ).fill(null);
      const usedSceneIds = new Set<string>(
        initialPrompts.map((entry) => entry.sceneId),
      );
      let completedCount = 0;

      const runSlot = async (
        slotIndex: number,
        slot: ShowcaseSlotPrompt,
      ): Promise<void> => {
        const key = await createAndStoreGeneratedImage(
          ctx,
          slot.prompt,
          avatarReferenceUrl,
          `aiProfiles/generated/${jobId}/showcase`,
        );
        profileImageSlots[slotIndex] = key;
        completedCount += 1;
        await updateJobProgress(
          ctx,
          jobId,
          "showcase_generation",
          completedSteps,
          stepModels,
          `Showcase images: ${completedCount}/${showcaseCount} done`,
        );
      };

      const firstPass = await Promise.allSettled(
        initialPrompts.map((slot, index) => runSlot(index, slot)),
      );
      const failedSlotIndexes = firstPass
        .map((outcome, index) => (outcome.status === "rejected" ? index : -1))
        .filter((index) => index >= 0);

      if (failedSlotIndexes.length > 0) {
        const retryPrompts = buildShowcasePrompts(
          candidate,
          appearance,
          subjectDescriptor,
          failedSlotIndexes.length,
          usedSceneIds,
        );
        for (const retrySlot of retryPrompts) {
          usedSceneIds.add(retrySlot.sceneId);
        }
        await updateJobProgress(
          ctx,
          jobId,
          "showcase_generation",
          completedSteps,
          stepModels,
          `Retrying ${failedSlotIndexes.length} failed showcase slot${failedSlotIndexes.length > 1 ? "s" : ""}...`,
        );

        await Promise.allSettled(
          failedSlotIndexes.map((slotIndex, i) => {
            const retrySlot = retryPrompts[i];
            if (!retrySlot) return Promise.resolve();
            return runSlot(slotIndex, retrySlot);
          }),
        );
      }

      const profileImageKeys = profileImageSlots.filter(
        (key): key is string => typeof key === "string",
      );

      if (profileImageKeys.length < SHOWCASE_MIN_SUCCESS) {
        throw new GenerationFailureError(
          "image_generation_retry_exhausted",
          `Only ${profileImageKeys.length}/${showcaseCount} showcase images succeeded (minimum ${SHOWCASE_MIN_SUCCESS}).`,
        );
      }

      completedSteps = [...completedSteps, "showcase_generation"];
      stepModels = upsertStepModel(
        stepModels,
        "profile_persist",
        PROFILE_PERSIST_MODEL,
      );
      await updateJobProgress(
        ctx,
        jobId,
        "profile_persist",
        completedSteps,
        stepModels,
        "Saving generated profile...",
      );

      const createdProfileId = (await ctx.runMutation(
        "features/ai/profileGeneration:createSystemProfileInternal" as any,
        {
          ...candidate,
          avatarImageKey,
          profileImageKeys,
        },
      )) as string;
      completedSteps = [...completedSteps, "profile_persist"];

      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          status: "completed",
          selectedGender,
          attempts,
          createdProfileId,
          progress: {
            currentStep: "completed",
            completedSteps,
            stepModels,
            message: "Profile generation completed successfully.",
            totalSteps: JOB_PROGRESS_STEPS.length,
            completedStepCount: completedSteps.length,
          },
          completedAt: Date.now(),
        },
      );

      return { success: true, jobId, createdProfileId };
    } catch (error) {
      const errorMessage =
        error instanceof GenerationFailureError
          ? `${error.code}: ${error.message}`
          : error instanceof Error
            ? `profile_creation_failed: ${error.message}`
            : "profile_creation_failed: Unknown error";

      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          status: "failed",
          errorMessage,
          progress: {
            currentStep: "failed",
            completedSteps,
            stepModels,
            message: errorMessage,
            totalSteps: JOB_PROGRESS_STEPS.length,
            completedStepCount: completedSteps.length,
          },
          completedAt: Date.now(),
        },
      );
      return { success: false, jobId };
    }
  },
});
