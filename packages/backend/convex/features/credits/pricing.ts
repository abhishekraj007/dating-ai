/**
 * Dating AI App - Credits Pricing
 */

export const CREDITS_PRICING = {
  // Chat features
  TEXT_MESSAGE: 1,
  VOICE_MESSAGE: 2,
  QUIZ_INTERACTION: 1,
  TOPIC_INTERACTION: 1,

  // Image generation
  CUSTOM_SELFIE: 5,
  CUSTOM_VIDEO: 200,
  AI_CHARACTER_CREATION: 10, // For generating profile images

  // Free tier limits
  FREE_TRIAL_CREDITS: 0, // Credits given to new users
  ONBOARDING_FREE_MESSAGES: 2, // First onboarding chat is not charged
} as const;

export type CreditAction = keyof typeof CREDITS_PRICING;

