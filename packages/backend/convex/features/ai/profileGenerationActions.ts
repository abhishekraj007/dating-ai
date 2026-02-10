"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import Replicate from "replicate";
import { r2 } from "../../uploads";
import { z } from "zod";
import { generateObject } from "ai";
import { createGateway } from "@ai-sdk/gateway";

type Gender = "female" | "male";
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

const FEMALE_WEIGHT = 0.75;
const SEMANTIC_SIMILARITY_THRESHOLD = 0.42;
const MAX_GENERATION_ATTEMPTS = 12;
const AI_GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1/ai";
const PROFILE_GENERATION_MODEL =
  process.env.PROFILE_GENERATION_MODEL ?? "google/gemini-3-flash";

const FIRST_NAMES: Record<Gender, string[]> = {
  female: [
    "Ava",
    "Mila",
    "Ivy",
    "Nora",
    "Lena",
    "Aria",
    "Zara",
    "Sage",
    "Nia",
    "Maya",
    "Elise",
    "Rhea",
  ],
  male: [
    "Kai",
    "Noah",
    "Milo",
    "Axel",
    "Theo",
    "Jasper",
    "Luca",
    "Ryder",
    "Aiden",
    "Dylan",
    "Evan",
    "Rowan",
  ],
};

const LAST_NAMES = [
  "Rivera",
  "Chen",
  "Park",
  "Nguyen",
  "Santos",
  "Kim",
  "Wright",
  "Cruz",
  "Sharma",
  "Patel",
  "Martinez",
  "Singh",
];

const OCCUPATIONS: Record<Gender, string[]> = {
  female: [
    "Content Creator",
    "Product Designer",
    "Photographer",
    "Barista",
    "Marketing Strategist",
    "Dance Instructor",
    "Startup Founder",
  ],
  male: [
    "Software Engineer",
    "Music Producer",
    "Fitness Coach",
    "Filmmaker",
    "UX Designer",
    "Chef",
    "Entrepreneur",
  ],
};

const INTERESTS = [
  "Travel",
  "Gym",
  "Coffee",
  "Photography",
  "Gaming",
  "Music",
  "Fashion",
  "Cooking",
  "Hiking",
  "Art",
  "Podcasts",
  "Movies",
  "Skincare",
  "Books",
  "Tennis",
];

const PERSONALITY_TRAITS = [
  "Confident",
  "Playful",
  "Adventurous",
  "Ambitious",
  "Witty",
  "Loyal",
  "Calm",
  "Outgoing",
  "Curious",
  "Romantic",
];

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const RELATIONSHIP_GOALS = [
  "something meaningful with fun energy",
  "a slow-burn connection that feels real",
  "a playful relationship with deep conversations",
  "a best-friend and partner vibe",
];

const MBTI_TYPES = [
  "ENFP",
  "INFP",
  "ESFP",
  "ISFJ",
  "ENTJ",
  "INTP",
  "INFJ",
  "ESTP",
];

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

