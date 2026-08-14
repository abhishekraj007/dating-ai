"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguagePreferences } from "@/hooks/use-language-preferences";
import { cn } from "@/lib/utils";
import type { AppLanguage } from "@dating-ai/backend";
import type { DiscoverGenderPreference } from "@/lib/public-segments";

const discoverOptions = [
  {
    value: "female" as const,
    label: "Females",
    image: "/discover/female.webp",
    secondaryImage: undefined,
    imageAlt: "Portrait preview for the females explore feed",
  },
  {
    value: "male" as const,
    label: "Males",
    image: "/discover/male.webp",
    secondaryImage: undefined,
    imageAlt: "Portrait preview for the males explore feed",
  },
  {
    value: "both" as const,
    label: "All",
    image: "/discover/female.webp",
    secondaryImage: "/discover/male.webp",
    imageAlt: "Portrait preview for everyone",
  },
];

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const {
    appLanguage,
    chatLanguage,
    isLoaded,
    setLanguages,
    supportedLanguages,
  } = useLanguagePreferences();
  const [selectedAppLanguage, setSelectedAppLanguage] =
    useState<AppLanguage>(appLanguage);
  const [selectedChatLanguage, setSelectedChatLanguage] =
    useState<AppLanguage>(chatLanguage);
  const [genderPreference, setGenderPreference] =
    useState<DiscoverGenderPreference | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedAppLanguage(appLanguage);
    setSelectedChatLanguage(chatLanguage);
  }, [appLanguage, chatLanguage]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  const handleContinue = async () => {
    if (!genderPreference) {
      return;
    }

    setIsSaving(true);
    await setLanguages({
      appLanguage: selectedAppLanguage,
      chatLanguage: selectedChatLanguage,
    });
    sessionStorage.setItem("feelai.onboarding.gender", genderPreference);
    router.push("/onboarding/character");
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col px-6 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Who are you interested in?
        </h1>
        <p className="text-muted-foreground">
          We&apos;ll match you with people you&apos;ll actually want to talk to.
        </p>
      </div>

      <div className="mt-8 grid gap-3">
        {discoverOptions.map((option) => {
          const selected = genderPreference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setGenderPreference(option.value)}
              className={cn(
                "relative min-h-[120px] overflow-hidden rounded-[20px] text-left ring-1 ring-border transition-transform active:scale-[0.98] sm:min-h-[140px]",
                selected && "ring-2 ring-foreground",
              )}
            >
              {option.secondaryImage ? (
                <div className="absolute inset-0 flex">
                  <div className="relative h-full w-1/2">
                    <Image
                      src={option.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="50vw"
                    />
                  </div>
                  <div className="relative h-full w-1/2">
                    <Image
                      src={option.secondaryImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="50vw"
                    />
                  </div>
                </div>
              ) : (
                <Image
                  src={option.image}
                  alt={option.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 32rem"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-5">
        <div className="space-y-2">
          <div>
            <h2 className="text-sm font-semibold">App language</h2>
            <p className="text-xs text-muted-foreground">
              Controls menus, buttons, and other app text.
            </p>
          </div>
          <Select
            value={selectedAppLanguage}
            onValueChange={(value) =>
              setSelectedAppLanguage(value as AppLanguage)
            }
          >
            <SelectTrigger className="w-full rounded-[1.25rem]">
              <SelectValue placeholder="Choose app language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div>
            <h2 className="text-sm font-semibold">Chat language</h2>
            <p className="text-xs text-muted-foreground">
              Controls the language your AI companions reply in.
            </p>
          </div>
          <Select
            value={selectedChatLanguage}
            onValueChange={(value) =>
              setSelectedChatLanguage(value as AppLanguage)
            }
          >
            <SelectTrigger className="w-full rounded-[1.25rem]">
              <SelectValue placeholder="Choose chat language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((language) => (
                <SelectItem key={`chat-${language.code}`} value={language.code}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="mt-8 min-h-12 rounded-full text-base font-medium"
        disabled={isSaving || !genderPreference}
        onClick={() => void handleContinue()}
      >
        {isSaving ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
