export const FAL_GPT_IMAGE_2_MODEL = "openai/gpt-image-2 (fal.ai)";
export const FAL_QWEN_IMAGE_EDIT_MODEL = "fal-ai/qwen-image-2/edit (fal.ai)";

export type ImageGenerationModelOption = {
  value: string;
  label: string;
  requiresReference: boolean;
};

export const REPLICATE_IMAGE_MODEL_IDS = [
  "google/nano-banana-2",
  "bytedance/seedream-5-lite",
  "qwen/qwen-image-edit-2511",
] as const;

export const REPLICATE_IMAGE_MODEL_REQUIRES_REFERENCE: Record<
  (typeof REPLICATE_IMAGE_MODEL_IDS)[number],
  boolean
> = {
  "google/nano-banana-2": false,
  "bytedance/seedream-5-lite": false,
  "qwen/qwen-image-edit-2511": true,
};

export const IMAGE_GENERATION_MODEL_OPTIONS: ImageGenerationModelOption[] = [
  {
    value: FAL_GPT_IMAGE_2_MODEL,
    label: "GPT Image 2 (fal.ai)",
    requiresReference: false,
  },
  {
    value: FAL_QWEN_IMAGE_EDIT_MODEL,
    label: "Qwen Image 2 Edit (fal.ai)",
    requiresReference: true,
  },
  ...REPLICATE_IMAGE_MODEL_IDS.map((modelId) => ({
    value: modelId,
    label: `Replicate: ${modelId}`,
    requiresReference: REPLICATE_IMAGE_MODEL_REQUIRES_REFERENCE[modelId],
  })),
];

const IMAGE_GENERATION_MODEL_VALUES = new Set(
  IMAGE_GENERATION_MODEL_OPTIONS.map((option) => option.value),
);

export function normalizeImageGenerationModel(
  modelName: string | undefined,
): string | undefined {
  const trimmed = modelName?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!IMAGE_GENERATION_MODEL_VALUES.has(trimmed)) {
    throw new Error(`Unknown image generation model: ${trimmed}`);
  }
  return trimmed;
}
