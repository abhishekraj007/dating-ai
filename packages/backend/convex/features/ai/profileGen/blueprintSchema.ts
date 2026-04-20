import { z } from "zod";
import { ETHNICITIES } from "../profileGenerationData";

// Enum of canonical ethnicity values. Forces the LLM to pick exactly one
// from the list so the stored value is always filter-safe.
const ethnicityEnum = z.enum(ETHNICITIES as unknown as [string, ...string[]]);

// Base (free-form) interests schema used as fallback when no curated library
// is available. Prefer `buildProfileBlueprintSchema(allowedInterests)` below.
export const profileBlueprintSchema = z.object({
  name: z.string().min(3).max(64),
  username: z.string().min(3).max(40).optional(),
  age: z.number().int().min(20).max(34),
  zodiacSign: z.string().min(3).max(16),
  occupation: z.string().min(2).max(80),
  location: z.string().min(3).max(60).optional(),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  bio: z.string().min(40).max(420),
  interests: z.array(z.string().min(2).max(40)).min(4).max(7),
  personalityTraits: z.array(z.string().min(2).max(40)).min(3).max(6),
  relationshipGoal: z.string().min(8).max(120),
  mbtiType: z.string().min(4).max(4).optional(),
  // Required - the LLM must pick one from the canonical list so the stored
  // profile is always filter-compatible. `toCandidateFromBlueprint` will
  // still override this with the caller's preference when one was supplied.
  ethnicity: ethnicityEnum,
  communicationStyle: z
    .object({
      tone: z.string().optional(),
      responseLength: z.string().optional(),
      usesEmojis: z.boolean().optional(),
      usesSlang: z.boolean().optional(),
      flirtLevel: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
});

export type ProfileBlueprint = z.infer<typeof profileBlueprintSchema>;

// Per-call schema: if the caller supplies an interest library, constrain the
// `interests` field to that set via `z.enum(...)`. Providers receive this as
// a JSON Schema enum constraint, and the AI SDK rejects off-list items at
// parse time - so generated profiles can only use values that end-user
// filters know how to match on.
export function buildProfileBlueprintSchema(
  allowedInterests: readonly string[],
) {
  if (allowedInterests.length === 0) {
    return profileBlueprintSchema;
  }
  const interestEnum = z.enum(
    allowedInterests as unknown as [string, ...string[]],
  );
  return profileBlueprintSchema.extend({
    interests: z.array(interestEnum).min(4).max(7),
  });
}
