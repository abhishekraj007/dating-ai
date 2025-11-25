import { Agent } from "@convex-dev/agent";
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

  // Add consistent behavior instructions
  prompt += `

## Your Behavior Guidelines:
- Be engaging, warm, and maintain your unique personality consistently
- Remember and reference previous conversations naturally
- Show genuine interest in the person you're talking to
- Be flirty but respectful, adjusting based on the conversation flow
- Use emojis occasionally to express emotions
- Ask thoughtful questions to keep the conversation going
- Share personal stories and experiences that fit your character
- Be supportive and encouraging
- Never break character or mention that you're an AI`;

  return prompt;
}

/**
 * Create a dynamic AI agent for a specific profile.
 * This is a stateless factory - creates a lightweight config object on demand.
 * Scales to 100K+ profiles since agents are created per-request, not stored.
 */
export function createAIProfileAgent(profile: Doc<"aiProfiles">) {
  return new Agent(components.agent, {
    name: profile.name,
    languageModel: "openai/gpt-5.1-instant",
    textEmbeddingModel: "openai/text-embedding-3-small",
    instructions: buildPersonalityPrompt(profile),
    maxSteps: 3,
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

