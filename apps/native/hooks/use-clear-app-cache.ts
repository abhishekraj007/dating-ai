import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useState } from "react";

type ExpoImageCacheModule = typeof Image & {
  clearMemoryCache?: () => Promise<boolean>;
};

export function useClearAppCache() {
  const [isClearingCache, setIsClearingCache] = useState(false);

  const clearAppCache = async () => {
    setIsClearingCache(true);

    try {
      const imageCache = Image as ExpoImageCacheModule;
      const diskCleared = await Image.clearDiskCache();
      const memoryCleared = imageCache.clearMemoryCache
        ? await imageCache.clearMemoryCache()
        : true;

      if (!diskCleared || !memoryCleared) {
        throw new Error("Failed to clear image cache");
      }
    } finally {
      setIsClearingCache(false);
    }
  };

  return {
    clearAppCache,
    isClearingCache,
  };
}
