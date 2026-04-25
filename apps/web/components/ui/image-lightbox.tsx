"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  open: boolean;
  initialIndex?: number;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  images,
  open,
  initialIndex = 0,
  onOpenChange,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;

    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
    const next = () => setIndex((i) => (i + 1) % images.length);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onOpenChange]);

  if (!open || images.length === 0) return null;

  const current = images[index];
  const hasMultiple = images.length > 1;

  const goPrev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setIndex((i) => (i + 1) % images.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={() => onOpenChange(false)}
    >
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(false);
        }}
        variant="secondary"
        size="icon"
        className="absolute top-4 right-4 h-9 w-9 z-10"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </Button>

      {hasMultiple && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          variant="secondary"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      <div
        className="relative flex max-h-full max-w-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={`Image ${index + 1} of ${images.length}`}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain select-none"
          draggable={false}
        />
      </div>

      {hasMultiple && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          variant="secondary"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 z-10"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white z-10">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
