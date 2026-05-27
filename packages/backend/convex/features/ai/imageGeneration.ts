import Replicate from "replicate";
import {
  FAL_GPT_IMAGE_2_MODEL,
  FAL_QWEN_IMAGE_EDIT_MODEL,
} from "./profileGen/imageModelOptions";

export {
  FAL_GPT_IMAGE_2_MODEL,
  FAL_QWEN_IMAGE_EDIT_MODEL,
  IMAGE_GENERATION_MODEL_OPTIONS,
  normalizeImageGenerationModel,
} from "./profileGen/imageModelOptions";
export type { ImageGenerationModelOption } from "./profileGen/imageModelOptions";

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
        quality: "low",
        output_format: "webp",
        num_images: 1,
        image_size: "portrait_4_3",
      };

  if (args.model === "gpt-image-2" && hasReference) {
    body.image_urls = args.referenceImageUrls;
    // Force a fresh frame instead of "auto". With "auto" the edit endpoint
    // matches the reference image's framing and head crop, which causes
    // every showcase slot to mirror the avatar's pose. Mapping from the
    // requested aspect ratio lets the prompt drive composition.
    body.image_size = mapAspectRatioToFalSize(args.aspectRatio);
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
//
// IMPORTANT: this prefix is intentionally identity-only. Previously it also
// said "preserve body type exactly" and "only change outfit, pose, setting" -
// which models treat as an instruction to keep the head crop, head angle,
// silhouette, and even the clothing close to the reference. That made every
// showcase slot mirror the avatar. We now lock only facial identity and
// explicitly free pose / framing / outfit / setting, so per-slot prompts can
// actually drive variation.
const REFERENCE_IMAGE_CONSISTENCY_PREFIX =
  "The person in the reference image is the same person in this image. Preserve only their facial identity: face shape, skin tone, eye color, eyebrow shape, hair color and texture. Their pose, head angle, body framing, outfit, setting, and lighting must follow the description below and intentionally differ from the reference image.";

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

export function imageGenerationModelName(
  isDev: boolean,
  preferredModel?: string,
): string {
  if (isDev) return "picsum.photos (dev)";
  const falAvailable = Boolean(process.env.FAL_KEY);
  const replicateChain = IMAGE_MODEL_CHAIN.map((m) => m.id).join(" -> ");
  const defaultChain = falAvailable
    ? `${FAL_GPT_IMAGE_2_MODEL} -> ${replicateChain}`
    : replicateChain;
  if (preferredModel) {
    return `${preferredModel} -> ${defaultChain}`;
  }
  return defaultChain;
}

type FalGenerationAttempt = {
  kind: "fal";
  model: FalPrimaryModel;
  name: string;
};

type ReplicateGenerationAttempt = {
  kind: "replicate";
  config: ImageModelConfig;
};

type ImageGenerationAttempt = FalGenerationAttempt | ReplicateGenerationAttempt;

function falModelName(model: FalPrimaryModel): string {
  return model === "qwen-image-2-edit"
    ? FAL_QWEN_IMAGE_EDIT_MODEL
    : FAL_GPT_IMAGE_2_MODEL;
}

function falModelFromName(modelName: string): FalPrimaryModel | null {
  if (modelName === FAL_GPT_IMAGE_2_MODEL) {
    return "gpt-image-2";
  }
  if (modelName === FAL_QWEN_IMAGE_EDIT_MODEL) {
    return "qwen-image-2-edit";
  }
  return null;
}

function buildImageGenerationAttempts(args: {
  preferredModel?: string;
  primaryFalModel?: FalPrimaryModel;
}): ImageGenerationAttempt[] {
  const attempts: ImageGenerationAttempt[] = [];
  const seen = new Set<string>();

  const addFal = (model: FalPrimaryModel) => {
    const name = falModelName(model);
    if (seen.has(name)) {
      return;
    }
    seen.add(name);
    attempts.push({ kind: "fal", model, name });
  };

  const addReplicate = (config: ImageModelConfig) => {
    if (seen.has(config.id)) {
      return;
    }
    seen.add(config.id);
    attempts.push({ kind: "replicate", config });
  };

  const preferredFalModel = args.preferredModel
    ? falModelFromName(args.preferredModel)
    : null;
  if (preferredFalModel) {
    addFal(preferredFalModel);
  } else if (args.preferredModel) {
    const replicateModel = IMAGE_MODEL_CHAIN.find(
      (model) => model.id === args.preferredModel,
    );
    if (replicateModel) {
      addReplicate(replicateModel);
    }
  }

  if (process.env.FAL_KEY) {
    const defaultFalModels: FalPrimaryModel[] =
      args.primaryFalModel === "qwen-image-2-edit"
        ? ["qwen-image-2-edit", "gpt-image-2"]
        : ["gpt-image-2"];
    for (const model of defaultFalModels) {
      addFal(model);
    }
  }

  for (const model of IMAGE_MODEL_CHAIN) {
    addReplicate(model);
  }

  return attempts;
}

async function runImageGenerationAttempt(
  attempt: ImageGenerationAttempt,
  args: {
    prompt: string;
    aspectRatio: string;
    referenceImageUrls: string[];
    enableSafety?: boolean;
  },
): Promise<{ imageUrl: string; model: string }> {
  if (attempt.kind === "fal") {
    if (
      attempt.model === "qwen-image-2-edit" &&
      args.referenceImageUrls.length === 0
    ) {
      throw new Error("Skipped because this model requires a reference image");
    }

    const result = await generateWithFal({
      prompt: args.prompt,
      aspectRatio: args.aspectRatio,
      referenceImageUrls: args.referenceImageUrls,
      model: attempt.model,
      enableSafety: args.enableSafety,
    });
    if (!result) {
      throw new Error("Provider returned no image URL");
    }
    return { imageUrl: result.imageUrl, model: attempt.name };
  }

  if (
    args.referenceImageUrls.length === 0 &&
    !attempt.config.supportsGenerationWithoutReference
  ) {
    throw new Error("Skipped because this model requires a reference image");
  }

  const output = await replicate.run(attempt.config.id, {
    input: attempt.config.buildInput({
      prompt: args.prompt,
      aspectRatio: args.aspectRatio,
      referenceImageUrls: args.referenceImageUrls,
    }),
  });
  const imageUrl = extractImageUrl(output);
  if (!imageUrl) {
    throw new Error("No image URL returned from provider");
  }
  return { imageUrl, model: attempt.config.id };
}

export async function generateImageWithFallback(args: {
  prompt: string;
  aspectRatio: string;
  referenceImageUrls?: string[];
  applyReferenceConsistencyPrefix?: boolean;
  primaryFalModel?: FalPrimaryModel;
  preferredModel?: string;
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
  const generationAttempts = buildImageGenerationAttempts({
    preferredModel: args.preferredModel,
    primaryFalModel: args.primaryFalModel,
  });

  for (const generationAttempt of generationAttempts) {
    const modelName =
      generationAttempt.kind === "fal"
        ? generationAttempt.name
        : generationAttempt.config.id;

    if (generationAttempt.kind === "fal" && !process.env.FAL_KEY) {
      attempts.push({
        model: modelName,
        error: "FAL_KEY is not configured",
      });
      continue;
    }

    try {
      const result = await runImageGenerationAttempt(generationAttempt, {
        prompt,
        aspectRatio: args.aspectRatio,
        referenceImageUrls,
        enableSafety: args.enableSafety,
      });
      return {
        success: true,
        imageUrl: result.imageUrl,
        model: result.model,
      };
    } catch (error) {
      attempts.push({
        model: modelName,
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
