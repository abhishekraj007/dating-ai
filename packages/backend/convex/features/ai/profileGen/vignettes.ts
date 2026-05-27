import { generateObject } from "ai";
import { z } from "zod";
import { gatewayProvider, openRouterProvider } from "../aiProviders";
import {
  SHOWCASE_VIGNETTE_FALLBACK_MODELS,
  SHOWCASE_VIGNETTE_MODEL,
} from "./constants";
import type {
  AppearanceProfile,
  ProfileCandidate,
  SceneVignette,
  ShowcaseSlotPlan,
} from "./types";
import { uniqueModelList } from "./textUtils";

/**
 * Zod schema for a single per-slot vignette. Every field is optional because
 * the model might omit one occasionally; the prompt builder gracefully falls
 * back to the `ShowcaseSlotPlan` baseline for any field the model skipped.
 */
const sceneVignetteSchema = z.object({
  action: z
    .string()
    .min(5)
    .max(240)
    .describe(
      "A specific, vivid action the subject is doing in this slot, overriding the baseline action. One short sentence.",
    )
    .optional(),
  settingDetail: z
    .string()
    .min(5)
    .max(240)
    .describe(
      "A concrete location detail (a neighborhood, shop name, landmark, specific object visible) appended to the baseline setting.",
    )
    .optional(),
  prop: z
    .string()
    .min(3)
    .max(120)
    .describe(
      "A small, scene-appropriate prop the subject holds or carries.",
    )
    .optional(),
  outfit: z
    .string()
    .min(12)
    .max(220)
    .describe(
      "A complete, original, scene-appropriate outfit for this slot. Include garment types, color/material details, and one styling detail. Must not repeat the avatar outfit or any other slot outfit.",
    ),
  wardrobeAccent: z
    .string()
    .min(3)
    .max(120)
    .describe(
      "A small optional refinement layered on top of the outfit: a color, fabric, pattern, or single accessory. Never face or body.",
    )
    .optional(),
  emotionalBeat: z
    .string()
    .min(3)
    .max(160)
    .describe(
      "A one-phrase emotional beat: what the subject is feeling or about to do in the next instant.",
    )
    .optional(),
  timeOfDay: z
    .string()
    .min(3)
    .max(60)
    .describe(
      "Specific time of day or light condition that fits the scene and season.",
    )
    .optional(),
});

const vignetteBatchSchema = z.object({
  vignettes: z
    .array(sceneVignetteSchema)
    .describe(
      "One vignette per slot, in the same order as the input slots. Length MUST equal the slot count.",
    ),
});

