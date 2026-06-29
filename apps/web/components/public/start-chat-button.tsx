"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { CreditsModal } from "@/components/credits-modal";
import { PremiumSubscriptionModal } from "@/components/premium-subscription-modal";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useChatBillingGate } from "@/hooks/use-chat-billing-gate";
import { toast } from "sonner";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";

interface StartChatButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  aiProfileId: string;
}

export function StartChatButton({
  aiProfileId,
  children,
  ...props
}: StartChatButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { open } = useAuthModal();
  const startConversation = useMutation(
    api.features.ai.mutations.startConversation,
  );
  const {
    canStartChat,
  } = useChatBillingGate();
  const [isStarting, setIsStarting] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      open();
      return;
    }

    if (!canStartChat()) {
      setIsCreditsOpen(true);
      return;
    }

    setIsStarting(true);
    try {
      const conversationId = await startConversation({
        aiProfileId: aiProfileId as Id<"aiProfiles">,
      });
      router.push(`/chat/${conversationId}`);
    } catch {
      toast.error("Could not start a conversation right now.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <Button {...props} onClick={handleClick} disabled={isStarting}>
        {isStarting ? "Starting..." : children}
      </Button>
      <CreditsModal open={isCreditsOpen} onOpenChange={setIsCreditsOpen} />
    </>
  );
}
