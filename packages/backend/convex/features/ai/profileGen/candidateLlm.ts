import { generateObject } from "ai";
import {
  type Gender,
  BANNED_BIO_PHRASES,
  ETHNICITIES,
} from "../profileGenerationData";
import { gatewayProvider, openRouterProvider } from "../aiProviders";
import {
  FALLBACK_TEMPLATE_MODEL,
  PROFILE_GENERATION_FALLBACK_MODELS,
  PROFILE_GENERATION_MODEL,
} from "./constants";
import {
  buildProfileBlueprintSchema,
  type ProfileBlueprint,
} from "./blueprintSchema";
import type {
  AppearanceProfile,
  CandidateBuildResult,
  GenerationPreferences,
} from "./types";
import { GenerationFailureError } from "./types";
import {
  bioHasBannedPhrase,
  buildCandidate,
  getBioOpenings,
  toCandidateFromBlueprint,
} from "./candidate";
import { uniqueModelList } from "./textUtils";

export async function generateCandidateWithLLM(
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
  allowedInterests: readonly string[],
  preferences?: GenerationPreferences,
): Promise<CandidateBuildResult> {
  if (!gatewayProvider && !openRouterProvider) {
    throw new GenerationFailureError(
      "profile_model_generation_failed",
      "Neither AI_GATEWAY_API_KEY nor OPENROUTER_API_KEY is set",
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
  // Only surface preferred interests that are part of the allowed library.
  // Anything else would violate the enum schema below and force a retry.
  const allowedInterestSet = new Set(allowedInterests);
  const validPreferredInterests =
    preferences?.preferredInterests?.filter((i) =>
      allowedInterestSet.size === 0 ? true : allowedInterestSet.has(i),
    ) ?? [];

  const preferenceHints = [
    preferences?.preferredOccupation
      ? `- occupation must be exactly: ${preferences.preferredOccupation}`
      : null,
    validPreferredInterests.length > 0
      ? `- include these interests exactly (at least first 2): ${validPreferredInterests.join(", ")}`
      : null,
    preferences?.preferredLocation
      ? `- location MUST be exactly: ${preferences.preferredLocation} (do not change city, country, or format)`
      : null,
    preferences?.ethnicity
      ? `- ethnicity field MUST be exactly "${preferences.ethnicity}" (do not deviate)`
      : null,
    preferences?.ethnicity
      ? `- name must be a believable first + last name for a ${preferences.ethnicity} person${preferences?.preferredLocation ? ` living in ${preferences.preferredLocation}` : ""}; use naming conventions typical for that background (script romanized if non-Latin)`
      : null,
    preferences?.ethnicity
      ? `- bio should feel culturally coherent with a ${preferences.ethnicity} background — natural references (foods, places, habits) are fine but do not stereotype`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const livesInLine = preferences?.preferredLocation
    ? `- lives in ${preferences.preferredLocation}`
    : `- lives in a ${appearance.cityArchetype}`;
  const nameHintLine = preferences?.ethnicity
    ? `- name must reflect a ${preferences.ethnicity} background`
    : `- pick a name and location that feel culturally coherent with the appearance — no strict rules, just natural`;

  const prompt = `Generate one unique ${gender} dating profile that reads like a real person's, not AI-written.

Soft persona seed (use naturally, do not quote literally):
- age around ${appearance.ageHint} (allowed range 20-34)
- appearance: ${appearance.skinTone}, ${appearance.hair}, ${appearance.eyes}
${livesInLine}
- overall style/aesthetic: ${appearance.vibe}
- personal quirk to weave in subtly: ${appearance.quirk}
${nameHintLine}

Hard requirements:
- age integer between 20 and 34
- occupation: specific and believable (prefer non-generic roles)
- location: a specific real city in "City, ST" or "City, CC" format (e.g. "Austin, TX", "Shanghai, CN", "Berlin, DE") - should feel natural for the persona
- countryCode: the ISO 3166-1 alpha-2 country code for the location
- if location is a US city written as "City, ST", countryCode MUST be "US"
- if location is a non-US city written as "City, CC", countryCode MUST match that country code
- bio: 2-3 short sentences, 60-240 chars total
- interests: pick 4-7 items${allowedInterests.length > 0 ? ` STRICTLY from the allowed library below. Use the values verbatim (exact spelling and capitalization). Do NOT invent new interests.` : " (specific, not vague nouns)"}
- personalityTraits: 3-6 short adjectives
- relationshipGoal: one short natural phrase
- name must be a believable first + last name
- username is optional; if provided, lowercase letters/numbers/underscores only${
    allowedInterests.length > 0
      ? `

Allowed interests library (pick 4-7, verbatim):
${allowedInterests.join(", ")}`
      : ""
  }

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

Ethnicity rules (strict):
- Pick exactly one value for the "ethnicity" field from this list, verbatim: ${ETHNICITIES.join(", ")}.
- Treat the field as the MOST SPECIFIC stored value, not a broad parent category.
- The chosen ethnicity MUST be coherent with the name you pick (e.g. "Priya Sharma" → "Indian", "Kenji Tanaka" → "Japanese", "Sofia Romano" → "White" or "Hispanic" depending on feel).
- "Asian" is the broad umbrella bucket. Use it only when the profile should read broadly Asian but none of the more specific options (Indian/Chinese/Japanese/Korean/Vietnamese/Filipino) is clearly intended.
- If a specific option clearly fits, prefer that specific option over "Asian".
- Use "Black", "Hispanic", or "Middle Eastern" where appropriate; do not force those profiles into "Asian".
- Use "Mixed" only when the name + bio honestly imply multiple backgrounds.

Required JSON shape:
{
  "name": "string",
  "username": "string optional",
  "age": 24,
  "zodiacSign": "string",
  "occupation": "string",
  "location": "City, ST or City, CC (optional)",
  "countryCode": "ISO 3166-1 alpha-2 country code matching the location",
  "bio": "string",
  "interests": ["string"],
  "personalityTraits": ["string"],
  "relationshipGoal": "string",
  "mbtiType": "string optional",
  "ethnicity": "one of: ${ETHNICITIES.join(" | ")}",
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

  // We use `generateObject` (not `generateText` + `experimental_output`)
  // because the latter only resolves the output when `finishReason === "stop"`
  // and throws `NoOutputSpecifiedError` for any other finish reason (length,
  // tool-calls, content-filter, error). `generateObject` has the correct
  // structured-output semantics for every provider AI SDK v5 supports.
  //
  // `maxRetries: 1` cuts per-model wait time. Each model already retries
  // internally on transient failures; we don't want compounded retries
  // ballooning the action to minutes before the outer loop moves on.
  const generateArgs = {
    schema: buildProfileBlueprintSchema(allowedInterests),
    maxRetries: 1,
    temperature: 1.05,
    system:
      "You generate highly unique, human-sounding dating profile blueprints. Write like a real person, not a copywriter. Return valid structured output only.",
    prompt,
  } as const;

  const validateAndReturn = (
    blueprint: ProfileBlueprint,
    modelName: string,
  ): CandidateBuildResult => {
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
        appearance,
        allowedInterests,
        preferences,
      ),
      model: modelName,
    };
  };

  // Phase 1: Try OpenRouter

  if (openRouterProvider) {
    for (const modelName of modelsToTry) {
      console.log("[OpenRouter] Trying model:", modelName);
      try {
        const result = await generateObject({
          model: openRouterProvider.chat(modelName),
          ...generateArgs,
        });
        return validateAndReturn(result.object, `openrouter/${modelName}`);
      } catch (error) {
        console.error("[OpenRouter] Model failed:", modelName, error);
        const message =
          error instanceof Error ? error.message : "Unknown model error";
        modelErrors.push(`openrouter/${modelName}: ${message}`);
      }
    }
  }

  // Phase 2: Fallback to AI Gateway (Vercel)

  if (gatewayProvider) {
    for (const modelName of modelsToTry) {
      console.log("[AI Gateway] Trying model:", modelName);
      try {
        const result = await generateObject({
          model: gatewayProvider(modelName),
          ...generateArgs,
        });
        return validateAndReturn(result.object, `gateway/${modelName}`);
      } catch (error) {
        console.error("[AI Gateway] Model failed:", modelName, error);
        const message =
          error instanceof Error ? error.message : "Unknown model error";
        modelErrors.push(`gateway/${modelName}: ${message}`);
      }
    }
  }

  throw new GenerationFailureError(
    "profile_model_generation_failed",
    `Model generation failed for all candidates. ${modelErrors.join(" | ")}`,
  );
}

export async function buildCandidateDynamic(
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
  allowedInterests: readonly string[],
  preferences?: GenerationPreferences,
): Promise<CandidateBuildResult> {
  try {
    return await generateCandidateWithLLM(
      gender,
      attempt,
      existingProfiles,
      existingUsernames,
      appearance,
      allowedInterests,
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
        allowedInterests,
        preferences,
      ),
      model: FALLBACK_TEMPLATE_MODEL,
    };
  }
}
