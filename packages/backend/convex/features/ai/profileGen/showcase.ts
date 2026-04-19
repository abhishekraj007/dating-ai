import {
  type ShowcaseScene,
  SHOWCASE_ACCENT_PROPS,
  SHOWCASE_MAX_COUNT,
  SHOWCASE_MIN_COUNT,
  SHOWCASE_SCENES,
  SHOWCASE_SEASONS,
  SHOWCASE_TIMES_OF_DAY,
} from "../profileGenerationData";
import type {
  AppearanceProfile,
  ProfileCandidate,
  SceneVignette,
  ShowcaseSlotPlan,
  ShowcaseSlotPrompt,
} from "./types";
import { buildShowcasePromptFromPlan } from "./prompts";
import { randomItem, shuffle } from "./textUtils";

/**
 * Soft per-category cap: a single profile's grid should never feel clustered.
 * We allow at most this many scenes from the same category before we start
 * skipping further candidates in that category (unless the pool is exhausted).
 */
const CATEGORY_SOFT_CAP = 1;

/**
 * Minimum share of the grid that must be `flirty` or `bold` scenes. This is
 * the "swipe hook" guarantee: every grid contains at least this fraction of
 * scenes that tend to stop a thumb. For a 5-slot grid this resolves to 2.
 * Dating-app context: all-cozy grids under-perform, so we deliberately tilt.
 */
const BOLD_FLIRTY_MIN_RATIO = 0.4;

function isBoldOrFlirty(scene: ShowcaseScene): boolean {
  return scene.boldness === "bold" || scene.boldness === "flirty";
}

function scoreSceneMatch(
  scene: ShowcaseScene,
  candidateInterestSet: Set<string>,
  vibeLower: string,
): boolean {
  const interestMatch =
    scene.interestAffinity?.some((i) =>
      candidateInterestSet.has(i.toLowerCase()),
    ) ?? false;
  const vibeMatch =
    scene.vibeAffinity?.some((v) => v.toLowerCase() === vibeLower) ?? false;
  return interestMatch || vibeMatch;
}

/**
 * Selects `count` scenes for a profile:
 *   1. affinity-matched scenes come first (shuffled),
 *   2. remaining scenes fill the rest (shuffled),
 *   3. we enforce a soft per-category cap so we never pick 3 indoor_cozy shots
 *      before running out of other categories.
 *
 * Retries (excludeIds non-empty) fall through the category cap if necessary,
 * since by that point we're just filling a missing slot.
 */
export function pickShowcaseScenes(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  count: number,
  excludeIds: Set<string> = new Set(),
): ShowcaseScene[] {
  const candidateInterestSet = new Set(
    candidate.interests.map((i) => i.toLowerCase()),
  );
  const vibeLower = appearance.vibe.toLowerCase();

  const pool = SHOWCASE_SCENES.filter((scene) => !excludeIds.has(scene.id));

  const preferred: ShowcaseScene[] = [];
  const rest: ShowcaseScene[] = [];
  for (const scene of pool) {
    if (scoreSceneMatch(scene, candidateInterestSet, vibeLower)) {
      preferred.push(scene);
    } else {
      rest.push(scene);
    }
  }

  const filterPet = (scenes: ShowcaseScene[]): ShowcaseScene[] =>
    scenes.filter((scene) => scene.id !== "with_pet" || Math.random() < 0.25);

  const ordered = [
    ...shuffle(filterPet(preferred)),
    ...shuffle(filterPet(rest)),
  ];

  // First pass: respect the per-category soft cap.
  const categoryCounts = new Map<string, number>();
  const selected: ShowcaseScene[] = [];
  const deferred: ShowcaseScene[] = [];

  for (const scene of ordered) {
    const current = categoryCounts.get(scene.category) ?? 0;
    if (current < CATEGORY_SOFT_CAP) {
      selected.push(scene);
      categoryCounts.set(scene.category, current + 1);
      if (selected.length >= count) break;
    } else {
      deferred.push(scene);
    }
  }

  // Second pass: if we still need more slots, fall through the cap.
  if (selected.length < count) {
    for (const scene of deferred) {
      selected.push(scene);
      if (selected.length >= count) break;
    }
  }

  const finalSelection = selected.slice(0, count);

  // Third pass: swipe-hook guarantee. Enforce a minimum share of flirty/bold
  // scenes. If the category-coverage pass under-shot the target, swap the
  // lowest-priority `casual` entries (from the tail of the grid, which is
  // where the user sees "extra" shots) with the best available flirty/bold
  // scenes from the rest of the pool. Retries (excludeIds non-empty) are
  // exempted — the retry path just needs *a* valid scene.
  if (excludeIds.size === 0) {
    return enforceBoldFlirtyFloor(finalSelection, pool, count);
  }
  return finalSelection;
}

