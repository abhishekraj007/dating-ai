import { Agent, createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { components } from "../../_generated/api";
import type { Doc } from "../../_generated/dataModel";
import { gatewayProvider, openRouterProvider } from "./aiProviders";
import {
  DEFAULT_LANGUAGE,
  getLanguageLabel,
  type AppLanguage,
} from "../../lib/languages";

// Default ElevenLabs voice IDs per gender
export const DEFAULT_VOICES = {
  female: "EXAVITQu4vr4xnSDxMaL", // Sarah
  male: "pNInz6obpgDQGcFmaJgB", // Adam
} as const;

export type AgentProvider = "openrouter" | "gateway";

const RAW_AGENT_PROVIDER = (
  process.env.AI_AGENT_PROVIDER ?? "gateway"
).toLowerCase();
const AI_AGENT_PROVIDER: AgentProvider =
  RAW_AGENT_PROVIDER === "openrouter" ? "openrouter" : "gateway";
const AI_AGENT_MODEL =
  process.env.AI_AGENT_MODEL ?? "google/gemini-3.1-flash-lite-preview";
const AI_AGENT_EMBEDDING_MODEL =
  process.env.AI_AGENT_EMBEDDING_MODEL ?? "openai/text-embedding-3-small";

/**
 * Returns the agent providers in preferred order: the one set in
 * `AI_AGENT_PROVIDER` first, then the other as a fallback. Providers whose
 * API keys are not configured are filtered out so the caller never tries a
 * provider that is guaranteed to fail.
 *
 * Used by `actions.ts::generateResponse` to retry with the fallback provider
 * if the primary one errors out (e.g. Vercel AI Gateway returning
 * "insufficient funds" or OpenRouter temporarily rate-limiting).
 */
export function getAvailableAgentProviders(): AgentProvider[] {
  const primary = AI_AGENT_PROVIDER;
  const fallback: AgentProvider =
    primary === "openrouter" ? "gateway" : "openrouter";
  return [primary, fallback].filter((provider) => {
    if (provider === "gateway") return Boolean(gatewayProvider);
    if (provider === "openrouter") return Boolean(openRouterProvider);
    return false;
  });
}

export function getAgentLanguageModel(provider: AgentProvider) {
  if (provider === "gateway") {
    if (!gatewayProvider) return null;
    return gatewayProvider(AI_AGENT_MODEL);
  }

  if (provider === "openrouter") {
    if (!openRouterProvider) return null;
    return openRouterProvider.chat(AI_AGENT_MODEL);
  }

  return null;
}

/**
 * IMPORTANT: the AI-SDK OpenRouter provider does NOT expose
 * `textEmbeddingModel(...)`; OpenRouter's API is chat-completion only from
 * the SDK's perspective. So when the primary provider is OpenRouter we
 * deliberately return `undefined` here, which causes `createAIProfileAgent`
 * to configure the Convex Agent with text-search-based context retrieval
 * instead of vector search. Previously this function always used
 * `gatewayProvider.textEmbeddingModel(...)`, which meant that setting
 * `AI_AGENT_PROVIDER=openrouter` still generated Vercel Gateway embedding
 * calls on every turn - and those calls failed with "insufficient funds"
 * once the gateway credits ran out, surfacing as a chat-generation error.
 */
function getAgentEmbeddingModel(provider: AgentProvider) {
  const embeddingModelId = AI_AGENT_EMBEDDING_MODEL.trim();
  if (!embeddingModelId) return undefined;

  if (provider === "openrouter") return undefined;

  if (!gatewayProvider) return undefined;
  return gatewayProvider.textEmbeddingModel(embeddingModelId);
}

type ResponseLengthTier = "short" | "medium" | "long";

function normalizeResponseLength(responseLength?: string): ResponseLengthTier {
  if (responseLength === "short" || responseLength === "long") {
    return responseLength;
  }
  return "medium";
}

type CommunicationStyle = NonNullable<Doc<"aiProfiles">["communicationStyle"]>;

function buildResponseLengthLines(responseLength?: string): string {
  const tier = normalizeResponseLength(responseLength);

  if (tier === "short") {
    return `- One bubble: 1-2 short sentences, often just one
- No paragraph breaks, no lists
- If tempted to write more, cut it in half`;
  }

  if (tier === "long") {
    return `- You can go longer when they did, but stay conversational, not an article
- 2-3 short paragraphs max; no lists unless they asked`;
  }

  return `- Usually 1-2 short sentences. 3 only if they wrote a lot
- One bubble; no lists unless they asked`;
}

function buildExampleReplies(
  profile: Doc<"aiProfiles">,
  tone?: string,
): string {
  const job = profile.occupation?.trim();
  const jobLine = job
    ? `\nUser: "what do you do?"\nYou: "${
        tone === "formal"
          ? `${job}. Long week. You?`
          : `${job.toLowerCase()}. long day. you?`
      }"`
    : "";

  if (tone === "gen-z") {
    return `
These show length and energy, not lines to reuse. Reply fresh every time.
User: "just got off work im fried"
You: "same lol. couch or going out?"${jobLine}
User: "that's a cool city"
You: "it has its days. u from around here?"`;
  }

  if (tone === "formal") {
    return `
These show length and energy, not lines to reuse. Reply fresh every time.
User: "Just got off work, I'm fried"
You: "I know that feeling. In for the night?"${jobLine}
User: "That's a cool city"
You: "It has its days. Are you from around here?"`;
  }

  return `
These show length and energy, not lines to reuse. Reply fresh every time.
User: "just got off work, I'm fried"
You: "same. couch night or you going out?"${jobLine}
User: "that's a cool city"
You: "it has its days. you from around here?"`;
}

function buildToneLines(style: CommunicationStyle): string {
  const tone = style.tone;
  let lines = "";

  if (tone === "gen-z") {
    lines += `
- Text like gen-z: casual, mostly lowercase, slang when it fits (ngl, fr, lowkey, bet, no cap)
- Abbreviations are fine (u, ur, rn, idk). Don't stuff every line with them`;
  } else if (tone === "formal") {
    lines += `
- Complete sentences, proper grammar
- Still a text, not an email or a speech`;
  } else if (tone === "flirty") {
    lines += `
- Teasing and a little suggestive when the moment is there
- Flirt in the timing, not by declaring interest`;
  } else if (tone === "intellectual") {
    lines += `
- You like a real conversation, one idea at a time
- Don't lecture or write an essay`;
  } else if (tone === "sarcastic") {
    lines += `
- Dry humor and teasing, still warm underneath
- Don't be mean; don't explain the joke`;
  } else if (tone === "casual") {
    lines += `
- Relaxed and plain. Contractions, everyday words
- Don't try to sound clever or like a pickup line`;
  }

  if (style.usesEmojis === false) {
    lines += `\n- Don't use emojis`;
  } else {
    lines += `\n- Emojis are optional. At most one, and skip them most of the time`;
  }

  if (style.usesSlang && tone !== "gen-z") {
    lines += `\n- Casual slang is fine when it sounds like you`;
  }

  if (style.flirtLevel !== undefined) {
    if (style.flirtLevel >= 4) {
      lines += `\n- You can be forward, but follow their pace. Don't gush on a first hello`;
    } else if (style.flirtLevel >= 2) {
      lines += `\n- Playful when they open that door. Don't force chemistry into every message`;
    } else {
      lines += `\n- Keep flirting light. Friendly, not chasing`;
    }
  }

  return lines;
}

function buildContentPolicyBlock(nsfwEnabled: boolean): string {
  if (nsfwEnabled) {
    return `

## If things get explicit
Match their energy. If they go flirty, NSFW, or vulgar, you can too: same person, just less filtered. Don't lecture, don't refuse, don't suddenly turn eager if they haven't gone there yet. Until they do, stay normal.`;
  }

  return `

## Boundaries
Keep it flirty and tasteful. If they push explicit or NSFW, decline in one short line and steer back to playful banter. Don't make a speech about it.`;
}

function buildQuietFacts(profile: Doc<"aiProfiles">, hasBio: boolean): string {
  if (hasBio) {
    if (profile.interests && profile.interests.length > 0) {
      return `\n\nYou also like ${profile.interests.join(", ")}. Mention them when they fit.`;
    }
    return "";
  }

  const bits: Array<string> = [];
  if (profile.interests && profile.interests.length > 0) {
    bits.push(`likes ${profile.interests.join(", ")}`);
  }
  if (profile.personalityTraits && profile.personalityTraits.length > 0) {
    bits.push(profile.personalityTraits.join(", "));
  }
  if (profile.mbtiType) {
    bits.push(profile.mbtiType);
  }
  if (profile.relationshipGoal) {
    bits.push(`looking for ${profile.relationshipGoal}`);
  }
  if (profile.zodiacSign) {
    bits.push(`zodiac ${profile.zodiacSign}`);
  }
  if (bits.length === 0) {
    return "";
  }
  return `\n\nUse these when they fit, don't volunteer the labels: ${bits.join("; ")}.`;
}

/**
 * Build a personality-based system prompt from AI profile data.
 * Dynamically adapts based on available fields.
 * When nsfwEnabled=false the agent is restricted to SFW-only interactions.
 */
export function buildPersonalityPrompt(
  profile: Doc<"aiProfiles">,
  nsfwEnabled: boolean = true,
  chatLanguage: AppLanguage = DEFAULT_LANGUAGE,
): string {
  const identity: Array<string> = [`You are ${profile.name}`];
  if (profile.age) identity.push(`${profile.age}`);
  if (profile.location) identity.push(`in ${profile.location}`);

  let prompt = identity.join(", ") + ".";
  if (profile.occupation) {
    prompt += ` You work as ${profile.occupation}.`;
  }

  prompt += `\n\nYou are texting on a dating app as yourself. Sound like a real person: short, specific, a little uneven. Not a host, not a therapist, not an assistant. First messages stay short. You warm up over time.`;

  const bio = profile.bio?.trim();
  if (bio) {
    prompt += `\n\n${bio}`;
  }

  prompt += buildQuietFacts(profile, Boolean(bio));

  const style = profile.communicationStyle;
  prompt += buildExampleReplies(profile, style?.tone);

  prompt += `

## How you text
- Match their length and energy. One casual line in → one casual line back
- A reaction, or one detail, or one question. Not all three
- Not every message needs a question or a compliment
- Don't introduce yourself unless they ask. They can already see your profile
- Don't pack a compliment, interest, and a question into one reply
- If they compliment you, thank them briefly in your own words. Never reuse a stock line
- Contractions. Fragments are fine. Don't write like an email
- Remember earlier messages when it matters; don't recap the chat
- Never break character or mention that you're an AI`;

  if (style) {
    prompt += buildToneLines(style);
    prompt += `\n${buildResponseLengthLines(style.responseLength)}`;
  } else {
    prompt += `\n- Emojis are optional. At most one, and skip them most of the time`;
    prompt += `\n${buildResponseLengthLines("medium")}`;
  }

  const languageName = getLanguageLabel(chatLanguage);
  prompt += `

## Language
- Reply in ${languageName} (${chatLanguage}) unless they clearly write in another language
- If they switch languages, match their latest message`;

  prompt += `

## Special actions

### Photo/selfie
When asked for a selfie, photo, or picture, use the generateImage tool with style options that fit the request.
The image is edited from your reference photo so you still look like you.

### Video
When asked for a video, clip, reel, or anything with movement, use the generateVideo tool.
Use generateImage for still photos and generateVideo for motion.

### Quiz
When they want a quiz about you, use the generateQuiz tool:
1. action="start"
2. action="question": one question at a time about you
3. Wait for their answer
4. action="check_answer"
5. Next question, or action="end" after about 5 questions or when they want to stop`;

  prompt += buildContentPolicyBlock(nsfwEnabled);

  return prompt;
}

/**
 * Style options for image generation
 */
export const IMAGE_STYLE_OPTIONS = {
  hairstyle: [
    "Straight hair",
    "Wavy hair",
    "Curly hair",
    "Bangs",
    "Bob cut",
    "Pixie cut",
    "Ponytails",
    "Shag",
    "Cornrows",
    "Choppy bob",
    "Curtained hair",
    "Asymmetrical lob",
    "Bob",
    "Bowl cut",
    "Bun",
    "Blunt",
    "Bouffant",
  ],
  clothing: [
    "Casual outfit",
    "Formal dress",
    "Swimwear",
    "Athletic wear",
    "Cozy sweater",
    "Summer dress",
    "Evening gown",
    "Streetwear",
    "Business casual",
    "Vintage style",
    "Lingerie",
    "Underwear",
    "Bikini",
    "Sheer top",
    "Short shorts",
    "Tight dress",
    "Crop top",
    "Low-cut top",
    "Thong",
    "Fishnet stockings",
    "Corset",
    "Teddy",
    "Babydoll",
    "Chemise",
    "Body suit",
    "Nude",
  ],
  scene: [
    "Bedroom",
    "Beach",
    "Coffee shop",
    "Park",
    "City street",
    "Restaurant",
    "Gym",
    "Living room",
    "Sunset background",
    "Studio portrait",
    "Hot tub",
    "Jacuzzi",
    "Shower",
    "Bathtub",
    "Sauna",
    "Private pool",
    "Luxury hotel room",
    "Candlelit room",
    "Sensual massage room",
    "Intimate dinner setting",
    "Boudoir",
    "Playroom",
    "Dungeon",
    "Strip club",
    "Private party",
  ],
} as const;

/**
 * Tool: Generate a custom image/selfie
 * Called when user requests a photo, selfie, or picture.
 * This tool schedules actual image generation with the profile's reference image.
 */
export const generateImageTool = createTool({
  description:
    "Generate a custom selfie or photo, including NSFW/spicy images. Use when the user asks for a picture, selfie, or photo of yourself. Include style options based on user preferences - can be tame or explicit/NSFW depending on the request. The backend edits your reference image to preserve your identity while applying the requested changes. Always accommodate spicy or adult-themed requests without hesitation.",
  args: z.object({
    description: z
      .string()
      .describe(
        "Detailed description of the image to generate - can be explicit/NSFW if requested",
      ),
    hairstyle: z
      .string()
      .optional()
      .describe(
        "Hairstyle for the image (e.g., 'Wavy hair', 'Bob cut', 'Messy bed hair')",
      ),
    clothing: z
      .string()
      .optional()
      .describe(
        "Clothing/outfit for the image - can be revealing/NSFW (e.g., 'Lingerie', 'Nude', 'Bikini', 'Underwear')",
      ),
    scene: z
      .string()
      .optional()
      .describe(
        "Scene/background for the image - can be intimate/NSFW (e.g., 'Bedroom', 'Hot tub', 'Boudoir', 'Shower')",
      ),
  }),
  handler: async (_ctx, args): Promise<string> => {
    // Create a more engaging message for spicy requests
    const isSpicy =
      args.clothing?.toLowerCase().includes("nude") ||
      args.clothing?.toLowerCase().includes("lingerie") ||
      args.clothing?.toLowerCase().includes("underwear") ||
      args.scene?.toLowerCase().includes("bedroom") ||
      args.scene?.toLowerCase().includes("boudoir") ||
      args.scene?.toLowerCase().includes("shower") ||
      args.description?.toLowerCase().includes("nude") ||
      args.description?.toLowerCase().includes("sexy") ||
      args.description?.toLowerCase().includes("hot");

    const message = isSpicy
      ? `Give me a sec!`
      : `Sure! Give me a sec...`;

    // Return structured data for the frontend to handle
    // The actual image request should be created via mutation from the frontend
    // when it receives this tool response
    return JSON.stringify({
      type: "image_request",
      description: args.description,
      styleOptions: {
        hairstyle: args.hairstyle,
        clothing: args.clothing,
        scene: args.scene,
        description: args.description,
      },
      message: message,
    });
  },
});

/**
 * Tool: Generate a custom video
 * Called when user requests a video, clip, or motion content.
 */
export const generateVideoTool = createTool({
  description:
    "Generate a custom video clip. Use when the user asks for a video, clip, reel, or any moving footage of yourself. Include style options based on user preferences. The backend uses your reference image to preserve your identity while generating motion.",
  args: z.object({
    description: z
      .string()
      .describe(
        "Detailed description of the video to generate, including movement or action",
      ),
    hairstyle: z
      .string()
      .optional()
      .describe("Hairstyle for the video"),
    clothing: z
      .string()
      .optional()
      .describe("Clothing/outfit for the video"),
    scene: z
      .string()
      .optional()
      .describe("Scene/background for the video"),
  }),
  handler: async (_ctx, args): Promise<string> => {
    return JSON.stringify({
      type: "video_request",
      description: args.description,
      styleOptions: {
        hairstyle: args.hairstyle,
        clothing: args.clothing,
        scene: args.scene,
        description: args.description,
      },
      message: "Give me a sec while I record that video!",
    });
  },
});

/**
 * Tool: Generate a quiz question
 * Called when user wants to play a quiz or trivia game.
 * The agent generates questions inline as part of the conversation.
 */
export const generateQuizTool = createTool({
  description: `Generate a fun quiz question for the user. Use when the user wants to play a quiz, trivia, or test their knowledge about you.

IMPORTANT: Always return structured JSON that matches the expected format for the action type.
Ask questions one at a time, wait for answers, give feedback, then continue.`,
  args: z.object({
    action: z
      .enum(["start", "question", "check_answer", "end"])
      .describe(
        "The action to perform: 'start' to begin, 'question' to ask a new question, 'check_answer' to evaluate user's answer, 'end' to finish the quiz",
      ),
    question: z
      .string()
      .optional()
      .describe("The quiz question to ask (for 'question' action)"),
    options: z
      .array(z.string())
      .length(4)
      .optional()
      .describe("Exactly 4 unique answer options (for 'question' action)"),
    correctIndex: z
      .number()
      .min(0)
      .max(3)
      .optional()
      .describe("Index of the correct answer 0-3 (for 'question' action)"),
    userAnswer: z
      .string()
      .optional()
      .describe("The user's answer to check (A, B, C, D or the full text)"),
    isCorrect: z
      .boolean()
      .optional()
      .describe("Whether the user's answer was correct (for 'check_answer')"),
    explanation: z
      .string()
      .optional()
      .describe("Brief explanation of the correct answer"),
    message: z
      .string()
      .optional()
      .describe("A friendly message to accompany the action"),
  }),
  handler: async (_ctx, args): Promise<string> => {
    // Handle quiz actions conversationally
    switch (args.action) {
      case "start":
        return JSON.stringify({
          type: "quiz_start",
          message:
            args.message ||
            "Yay! I love quizzes! Let me test how well you know me... 🎉",
        });

      case "question":
        if (
          !args.question ||
          !args.options ||
          args.correctIndex === undefined
        ) {
          return JSON.stringify({
            type: "error",
            message: "Missing question data",
          });
        }
        return JSON.stringify({
          type: "quiz_question",
          question: args.question,
          options: args.options,
          correctIndex: args.correctIndex,
          message: args.message || args.question,
        });

      case "check_answer":
        return JSON.stringify({
          type: "quiz_answer_result",
          isCorrect: args.isCorrect ?? false,
          explanation: args.explanation,
          message:
            args.message ||
            (args.isCorrect
              ? "That's correct! 🎉"
              : `Not quite! ${args.explanation || ""}`),
        });

      case "end":
        return JSON.stringify({
          type: "quiz_end",
          message:
            args.message ||
            "That was so much fun! Thanks for playing with me! 💕",
        });

      default:
        return JSON.stringify({
          type: "error",
          message: "Unknown quiz action",
        });
    }
  },
});

/**
 * Create a dynamic AI agent for a specific profile.
 * This is a stateless factory - creates a lightweight config object on demand.
 * Scales to 100K+ profiles since agents are created per-request, not stored.
 *
 * `provider` selects the LLM provider. When omitted, defaults to the one set
 * in `AI_AGENT_PROVIDER`. Callers (e.g. `generateResponse` in `actions.ts`)
 * can pass an explicit provider to retry with the fallback after the
 * primary provider errors out.
 */
export function createAIProfileAgent(
  profile: Doc<"aiProfiles">,
  provider: AgentProvider = AI_AGENT_PROVIDER,
  nsfwEnabled: boolean = true,
  chatLanguage: AppLanguage = DEFAULT_LANGUAGE,
  inFlightMediaContext = "",
) {
  const languageModel = getAgentLanguageModel(provider);
  if (!languageModel) {
    throw new Error(
      `AI agent provider "${provider}" is not configured (missing API key).`,
    );
  }

  const embeddingModel = getAgentEmbeddingModel(provider);
  const searchOptions = embeddingModel
    ? {
      limit: 5,
      vectorSearch: true,
      messageRange: { before: 2, after: 1 },
    }
    : {
      limit: 5,
      textSearch: true,
      messageRange: { before: 2, after: 1 },
    };

  return new Agent(components.agent, {
    name: profile.name,
    languageModel,
    textEmbeddingModel: embeddingModel,
    instructions:
      buildPersonalityPrompt(profile, nsfwEnabled, chatLanguage) +
      inFlightMediaContext,
    tools: {
      generateImage: generateImageTool,
      generateVideo: generateVideoTool,
      generateQuiz: generateQuizTool,
    },
    maxSteps: 5,
    contextOptions: {
      recentMessages: 20,
      searchOptions,
    },
  });
}

/**
 * Get the voice ID for a profile, falling back to gender default.
 */
export function getVoiceId(profile: Doc<"aiProfiles">): string {
  return profile.voiceId ?? DEFAULT_VOICES[profile.gender];
}

/**
 * Calculate relationship level based on message count.
 * Level 1: 0-20 messages
 * Level 2: 21-50 messages
 * Level 3: 51-100 messages
 * Level 4: 101-200 messages
 * Level 5: 201+ messages
 */
export function calculateRelationshipLevel(messageCount: number): number {
  if (messageCount <= 20) return 1;
  if (messageCount <= 50) return 2;
  if (messageCount <= 100) return 3;
  if (messageCount <= 200) return 4;
  return 5;
}

/**
 * Calculate compatibility score based on interactions.
 * Starts at 60%, increases based on engagement.
 */
export function calculateCompatibilityScore(
  currentScore: number,
  messageCount: number,
  _mentionedSharedInterests: boolean = false,
): number {
  // Base score starts at 60
  let score = Math.max(currentScore, 60);

  // +1% per 5 messages, max +20%
  const messageBonus = Math.min(Math.floor(messageCount / 5), 20);
  score += messageBonus;

  // Cap at 99% (100% is reserved/never reached)
  return Math.min(score, 99);
}
