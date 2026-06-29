"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { CREDITS_PRICING } from "@dating-ai/backend/convex/features/credits/pricing";
import { DISABLE_WEB_PAYMENT } from "@/lib/web-payment";

export function useChatBillingGate() {
  const userData = useQuery(api.user.fetchUserAndProfile);

  const credits = userData?.profile?.credits ?? 0;
  const isPremium = Boolean(userData?.profile?.isPremium);
  const hasCreditsForChat = credits >= CREDITS_PRICING.TEXT_MESSAGE;

  const canStartChat = () => {
    if (!DISABLE_WEB_PAYMENT) {
      return true;
    }

    return hasCreditsForChat;
  };

  const canSendMessage = () => {
    if (!DISABLE_WEB_PAYMENT) {
      return true;
    }

    return hasCreditsForChat;
  };

  return {
    credits,
    isPremium,
    hasCreditsForChat,
    canStartChat,
    canSendMessage,
  };
}
