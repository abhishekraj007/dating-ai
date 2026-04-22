"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { PremiumLockedImage } from "@/components/chat/premium-locked-image";
import { cn } from "@/lib/utils";

interface ChatImageBubbleProps {
  imageKey?: string;
  imageUrl?: string;
  caption?: string;
  isPremium: boolean;
  profileName?: string;
  profileAvatar?: string | null;
  viewerName?: string | null;
  viewerEmail?: string | null;
  viewerAuthUserId?: string | null;
}

export function ChatImageBubble({
  imageKey,
  imageUrl,
  caption,
  isPremium,
  profileName,
  profileAvatar,
  viewerName,
  viewerEmail,
  viewerAuthUserId,
}: ChatImageBubbleProps) {
  const freshImageUrl = useQuery(
    api.features.ai.queries.getChatImageUrl,
    imageKey ? { imageKey } : "skip",
  );

  const resolvedImageUrl = freshImageUrl ?? imageUrl;

  if (!resolvedImageUrl) {
    return (
      <div className="flex w-[260px] items-center justify-center rounded-3xl bg-muted/60 px-4 py-16 text-sm text-muted-foreground ring-1 ring-black/10 dark:ring-white/10">
        Loading photo...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl shadow-[0_18px_32px_-24px_rgba(0,0,0,0.65)]">
      {isPremium ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedImageUrl}
          alt={`Photo from ${profileName ?? "AI"}`}
          className="max-w-[260px] rounded-3xl object-cover ring-1 ring-black/10 dark:ring-white/10"
          loading="lazy"
        />
      ) : (
        <PremiumLockedImage
          imageUrl={resolvedImageUrl}
          profileName={profileName}
          profileAvatar={profileAvatar}
          viewerName={viewerName}
          viewerEmail={viewerEmail}
          viewerAuthUserId={viewerAuthUserId}
        />
      )}

      {caption ? (
        <p
          className={cn(
            "mt-1.5 rounded-3xl rounded-bl-lg bg-muted px-4 py-2.5 text-sm text-foreground shadow-sm",
          )}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
