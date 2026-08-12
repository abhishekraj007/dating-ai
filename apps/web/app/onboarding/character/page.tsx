"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CharacterPickCard } from "@/components/onboarding/character-pick-card";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import type { DiscoverGenderPreference } from "@/lib/public-segments";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";

function readOnboardingGender(): DiscoverGenderPreference {
  const stored = sessionStorage.getItem("feelai.onboarding.gender");
  if (stored === "male" || stored === "female" || stored === "both") {
    return stored;
  }

  return "female";
}

export default function OnboardingCharacterPage() {
  const router = useRouter();
  const [genderPreference, setGenderPreference] =
    useState<DiscoverGenderPreference>("female");
  const { characters, isLoading } = useOnboardingCharacters(
    genderPreference,
    6,
  );
  const saveUserPreferences = useMutation(
    api.features.preferences.queries.saveUserPreferences,
  );
  const markOnboardingComplete = useMutation(api.user.markOnboardingComplete);
  const startConversation = useMutation(
    api.features.ai.mutations.startConversation,
  );
  const [selectedId, setSelectedId] = useState<Id<"aiProfiles"> | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    setGenderPreference(readOnboardingGender());
  }, []);

  const selected =
    characters.find((character) => character._id === selectedId) ??
    characters[0];

  const finishPreferences = async () => {
    await saveUserPreferences({
      genderPreference,
      ageMin: 18,
      ageMax: 60,
      zodiacPreferences: [],
      interestPreferences: [],
    });
    await markOnboardingComplete();
  };

  const handleChat = async () => {
    if (!selected || isFinishing) {
      return;
    }

    setIsFinishing(true);
    await finishPreferences();
    const conversationId = await startConversation({
      aiProfileId: selected._id,
      grantFreeMessages: true,
    });
    router.replace(`/chat/${conversationId}`);
  };

  const handleBrowse = async () => {
    setIsFinishing(true);
    await finishPreferences();
    router.replace("/");
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Pick who texts you first
        </h1>
        <p className="text-muted-foreground">
          These companions are trending right now. You can always meet more
          later.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {characters.map((character) => (
            <div key={character._id} className="snap-center">
              <CharacterPickCard
                name={character.name}
                tagline={character.tagline}
                occupation={character.occupation}
                avatarUrl={character.avatarUrl}
                isTrending={character.isTrending}
                selected={selected?._id === character._id}
                onSelect={() => setSelectedId(character._id)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button
          size="lg"
          className="h-12 w-full rounded-full text-base font-semibold"
          disabled={!selected || isFinishing}
          onClick={() => void handleChat()}
        >
          {isFinishing
            ? "Setting up..."
            : `Chat with ${selected?.name ?? ""}`}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="h-12 w-full rounded-full text-base"
          disabled={isFinishing}
          onClick={() => void handleBrowse()}
        >
          Browse everyone first
        </Button>
      </div>
    </div>
  );
}
