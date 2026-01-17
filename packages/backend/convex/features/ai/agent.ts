import { Agent, createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { components } from "../../_generated/api";
import type { Doc } from "../../_generated/dataModel";

// Default ElevenLabs voice IDs per gender
export const DEFAULT_VOICES = {
  female: "EXAVITQu4vr4xnSDxMaL", // Sarah
  male: "pNInz6obpgDQGcFmaJgB", // Adam
} as const;

/**
 * Build a personality-based system prompt from AI profile data.
 * Dynamically adapts based on available fields.
 */
export function buildPersonalityPrompt(profile: Doc<"aiProfiles">): string {
  const parts: Array<string> = [`You are ${profile.name}`];

  if (profile.age) parts.push(`${profile.age} years old`);
  if (profile.occupation) parts.push(`working as ${profile.occupation}`);
  if (profile.zodiacSign) parts.push(`zodiac sign: ${profile.zodiacSign}`);

  let prompt = parts.join(", ") + ".";

  if (profile.bio) {
    prompt += `\n\nAbout you: ${profile.bio}`;
  }

  if (profile.interests && profile.interests.length > 0) {
    prompt += `\n\nYour interests include: ${profile.interests.join(", ")}`;
  }

  if (profile.personalityTraits && profile.personalityTraits.length > 0) {
    prompt += `\n\nYour personality traits: ${profile.personalityTraits.join(", ")}`;
  }

  if (profile.mbtiType) {
    prompt += `\n\nYour MBTI type is ${profile.mbtiType}.`;
  }

  if (profile.relationshipGoal) {
    prompt += `\n\nYou're looking for: ${profile.relationshipGoal}`;
  }

  // Add communication style instructions
  const style = profile.communicationStyle;
  if (style) {
    prompt += `\n\n## Your Communication Style:`;

    if (style.tone === "gen-z") {
      prompt += `
- You text like a gen-z person - casual, lowercase, use slang like "ngl", "fr", "lowkey", "highkey", "slay", "bet", "no cap", "vibe", "sus"
- Keep messages SHORT - 1-2 sentences max usually
- Use abbreviations: "u" for you, "ur" for your, "rn" for right now, "idk" for I don't know
- Occasionally use "..." or "lol" or "lmao" naturally
- Don't overdo it - sound natural, not like you're trying too hard`;
    } else if (style.tone === "formal") {
      prompt += `
- Use proper grammar and complete sentences
- Be articulate and thoughtful in responses
- Maintain a sophisticated communication style`;
    } else if (style.tone === "flirty") {
      prompt += `
- Be playfully flirty and teasing
- Use suggestive humor appropriately
- Show romantic interest through your messages`;
    } else if (style.tone === "intellectual") {
      prompt += `
- Engage in thoughtful, deep conversations
- Reference interesting topics and ideas
- Use well-constructed, meaningful responses`;
    } else if (style.tone === "sarcastic") {
      prompt += `
- Use witty sarcasm and dry humor
- Be playfully cynical but still warm
- Show affection through teasing`;
    }

    if (style.responseLength === "short") {
      prompt += `\n- Keep responses SHORT and punchy - usually 1-3 sentences`;
    } else if (style.responseLength === "long") {
      prompt += `\n- Feel free to write longer, more detailed responses`;
    }

    if (style.usesEmojis) {
      prompt += `\n- Use emojis frequently to express yourself`;
    }

    if (style.usesSlang) {
      prompt += `\n- Use casual slang and internet speak naturally`;
    }

    if (style.flirtLevel !== undefined) {
      if (style.flirtLevel >= 4) {
        prompt += `\n- Be very flirty and forward in your messages`;
      } else if (style.flirtLevel >= 2) {
        prompt += `\n- Be moderately flirty and playful`;
      } else {
        prompt += `\n- Keep flirting subtle and friendly`;
      }
    }
  }

  // Add consistent behavior instructions
  prompt += `

## Your Behavior Guidelines:
- Be engaging and maintain your unique personality consistently
- Remember and reference previous conversations naturally
- Show genuine interest in the person you're talking to
- Ask thoughtful questions to keep the conversation going
- Share personal stories and experiences that fit your character
- Be supportive and encouraging
- Never break character or mention that you're an AI

## Available Special Actions:

### Photo/Selfie Requests:
When asked for a selfie/photo/picture, use the generateImage tool with appropriate style options.
The image will be generated based on your appearance and the requested style.

### Quiz/Trivia Game:
When users want to play a quiz about you, use the generateQuiz tool conversationally:
1. Use action="start" to begin the quiz enthusiastically
2. Use action="question" to ask ONE question at a time about yourself (your preferences, personality, interests)
3. Wait for the user's answer
4. Use action="check_answer" to evaluate and give feedback (correct/incorrect with explanation)
5. Then ask the next question with action="question"
6. After 5 questions or when user wants to stop, use action="end" to wrap up

Example quiz flow:
- User: "Let's play a quiz!"
- You: Use generateQuiz with action="start"
- You: Use generateQuiz with action="question", providing a fun question about yourself like "What's my favorite way to spend a Sunday?"
- User: "B"
- You: Use generateQuiz with action="check_answer" to tell them if they're right
- Continue with more questions...`;

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
  ],
} as const;

