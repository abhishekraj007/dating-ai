"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { PremiumLockedImage } from "@/components/chat/premium-locked-image";
import { Skeleton } from "../ui/skeleton";

const LOCKED_VIDEO_PLACEHOLDER_URL = "/placeholder.jpg";

interface ChatVideoBubbleProps {
  videoKey?: string;
  videoUrl?: string;
  isPremium: boolean;
  profileName?: string;
  profileAvatar?: string | null;
  viewerName?: string | null;
  viewerEmail?: string | null;
  viewerAuthUserId?: string | null;
}

export function ChatVideoBubble({
  videoKey,
  videoUrl,
  isPremium,
  profileName,
  profileAvatar,
  viewerName,
  viewerEmail,
  viewerAuthUserId,
}: ChatVideoBubbleProps) {
  const freshVideoUrl = useQuery(
    api.features.ai.queries.getChatVideoUrl,
    isPremium && videoKey ? { videoKey } : "skip",
  );

  const resolvedVideoUrl = isPremium ? (freshVideoUrl ?? videoUrl) : undefined;

  if (!resolvedVideoUrl) {
    if (!isPremium) {
      return (
        <PremiumLockedImage
          imageUrl={LOCKED_VIDEO_PLACEHOLDER_URL}
          profileName={profileName}
          profileAvatar={profileAvatar}
          viewerName={viewerName}
          viewerEmail={viewerEmail}
          viewerAuthUserId={viewerAuthUserId}
        />
      );
    }

    return (
      <div className="relative overflow-hidden rounded-3xl">
        <Skeleton className="h-[350px] w-[250px] rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-black/10 dark:ring-white/10">
      <video
        src={resolvedVideoUrl}
        controls
        playsInline
        className="max-h-[420px] max-w-[260px] bg-black object-contain"
      />
    </div>
  );
}
