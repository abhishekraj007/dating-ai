"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Menu, Sparkles } from "lucide-react";
import { PublicBillingActions } from "@/components/public/public-billing-actions";
import { Button } from "@/components/ui/button";
import {
  PUBLIC_SEGMENTS,
  genderPreferenceFromSegment,
  segmentFromPathname,
} from "@/lib/public-segments";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/public/sidebar-context";
import { useDiscoverPreferences } from "@/hooks/use-discover-preferences";
import Image from "next/image";

export function PublicHeader() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const isSegmentRoute = pathname === "/" || pathname.startsWith("/ai-");
  const isChatRoute = pathname.startsWith("/chat");
  const showSegmentSwitch = isSegmentRoute && !isChatRoute;
  const { preferredSegment, setGenderPreference } = useDiscoverPreferences();
  const activeSegment =
    pathname === "/" ? preferredSegment : segmentFromPathname(pathname);
  const { open } = useSidebar();

  const handleSegmentClick = (segment: string) => {
    const nextGenderPreference = genderPreferenceFromSegment(segment as any);

    if (nextGenderPreference) {
      void setGenderPreference(nextGenderPreference);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur md:hidden">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4">
        <div className="flex h-[60px] items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open navigation"
              onClick={open}
            >
              <Menu className="size-4" />
            </Button>

            <Link href="/" className="flex min-w-0 items-center gap-2">
              <Image src="/logo.png" alt="FeelAI logo" width={32} height={32} />
            </Link>
          </div>

          {showSegmentSwitch ? (
            <div className="flex justify-center pb-3">
              <nav
                className={cn(
                  "grid w-full max-w-[320px] gap-1 rounded-full border border-border/70 bg-card/70 p-1 shadow-[0_18px_30px_-24px_rgba(0,0,0,0.65)]",
                  Object.keys(PUBLIC_SEGMENTS).length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3",
                )}
              >
                {Object.entries(PUBLIC_SEGMENTS).map(([segment, tab]) => {
                  const isActive = segment === activeSegment;

                  return (
                    <Button
                      key={segment}
                      asChild
                      size="xs"
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "h-8 rounded-full px-2 text-xs font-medium",
                        !isActive && "text-muted-foreground",
                      )}
                    >
                      <Link
                        href={tab.href}
                        onClick={() => handleSegmentClick(segment)}
                      >
                        {tab.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>
            </div>
          ) : null}

          {!isLoading && isAuthenticated ? (
            <div className="flex shrink-0 items-center">
              <PublicBillingActions variant="header" />
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </header>
  );
}
