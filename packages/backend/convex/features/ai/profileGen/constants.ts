import type { JobProgressStep } from "./types";

export const IMAGE_ANALYSIS_MODEL =
  process.env.IMAGE_ANALYSIS_MODEL || "google/gemini-3.1-flash-lite-preview";

export const PROFILE_GENERATION_MODEL =
  process.env.PROFILE_GENERATION_MODEL ??
  "google/gemini-3.1-flash-lite-preview";

export const PROFILE_GENERATION_FALLBACK_MODELS = (
  process.env.PROFILE_GENERATION_FALLBACK_MODELS ??
  "google/gemini-3-flash-preview,openai/gpt-5.4-nano,anthropic/claude-3-5-haiku-latest"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

// ── Showcase vignette model (per-slot scene diversity) ─────────────
//
// One batched `generateObject` call per profile enriches the showcase slots
// with bespoke, culturally-grounded vignettes. We target a cheap model by
// default (~$0.00015-0.00020 per profile) so 10k profiles cost ~$1.50-$2.00.
// Any failure degrades gracefully to the sampled baseline plan prompts.

export const SHOWCASE_VIGNETTE_MODEL =
  process.env.SHOWCASE_VIGNETTE_MODEL ?? "google/gemini-3.1-flash-lite-preview";

export const SHOWCASE_VIGNETTE_FALLBACK_MODELS = (
  process.env.SHOWCASE_VIGNETTE_FALLBACK_MODELS ??
  "google/gemini-3-flash-preview,google/gemini-2.5-flash,openai/gpt-5.4-nano"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

export const IS_DEV =
  process.env.CONVEX_CLOUD_URL?.includes("cheery-akita") ?? false;

export const JOB_PROGRESS_STEPS: JobProgressStep[] = [
  "candidate_generation",
  "avatar_generation",
  "showcase_generation",
  "profile_persist",
];

export const FALLBACK_TEMPLATE_MODEL = "fallback/static-template";
export const PROFILE_PERSIST_MODEL = "convex-db";

export const MAX_AVATAR_ATTEMPTS = 5;

export const PROFILE_OCCUPATION_OPTIONS = [
  "Software Engineer",
  "Product Designer",
  "Data Scientist",
  "Marketing Manager",
  "Content Creator",
  "Photographer",
  "Nurse",
  "Doctor",
  "Teacher",
  "Lawyer",
  "Financial Analyst",
  "Chef",
  "Fitness Coach",
  "Architect",
  "Entrepreneur",
  "Sales Manager",
  "UX Researcher",
  "Project Manager",
  "HR Specialist",
  "Civil Engineer",
] as const;

export const PROFILE_GENERATION_JOB_RETENTION_DAYS = 5;
export const AWAITING_APPROVAL_TTL_MS = 30 * 60 * 1000; // 30 minutes
