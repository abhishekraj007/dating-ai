"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Coins, Crown } from "lucide-react";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { CreditsModal } from "@/components/credits-modal";
import { PremiumSubscriptionModal } from "@/components/premium-subscription-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicBillingActionsProps {
  variant: "header" | "sidebar";
  className?: string;
}

export function PublicBillingActions({
  variant,
  className,
}: PublicBillingActionsProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);

  const isSidebar = variant === "sidebar";
  const credits = userData?.profile?.credits ?? 0;
  const isPremium = Boolean(userData?.profile?.isPremium);

  if (isLoading) {
    return null;
  }

  const actionsClassName = isSidebar
    ? "flex flex-col gap-2"
    : "flex items-center gap-1.5";

  const creditsButtonClassName = isSidebar
    ? "h-11 w-full justify-between rounded-3xl"
    : "h-9 rounded-full px-2.5 text-xs font-medium shadow-[0_12px_24px_-24px_rgba(0,0,0,0.55)]";

  const premiumButtonClassName = isSidebar
    ? "h-11 w-full justify-between rounded-3xl"
    : "h-9 rounded-full px-2.5 text-xs font-medium shadow-[0_12px_24px_-24px_rgba(0,0,0,0.55)]";

  return (
    <>
      <div className={cn(actionsClassName, className)}>
        {isAuthenticated ? (
          <Button
            variant="outline"
            onClick={() => setIsCreditsOpen(true)}
            className={creditsButtonClassName}
          >
            <span className={cn("flex items-center", isSidebar && "gap-2")}>
              <Coins className="h-4 w-4" />
              <span>{isSidebar ? "Buy credits" : ""}</span>
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium tabular-nums text-foreground">
              {credits}
            </span>
          </Button>
        ) : (
          <OpenAuthModalButton
            variant="outline"
            className={creditsButtonClassName}
          >
            <span className={cn("flex items-center", isSidebar && "gap-2")}>
              <Coins className="h-4 w-4" />
              <span>{isSidebar ? "Buy credits" : ""}</span>
            </span>
          </OpenAuthModalButton>
        )}

        {!isPremium ? (
          isAuthenticated ? (
            <Button
              onClick={() => setIsPremiumOpen(true)}
              className={premiumButtonClassName}
            >
              <span className={cn("flex items-center", isSidebar && "gap-2")}>
                <Crown className="h-4 w-4" />
                <span>{isSidebar ? "Go premium" : ""}</span>
              </span>
            </Button>
          ) : (
            <OpenAuthModalButton className={premiumButtonClassName}>
              <span className={cn("flex items-center", isSidebar && "gap-2")}>
                <Crown className="h-4 w-4" />
                <span>{isSidebar ? "Go premium" : ""}</span>
              </span>
            </OpenAuthModalButton>
          )
        ) : null}
      </div>

      <CreditsModal open={isCreditsOpen} onOpenChange={setIsCreditsOpen} />
      <PremiumSubscriptionModal
        open={isPremiumOpen}
        onOpenChange={setIsPremiumOpen}
      />
    </>
  );
}
