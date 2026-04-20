import { AVATAR_SHOT_STYLES, INLINE_NEGATIVES } from "../profileGenerationData";
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
  const realismCues = "natural realistic skin, dating profile photo look";

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

  prompt += ` ${INLINE_NEGATIVES}`;
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
    action: `the kind of everyday profile photo someone would actually use - ${candidate.occupation.toLowerCase()}, relaxed and real`,
    setting: shot.setting,
    composition: shot.composition,
    lighting: shot.lighting,
    style: shot.style,
    expression: appearance.expression,
    vibe: appearance.vibe,
    cityArchetype: appearance.cityArchetype,
    withReferenceClause: false,
  });
}

/**
 * Builds a showcase prompt from a sampled `ShowcaseSlotPlan`. When a
 * `SceneVignette` is supplied, its fields override matching plan fields:
 *   - `action`          overrides `plan.action`
 *   - `settingDetail`   is appended to `plan.setting`
 *   - `timeOfDay`       overrides `plan.timeOfDay`
 *   - `prop`            overrides `plan.accentProp`
 *   - `wardrobeAccent`  is appended as extra context
 *   - `emotionalBeat`   is appended as extra context
 *
 * This design means a failed vignette call (all fields undefined) degrades
 * cleanly to the baseline plan, and a partial response still gets us partial
 * uniqueness gains.
 */
export function buildShowcasePromptFromPlan(
  plan: ShowcaseSlotPlan,
  _candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
  vignette: SceneVignette | null = null,
): string {
  const action = vignette?.action?.trim() || plan.action;
  const settingDetail = vignette?.settingDetail?.trim();
  const combinedSetting = settingDetail
    ? `${plan.setting}, specifically ${settingDetail}`
    : plan.setting;
  const timeOfDay = vignette?.timeOfDay?.trim() || plan.timeOfDay;
  const prop = vignette?.prop?.trim() || plan.accentProp;
  const wardrobeAccent = vignette?.wardrobeAccent?.trim();
  const emotionalBeat = vignette?.emotionalBeat?.trim();

  return buildImagePromptCore({
    subjectDescriptor,
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
      wardrobeAccent ? `wardrobe detail: ${wardrobeAccent}` : null,
      emotionalBeat ? `emotional beat: ${emotionalBeat}` : null,
    ],
    withReferenceClause: true,
  });
}
