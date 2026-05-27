import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const P_VIDEO_MODEL = "prunaai/p-video" as const;

const DEV_DUMMY_VIDEO_URL =
  "https://samplelib.com/preview/mp4/sample-5s.mp4";

export type VideoGenerationResult =
  | {
    success: true;
    videoUrl: string;
    model: string;
  }
  | {
    success: false;
    error: string;
  };

function extractVideoUrl(output: unknown): string | null {
  if (typeof output === "string") {
    return output.startsWith("http") ? output : null;
  }

  if (output instanceof URL) {
    return output.toString();
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = extractVideoUrl(item);
      if (url) {
        return url;
      }
    }
    return null;
  }

  if (!output || typeof output !== "object") {
    return null;
  }

  const fileLike = output as {
    url?: () => unknown;
    toString?: () => string;
  };

  if (typeof fileLike.url === "function") {
    const urlValue = fileLike.url();
    if (typeof urlValue === "string") {
      return urlValue;
    }
    if (urlValue instanceof URL) {
      return urlValue.toString();
    }
  }

  if (typeof fileLike.toString === "function") {
    const stringValue = fileLike.toString();
    if (
      stringValue.startsWith("http://") ||
      stringValue.startsWith("https://")
    ) {
      return stringValue;
    }
  }

  return null;
}

export async function generateVideoWithFallback(args: {
  prompt: string;
  referenceImageUrl?: string | null;
  enableSafety?: boolean;
  isDev: boolean;
}): Promise<VideoGenerationResult> {
  if (args.isDev) {
    return {
      success: true,
      videoUrl: DEV_DUMMY_VIDEO_URL,
      model: "dev-dummy-video",
    };
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return {
      success: false,
      error: "REPLICATE_API_TOKEN is not configured",
    };
  }

  const input: Record<string, unknown> = {
    prompt: args.prompt,
    duration: 5,
    resolution: "720p",
    fps: 24,
    aspect_ratio: "9:16",
    draft: false,
    save_audio: true,
    prompt_upsampling: true,
    disable_safety_filter: args.enableSafety === false,
  };

  if (args.referenceImageUrl) {
    input.image = args.referenceImageUrl;
  }

  try {
    const output = await replicate.run(P_VIDEO_MODEL, { input });
    const videoUrl = extractVideoUrl(output);

    if (!videoUrl) {
      return {
        success: false,
        error: "No video URL returned from provider",
      };
    }

    return {
      success: true,
      videoUrl,
      model: P_VIDEO_MODEL,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Video generation failed",
    };
  }
}
