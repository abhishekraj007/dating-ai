"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { CREDITS_PRICING } from "@dating-ai/backend/convex/features/credits/pricing";
import { isPremiumRequiredError } from "@dating-ai/backend/convex/features/premium/errors";

export { isPremiumRequiredError };

export type ChatBillingBlockReason = "premium" | "credits";

export function useChatBillingGate() {
  const userData = useQuery(api.user.fetchUserAndProfile);

  const credits = userData?.profile?.credits ?? 0;
  const isPremium = Boolean(userData?.profile?.isPremium);
  const hasCreditsForChat = credits >= CREDITS_PRICING.TEXT_MESSAGE;

  const startChatBlockReason = (): ChatBillingBlockReason | null => {
    if (!isPremium) {
      return "premium";
    }

    return null;
  };

  const sendMessageBlockReason = (): ChatBillingBlockReason | null => {
    if (!isPremium) {
      return "premium";
    }

    if (!hasCreditsForChat) {
      return "credits";
    }

    return null;
  };

  const canStartChat = () => startChatBlockReason() === null;
  const canSendMessage = () => sendMessageBlockReason() === null;

  return {
    credits,
    isPremium,
    hasCreditsForChat,
    canStartChat,
    canSendMessage,
    startChatBlockReason,
    sendMessageBlockReason,
  };
}
