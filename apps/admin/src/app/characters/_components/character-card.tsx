"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { ImageLightbox } from "@/components/image-lightbox";
import type { AIProfile } from "../_hooks/use-character-edit";

interface CharacterCardProps {
  profile: AIProfile;
  onView: (profile: AIProfile) => void;
  onEdit: (profile: AIProfile) => void;
  isNew?: boolean;
}

export function CharacterCard({
  profile,
  onView,
  onEdit,
  isNew = false,
}: CharacterCardProps) {
  const visibleInterests = profile.interests?.slice(0, 2) ?? [];
  const remainingInterests = Math.max((profile.interests?.length ?? 0) - 2, 0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="group rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/50">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border/60">
            <AvatarImage
              className="object-cover position-top"
              src={profile.avatarUrl ?? undefined}
            />
            <AvatarFallback>
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold leading-none">
                {profile.name}
              </h3>
              {isNew ? (
                <Badge
                  variant="outline"
                  className="h-6 border-primary/40 px-2 text-[11px] text-primary"
                >
                  new
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{profile.gender === "female" ? "♀" : "♂"}</span>
              {profile.age && <span>{profile.age}</span>}
              {profile.zodiacSign && <span>• {profile.zodiacSign}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            aria-label="View character"
            onClick={() => onView(profile)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit character"
            onClick={() => onEdit(profile)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {profile.occupation && (
        <p className="mb-2 text-lg text-muted-foreground">
          {profile.occupation}
        </p>
      )}

      {profile.bio && (
        <p className="mb-3 line-clamp-3 text-sm leading-relaxed">
          {profile.bio}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {visibleInterests.map((interest) => (
            <Badge
              key={interest}
              variant="secondary"
              className="h-6 px-2 text-[12px]"
            >
              {interest}
            </Badge>
          ))}
          {remainingInterests > 0 && (
            <Badge variant="outline" className="h-6 px-2 text-[12px]">
              +{remainingInterests}
            </Badge>
          )}
        </div>
        <div className="flex justify-end">
          <StatusBadge status={profile.status} />
        </div>
      </div>

      {profile.profileImageUrls.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {profile.profileImageUrls.slice(0, 3).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="h-14 w-14 overflow-hidden rounded-md bg-muted ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              aria-label={`View image ${i + 1}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {profile.profileImageUrls.length > 3 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(3)}
              className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              aria-label={`View remaining ${profile.profileImageUrls.length - 3} images`}
            >
              +{profile.profileImageUrls.length - 3}
            </button>
          )}
        </div>
      )}

      <ImageLightbox
        images={profile.profileImageUrls}
        open={lightboxIndex !== null}
        initialIndex={lightboxIndex ?? 0}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      />
    </div>
  );
}
