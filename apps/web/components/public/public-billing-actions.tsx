"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Coins, Crown } from "lucide-react";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { CreditsModal } from "@/components/credits-modal";
import { PremiumSubscriptionModal } from "@/components/premium-subscription-modal";
import { SidebarRailItem } from "@/components/public/sidebar-flyout-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/public/sidebar-context";

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
  const { isCollapsed } = useSidebar();

  const isSidebar = variant === "sidebar";
  const collapsed = isSidebar && isCollapsed;
  const credits = userData?.profile?.credits ?? 0;
  const isPremium = Boolean(userData?.profile?.isPremium);

  if (isLoading) {
    return null;
  }

  const actionsClassName = isSidebar
    ? cn("flex flex-col gap-2", collapsed && "items-center")
    : "flex items-center gap-1.5";

  const creditsButtonClassName = isSidebar
    ? cn(
        "h-11 w-full justify-between rounded-3xl cursor-pointer",
        collapsed &&
          "size-11 rounded-full p-0 justify-center transition-transform duration-200 hover:scale-[1.04]",
      )
    : "h-9 rounded-full px-2.5 text-xs font-medium shadow-[0_12px_24px_-24px_rgba(0,0,0,0.55)] cursor-pointer";

  const premiumButtonClassName = isSidebar
    ? cn(
        "h-11 w-full justify-between rounded-3xl border border-[#d6b061] bg-[linear-gradient(135deg,#f7e29b_0%,#d8a53b_55%,#b97a16_100%)] text-[#2c1800] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_16px_30px_-20px_rgba(216,165,59,0.95)] hover:brightness-[1.04] cursor-pointer",
        collapsed &&
          "size-11 rounded-full p-0 justify-center transition-transform duration-200 hover:scale-[1.04]",
      )
    : "h-9 rounded-full border border-[#d6b061] bg-[linear-gradient(135deg,#f7e29b_0%,#d8a53b_55%,#b97a16_100%)] px-2.5 text-xs font-semibold text-[#2c1800] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_16px_30px_-20px_rgba(216,165,59,0.95)] hover:brightness-[1.04] cursor-pointer";

  const creditsLabel = collapsed
    ? `Buy credits · ${credits.toLocaleString()}`
    : "Buy credits";

  return (
    <>
      <div className={cn(actionsClassName, className)}>
        {isAuthenticated ? (
          <SidebarRailItem showLabel={collapsed} label={creditsLabel}>
            <Button
              variant="outline"
              aria-label={creditsLabel}
              onClick={() => setIsCreditsOpen(true)}
              className={creditsButtonClassName}
            >
              <span className={cn("flex items-center", isSidebar && "gap-2")}>
                <Coins className="h-4 w-4" />
                {collapsed ? null : (
                  <span>{isSidebar ? "Buy credits" : ""}</span>
                )}
              </span>
              {collapsed ? null : (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium tabular-nums text-foreground">
                  {credits}
                </span>
              )}
            </Button>
          </SidebarRailItem>
        ) : (
          <SidebarRailItem showLabel={collapsed} label="Buy credits">
            <OpenAuthModalButton
              variant="outline"
              aria-label="Buy credits"
              className={creditsButtonClassName}
            >
              <span className={cn("flex items-center", isSidebar && "gap-2")}>
                <Coins className="h-4 w-4" />
                {collapsed ? null : (
                  <span>{isSidebar ? "Buy credits" : ""}</span>
                )}
              </span>
            </OpenAuthModalButton>
          </SidebarRailItem>
        )}

        {!isPremium ? (
          isAuthenticated ? (
            <SidebarRailItem showLabel={collapsed} label="Go premium">
              <Button
                aria-label="Go premium"
                onClick={() => setIsPremiumOpen(true)}
                className={premiumButtonClassName}
              >
                <span className={cn("flex items-center", isSidebar && "gap-2")}>
                  <Crown className="h-4 w-4" />
                  {collapsed ? null : (
                    <span>{isSidebar ? "Go premium" : ""}</span>
                  )}
                </span>
              </Button>
            </SidebarRailItem>
          ) : (
            <SidebarRailItem showLabel={collapsed} label="Go premium">
              <OpenAuthModalButton
                aria-label="Go premium"
                className={premiumButtonClassName}
              >
                <span className={cn("flex items-center", isSidebar && "gap-2")}>
                  <Crown className="h-4 w-4" />
                  {collapsed ? null : (
                    <span>{isSidebar ? "Go premium" : ""}</span>
                  )}
                </span>
              </OpenAuthModalButton>
            </SidebarRailItem>
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
