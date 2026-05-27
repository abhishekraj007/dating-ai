import { AVATAR_SHOT_STYLES } from "../profileGenerationData";
import type {
  AppearanceProfile,
  ProfileCandidate,
  SceneVignette,
  ShowcaseSlotPlan,
} from "./types";
import { randomItem } from "./textUtils";

export type ImagePromptInput = {
  subjectDescriptor: string;
  action: string;
  setting: string;
  composition: string;
  lighting: string;
  style: string;
  expression?: string;
  vibe?: string;
  cityArchetype?: string;
  // Additional context fragments that get appended in a dedicated sentence.
  // Used by showcase prompts to inject accent prop / season / time-of-day /
  // LLM-authored emotional beat while keeping the core sentence structure
  // deterministic.
  contextFragments?: Array<string | null | undefined>;
  withReferenceClause: boolean;
};

export function buildImagePromptCore(input: ImagePromptInput): string {
  // Kept intentionally short. The previous, longer cue ("Beautiful clear skin,
  // attractive well-proportioned features, photogenic and appealing, high-
  // quality dating profile photo") was redundant with the photorealistic
  // preamble and paradoxically primed the model to over-smooth skin or
  // amplify cues like freckles.
  const realismCues = "";

  const settingWithContext = [
    input.setting,
    input.cityArchetype ? `in a ${input.cityArchetype}` : null,
    // NOTE: vibe is intentionally NOT mixed into showcase settings. It
    // conflicts with scene-specific `style` strings (e.g. a "coastal"
    // scene + "clean-girl aesthetic" + "quiet coastal editorial" all
    // fighting each other). Avatar prompts still pass vibe through the
    // appearance.vibe field on the subject descriptor.
    input.vibe ? `${input.vibe} aesthetic` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const parts: string[] = [
    `Photorealistic portrait of ${input.subjectDescriptor}`,
    input.expression ? `with ${input.expression}` : null,
    input.action,
    settingWithContext,
    input.composition,
    input.lighting,
    input.style,
    realismCues,
  ].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  let prompt = parts.join(". ");
  if (!prompt.endsWith(".")) prompt += ".";

  const contextSentence = (input.contextFragments ?? [])
    .filter(
      (fragment): fragment is string =>
        typeof fragment === "string" && fragment.trim().length > 0,
    )
    .map((fragment) => fragment.trim())
    .join("; ");
  if (contextSentence.length > 0) {
    prompt += ` Scene context: ${contextSentence}.`;
  }

  // IMPORTANT: we no longer append a second reference-preservation clause
  // here. When a reference image is supplied, `imageGeneration.ts` already
  // prepends `REFERENCE_IMAGE_CONSISTENCY_PREFIX` to the final prompt. Having
  // both caused the same instruction to appear twice per request, which
  // models interpret as emphasis and over-apply (notably freckles/skin
  // features). `withReferenceClause` is preserved on the input type for
  // backward compat but is now a no-op.

  return prompt;
}

export function buildAvatarPrompt(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
): string {
  const shot = randomItem(AVATAR_SHOT_STYLES);
  return buildImagePromptCore({
    subjectDescriptor,
    action: `relaxed and real`,
    setting: shot.setting,
    composition: shot.composition,
    lighting: shot.lighting,
    style: shot.style,
    vibe: appearance.vibe,
    cityArchetype: appearance.cityArchetype,
    withReferenceClause: false,
  });
}

/**
 * Builds a showcase prompt from a sampled `ShowcaseSlotPlan`. When a
 * `SceneVignette` is supplied, its fields override matching plan fields:
 *   - `action`          overrides `plan.action`
 *   - `settingDetail`   is the main location (no fixed baseline setting)
 *   - `timeOfDay`       overrides `plan.timeOfDay`
 *   - `prop`            overrides `plan.accentProp`
 *   - `outfit`          becomes the slot's complete outfit
 *   - `wardrobeAccent`  refines the slot outfit
 *   - `emotionalBeat`   is appended as extra context
 *
 * This design means a failed vignette call (all fields undefined) degrades
 * cleanly to the baseline plan, and a partial response still gets us partial
 * uniqueness gains.
 */
export function buildShowcasePromptFromPlan(
  plan: ShowcaseSlotPlan,
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
  vignette: SceneVignette | null = null,
  promptSuggestion?: string,
): string {
  const action = vignette?.action?.trim() || plan.action;
  const settingDetail = vignette?.settingDetail?.trim();
  const baselineSetting = plan.setting.trim();
  const combinedSetting = settingDetail
    ? baselineSetting
      ? `${baselineSetting}, specifically ${settingDetail}`
      : settingDetail
    : baselineSetting ||
      `a ${plan.category.replace(/_/g, " ")} setting in ${candidate.location} that fits their interests`;
  const timeOfDay = vignette?.timeOfDay?.trim() || plan.timeOfDay;
  const prop = vignette?.prop?.trim() || plan.accentProp;
  const generatedOutfit = vignette?.outfit?.trim();
  const wardrobeAccent = vignette?.wardrobeAccent?.trim();
  const emotionalBeat = vignette?.emotionalBeat?.trim();
  const suggestion = promptSuggestion?.trim();

  // Inject the AI-authored per-slot outfit directly into the subject line.
  // Code no longer owns a fixed outfit catalog; the vignette model sees the
  // avatar outfit and all slots at once, then generates complete outfits that
  // differ from the avatar and from each other. If vignette generation is
  // unavailable (retry / provider outage), the fallback is still a generative
  // instruction rather than a static outfit string.
  const outfit =
    generatedOutfit ||
    `a completely new ${plan.category.replace("_", " ")} outfit, different from ${appearance.outfit}, with original garments, colors, materials, and accessories chosen for ${combinedSetting} at ${timeOfDay}`;
  const outfitClause = wardrobeAccent
    ? `wearing ${outfit} (with ${wardrobeAccent})`
    : `wearing ${outfit}`;
  const subjectWithOutfit = `${subjectDescriptor}, ${outfitClause}`;

  const core = buildImagePromptCore({
    subjectDescriptor: subjectWithOutfit,
    action,
    setting: combinedSetting,
    composition: plan.composition,
    lighting: plan.lighting,
    style: plan.style,
    // NOTE: `vibe` intentionally omitted for showcase prompts. See the
    // comment in `buildImagePromptCore`: mixing appearance.vibe with the
    // scene-specific `style` produces fighting aesthetic tags. The vibe
    // already informs outfit / hair / signature via the appearance profile.
    cityArchetype: appearance.cityArchetype,
    contextFragments: [
      plan.season ? `season: ${plan.season}` : null,
      timeOfDay ? `time: ${timeOfDay}` : null,
      prop ? `holding or carrying ${prop}` : null,
      emotionalBeat ? `emotional beat: ${emotionalBeat}` : null,
      suggestion ? `Include: ${suggestion}` : null,
    ],
    withReferenceClause: true,
  });

  // Explicit pose directive: without this the edit model tends to inherit
  // the reference image's head angle and framing. The identity prefix in
  // `imageGeneration.ts` already frees pose globally; this reinforces it
  // per slot with scene-natural variation.
  return `${core} Pose, head angle, body language, and framing must be distinct from the reference image and feel natural for this scene.`;
}
