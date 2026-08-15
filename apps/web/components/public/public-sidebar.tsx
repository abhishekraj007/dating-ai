"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { PublicBillingActions } from "@/components/public/public-billing-actions";
import { PublicHeaderAccountMenu } from "@/components/public/public-header-account-menu";
import { SidebarRailItem } from "@/components/public/sidebar-flyout-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/public/sidebar-context";
import { useConvexAuth } from "convex/react";
import Image from "next/image";

const primaryItems = [
  { label: "Home", href: "/", icon: Home },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircle,
    requiresAuth: true,
    returnTo: "/chat",
  },
];

export function PublicSidebar() {
  const pathname = usePathname();
  const { isOpen, close, isCollapsed, toggleCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] flex-col border-r border-border/70 bg-sidebar/95 backdrop-blur",
          "md:sticky md:top-0 md:z-auto md:flex md:h-screen md:flex-shrink-0 md:transition-[width] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "flex" : "hidden md:flex",
          isCollapsed
            ? "md:z-20 md:w-[4.5rem] md:overflow-visible"
            : "md:w-72",
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          aria-controls="app-sidebar"
          className="absolute -right-3 top-5 z-20 hidden size-6 rounded-full border-border/80 bg-background shadow-sm md:inline-flex"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-3.5" />
          ) : (
            <PanelLeftClose className="size-3.5" />
          )}
        </Button>

        <div
          className={cn(
            "relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-primary/[0.10] to-transparent py-1",
            isCollapsed ? "px-1" : "px-5",
          )}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20"
            aria-hidden
          />

          <div
            className={cn(
              "relative flex items-center justify-between",
              isCollapsed && "justify-center",
            )}
          >
            <Link
              href="/"
              className={cn(
                "flex items-center gap-1",
                isCollapsed && "justify-center",
              )}
              onClick={close}
            >
              <Image
                src="/logo-transparent.png"
                alt="FeelAI logo"
                width={48}
                height={48}
                priority
                loading="eager"
                className="size-12 object-contain"
              />
              {isCollapsed ? null : (
                <span className="text-lg font-bold italic">FEELAI</span>
              )}
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

        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col overflow-visible py-4",
            isCollapsed ? "items-center px-2" : "px-3",
          )}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-100 w-28 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20"
            aria-hidden
          />

          <div
            className={cn(
              "space-y-1",
              isCollapsed && "flex w-full flex-col items-center",
            )}
          >
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              const itemClassName = cn(
                "w-full justify-start gap-2.5 rounded-3xl px-4 py-6 text-base cursor-pointer",
                isCollapsed &&
                  "size-11 rounded-full p-0 justify-center transition-transform duration-200 hover:scale-[1.04]",
                isActive &&
                  "bg-primary text-primary-foreground hover:bg-primary/85",
              );

              if (item.requiresAuth) {
                return (
                  <SidebarRailItem
                    key={item.label}
                    showLabel={isCollapsed}
                    label={item.label}
                  >
                    <OpenAuthModalButton
                      aria-label={item.label}
                      className={itemClassName}
                      onClick={close}
                      returnTo={item.returnTo}
                      variant={isActive ? "default" : "ghost"}
                    >
                      <Icon className="size-4" />
                      {isCollapsed ? null : <span>{item.label}</span>}
                    </OpenAuthModalButton>
                  </SidebarRailItem>
                );
              }

              return (
                <SidebarRailItem
                  key={item.label}
                  showLabel={isCollapsed}
                  label={item.label}
                >
                  <Button
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    className={itemClassName}
                    onClick={close}
                  >
                    <Link href={item.href} aria-label={item.label}>
                      <Icon className="size-4" />
                      {isCollapsed ? null : <span>{item.label}</span>}
                    </Link>
                  </Button>
                </SidebarRailItem>
              );
            })}
          </div>

          <div
            className={cn(
              "mt-auto space-y-4 pt-6",
              isCollapsed && "flex w-full flex-col items-center",
            )}
          >
            {mounted && !isLoading && isAuthenticated ? (
              <div className={cn(isCollapsed && "w-auto")}>
                <PublicBillingActions variant="sidebar" />
              </div>
            ) : null}

            <div
              className={cn(
                "hidden border-t border-border/70 pt-4 md:block",
                isCollapsed && "border-t-0 pt-0",
              )}
            >
              <PublicHeaderAccountMenu placement="sidebar" />
            </div>

            {isCollapsed ? null : (
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
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
