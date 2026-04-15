"use client";

import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

