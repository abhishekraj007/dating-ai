"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render an inert placeholder with the same dimensions before mount
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="relative h-7 w-[3.25rem] rounded-full border border-border/60 bg-muted"
      />
    );
  }

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={[
        "relative inline-flex h-7 w-[3.25rem] cursor-pointer select-none items-center rounded-full border",
        "transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark
          ? "border-border/50 bg-neutral-800"
          : "border-border/60 bg-neutral-200",
      ].join(" ")}
    >
      {/* Thumb */}
      <span
        className={[
          "absolute top-[3px] flex h-5 w-5 items-center justify-center rounded-full shadow-sm",
          "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isDark
            ? "left-[calc(100%-1.375rem)] bg-neutral-950"
            : "left-[3px] bg-white",
        ].join(" ")}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-red-300" strokeWidth={2} />
        ) : (
          <Sun className="h-3 w-3 text-amber-500" strokeWidth={2.5} />
        )}
      </span>

      {/* Opposite icon in the track */}
      <span
        className={[
          "absolute flex items-center justify-center",
          "transition-opacity duration-200",
          isDark ? "left-[5px] opacity-40" : "right-[5px] opacity-40",
        ].join(" ")}
      >
        {isDark ? (
          <Sun className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
        ) : (
          <Moon className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
