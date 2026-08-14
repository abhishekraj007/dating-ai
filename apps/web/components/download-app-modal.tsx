"use client";

import { Coins, Crown, MessageCircle, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppStoreDownloadButton } from "@/components/store-download-button";
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

const badgeIcons = {
  credits: Coins,
  premium: Crown,
  login: MessageCircle,
} as const;

export function DownloadAppModal({
  open,
  onOpenChange,
  reason = "credits",
}: DownloadAppModalProps) {
  const copy = getDownloadAppCopy(reason);
  const BadgeIcon = badgeIcons[reason];

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
              <AppStoreDownloadButton />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
