"use client";

import Link from "next/link";
import {
  Compass,
  Crown,
  Home,
  MessageCircle,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/public/sidebar-context";

const primaryItems = [
  { label: "Home", href: "/", icon: Home, active: true },
  {
    label: "Discover",
    href: "/explore",
    icon: Compass,
    requiresAuth: true,
    returnTo: "/explore",
  },
  {
    label: "Chat",
    href: "/explore",
    icon: MessageCircle,
    requiresAuth: true,
    returnTo: "/explore",
  },
  {
    label: "Create Character",
    href: "/explore",
    icon: WandSparkles,
    requiresAuth: true,
    returnTo: "/explore",
  },
  {
    label: "Premium",
    href: "/explore",
    icon: Crown,
    requiresAuth: true,
    returnTo: "/explore",
  },
];

export function PublicSidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 xl:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] flex-col border-r border-border/70 bg-sidebar",
          "xl:sticky xl:top-[60px] xl:z-auto xl:flex xl:h-[calc(100vh-60px)] xl:w-72 xl:flex-shrink-0",
          isOpen ? "flex" : "hidden xl:flex",
        )}
      >
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 xl:hidden">
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">FeelAI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={close}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Nav items — flex-1 so footer is pushed to bottom */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Browse
          </p>
          <div className="space-y-1">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              if (item.requiresAuth) {
                return (
                  <OpenAuthModalButton
                    key={item.label}
                    className="w-full justify-start gap-2"
                    onClick={close}
                    returnTo={item.returnTo}
                    variant="ghost"
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
                  variant={item.active ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
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
        </div>

        {/* Footer — dark mode info + links pinned to bottom */}
        <div className="space-y-3 border-t border-border/70 px-4 py-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
