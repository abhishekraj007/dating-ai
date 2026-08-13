"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import { SampleChatPreview } from "@/components/onboarding/sample-chat-preview";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { characters } = useOnboardingCharacters("both", 4);
  const hero =
    characters.find((character) => character.avatarUrl) ?? characters[0];
  const stacked = characters
    .filter((character) => character.avatarUrl)
    .slice(0, 3);

  return (
    <div className="relative min-h-svh overflow-hidden bg-black text-white">
      <img
        src={hero?.avatarUrl ?? "/discover/female.webp"}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,transparent_18%,rgba(0,0,0,0.45)_48%,#000_70%)]" />

      <div className="relative flex min-h-svh flex-col justify-between px-6 pb-8 pt-6">
        <div className="flex items-center">
          {stacked.map((character, index) => (
            <img
              key={character._id}
              src={character.avatarUrl ?? undefined}
              alt=""
              className="h-9 w-9 rounded-full border-2 border-black object-cover object-top"
              style={{ marginLeft: index === 0 ? 0 : -12, zIndex: 3 - index }}
            />
          ))}
          <span className="ml-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.4px] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <SampleChatPreview
            bubbles={[
              { from: "them", text: "Hey. I've been waiting to talk to you." },
              { from: "you", text: "Hi. What's up?" },
              { from: "them", text: "I'm bored. You free?" },
            ]}
          />
          <h1 className="text-[32px] font-extrabold leading-[38px] tracking-tight">
            Someone here is already into you
          </h1>
          <Button
            size="lg"
            className="h-12 w-full rounded-full text-base font-semibold"
            onClick={() => router.push("/onboarding/preferences")}
          >
            Start chatting
          </Button>
        </div>
      </div>
    </div>
  );
}
