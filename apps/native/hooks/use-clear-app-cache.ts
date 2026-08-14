import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useState } from "react";
import { GUEST_ONBOARDING_KEY } from "@/hooks/use-finish-onboarding";
import {
  ONBOARDING_STORAGE_KEY,
  useOnboardingStore,
} from "@/stores/onboarding-store";

type ExpoImageCacheModule = typeof Image & {
  clearMemoryCache?: () => Promise<boolean>;
};

const USER_PREFERENCES_STORAGE_KEY = "user_preferences";

export async function clearLocalUserCache() {
  const imageCache = Image as ExpoImageCacheModule;
  const diskCleared = await Image.clearDiskCache();
  const memoryCleared = imageCache.clearMemoryCache
    ? await imageCache.clearMemoryCache()
    : true;

  await AsyncStorage.multiRemove([
    GUEST_ONBOARDING_KEY,
    ONBOARDING_STORAGE_KEY,
    USER_PREFERENCES_STORAGE_KEY,
  ]);
  useOnboardingStore.getState().clearAll();

  return diskCleared && memoryCleared;
}

export function useClearAppCache() {
  const [isClearingCache, setIsClearingCache] = useState(false);

  const clearAppCache = async () => {
    setIsClearingCache(true);

    try {
      const didClear = await clearLocalUserCache();
      if (!didClear) {
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
