"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { StartChatButton } from "@/components/public/start-chat-button";

type Props = {
  avatarUrl: string | null | undefined;
  name: string;
  aiProfileId: string;
};

export function ProfileAvatarSection({ avatarUrl, name, aiProfileId }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card aspect-[4/5] lg:aspect-auto lg:h-full min-h-[300px]">
        {avatarUrl ? (
          <>
            <Image
              alt={name}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 360px"
              src={avatarUrl}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute inset-0 z-[1] cursor-zoom-in"
              aria-label={`View ${name} photo fullscreen`}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-6xl font-semibold text-muted-foreground">
            {name[0]}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 to-transparent z-[2]" />
        <div className="absolute bottom-4 left-0 right-0 flex flex-row gap-3 px-4 z-[3]">
          <OpenAuthModalButton
            size="lg"
            variant="outline"
            className="w-14 shrink-0 px-0"
          >
            <Heart className="h-5 w-5" />
          </OpenAuthModalButton>
          <StartChatButton
            aiProfileId={aiProfileId}
            className="flex-1"
            size="lg"
          >
            Chat
          </StartChatButton>
        </div>
      </div>

      {avatarUrl ? (
        <ImageLightbox
          images={[avatarUrl]}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      ) : null}
    </>
  );
}
