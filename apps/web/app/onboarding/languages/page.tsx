"use client";

import { useEffect, useState } from "react";
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
import type { AppLanguage } from "@dating-ai/backend";

export default function OnboardingLanguagesPage() {
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
    setIsSaving(true);
    try {
      await setLanguages({
        appLanguage: selectedAppLanguage,
        chatLanguage: selectedChatLanguage,
      });
      router.push("/onboarding/preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col px-6 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Choose your languages
        </h1>
        <p className="text-muted-foreground">
          Set how the app looks and how your AI matches talk to you.
        </p>
      </div>

      <div className="mt-10 flex flex-1 flex-col gap-8">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">App language</h2>
            <p className="text-sm text-muted-foreground">
              Controls menus, buttons, and other app text.
            </p>
          </div>
          <Select
            value={selectedAppLanguage}
            onValueChange={(value) => setSelectedAppLanguage(value as AppLanguage)}
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

        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Chat language</h2>
            <p className="text-sm text-muted-foreground">
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
        disabled={isSaving}
        onClick={() => void handleContinue()}
      >
        {isSaving ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
