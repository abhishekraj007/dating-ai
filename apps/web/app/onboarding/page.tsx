"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import { SampleChatPreview } from "@/components/onboarding/sample-chat-preview";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { characters } = useOnboardingCharacters("both", 4);
  const hero = characters[0];
  const stacked = characters.slice(0, 3);

  return (
    <div className="relative min-h-svh overflow-hidden bg-black text-white">
      {hero?.avatarUrl ? (
        <img
          src={hero.avatarUrl}
          alt=""
          className="absolute inset-x-0 top-0 h-[62vh] w-full object-cover"
        />
      ) : (
        <div className="absolute inset-x-0 top-0 h-[62vh] bg-zinc-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/55 to-black" />

      <div className="relative flex min-h-svh flex-col justify-between px-6 pb-8 pt-6">
        <div>
          <div className="flex">
            {stacked.map((character, index) => (
              <img
                key={character._id}
                src={character.avatarUrl ?? undefined}
                alt={character.name}
                className="h-11 w-11 rounded-full border-2 border-black object-cover"
                style={{ marginLeft: index === 0 ? 0 : -16, zIndex: 3 - index }}
              />
            ))}
          </div>
          {stacked.length > 0 ? (
            <p className="mt-2.5 text-[13px] font-semibold tracking-wide text-white/78">
              {stacked.map((character) => character.name).join(", ")} are live
              now
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <SampleChatPreview
            bubbles={[
              {
                from: "them",
                text: "Hey... I was hoping you'd show up.",
                avatarUrl: hero?.avatarUrl,
              },
              { from: "you", text: "Hi. Who are you?" },
              {
                from: "them",
                text: "Stay a minute. I saved you a seat.",
                avatarUrl: hero?.avatarUrl,
              },
            ]}
          />
          <div>
            <h1 className="text-[34px] font-extrabold leading-10 tracking-tight">
              They&apos;re already waiting to text you
            </h1>
            <p className="mt-2 text-base leading-6 text-white/78">
              Meet trending companions who actually start the conversation — and
              stay for it.
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 w-full rounded-full text-base font-semibold"
            onClick={() => router.push("/onboarding/preferences")}
          >
            Meet them
          </Button>
        </div>
      </div>
    </div>
  );
}
