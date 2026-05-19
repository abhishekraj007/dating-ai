"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { cn } from "@/lib/utils";
import type { DiscoverGenderPreference } from "@/lib/public-segments";

const discoverOptions = [
  {
    value: "female" as const,
    label: "Females",
    image: "/discover/female.webp",
    imageAlt: "Portrait preview for the females explore feed",
  },
  {
    value: "male" as const,
    label: "Males",
    image: "/discover/male.webp",
    imageAlt: "Portrait preview for the males explore feed",
  },
];

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const saveUserPreferences = useMutation(
    api.features.preferences.queries.saveUserPreferences,
  );
  const markOnboardingComplete = useMutation(api.user.markOnboardingComplete);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingGender, setPendingGender] =
    useState<DiscoverGenderPreference | null>(null);

  const handleSelect = async (genderPreference: DiscoverGenderPreference) => {
    setIsSaving(true);
    setPendingGender(genderPreference);

    try {
      await saveUserPreferences({
        genderPreference,
        ageMin: 18,
        ageMax: 60,
        zodiacPreferences: [],
        interestPreferences: [],
      });
      await markOnboardingComplete();
      router.replace("/");
    } finally {
      setIsSaving(false);
      setPendingGender(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-6 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Who would you like to meet?
        </h1>
        <p className="text-muted-foreground">
          Pick a starting preference for your feed. You can change this later.
        </p>
      </div>

      <div className="mt-8 grid flex-1 gap-4 sm:grid-cols-2">
        {discoverOptions.map((option) => {
          const isPending = pendingGender === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isSaving}
              onClick={() => void handleSelect(option.value)}
              className={cn(
                "group relative min-h-[280px] overflow-hidden rounded-[28px] text-left ring-1 ring-border transition-[transform,box-shadow,opacity] active:scale-[0.98] sm:min-h-[340px]",
                isSaving && !isPending && "opacity-70",
                isPending && "ring-2 ring-primary",
              )}
            >
              <Image
                src={option.image}
                alt={option.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.12)_0%,rgba(8,8,8,0.88)_100%)]" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <h2 className="text-2xl font-semibold text-white">{option.label}</h2>
                <span className="mt-3 inline-flex min-h-9 w-fit items-center rounded-full border border-white/20 bg-black/30 px-3 text-xs font-medium text-white">
                  {isPending ? "Saving..." : "Choose"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
