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

type FalPrimaryModel = "gpt-image-2" | "qwen-image-2-edit";

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

// ---------------------------------------------------------------------------
// fal.ai GPT-Image-2 (primary model)
// ---------------------------------------------------------------------------

const FAL_BASE_URL = "https://fal.run";

/**
 * Map common aspect-ratio strings (e.g. "3:4", "9:16") to the preset
 * `image_size` names accepted by fal.ai's GPT-Image-2 endpoint.
 * Falls back to "landscape_4_3" when no match is found.
 */
function mapAspectRatioToFalSize(
  aspectRatio: string,
): string | { width: number; height: number } {
  const presets: Record<string, string> = {
    "1:1": "square",
    "4:3": "landscape_4_3",
    "3:4": "portrait_4_3",
    "16:9": "landscape_16_9",
    "9:16": "portrait_16_9",
  };
  return presets[aspectRatio] ?? "portrait_4_3";
}

type FalImageResponse = {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type?: string;
    file_name?: string;
  }>;
};

/**
 * Generate an image using fal.ai GPT-Image-2.
 * Uses the text-to-image endpoint when no reference images are provided,
 * and the edit endpoint when reference images are available.
 */
async function generateWithFal(args: {
  prompt: string;
  aspectRatio: string;
  referenceImageUrls: string[];
  model: FalPrimaryModel;
  enableSafety?: boolean;
}): Promise<{ imageUrl: string } | null> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) return null;

  const hasReference = args.referenceImageUrls.length > 0;
  const endpoint =
    args.model === "qwen-image-2-edit"
      ? `${FAL_BASE_URL}/fal-ai/qwen-image-2/edit`
      : hasReference
        ? `${FAL_BASE_URL}/openai/gpt-image-2/edit`
        : `${FAL_BASE_URL}/openai/gpt-image-2`;

  const body: Record<string, unknown> =
    args.model === "qwen-image-2-edit"
      ? {
          prompt: args.prompt,
          output_format: "webp",
          num_images: 1,
          image_urls: args.referenceImageUrls,
          enable_safety_checker: Boolean(args.enableSafety),
        }
      : {
          prompt: args.prompt,
          quality: "medium",
          output_format: "webp",
          num_images: 1,
          image_size: "portrait_4_3",
        };

  if (args.model === "gpt-image-2" && hasReference) {
    body.image_urls = args.referenceImageUrls;
    body.image_size = "auto";
  } else if (args.model === "gpt-image-2") {
    body.image_size = mapAspectRatioToFalSize(args.aspectRatio);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(`fal.ai responded with ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as FalImageResponse;
  const url = data.images?.[0]?.url;
  if (!url) {
    throw new Error("fal.ai returned no image URL in response");
  }

  return { imageUrl: url };
}

// ---------------------------------------------------------------------------
// Replicate fallback chain
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const FAL_MODEL_NAME = "openai/gpt-image-2 (fal.ai)";
const FAL_QWEN_IMAGE_EDIT_MODEL_NAME = "fal-ai/qwen-image-2/edit (fal.ai)";

export function imageGenerationModelName(isDev: boolean): string {
  if (isDev) return "picsum.photos (dev)";
  const falAvailable = Boolean(process.env.FAL_KEY);
  const replicateChain = IMAGE_MODEL_CHAIN.map((m) => m.id).join(" -> ");
  return falAvailable
    ? `${FAL_MODEL_NAME} -> ${replicateChain}`
    : replicateChain;
}

export async function generateImageWithFallback(args: {
  prompt: string;
  aspectRatio: string;
  referenceImageUrls?: string[];
  applyReferenceConsistencyPrefix?: boolean;
  primaryFalModel?: FalPrimaryModel;
  enableSafety?: boolean;
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

  // --- Primary: fal.ai GPT-Image-2 ---
  if (process.env.FAL_KEY) {
    const falModels: FalPrimaryModel[] =
      args.primaryFalModel === "qwen-image-2-edit"
        ? ["qwen-image-2-edit", "gpt-image-2"]
        : ["gpt-image-2"];

    for (const falModel of falModels) {
      const modelName =
        falModel === "qwen-image-2-edit"
          ? FAL_QWEN_IMAGE_EDIT_MODEL_NAME
          : FAL_MODEL_NAME;

      if (falModel === "qwen-image-2-edit" && referenceImageUrls.length === 0) {
        attempts.push({
          model: modelName,
          error: "Skipped because this model requires a reference image",
        });
        continue;
      }

      try {
        const result = await generateWithFal({
          prompt,
          aspectRatio: args.aspectRatio,
          referenceImageUrls,
          model: falModel,
          enableSafety: args.enableSafety,
        });
        if (result) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            model: modelName,
          };
        }
      } catch (error) {
        attempts.push({
          model: modelName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  // --- Fallback: Replicate model chain ---
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
