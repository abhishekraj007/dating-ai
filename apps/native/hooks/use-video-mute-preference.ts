import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "@chat_video_muted";

let persistedMuted = false;
let hydrated = false;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return persistedMuted;
}

async function hydrateVideoMutePreference() {
  if (hydrated) {
    return;
  }

  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (value === "true") {
    persistedMuted = true;
  } else if (value === "false") {
    persistedMuted = false;
  }

  hydrated = true;
  emitChange();
}

void hydrateVideoMutePreference();

export function useVideoMutePreference() {
  const isMuted = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  function setMuted(muted: boolean) {
    persistedMuted = muted;
    emitChange();
    void AsyncStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
  }

  function toggleMuted() {
    setMuted(!getSnapshot());
  }

  return { isMuted, setMuted, toggleMuted };
}