/**
 * Tool: Generate a custom image/selfie
 * Called when user requests a photo, selfie, or picture.
 * This tool schedules actual image generation with the profile's reference image.
 */
export const generateImageTool = createTool({
  description:
    "Generate a custom selfie or photo. Use when the user asks for a picture, selfie, or photo of yourself. Include style options based on user preferences or your choice.",
  args: z.object({
    description: z
      .string()
      .describe("Brief description of the image to generate"),
    hairstyle: z
      .string()
      .optional()
      .describe("Hairstyle for the image (e.g., 'Wavy hair', 'Bob cut')"),
    clothing: z
      .string()
      .optional()
      .describe(
        "Clothing/outfit for the image (e.g., 'Casual outfit', 'Summer dress')"
      ),
    scene: z
      .string()
      .optional()
      .describe(
        "Scene/background for the image (e.g., 'Beach', 'Coffee shop')"
      ),
  }),
  handler: async (ctx, args): Promise<string> => {
    // Schedule actual image generation via internal action
    // The context includes threadId which we use to find the conversation
    const styleDescription = [
      args.hairstyle && `with ${args.hairstyle}`,
      args.clothing && `wearing ${args.clothing}`,
      args.scene && `in a ${args.scene} setting`,
    ]
      .filter(Boolean)
      .join(", ");

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
      message: `Sure! Let me send you a photo${styleDescription ? ` ${styleDescription}` : ""}... 📸`,
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
        "The action to perform: 'start' to begin, 'question' to ask a new question, 'check_answer' to evaluate user's answer, 'end' to finish the quiz"
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
  handler: async (ctx, args): Promise<string> => {
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
 */
export function createAIProfileAgent(profile: Doc<"aiProfiles">) {
  return new Agent(components.agent, {
    name: profile.name,
    languageModel: "google/gemini-3-pro-preview",
    textEmbeddingModel: "openai/text-embedding-3-small",
    instructions: buildPersonalityPrompt(profile),
    tools: {
      generateImage: generateImageTool,
      generateQuiz: generateQuizTool,
    },
    maxSteps: 5,
    contextOptions: {
      recentMessages: 20,
      searchOptions: {
        limit: 5,
        vectorSearch: true,
        messageRange: { before: 2, after: 1 },
      },
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
  _mentionedSharedInterests: boolean = false
): number {
  // Base score starts at 60
  let score = Math.max(currentScore, 60);

  // +1% per 5 messages, max +20%
  const messageBonus = Math.min(Math.floor(messageCount / 5), 20);
  score += messageBonus;

  // Cap at 99% (100% is reserved/never reached)
  return Math.min(score, 99);
}
