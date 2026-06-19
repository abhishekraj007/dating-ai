"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { PremiumLockedImage } from "@/components/chat/premium-locked-image";
import { Skeleton } from "../ui/skeleton";
import { Loader2 } from "lucide-react";

const LOCKED_VIDEO_PLACEHOLDER_URL = "/placeholder.jpg";

interface ChatVideoBubbleProps {
  videoKey?: string;
  videoUrl?: string;
  posterKey?: string;
  posterUrl?: string;
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
  posterKey,
  posterUrl,
  isPremium,
  profileName,
  profileAvatar,
  viewerName,
  viewerEmail,
  viewerAuthUserId,
}: ChatVideoBubbleProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);

  const freshVideoUrl = useQuery(
    api.features.ai.queries.getChatVideoUrl,
    isPremium && videoKey ? { videoKey } : "skip",
  );

  const freshPosterUrl = useQuery(
    api.features.ai.queries.getChatVideoPosterUrl,
    posterKey ? { posterKey } : "skip",
  );

  const resolvedVideoUrl = isPremium ? (freshVideoUrl ?? videoUrl) : undefined;
  const resolvedPosterUrl = freshPosterUrl ?? posterUrl;

  if (!isPremium) {
    if (resolvedPosterUrl) {
      return (
        <PremiumLockedImage
          imageUrl={resolvedPosterUrl}
          profileName={profileName}
          profileAvatar={profileAvatar}
          viewerName={viewerName}
          viewerEmail={viewerEmail}
          viewerAuthUserId={viewerAuthUserId}
        />
      );
    }

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

  if (!resolvedVideoUrl && !resolvedPosterUrl) {
    return (
      <div className="relative overflow-hidden rounded-3xl">
        <Skeleton className="h-[350px] w-[250px] rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/10 dark:ring-white/10">
      {resolvedPosterUrl ? (
        <img
          src={resolvedPosterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {!isVideoReady ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : null}

      {resolvedVideoUrl ? (
        <video
          src={resolvedVideoUrl}
          poster={resolvedPosterUrl}
          controls
          playsInline
          onLoadedData={() => setIsVideoReady(true)}
          className="relative z-[1] max-h-[420px] max-w-[260px] bg-black object-contain"
        />
      ) : (
        <div className="relative z-[1] h-[350px] w-[250px] bg-black" />
      )}
    </div>
  );
}
