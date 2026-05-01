"use client";

import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

interface ImageLightboxProps {
  images: string[];
  open: boolean;
  initialIndex?: number;
  onOpenChange: (open: boolean) => void;
}

const LIGHTBOX_PLUGINS = [Zoom, Counter];

export function ImageLightbox({
  images,
  open,
  initialIndex = 0,
  onOpenChange,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const slides = images.map((src, imageIndex) => ({
    src,
    alt: `Image ${imageIndex + 1} of ${images.length}`,
  }));

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  return (
    <Lightbox
      open={open && slides.length > 0}
      close={() => onOpenChange(false)}
      index={index}
      slides={slides}
      plugins={LIGHTBOX_PLUGINS}
      carousel={{ finite: slides.length <= 1 }}
      controller={{ closeOnBackdropClick: true }}
      animation={{ fade: 180, swipe: 220, zoom: 240 }}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 1.8,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 60,
        scrollToZoom: true,
        pinchZoomV4: true,
      }}
      counter={{ container: { style: { top: "unset", bottom: 0 } } }}
      on={{ view: ({ index: currentIndex }) => setIndex(currentIndex) }}
    />
  );
}
