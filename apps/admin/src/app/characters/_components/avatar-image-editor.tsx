"use client";

import { useState } from "react";
import { Check, ImagePlus, Images, Loader2, X, ZoomIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/image-lightbox";
import type { AIProfile } from "../_hooks/use-character-edit";

interface AvatarImageEditorProps {
  profile: AIProfile;
  isReadOnly: boolean;
  isUploadingAvatar: boolean;
  deletingImageKey: string | null;
  selectingAvatarImageKey: string | null;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAvatar: (key: string) => void;
  onSelectShowcaseAvatar: (key: string) => void;
}

export function AvatarImageEditor({
  profile,
  isReadOnly,
  isUploadingAvatar,
  deletingImageKey,
  selectingAvatarImageKey,
  avatarInputRef,
  onAvatarUpload,
  onDeleteAvatar,
  onSelectShowcaseAvatar,
}: AvatarImageEditorProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const showcaseImages = profile.profileImageUrls
    .map((url, index) => ({ url, key: profile.profileImageKeys?.[index] }))
    .filter((image): image is { url: string; key: string } =>
      Boolean(image.key),
    );

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {profile.avatarUrl ? (
            <button
              type="button"
              className="group relative block h-24 w-24 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setLightboxOpen(true)}
              aria-label="View avatar in full size"
            >
              <Avatar className="h-24 w-24">
                <AvatarImage
                  className="object-cover position-top"
                  src={profile.avatarUrl}
                />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-5 w-5 text-white" />
              </div>
            </button>
          ) : (
            <Avatar className="h-24 w-24">
              <AvatarImage
                className="object-cover position-top"
                src={undefined}
              />
              <AvatarFallback className="text-2xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {!isReadOnly && profile.avatarImageKey && (
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-0 right-0 z-10 h-6 w-6 rounded-full"
              onClick={() => onDeleteAvatar(profile.avatarImageKey!)}
              disabled={deletingImageKey === profile.avatarImageKey}
              aria-label="Remove avatar image"
            >
              {deletingImageKey === profile.avatarImageKey ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <Label>Avatar image</Label>
            <p className="text-xs text-muted-foreground">
              Upload a custom avatar or reuse a showcase image.
            </p>
          </div>
          {!isReadOnly && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                )}
                Upload
              </Button>
            </>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Images className="h-4 w-4 text-muted-foreground" />
            Showcase images
          </div>
          {showcaseImages.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {showcaseImages.map((image, index) => {
                const isCurrentAvatar = image.key === profile.avatarImageKey;
                const isSelecting = selectingAvatarImageKey === image.key;

                return (
                  <button
                    key={image.key}
                    type="button"
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-md border bg-muted transition",
                      "hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isCurrentAvatar &&
                        "border-primary ring-2 ring-primary/30",
                    )}
                    onClick={() => onSelectShowcaseAvatar(image.key)}
                    disabled={isCurrentAvatar || isSelecting}
                    aria-label={`Use showcase image ${index + 1} as avatar`}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {(isCurrentAvatar || isSelecting) && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                        {isSelecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              Generate or upload showcase images to reuse one as the avatar.
            </p>
          )}
        </div>
      )}

      <ImageLightbox
        images={profile.avatarUrl ? [profile.avatarUrl] : []}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
