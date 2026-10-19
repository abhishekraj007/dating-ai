import { useMutation, useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import {
  normalizeVideoDuration,
  type VideoDuration,
} from "@/lib/video-duration";

export function useVideoDurationPreference() {
  const saved = useQuery(api.features.preferences.queries.getUserVideoDuration);
  const setRemote = useMutation(
    api.features.preferences.queries.setUserVideoDuration,
  );

  return {
    videoDuration: normalizeVideoDuration(saved),
    setVideoDuration: async (duration: VideoDuration) => {
      await setRemote({ videoDuration: duration });
    },
  };
}
