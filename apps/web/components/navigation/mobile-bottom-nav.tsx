"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Home, MessageCircle, UserRound } from "lucide-react";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { cn } from "@/lib/utils";

const mobileTabs = [
  {
    label: "Home" as const,
    href: "/",
    icon: Home,
    protected: false,
    matches: (pathname: string) => pathname === "/" || pathname.startsWith("/ai-"),
  },
  {
    label: "Chat" as const,
    href: "/chat",
    icon: MessageCircle,
    protected: true,
    matches: (pathname: string) => pathname.startsWith("/chat"),
  },
  {
    label: "Account" as const,
    href: "/settings",
    icon: UserRound,
    protected: true,
    matches: (pathname: string) => pathname.startsWith("/settings"),
  },
];

function itemClassName(isActive: boolean) {
  return cn(
    "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[1.35rem] px-3 py-2 text-[11px] font-medium transition-[transform,background-color,color,box-shadow] active:scale-[0.96]",
    isActive
      ? "bg-primary/12 text-primary shadow-[0_14px_28px_-24px_rgba(0,0,0,0.75)]"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.matches(pathname);

          if (tab.protected && !isAuthenticated) {
            return (
              <OpenAuthModalButton
                key={tab.label}
                returnTo={tab.href}
                variant="ghost"
                className={itemClassName(isActive)}
              >
                <Icon className="size-5" />
                <span>{tab.label}</span>
              </OpenAuthModalButton>
            );
          }

          return (
            <Link key={tab.label} href={tab.href} className={itemClassName(isActive)}>
              <Icon className="size-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
