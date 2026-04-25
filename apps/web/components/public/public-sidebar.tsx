"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Sparkles, SunMoon, X } from "lucide-react";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { PublicBillingActions } from "@/components/public/public-billing-actions";
import { PublicHeaderAccountMenu } from "@/components/public/public-header-account-menu";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  PUBLIC_SEGMENTS,
  genderPreferenceFromSegment,
  segmentFromPathname,
} from "@/lib/public-segments";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/public/sidebar-context";
import { useDiscoverPreferences } from "@/hooks/use-discover-preferences";
import { useConvexAuth } from "convex/react";
import Image from "next/image";

const primaryItems = [
  { label: "Home", href: "/", icon: Home },
  // {
  //   label: "Discover",
  //   href: "/explore",
  //   icon: Compass,
  //   requiresAuth: true,
  //   returnTo: "/explore",
  // },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircle,
    requiresAuth: true,
    returnTo: "/chat",
  },
  // {
  //   label: "Create Character",
  //   href: "/explore",
  //   icon: WandSparkles,
  //   requiresAuth: true,
  //   returnTo: "/explore",
  // },
  // {
  //   label: "Premium",
  //   href: "/explore",
  //   icon: Crown,
  //   requiresAuth: true,
  //   returnTo: "/explore",
  // },
];

export function PublicSidebar() {
  const pathname = usePathname();
  const { preferredSegment, setGenderPreference } = useDiscoverPreferences();
  const activeSegment =
    pathname === "/" ? preferredSegment : segmentFromPathname(pathname);
  const { isOpen, close } = useSidebar();

  const { isAuthenticated, isLoading } = useConvexAuth();

  const handleSegmentClick = (segment: string) => {
    const nextGenderPreference = genderPreferenceFromSegment(segment as any);

    if (nextGenderPreference) {
      void setGenderPreference(nextGenderPreference);
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] flex-col border-r border-border/70 bg-sidebar/95 backdrop-blur",
          "md:sticky md:top-0 md:z-auto md:flex md:h-screen md:w-72 md:flex-shrink-0",
          isOpen ? "flex" : "hidden md:flex",
        )}
      >
        <div className="border-b border-border/70 px-5 py-2">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3" onClick={close}>
              <Image
                src="/logo.png"
                alt="FeelAI logo"
                width={64}
                height={64}
                objectFit="contain"
              />
              <span className="text-lg font-bold italic">FEELAI</span>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={close}
              aria-label="Close menu"
              className="md:hidden"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-4">
          <div className="space-y-1">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              if (item.requiresAuth) {
                return (
                  <OpenAuthModalButton
                    key={item.label}
                    className={cn(
                      "w-full justify-start gap-2.5 rounded-3xl px-4 py-6 text-base cursor-pointer",
                      isActive &&
                        "bg-primary text-primary-foreground hover:bg-primary/85",
                    )}
                    onClick={close}
                    returnTo={item.returnTo}
                    variant={isActive ? "default" : "ghost"}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </OpenAuthModalButton>
                );
              }

              return (
                <Button
                  key={item.label}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-2.5 rounded-3xl px-4 py-6 text-base cursor-pointer"
                  onClick={close}
                >
                  <Link href={item.href}>
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>

          {!isLoading && isAuthenticated ? (
            <div className="mt-5">
              <PublicBillingActions variant="sidebar" />
            </div>
          ) : null}

          <div className="mt-auto space-y-4 pt-6">
            <div className="flex items-center justify-between rounded-4xl border border-border/70 bg-card/60 px-4 py-2.5 shadow-[0_14px_24px_-24px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SunMoon className="h-4 w-4" />
                <span>Theme</span>
              </div>
              <ThemeToggle />
            </div>

            <div className="hidden border-t border-border/70 pt-4 md:block">
              <PublicHeaderAccountMenu placement="sidebar" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
