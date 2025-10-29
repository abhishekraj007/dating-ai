import { internalMutation } from "../_generated/server";

export const addCreditsToProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profile").collect();
    
    let updated = 0;
    for (const profile of profiles) {
      // Only update if credits field is missing
      if (profile.credits === undefined) {
        await ctx.db.patch(profile._id, {
          credits: 0,
          isPremium: false,
        });
        updated++;
      }
    }
    
    return { success: true, updated };
  },
});
