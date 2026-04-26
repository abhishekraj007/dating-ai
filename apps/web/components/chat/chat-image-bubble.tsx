"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { PremiumLockedImage } from "@/components/chat/premium-locked-image";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

const LOCKED_IMAGE_PLACEHOLDER_URL = "/placeholder.jpg";

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
    isPremium && imageKey ? { imageKey } : "skip",
  );

  const resolvedImageUrl = isPremium ? (freshImageUrl ?? imageUrl) : undefined;

  if (!resolvedImageUrl) {
    if (!isPremium) {
      return (
        <PremiumLockedImage
          imageUrl={LOCKED_IMAGE_PLACEHOLDER_URL}
          profileName={profileName}
          profileAvatar={profileAvatar}
          viewerName={viewerName}
          viewerEmail={viewerEmail}
          viewerAuthUserId={viewerAuthUserId}
        />
      );
    }

    return (
      <div className="relative border rounded-3xl animate-border-slow">
        <Skeleton className="w-[140px] h-[180px] rounded-3xl animate-pulse" />
        <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          In progress...
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl">
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
          imageUrl={LOCKED_IMAGE_PLACEHOLDER_URL}
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
