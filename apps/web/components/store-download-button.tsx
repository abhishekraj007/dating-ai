"use client";

import { useAppStoreLinks } from "@/hooks/use-app-store-links";
import { cn } from "@/lib/utils";

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

export function StoreDownloadButton({
  href,
  label,
  subtitle,
  className,
}: {
  href: string;
  label: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3",
        "bg-foreground text-background",
        "shadow-[0_12px_28px_-18px_rgba(0,0,0,0.45)]",
        "transition-[transform,background-color,opacity,box-shadow] hover:opacity-90 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "dark:bg-white dark:text-black dark:shadow-[0_14px_36px_-18px_rgba(255,255,255,0.45)] dark:hover:opacity-100 dark:hover:bg-neutral-100",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/12 dark:bg-black/8">
        <AppleStoreIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[11px] font-medium uppercase tracking-wide text-background/70 dark:text-black/55">
          {subtitle}
        </p>
        <p className="truncate text-sm font-semibold">{label}</p>
      </div>
    </a>
  );
}

export function AppStoreDownloadButton({ className }: { className?: string }) {
  const { iosUrl } = useAppStoreLinks();

  return (
    <StoreDownloadButton
      href={iosUrl}
      subtitle="Download on the"
      label="App Store"
      className={className}
    />
  );
}
