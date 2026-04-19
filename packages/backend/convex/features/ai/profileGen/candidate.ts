import {
  type Gender,
  FIRST_NAMES,
  LAST_NAMES,
  OCCUPATIONS,
  INTERESTS,
  PERSONALITY_TRAITS,
  ZODIAC_SIGNS,
  RELATIONSHIP_GOALS,
  MBTI_TYPES,
  BANNED_BIO_PHRASES,
  STOPWORDS,
} from "../profileGenerationData";
import type {
  AppearanceProfile,
  GenerationPreferences,
  ProfileCandidate,
} from "./types";
import type { ProfileBlueprint } from "./blueprintSchema";
import { locationForArchetype } from "./appearance";
import {
  buildUsername,
  jaccardSimilarity,
  normalize,
  randomItem,
  sanitizeUsername,
  shuffle,
  tokenize,
  uniqueList,
} from "./textUtils";

export function getBioOpenings(
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

export function bioHasBannedPhrase(bio: string): boolean {
  const lower = bio.toLowerCase();
  return BANNED_BIO_PHRASES.some((phrase) => lower.includes(phrase));
}

export function toCandidateFromBlueprint(
  blueprint: ProfileBlueprint,
  gender: Gender,
  existingUsernames: Set<string>,
  appearance: AppearanceProfile,
  allowedInterests: readonly string[],
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

  // Defense-in-depth: even if the schema already restricted the LLM to the
  // library, any off-list values (e.g. via the free-form fallback schema)
  // are filtered out here, and we backfill from the library to meet the
  // 4-item floor before persistence.
  const libraryPool =
    allowedInterests.length > 0
      ? (allowedInterests as readonly string[])
      : INTERESTS;
  const allowedSet = new Set(libraryPool);
  const filteredGenerated = blueprint.interests.filter((i) =>
    allowedSet.has(i),
  );
  const filteredPreferred = (preferences?.preferredInterests ?? []).filter(
    (i) => allowedSet.has(i),
  );
  const backfill = shuffle([...libraryPool]);
  const mergedInterests = uniqueList(
    [...filteredPreferred, ...filteredGenerated, ...backfill],
    5,
  );

  // Hard-override with user/reference-supplied location when present;
  // otherwise prefer LLM-provided location, falling back to archetype-derived.
  const location =
    preferences?.preferredLocation?.trim() ||
    blueprint.location?.trim() ||
    locationForArchetype(appearance.cityArchetype);

  return {
    name: blueprint.name.trim(),
    username,
    gender,
    age: blueprint.age,
    zodiacSign: zodiac,
    occupation: preferences?.preferredOccupation ?? blueprint.occupation.trim(),
    location,
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

export function buildCandidate(
  gender: Gender,
  existingUsernames: Set<string>,
  appearance: AppearanceProfile,
  allowedInterests: readonly string[],
  preferences?: GenerationPreferences,
): ProfileCandidate {
  const firstName = randomItem(FIRST_NAMES[gender]);
  const lastName = randomItem(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const username = buildUsername(name, existingUsernames);
  // Prefer the live library when available; fall back to the static constant
  // so this fallback path never produces off-library interests either.
  const libraryPool =
    allowedInterests.length > 0
      ? (allowedInterests as readonly string[])
      : INTERESTS;
  const interestPool = shuffle([...libraryPool]);
  const allowedSet = new Set(libraryPool);
  const validPreferredInterests = (
    preferences?.preferredInterests ?? []
  ).filter((i) => allowedSet.has(i));
  const interests = uniqueList(
    [...validPreferredInterests, ...interestPool],
    5,
  );
  const personalityTraits = shuffle(PERSONALITY_TRAITS).slice(0, 4);
  const occupation =
    preferences?.preferredOccupation ?? randomItem(OCCUPATIONS[gender]);
  const age = appearance.ageHint;
  const zodiacSign = randomItem(ZODIAC_SIGNS);
  const [interestA = "coffee", interestB = "music", interestC = "books"] =
    interests;

  const bioTemplates = [
    `${interestA.toLowerCase()} addict, ${occupation.toLowerCase()} by day. currently obsessed with ${interestB.toLowerCase()} and finding the best ${interestC.toLowerCase()} spots in the city.`,
    `split my time between ${interestA.toLowerCase()} and ${interestB.toLowerCase()}. ${appearance.quirk}. looking for someone who doesn't take themselves too seriously.`,
    `${occupation.toLowerCase()} who can't stop talking about ${interestA.toLowerCase()}. weekends are for ${interestB.toLowerCase()} and ${interestC.toLowerCase()}. ${appearance.quirk}.`,
    `moved to this ${appearance.cityArchetype} for the ${interestA.toLowerCase()} scene, stayed for the people. ${interestB.toLowerCase()} on my days off. ${appearance.quirk}.`,
    `probably ${interestA.toLowerCase()} right now. or ${interestB.toLowerCase()}. ${occupation.toLowerCase()} life is busy but i always make time for ${interestC.toLowerCase()}.`,
    `my friends describe me as the ${interestA.toLowerCase()} person. ${appearance.quirk}. also really into ${interestB.toLowerCase()} lately.`,
    `${occupation.toLowerCase()} in a ${appearance.cityArchetype}. ${interestA.toLowerCase()} keeps me sane, ${interestB.toLowerCase()} keeps me happy. let's talk about ${interestC.toLowerCase()}.`,
    `two truths and a lie: i'm a ${occupation.toLowerCase()}, i'm obsessed with ${interestA.toLowerCase()}, and i hate ${interestB.toLowerCase()}. (it's the last one)`,
    `here for good ${interestA.toLowerCase()} recs and better conversations. ${appearance.quirk}. part-time ${interestB.toLowerCase()} enthusiast.`,
    `not your typical ${occupation.toLowerCase()}. i'd rather be doing ${interestA.toLowerCase()} or ${interestB.toLowerCase()} than anything else. ${appearance.quirk}.`,
    `${interestA.toLowerCase()} > everything. currently in my ${interestB.toLowerCase()} era. ${occupation.toLowerCase()} paying the bills. ${appearance.quirk}.`,
    `${appearance.quirk}. when i'm not working as a ${occupation.toLowerCase()}, you'll find me deep into ${interestA.toLowerCase()} or attempting ${interestB.toLowerCase()}.`,
  ];

  const bio = randomItem(bioTemplates);

  return {
    name,
    username,
    gender,
    age,
    zodiacSign,
    occupation,
    location:
      preferences?.preferredLocation?.trim() ||
      locationForArchetype(appearance.cityArchetype),
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

export function profileSignature(profile: {
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

export function isDuplicateCandidate(
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

export function candidateFingerprint(candidate: ProfileCandidate): string {
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