/**
 * If `selected` has fewer than `ceil(count * BOLD_FLIRTY_MIN_RATIO)` flirty-
 * or-bold scenes, replace trailing casual scenes with flirty/bold picks from
 * the remaining pool. Falls back gracefully when the pool has insufficient
 * flirty/bold options (e.g. after heavy interest filtering).
 */
function enforceBoldFlirtyFloor(
  selected: ShowcaseScene[],
  pool: ShowcaseScene[],
  count: number,
): ShowcaseScene[] {
  const minBoldFlirty = Math.max(1, Math.ceil(count * BOLD_FLIRTY_MIN_RATIO));
  const currentBoldFlirty = selected.filter(isBoldOrFlirty).length;
  if (currentBoldFlirty >= minBoldFlirty) return selected;

  const selectedIds = new Set(selected.map((s) => s.id));
  const available = shuffle(
    pool.filter((s) => !selectedIds.has(s.id) && isBoldOrFlirty(s)),
  );
  if (available.length === 0) return selected;

  const replacements = [...selected];
  let needed = minBoldFlirty - currentBoldFlirty;

  // Replace from the tail (later grid positions) backwards, only swapping
  // `casual` entries so we preserve any diverse category coverage we have.
  for (
    let i = replacements.length - 1;
    i >= 0 && needed > 0 && available.length > 0;
    i -= 1
  ) {
    if (replacements[i].boldness === "casual") {
      const next = available.shift();
      if (!next) break;
      replacements[i] = next;
      needed -= 1;
    }
  }

  return replacements;
}

export function randomShowcaseCount(): number {
  return (
    SHOWCASE_MIN_COUNT +
    Math.floor(Math.random() * (SHOWCASE_MAX_COUNT - SHOWCASE_MIN_COUNT + 1))
  );
}

/**
 * Samples the scene's variation arrays and rolls a rotating accent prop,
 * season, and time-of-day. Produces a fully-resolved `ShowcaseSlotPlan` that
 * can later be enriched by an LLM vignette.
 */
function sampleSlotPlan(
  scene: ShowcaseScene,
  candidate: ProfileCandidate,
): ShowcaseSlotPlan {
  const actionBuilder = randomItem(scene.buildActions) ?? scene.buildActions[0];
  const action = actionBuilder({ interests: candidate.interests });
  return {
    sceneId: scene.id,
    category: scene.category,
    action,
    setting: randomItem(scene.settings) ?? scene.settings[0] ?? "",
    composition: randomItem(scene.compositions) ?? scene.compositions[0] ?? "",
    lighting: randomItem(scene.lightings) ?? scene.lightings[0] ?? "",
    style: randomItem(scene.styles) ?? scene.styles[0] ?? "",
    accentProp: randomItem(SHOWCASE_ACCENT_PROPS) ?? "",
    season: randomItem(SHOWCASE_SEASONS) ?? "",
    timeOfDay: randomItem(SHOWCASE_TIMES_OF_DAY) ?? "",
    requireDaylight: scene.requireDaylight,
  };
}

/**
 * Builds a list of fully-resolved `ShowcaseSlotPlan`s. This is the step where
 * we decide "what goes in each slot" but we don't yet have an LLM vignette
 * attached; callers can either pass the plans to `generateShowcaseVignettes`
 * for enrichment or skip straight to `materializeSlotPrompts`.
 */
export function planShowcaseSlots(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  count: number,
  excludeIds: Set<string> = new Set(),
): ShowcaseSlotPlan[] {
  const scenes = pickShowcaseScenes(candidate, appearance, count, excludeIds);
  return scenes.map((scene) => sampleSlotPlan(scene, candidate));
}

/**
 * Turns plans + optional vignettes into final prompt strings. Vignettes are
 * applied element-wise; if a vignette is null/undefined the corresponding plan
 * falls back to its sampled baseline.
 */
export function materializeSlotPrompts(
  plans: ShowcaseSlotPlan[],
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
  vignettes: Array<SceneVignette | null | undefined> = [],
): ShowcaseSlotPrompt[] {
  return plans.map((plan, index) => ({
    sceneId: plan.sceneId,
    prompt: buildShowcasePromptFromPlan(
      plan,
      candidate,
      appearance,
      subjectDescriptor,
      vignettes[index] ?? null,
    ),
  }));
}

/**
 * Legacy-compatible one-shot helper: plans + materializes without any LLM
 * vignette step. Retained for callers (e.g. retry paths) that can't afford
 * the vignette LLM roundtrip.
 */
export function buildShowcasePrompts(
  candidate: ProfileCandidate,
  appearance: AppearanceProfile,
  subjectDescriptor: string,
  count: number,
  excludeIds: Set<string> = new Set(),
): ShowcaseSlotPrompt[] {
  const plans = planShowcaseSlots(candidate, appearance, count, excludeIds);
  return materializeSlotPrompts(
    plans,
    candidate,
    appearance,
    subjectDescriptor,
  );
}
