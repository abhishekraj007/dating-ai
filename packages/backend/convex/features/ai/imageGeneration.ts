import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type ReplicateModelId = `${string}/${string}` | `${string}/${string}:${string}`;

type ImageModelAttempt = {
  model: string;
  error: string;
};

type ImageModelConfig = {
  id: ReplicateModelId;
  supportsGenerationWithoutReference: boolean;
  buildInput: (args: {
    prompt: string;
    aspectRatio: string;
    referenceImageUrls: string[];
  }) => Record<string, unknown>;
};

export type ImageGenerationResult =
  | {
      success: true;
      imageUrl: string;
      model: string;
    }
  | {
      success: false;
      error: string;
      attempts: ImageModelAttempt[];
    };

const IMAGE_MODEL_CHAIN: ImageModelConfig[] = [
  {
    id: "google/nano-banana-2",
    supportsGenerationWithoutReference: true,
    buildInput: ({ prompt, aspectRatio, referenceImageUrls }) => ({
      prompt,
      image_input: referenceImageUrls,
      aspect_ratio:
        referenceImageUrls.length > 0 ? "match_input_image" : aspectRatio,
      resolution: "1K",
      output_format: "jpg",
    }),
  },
  {
    id: "bytedance/seedream-5-lite",
    supportsGenerationWithoutReference: true,
    buildInput: ({ prompt, aspectRatio, referenceImageUrls }) => ({
      prompt,
      image_input: referenceImageUrls,
      aspect_ratio:
        referenceImageUrls.length > 0 ? "match_input_image" : aspectRatio,
      size: "2K",
    }),
  },
  {
    id: "qwen/qwen-image-edit-2511",
    supportsGenerationWithoutReference: false,
    buildInput: ({ prompt, aspectRatio, referenceImageUrls }) => ({
      prompt,
      image: referenceImageUrls,
      aspect_ratio: aspectRatio,
    }),
  },
];

// NOTE: We intentionally do NOT include "freckles and marks" here.
// Image models treat every mention of a skin feature as an emphasis cue and
// amplify it. Telling the model to preserve freckles caused the showcase
// images to render noticeably heavier freckling than the reference photo.
// "Skin tone" alone is sufficient to keep the ethnicity / complexion stable.
const REFERENCE_IMAGE_CONSISTENCY_PREFIX =
  "The person in the reference image is the same person in this image. Preserve their face shape, skin tone, eye color, eyebrow shape, hair color, and overall body type exactly. Only change outfit, pose, setting, and lighting as described below.";

function extractImageUrl(output: unknown): string | null {
  if (typeof output === "string") {
    return output;
  }

  if (output instanceof URL) {
    return output.toString();
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = extractImageUrl(item);
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

export function imageGenerationModelName(isDev: boolean): string {
  return isDev
    ? "picsum.photos (dev)"
    : IMAGE_MODEL_CHAIN.map((model) => model.id).join(" -> ");
}

export async function generateImageWithFallback(args: {
  prompt: string;
  aspectRatio: string;
  referenceImageUrls?: string[];
  applyReferenceConsistencyPrefix?: boolean;
  isDev: boolean;
  devWidth: number;
  devHeight: number;
}): Promise<ImageGenerationResult> {
  if (args.isDev) {
    try {
      const randomId = Math.floor(Math.random() * 1000);
      return {
        success: true,
        imageUrl: `https://picsum.photos/id/${randomId}/${args.devWidth}/${args.devHeight}`,
        model: "picsum.photos (dev)",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        attempts: [
          {
            model: "picsum.photos (dev)",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  }

  const referenceImageUrls = args.referenceImageUrls?.filter(Boolean) ?? [];
  const applyReferenceConsistencyPrefix =
    args.applyReferenceConsistencyPrefix ?? true;
  const prompt =
    referenceImageUrls.length > 0 && applyReferenceConsistencyPrefix
      ? `${REFERENCE_IMAGE_CONSISTENCY_PREFIX} ${args.prompt}`
      : args.prompt;
  const attempts: ImageModelAttempt[] = [];

  for (const model of IMAGE_MODEL_CHAIN) {
    if (
      referenceImageUrls.length === 0 &&
      !model.supportsGenerationWithoutReference
    ) {
      attempts.push({
        model: model.id,
        error: "Skipped because this model requires a reference image",
      });
      continue;
    }

    try {
      const output = await replicate.run(model.id, {
        input: model.buildInput({
          prompt,
          aspectRatio: args.aspectRatio,
          referenceImageUrls,
        }),
      });
      const imageUrl = extractImageUrl(output);

      if (!imageUrl) {
        throw new Error("No image URL returned from provider");
      }

      return {
        success: true,
        imageUrl,
        model: model.id,
      };
    } catch (error) {
      attempts.push({
        model: model.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: false,
    error: attempts
      .map((attempt) => `${attempt.model}: ${attempt.error}`)
      .join(" | "),
    attempts,
  };
}
