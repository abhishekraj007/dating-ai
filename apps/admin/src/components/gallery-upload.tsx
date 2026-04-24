"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/image-lightbox";

interface GalleryImage {
  url: string;
  key?: string;
}

interface GalleryUploadProps {
  images: GalleryImage[];
  maxFiles?: number;
  isUploading?: boolean;
  deletingKey?: string | null;
  onUpload?: () => void;
  onDelete?: (key: string) => void;
  headerAction?: ReactNode;
  className?: string;
}

export function GalleryUpload({
  images,
  maxFiles = 10,
  isUploading = false,
  deletingKey = null,
  onUpload,
  onDelete,
  headerAction,
  className,
}: GalleryUploadProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label>
          Photos ({images.length}/{maxFiles})
        </Label>
        {headerAction}
      </div>

      {/* Upload Area - show when no images or can add more */}
      {onUpload && images.length < maxFiles && (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            "hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-50",
          )}
          onClick={onUpload}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isUploading ? "Uploading..." : "Click to upload photos"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB each (max {maxFiles} files)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, i) => (
            <div
              key={image.key ?? i}
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {/* View Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`View photo ${i + 1}`}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                {/* Delete Button */}
                {image.key && onDelete && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(image.key!);
                    }}
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    disabled={deletingKey === image.key}
                    aria-label={`Delete photo ${i + 1}`}
                  >
                    {deletingKey === image.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageLightbox
        images={images.map((img) => img.url)}
        open={lightboxIndex !== null}
        initialIndex={lightboxIndex ?? 0}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      />
    </div>
  );
}
