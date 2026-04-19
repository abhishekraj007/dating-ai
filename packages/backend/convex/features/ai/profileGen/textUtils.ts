import {
  type Gender,
  FEMALE_WEIGHT,
  SEMANTIC_SIMILARITY_THRESHOLD,
} from "../profileGenerationData";
import { GenerationFailureError } from "./types";

export function randomItem<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) {
    throw new GenerationFailureError(
      "profile_creation_failed",
      "Cannot select an item from an empty list",
    );
  }
  return item;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i];
    const target = copy[j];
    if (current === undefined || target === undefined) {
      continue;
    }
    copy[i] = target;
    copy[j] = current;
  }
  return copy;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): Set<string> {
  const cleaned = normalize(text);
  if (!cleaned) return new Set();
  return new Set(cleaned.split(" ").filter((token) => token.length > 2));
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function weightedGender(): Gender {
  return Math.random() < FEMALE_WEIGHT ? "female" : "male";
}

export function buildUsername(name: string, existing: Set<string>): string {
  const base = normalize(name).replace(/\s+/g, "_");
  if (!existing.has(base)) return base;

  for (let i = 0; i < 20; i += 1) {
    const candidate = `${base}_${Math.floor(100 + Math.random() * 900)}`;
    if (!existing.has(candidate)) return candidate;
  }

  return `${base}_${crypto.randomUUID().slice(0, 8)}`;
}

export function sanitizeUsername(raw: string): string {
  return normalize(raw)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function uniqueList(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

export function uniqueModelList(models: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const model of models) {
    const normalized = model.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

export function normalizePreferenceText(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeInterestPreferences(
  interests: string[] | undefined,
): string[] | undefined {
  if (!interests || interests.length === 0) return undefined;
  const normalized = uniqueList(
    interests.map((interest) => interest.trim()),
    5,
  );
  return normalized.length > 0 ? normalized : undefined;
}

export function thresholdForAttempt(attempt: number): number {
  // Phase 1: strict matching, Phase 2/3: progressively relaxed semantic gate.
  if (attempt <= 4) return SEMANTIC_SIMILARITY_THRESHOLD;
  if (attempt <= 8) return 0.5;
  return 0.6;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
