"use client";

import { Coins, Crown, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStoreLinks } from "@/hooks/use-app-store-links";
import {
  type DownloadAppReason,
  getDownloadAppCopy,
} from "@/lib/web-payment";
import { cn } from "@/lib/utils";

interface DownloadAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: DownloadAppReason;
}

function AppleStoreIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.467 2.203-1.223 3.002-.82.867-2.17 1.535-3.32 1.442-.157-1.09.48-2.247 1.223-3.02.82-.89 2.247-1.574 3.32-1.424Zm4.02 17.07c-.64 1.48-1.4 2.88-2.52 4.36-1 1.28-2.18 2.88-3.76 2.9-1.42.02-1.78-.92-3.32-.92-1.54 0-1.9.9-3.3.94-1.62.04-2.86-1.66-3.86-2.94-2.1-2.72-3.7-7.68-1.54-11.02 1.06-1.54 2.96-2.52 5.02-2.54 1.56-.03 3.04 1.06 3.32 1.06.28 0 2.32-1.32 3.92-1.12.66.02 2.52.27 3.72 2.02-.1.06-2.22 1.3-2.2 3.88.04 3.08 2.7 4.1 2.74 4.12-.02.06-.42 1.46-1.38 2.9Z" />
    </svg>
  );
}

function StoreDownloadButton({
  href,
  label,
  subtitle,
  icon,
}: {
  href: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border/80 bg-background/90 px-4 py-3",
        "shadow-[0_10px_28px_-22px_rgba(0,0,0,0.55)] transition-[transform,background-color,border-color]",
        "hover:border-primary/30 hover:bg-accent/40 active:scale-[0.99]",
        "dark:border-border/60 dark:bg-background/50 dark:hover:bg-accent/20",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {subtitle}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
      </div>
    </a>
  );
}

export function DownloadAppModal({
  open,
  onOpenChange,
  reason = "credits",
}: DownloadAppModalProps) {
  const { iosUrl } = useAppStoreLinks();
  const copy = getDownloadAppCopy(reason);
  const BadgeIcon = reason === "premium" ? Crown : Coins;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md gap-0 overflow-hidden border-0 p-0 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:max-w-[420px] w-[80vw]",
          "dark:shadow-[0_28px_100px_-40px_rgba(0,0,0,0.85)] dark:ring-white/10",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            "bg-gradient-to-b from-primary/[0.12] via-background to-background",
            "dark:from-primary/[0.18] dark:via-popover dark:to-popover",
          )}
        >
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55)_0%,transparent_68%)] opacity-90 dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.14)_0%,transparent_65%)] dark:opacity-100"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl dark:bg-primary/25"
            aria-hidden
          />

          <div className="relative px-6 pb-7 pt-8 sm:px-8 sm:pb-8">
            <DialogHeader className="items-center gap-3.5 text-center sm:gap-4">
              <div
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                  "border border-primary/20 bg-background/80 shadow-sm backdrop-blur-md",
                  "dark:border-primary/25 dark:bg-background/40",
                )}
              >
                <BadgeIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                {copy.badge}
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Smartphone className="h-7 w-7" />
              </div>
              <DialogTitle className="font-heading text-balance text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="max-w-[min(100%,20rem)] text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
                {copy.description}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-7 sm:mt-8">
              <StoreDownloadButton
                href={iosUrl}
                subtitle="Download on the"
                label="App Store"
                icon={<AppleStoreIcon className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
