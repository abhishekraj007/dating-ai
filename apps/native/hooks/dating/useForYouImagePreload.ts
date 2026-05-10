import { useEffect, useRef } from "react";
import { Image } from "expo-image";
import type { ForYouProfile } from "./useForYou";

const PRELOAD_PROFILE_COUNT = 2;

function getPreloadUrls(profiles: ForYouProfile[]) {
  const urls: string[] = [];

  for (const profile of profiles.slice(0, PRELOAD_PROFILE_COUNT)) {
    if (profile.avatarUrl && !urls.includes(profile.avatarUrl)) {
      urls.push(profile.avatarUrl);
    }
  }

  return urls;
}

export function useForYouImagePreload(profiles: ForYouProfile[]) {
  const preloadSignatureRef = useRef("");

  useEffect(() => {
    const urls = getPreloadUrls(profiles);
    const preloadSignature = urls.join("|");

    if (!preloadSignature || preloadSignature === preloadSignatureRef.current) {
      if (!preloadSignature) {
        preloadSignatureRef.current = "";
      }
      return;
    }

    preloadSignatureRef.current = preloadSignature;
    void Image.prefetch(urls, { cachePolicy: "memory-disk" }).catch(() => {});
  }, [profiles]);
}
