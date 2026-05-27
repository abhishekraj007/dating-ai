"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, SunMoon, X } from "lucide-react";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { PublicBillingActions } from "@/components/public/public-billing-actions";
import { PublicHeaderAccountMenu } from "@/components/public/public-header-account-menu";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/public/sidebar-context";
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
  const { isOpen, close } = useSidebar();
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <div className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-primary/[0.10] to-transparent px-5 py-1">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20"
            aria-hidden
          />

          <div className="relative flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1" onClick={close}>
              <Image
                src="/logo-dark.png"
                alt="FeelAI logo"
                width={48}
                height={48}
                className="block object-contain dark:hidden"
              />
              <Image
                src="/logo-white.png"
                alt="FeelAI logo"
                width={48}
                height={48}
                className="hidden object-contain dark:block"
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

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-4">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-100 w-28 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20"
            aria-hidden
          />

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

          {mounted && !isLoading && isAuthenticated ? (
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

            <div className="flex items-center justify-center gap-2 text-[10px] leading-none text-muted-foreground/75">
              <Link
                href="/terms"
                className="transition-colors hover:text-foreground"
                onClick={close}
              >
                Terms
              </Link>
              <span aria-hidden>•</span>
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
                onClick={close}
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
