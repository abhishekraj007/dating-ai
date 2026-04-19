import { r2 } from "../../../uploads";
import { generateImageWithFallback } from "../imageGeneration";
import { IS_DEV } from "./constants";
import { GenerationFailureError } from "./types";
import { sleep } from "./textUtils";

export function shouldRetryImageFetch(status: number): boolean {
  return status === 404 || status === 408 || status === 429 || status >= 500;
}

export async function downloadImageWithRetry(
  imageUrl: string,
  maxAttempts = 4,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        const retryable = shouldRetryImageFetch(response.status);
        if (!retryable || attempt === maxAttempts) {
          throw new GenerationFailureError(
            "image_download_retry_exhausted",
            `download_retry_exhausted status=${response.status} attempts=${attempt} url=${imageUrl}`,
          );
        }
        await sleep(300 * attempt + Math.floor(Math.random() * 250));
        continue;
      }

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      return {
        bytes: new Uint8Array(buffer),
        contentType: response.headers.get("content-type") || "image/webp",
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown fetch error");
      if (attempt === maxAttempts) {
        break;
      }
      await sleep(300 * attempt + Math.floor(Math.random() * 250));
    }
  }

  throw (
    lastError ??
    new GenerationFailureError(
      "image_download_retry_exhausted",
      "download_retry_exhausted unknown_error",
    )
  );
}

export function getImageExtension(contentType: string): string {
  return contentType.includes("png")
    ? "png"
    : contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : "webp";
}

export async function createAndStoreGeneratedImage(
  ctx: Parameters<typeof r2.store>[0],
  prompt: string,
  referenceImageUrl: string | null,
  keyPrefix: string,
  applyReferenceConsistencyPrefix = true,
): Promise<string> {
  let lastError: Error | null = null;

  for (
    let generationAttempt = 1;
    generationAttempt <= 2;
    generationAttempt += 1
  ) {
    const imageResult = await generateImageWithFallback({
      prompt,
      aspectRatio: "3:4",
      referenceImageUrls: referenceImageUrl ? [referenceImageUrl] : [],
      applyReferenceConsistencyPrefix,
      isDev: IS_DEV,
      devWidth: 768,
      devHeight: 1024,
    });
    if (!imageResult.success) {
      lastError = new GenerationFailureError(
        "image_generation_retry_exhausted",
        `image_generation_failed attempt=${generationAttempt} reason=${imageResult.error}`,
      );
      continue;
    }

    try {
      const downloaded = await downloadImageWithRetry(imageResult.imageUrl);
      const ext = getImageExtension(downloaded.contentType);
      const key = `${keyPrefix}/${crypto.randomUUID()}.${ext}`;
      await r2.store(ctx, downloaded.bytes, key);
      return key;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new GenerationFailureError(
              "image_generation_retry_exhausted",
              "image_processing_failed",
            );
    }
  }

  throw (
    lastError ??
    new GenerationFailureError(
      "image_generation_retry_exhausted",
      "image_generation_retry_exhausted",
    )
  );
}

export function imageGenerationModelName(isDev: boolean): string {
  return isDev
    ? "picsum.photos (dev)"
    : "google/nano-banana-2 -> bytedance/seedream-5-lite -> qwen/qwen-image-edit-2511";
}
