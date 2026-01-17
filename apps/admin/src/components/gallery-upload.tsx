"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  key?: string;
}

interface GalleryUploadProps {
  images: GalleryImage[];
  maxFiles?: number;
  isUploading?: boolean;
  deletingKey?: string | null;
  onUpload: () => void;
  onDelete: (key: string) => void;
  className?: string;
}

export function GalleryUpload({
  images,
  maxFiles = 10,
  isUploading = false,
  deletingKey = null,
  onUpload,
  onDelete,
  className,
}: GalleryUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label>
          Photos ({images.length}/{maxFiles})
        </Label>
      </div>

      {/* Upload Area - show when no images or can add more */}
      {images.length < maxFiles && (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            "hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-50"
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
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
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
                    setSelectedImage(image.url);
                  }}
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                {/* Delete Button */}
                {image.key && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(image.key!);
                    }}
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    disabled={deletingKey === image.key}
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

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              onClick={() => setSelectedImage(null)}
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
