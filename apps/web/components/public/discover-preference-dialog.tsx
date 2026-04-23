"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDiscoverPreferences } from "@/hooks/use-discover-preferences";
import { cn } from "@/lib/utils";

const discoverOptions = [
  {
    value: "female",
    label: "Females",
    eyebrow: "Soft match",
    description:
      "Start with women-first profiles tuned for flirtier chat, warmth, and everyday chemistry.",
    image: "/discover/female.webp",
    imageAlt: "Portrait preview for the females explore feed",
  },
  {
    value: "male",
    label: "Males",
    eyebrow: "Bold match",
    description:
      "Open with men-first profiles shaped for confident banter, romantic roleplay, and direct energy.",
    image: "/discover/male.webp",
    imageAlt: "Portrait preview for the males explore feed",
  },
] as const;

export function DiscoverPreferenceDialog() {
  const { hasStoredPreferences, isLoading, setGenderPreference } =
    useDiscoverPreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingGenderPreference, setPendingGenderPreference] = useState<
    "female" | "male" | null
  >(null);

  const isOpen = !isLoading && !hasStoredPreferences;

  const handleSelect = async (genderPreference: "female" | "male") => {
    setIsSaving(true);
    setPendingGenderPreference(genderPreference);

    try {
      await setGenderPreference(genderPreference);
    } finally {
      setIsSaving(false);
      setPendingGenderPreference(null);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl overflow-hidden border border-white/10 bg-[#111111] p-0 shadow-[0_32px_120px_-48px_rgba(0,0,0,0.82)]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(190,24,93,0.18),transparent_62%)]" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <DialogHeader className="relative space-y-4 px-6 pt-6 text-center sm:px-8 sm:pt-8">
            <div className="mx-auto inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-[11px] font-medium uppercase tracking-[0.26em] text-white/70">
              Personalize your experience
            </div>
            <DialogTitle className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-[2.15rem] mb-3">
              Who would you like to meet?
            </DialogTitle>
            {/* <DialogDescription className="mx-auto max-w-2xl text-pretty text-sm leading-7 text-white/64 sm:text-base">
              Pick a starting lane for your home feed. We will keep the explore
              switch aligned with this choice, and you can still update it later
              from filters.
            </DialogDescription> */}
          </DialogHeader>

          <div className="relative grid gap-4 px-6 pb-6 pt-2 sm:grid-cols-2 sm:px-8 sm:pb-8">
            {discoverOptions.map((option) => {
              const isPending = pendingGenderPreference === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSaving}
                  aria-pressed={isPending}
                  onClick={() => void handleSelect(option.value)}
                  className={cn(
                    "cursor-pointer group relative min-h-[280px] overflow-hidden rounded-[28px] text-left outline-none ring-1 ring-white/10 shadow-[0_24px_60px_-36px_rgba(0,0,0,0.78)] transition-[transform,box-shadow,ring-color,opacity] duration-300 ease-out active:scale-[0.96] sm:min-h-[340px]",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0",
                    isSaving && !isPending && "opacity-70",
                    isPending &&
                      "ring-2 ring-primary shadow-[0_34px_90px_-44px_rgba(190,24,93,0.8)]",
                  )}
                >
                  <div className="absolute inset-0">
                    <Image
                      src={option.image}
                      alt={option.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      priority
                    />
                  </div>

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.12)_0%,rgba(8,8,8,0.28)_42%,rgba(8,8,8,0.88)_100%)]" />
                  <div className="absolute inset-[1px] rounded-[27px] ring-1 ring-white/10" />

                  <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                    <div className="flex justify-center gap-3">
                      <span
                        className={cn(
                          "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium backdrop-blur-sm transition-[background-color,border-color,color,opacity] duration-300",
                          isPending
                            ? "border-primary/70 bg-primary text-primary-foreground"
                            : "border-white/14 bg-black/20 text-white/72",
                        )}
                      >
                        {isPending ? "Saving..." : "Choose"}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                        {option.label}
                      </h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/8 px-6 py-4 text-center text-xs text-white/48 sm:px-8">
            This only sets your starting preference. You can fine-tune age,
            zodiac, and interests later.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