const profileBlueprintSchema = z.object({
  name: z.string().min(3).max(64),
  username: z.string().min(3).max(40).optional(),
  age: z.number().int().min(18).max(45),
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

function toCandidateFromBlueprint(
  blueprint: z.infer<typeof profileBlueprintSchema>,
  gender: Gender,
  existingUsernames: Set<string>,
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

  return {
    name: blueprint.name.trim(),
    username,
    gender,
    age: blueprint.age,
    zodiacSign: zodiac,
    occupation: blueprint.occupation.trim(),
    bio: blueprint.bio.trim(),
    interests: uniqueList(blueprint.interests, 5),
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
  }>,
  existingUsernames: Set<string>,
): Promise<ProfileCandidate> {
  if (!aiGatewayApiKey || !aiGatewayProvider) {
    throw new GenerationFailureError(
      "profile_model_generation_failed",
      "AI_GATEWAY_API_KEY is not set",
    );
  }

  const recentSameGenderNames = existingProfiles
    .filter((profile) => profile.gender === gender)
    .slice(0, 80)
    .map((profile) => profile.name);

  const recentUsernames = Array.from(existingUsernames).slice(0, 120);

  const strategyHint =
    attempt <= 4
      ? "Keep results highly distinct and avoid common stereotype templates."
      : attempt <= 8
        ? "Increase novelty strongly: different occupation, interests and personality wording."
        : "Maximize uniqueness aggressively while still realistic and natural.";

  try {
    const result = await generateObject({
      model: aiGatewayProvider(PROFILE_GENERATION_MODEL),
      schema: profileBlueprintSchema,
      temperature: 1.05,
      system:
        "You generate highly unique dating profile blueprints for a dating app. Return valid structured output only.",
      prompt: `Generate one unique ${gender} dating profile.
Constraints:
- age 21-29
- occupation
- natural bio (2-3 lines, no cringe)
- 4-7 interests
- 3-6 personality traits
- relationshipGoal short natural phrase
- optional username and communicationStyle
- avoid copying names or style from existing list

Existing names to avoid: ${recentSameGenderNames.join(", ") || "none"}
Existing usernames to avoid: ${recentUsernames.join(", ") || "none"}

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
}`,
    });
    return toCandidateFromBlueprint(result.object, gender, existingUsernames);
  } catch (error) {
    throw new GenerationFailureError(
      "profile_model_generation_failed",
      error instanceof Error
        ? `Model generation failed: ${error.message}`
        : "Model generation failed",
    );
  }
}

async function buildCandidateDynamic(
  gender: Gender,
  attempt: number,
  existingProfiles: Array<{
    name: string;
    username?: string;
    gender: Gender;
  }>,
  existingUsernames: Set<string>,
): Promise<ProfileCandidate> {
  try {
    return await generateCandidateWithLLM(
      gender,
      attempt,
      existingProfiles,
      existingUsernames,
    );
  } catch (error) {
    // Fallback preserves availability if model/API is unavailable.
    console.error(
      "[profileGeneration] LLM candidate generation failed:",
      error,
    );
    return buildCandidate(gender, existingUsernames);
  }
}

function buildCandidate(
  gender: Gender,
  existingUsernames: Set<string>,
): ProfileCandidate {
  const firstName = randomItem(FIRST_NAMES[gender]);
  const lastName = randomItem(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const username = buildUsername(name, existingUsernames);
  const interests = shuffle(INTERESTS).slice(0, 5);
  const personalityTraits = shuffle(PERSONALITY_TRAITS).slice(0, 4);
  const occupation = randomItem(OCCUPATIONS[gender]);
  const age = 21 + Math.floor(Math.random() * 8);
  const zodiacSign = randomItem(ZODIAC_SIGNS);
  const [interestA = "coffee", interestB = "travel", interestC = "music"] =
    interests;

  const bio = `${name.split(" ")[0]} here. ${occupation} by day, ${interestA.toLowerCase()} and ${interestB.toLowerCase()} after hours. I love ${interestC.toLowerCase()} and good conversations that can go from playful to deep.`;

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
  return tokenize(
    [
      profile.name,
      profile.occupation ?? "",
      profile.bio ?? "",
      ...(profile.interests ?? []),
      ...(profile.personalityTraits ?? []),
    ].join(" "),
  );
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

async function generateImageDev(): Promise<
  { success: true; imageUrl: string } | { success: false; error: string }
> {
  try {
    const width = 768;
    const height = 1024;
    const randomId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/id/${randomId}/${width}/${height}`;
    return { success: true, imageUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function generateImageProd(
  prompt: string,
  referenceImageUrl: string | null,
): Promise<
  { success: true; imageUrl: string } | { success: false; error: string }
> {
  try {
    const fluxInput: Record<string, unknown> = {
      prompt,
      go_fast: true,
      guidance: 3.5,
      num_outputs: 1,
      aspect_ratio: "3:4",
      output_format: "webp",
      output_quality: 90,
      num_inference_steps: 28,
    };

    if (referenceImageUrl) {
      fluxInput.image = referenceImageUrl;
      fluxInput.prompt_strength = 0.72;
    } else {
      fluxInput.prompt_strength = 0.8;
    }

    const output = await replicate.run("black-forest-labs/flux-dev", {
      input: fluxInput,
    });
    const fileOutput = Array.isArray(output) ? output[0] : output;

    let imageUrl = "";
    if (
      fileOutput &&
      typeof fileOutput === "object" &&
      "url" in fileOutput &&
      typeof fileOutput.url === "function"
    ) {
      imageUrl = String(fileOutput.url());
    } else if (typeof fileOutput === "string") {
      imageUrl = fileOutput;
    }

    if (!imageUrl) {
      return { success: false, error: "No image URL returned from provider" };
    }

    return { success: true, imageUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function generateConsistentProfileImage(
  prompt: string,
  referenceImageUrl: string | null,
): Promise<
  { success: true; imageUrl: string } | { success: false; error: string }
> {
  if (isDev) {
    return generateImageDev();
  }
  return generateImageProd(prompt, referenceImageUrl);
}

function buildAvatarPrompt(candidate: ProfileCandidate): string {
  return `Photorealistic dating app portrait of ${candidate.name}, ${candidate.age} year old ${candidate.gender}, ${candidate.occupation}, natural daylight, shallow depth of field, high detail, realistic skin texture, cinematic portrait`;
}

function buildShowcasePrompts(
  candidate: ProfileCandidate,
  count: number,
): string[] {
  const [interestA = "coffee", interestB = "music"] = candidate.interests;
  const prompts = [
    `Photorealistic lifestyle photo of ${candidate.name} enjoying ${interestA.toLowerCase()} at a stylish cafe, natural candid vibe, detailed face`,
    `Photorealistic full-body portrait of ${candidate.name} on a city street at golden hour, confident expression, modern outfit, detailed face`,
    `Photorealistic portrait of ${candidate.name} during ${interestB.toLowerCase()}, warm atmosphere, authentic candid moment, detailed face`,
  ];
  return shuffle(prompts).slice(0, count);
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
    const imageResult = await generateConsistentProfileImage(
      prompt,
      referenceImageUrl,
    );
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

export const runSystemProfileGeneration = internalAction({
  args: {
    source: v.union(v.literal("manual"), v.literal("cron")),
    triggeredByUserId: v.optional(v.string()),
    preferredGender: v.optional(
      v.union(v.literal("female"), v.literal("male")),
    ),
  },
  handler: async (ctx, args) => {
    const jobId = (await ctx.runMutation(
      "features/ai/profileGeneration:createProfileGenerationJobInternal" as any,
      {
        source: args.source,
        triggeredByUserId: args.triggeredByUserId,
      },
    )) as string;

    try {
      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          status: "processing",
          startedAt: Date.now(),
        },
      );

      const selectedGender = args.preferredGender ?? weightedGender();
      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          selectedGender,
        },
      );

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
      let attempts = 0;
      const seenCandidateFingerprints = new Set<string>();

      while (attempts < MAX_GENERATION_ATTEMPTS && !candidate) {
        attempts += 1;
        const generated = await buildCandidateDynamic(
          selectedGender,
          attempts,
          existingProfiles,
          existingUsernames,
        );
        const fingerprint = candidateFingerprint(generated);
        if (seenCandidateFingerprints.has(fingerprint)) {
          continue;
        }
        seenCandidateFingerprints.add(fingerprint);

        const semanticThreshold = thresholdForAttempt(attempts);
        const usernameAlreadyExists = (await ctx.runQuery(
          "features/ai/profileGeneration:usernameExistsInternal" as any,
          { username: generated.username },
        )) as boolean;
        if (usernameAlreadyExists) {
          continue;
        }
        if (
          !isDuplicateCandidate(generated, existingProfiles, semanticThreshold)
        ) {
          candidate = generated;
        }
      }

      if (!candidate) {
        throw new GenerationFailureError(
          "candidate_uniqueness_exhausted",
          `Failed to generate a unique profile candidate after ${MAX_GENERATION_ATTEMPTS} attempts`,
        );
      }

      const avatarImageKey = await createAndStoreGeneratedImage(
        ctx,
        buildAvatarPrompt(candidate),
        null,
        `aiProfiles/generated/${jobId}/avatar`,
      );

      const avatarReferenceUrl = await r2.getUrl(avatarImageKey);
      const showcaseCount = Math.random() < 0.5 ? 1 : 2;
      const showcasePrompts = buildShowcasePrompts(candidate, showcaseCount);
      const profileImageKeys: string[] = [];

      for (const prompt of showcasePrompts) {
        const imageKey = await createAndStoreGeneratedImage(
          ctx,
          prompt,
          avatarReferenceUrl,
          `aiProfiles/generated/${jobId}/showcase`,
        );
        profileImageKeys.push(imageKey);
      }

      const createdProfileId = (await ctx.runMutation(
        "features/ai/profileGeneration:createSystemProfileInternal" as any,
        {
          ...candidate,
          avatarImageKey,
          profileImageKeys,
        },
      )) as string;

      await ctx.runMutation(
        "features/ai/profileGeneration:updateProfileGenerationJobInternal" as any,
        {
          jobId,
          status: "completed",
          selectedGender,
          attempts,
          createdProfileId,
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
          completedAt: Date.now(),
        },
      );
      return { success: false, jobId };
    }
  },
});
