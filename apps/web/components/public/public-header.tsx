"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { PublicBillingActions } from "@/components/public/public-billing-actions";
import { Button } from "@/components/ui/button";
import { PUBLIC_SEGMENTS, segmentFromPathname } from "@/lib/public-segments";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/public/sidebar-context";

export function PublicHeader() {
  const pathname = usePathname();
  const isSegmentRoute = pathname === "/" || pathname.startsWith("/ai-");
  const isChatRoute = pathname.startsWith("/chat");
  const showSegmentSwitch = isSegmentRoute && !isChatRoute;
  const activeSegment = segmentFromPathname(pathname);
  const { open } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur md:hidden">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4">
        <div className="flex h-[60px] items-center gap-2">
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
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_24px_-20px_rgba(0,0,0,0.55)]">
                <Sparkles className="size-4" />
              </span>
              <span
                className={cn(
                  "truncate text-base font-semibold tracking-tight",
                  showSegmentSwitch && "hidden min-[400px]:inline",
                )}
              >
                FeelAI
              </span>
            </Link>
          </div>

          <div className="ml-auto flex shrink-0 items-center">
            <PublicBillingActions variant="header" />
          </div>
        </div>

        {showSegmentSwitch ? (
          <div className="flex justify-center pb-3">
            <nav className="grid w-full max-w-[320px] grid-cols-3 gap-1 rounded-full border border-border/70 bg-card/70 p-1 shadow-[0_18px_30px_-24px_rgba(0,0,0,0.65)]">
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
                    <Link href={tab.href}>{tab.label}</Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
