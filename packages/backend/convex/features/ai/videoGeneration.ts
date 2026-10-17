const FAL_QUEUE_URL = "https://queue.fal.run";
const WAN_REFERENCE_TO_VIDEO_MODEL = "alibaba/wan-3.0/reference-to-video";

const DEV_DUMMY_VIDEO_URL =
  "https://samplelib.com/preview/mp4/sample-5s.mp4";

const DEV_VIDEO_GENERATION_DELAY_MS = 30_000;

const DEFAULT_VIDEO_DURATION = 5;
const MIN_VIDEO_DURATION = 2;
const MAX_VIDEO_DURATION = 10;
const VIDEO_POLL_INTERVAL_MS = 4_000;
const VIDEO_POLL_ATTEMPTS = 120;

function clampVideoDuration(duration?: number): number {
  if (duration === undefined) {
    return DEFAULT_VIDEO_DURATION;
  }

  return Math.min(
    MAX_VIDEO_DURATION,
    Math.max(MIN_VIDEO_DURATION, Math.round(duration)),
  );
}

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

type FalQueueSubmit = {
  status_url?: string;
  response_url?: string;
};

type FalQueueStatus = {
  status?: string;
  error?: string;
};

function readVideoUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    video?: { url?: string };
    data?: { video?: { url?: string } };
  };

  return record.video?.url ?? record.data?.video?.url ?? null;
}

function referencePrompt(referenceCount: number, prompt: string): string {
  if (referenceCount > 1) {
    return `Image 1 is the person's identity. Image 2 is their look in this video. ${prompt}`;
  }

  return `The subject in Image 1 is the person in this video. ${prompt}`;
}

async function falQueueVideo(body: Record<string, unknown>): Promise<string> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error("FAL_KEY is not configured");
  }

  const headers = {
    Authorization: `Key ${falKey}`,
    "Content-Type": "application/json",
  };

  const submitResponse = await fetch(
    `${FAL_QUEUE_URL}/${WAN_REFERENCE_TO_VIDEO_MODEL}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
  );

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text();
    throw new Error(
      `fal.ai responded with ${submitResponse.status}: ${errorText}`,
    );
  }

  const queued = (await submitResponse.json()) as FalQueueSubmit;
  if (!queued.status_url || !queued.response_url) {
    throw new Error("fal.ai did not return queue URLs");
  }

  for (let attempt = 0; attempt < VIDEO_POLL_ATTEMPTS; attempt += 1) {
    const statusResponse = await fetch(queued.status_url, {
      headers: { Authorization: `Key ${falKey}` },
    });
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`fal.ai status ${statusResponse.status}: ${errorText}`);
    }

    const status = (await statusResponse.json()) as FalQueueStatus;
    if (status.status === "COMPLETED") {
      const resultResponse = await fetch(queued.response_url, {
        headers: { Authorization: `Key ${falKey}` },
      });
      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        throw new Error(`fal.ai result ${resultResponse.status}: ${errorText}`);
      }

      const videoUrl = readVideoUrl(await resultResponse.json());
      if (!videoUrl) {
        throw new Error("fal.ai returned no video URL");
      }
      return videoUrl;
    }

    if (status.status === "FAILED") {
      throw new Error(status.error ?? "fal.ai video generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, VIDEO_POLL_INTERVAL_MS));
  }

  throw new Error("fal.ai video generation timed out");
}

export async function generateVideoWithFallback(args: {
  prompt: string;
  referenceImageUrls?: string[];
  duration?: number;
  enableSafety?: boolean;
  isDev: boolean;
}): Promise<VideoGenerationResult> {
  if (args.isDev) {
    await new Promise((resolve) =>
      setTimeout(resolve, DEV_VIDEO_GENERATION_DELAY_MS),
    );

    return {
      success: true,
      videoUrl: DEV_DUMMY_VIDEO_URL,
      model: "dev-dummy-video",
    };
  }

  const referenceImageUrls = (args.referenceImageUrls ?? []).filter(Boolean);
  if (referenceImageUrls.length === 0) {
    return {
      success: false,
      error: "Reference image is required for video generation",
    };
  }

  const allowAdultPrompt = args.enableSafety === false;

  try {
    const videoUrl = await falQueueVideo({
      prompt: referencePrompt(referenceImageUrls.length, args.prompt),
      reference_image_urls: referenceImageUrls,
      resolution: "480p",
      aspect_ratio: "9:16",
      duration: clampVideoDuration(args.duration),
      audio: false,
      enable_prompt_expansion: !allowAdultPrompt,
      enable_safety_checker: !allowAdultPrompt,
    });

    return {
      success: true,
      videoUrl,
      model: `${WAN_REFERENCE_TO_VIDEO_MODEL} (fal.ai)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Video generation failed",
    };
  }
}