function buildVignetteBatchPrompt(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  plans: ShowcaseSlotPlan[],
): string {
  const slotLines = plans
    .map((plan, index) => {
      return [
        `Slot ${index + 1}:`,
        `  sceneId: ${plan.sceneId}`,
        `  category: ${plan.category}`,
        `  baseline_action: ${plan.action}`,
        `  baseline_setting: ${plan.setting}`,
        `  composition: ${plan.composition}`,
        `  lighting: ${plan.lighting}`,
        `  season: ${plan.season}`,
        `  time_of_day: ${plan.timeOfDay}`,
        `  baseline_prop: ${plan.accentProp}`,
        plan.requireDaylight ? `  must_be_daylight: true` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return `You are writing short, concrete scene vignettes for a dating-app profile's showcase photos.

The profile:
- name: ${candidate.name}
- gender: ${candidate.gender}
- age: ${candidate.age}
- occupation: ${candidate.occupation}
- location: ${candidate.location}
- interests: ${candidate.interests.join(", ")}
- bio: ${candidate.bio}
- city archetype: ${appearance.cityArchetype}
- vibe / aesthetic: ${appearance.vibe}
- avatar outfit to avoid: ${appearance.outfit}

For EACH slot below, produce a bespoke vignette so the photo feels specific to THIS person - not a generic scene. Use the bio, occupation, and interests to anchor concrete details (real places, real objects, culturally coherent wardrobe, believable moments).

Hard rules:
- The vignette must stay photorealistic and contemporary.
- The subject's face, skin tone, hair, and body are fixed by a reference image - DO NOT describe those. Only change outfit, pose, setting, props, and light.
- "action" must be one short sentence (<= 240 chars).
- "settingDetail" should be a concrete, grounded location detail (neighborhood name, shop style, a visible landmark, a specific object). Keep plausible for the city and archetype.
- "prop" should be a small, scene-appropriate object. If the baseline_prop already fits perfectly, you may echo it, but prefer something more specific. Avoid overused dating-app props (vintage film cameras, polaroids, generic iced coffee) unless the scene truly demands it.
- "outfit" is required. Generate a complete outfit from scratch for this slot: garment types + color/material + styling detail. Do not choose from a memorized list; invent a coherent look for this specific person and scene.
- Outfit diversity rules: never repeat the avatar outfit ("${appearance.outfit}"), never repeat the same dominant color, same main garment type, same silhouette, or same occasion across slots. Each slot should feel like a different day, mood, and setting.
- "wardrobeAccent" is optional and should only add a small refinement on top of "outfit" (e.g. "in dusty olive linen", "with gold hoop earrings"). Never face/body.
- "emotionalBeat" is one short phrase: what the subject feels or is about to do.
- If the slot must_be_daylight is true, your time_of_day MUST be a daylight hour.
- Return EXACTLY ${plans.length} vignette(s), in the same order as the slots.

Slots:

${slotLines}`;
}

/**
 * Generates one bespoke vignette per showcase slot in a single batched LLM
 * call. Never throws; on failure returns an array of nulls so the caller can
 * fall back to the sampled baselines.
 *
 * Cost profile (targeting ~$1 per 10k profiles): one cheap-model call per
 * profile. On a 5-slot profile with ~600 input + ~500 output tokens at
 * gemini-2.5-flash-lite rates, each call is approximately $0.00015-0.00020.
 */
export async function generateShowcaseVignettes(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  plans: ShowcaseSlotPlan[],
): Promise<Array<SceneVignette | null>> {
  if (plans.length === 0) return [];
  if (!gatewayProvider && !openRouterProvider) {
    return plans.map(() => null);
  }

  const prompt = buildVignetteBatchPrompt(candidate, appearance, plans);
  const modelsToTry = uniqueModelList([
    SHOWCASE_VIGNETTE_MODEL,
    ...SHOWCASE_VIGNETTE_FALLBACK_MODELS,
  ]);

  const generateArgs = {
    schema: vignetteBatchSchema,
    maxRetries: 1,
    temperature: 1.0,
    system:
      "You are a concise visual art director. You produce compact, concrete, culturally grounded scene vignettes for photorealistic portraits. Never describe face/body/skin. Return valid structured output only.",
    prompt,
  } as const;

  const normalizeOutput = (
    raw: z.infer<typeof vignetteBatchSchema>,
  ): Array<SceneVignette | null> => {
    const received = raw.vignettes ?? [];
    return plans.map((_, index) => {
      const entry = received[index];
      if (!entry) return null;
      return {
        action: entry.action,
        settingDetail: entry.settingDetail,
        prop: entry.prop,
        outfit: entry.outfit,
        wardrobeAccent: entry.wardrobeAccent,
        emotionalBeat: entry.emotionalBeat,
        timeOfDay: entry.timeOfDay,
      } satisfies SceneVignette;
    });
  };

  // Phase 1: OpenRouter.
  if (openRouterProvider) {
    for (const modelName of modelsToTry) {
      try {
        const result = await generateObject({
          model: openRouterProvider.chat(modelName),
          ...generateArgs,
        });
        return normalizeOutput(result.object);
      } catch (error) {
        console.warn(
          "[showcase-vignettes] OpenRouter model failed:",
          modelName,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  // Phase 2: AI Gateway.
  if (gatewayProvider) {
    for (const modelName of modelsToTry) {
      try {
        const result = await generateObject({
          model: gatewayProvider(modelName),
          ...generateArgs,
        });
        return normalizeOutput(result.object);
      } catch (error) {
        console.warn(
          "[showcase-vignettes] AI Gateway model failed:",
          modelName,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  console.warn(
    "[showcase-vignettes] All providers failed; falling back to baseline plan prompts.",
  );
  return plans.map(() => null);
}
