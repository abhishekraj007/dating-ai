import { internalMutation, mutation } from "../../_generated/server";
import { GENZ_STYLE, GENZ_FEMALE_PROFILES } from "./genz_profiles_data";
import { GENZ_MALE_PROFILES } from "./genz_profiles_male";

// Combine all Gen-Z profiles with communication style
const GENZ_PROFILES = [
  ...GENZ_FEMALE_PROFILES.map((p) => ({
    ...p,
    communicationStyle: GENZ_STYLE,
  })),
  ...GENZ_MALE_PROFILES.map((p) => ({ ...p, communicationStyle: GENZ_STYLE })),
];

const PLACEHOLDER_AVATAR = "default-avatar";

/**
 * Seed Gen-Z profiles to database.
 * Checks for duplicates by name before inserting.
 */
export const seedGenZProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get existing profile names
    const existingProfiles = await ctx.db.query("aiProfiles").collect();
    const existingNames = new Set(existingProfiles.map((p) => p.name));

    let created = 0;
    let skipped = 0;

    for (const profile of GENZ_PROFILES) {
      // Skip if profile with same name exists
      if (existingNames.has(profile.name)) {
        skipped++;
        continue;
      }

      await ctx.db.insert("aiProfiles", {
        name: profile.name,
        gender: profile.gender,
        avatarImageKey: PLACEHOLDER_AVATAR,
        isUserCreated: false,
        status: "active",
        age: profile.age,
        zodiacSign: profile.zodiacSign,
        occupation: profile.occupation,
        bio: profile.bio,
        interests: profile.interests,
        personalityTraits: profile.personalityTraits,
        mbtiType: profile.mbtiType,
        relationshipGoal: profile.relationshipGoal,
        language: "en",
        communicationStyle: profile.communicationStyle,
      });

      created++;
    }

    console.log(
      `Gen-Z profiles: created ${created}, skipped ${skipped} (duplicates)`
    );
    return { created, skipped };
  },
});

/**
 * Public mutation to trigger Gen-Z seeding (for development).
 */
export const triggerGenZSeed = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      "features/ai/seed_genz:seedGenZProfiles" as any,
      {}
    );
    return { message: "Gen-Z profile seeding started" };
  },
});

/**
 * Get count of Gen-Z style profiles in database.
 */
export const getGenZProfileCount = mutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("aiProfiles").collect();
    const genzProfiles = profiles.filter(
      (p) => p.communicationStyle?.tone === "gen-z"
    );
    return {
      total: profiles.length,
      genz: genzProfiles.length,
      female: genzProfiles.filter((p) => p.gender === "female").length,
      male: genzProfiles.filter((p) => p.gender === "male").length,
    };
  },
});
