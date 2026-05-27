import { internalMutation } from "../_generated/server";

export const backfillIsTrending = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("aiProfiles").collect();

    let updated = 0;
    for (const profile of profiles) {
      if (profile.isTrending === undefined) {
        await ctx.db.patch(profile._id, { isTrending: false });
        updated += 1;
      }
    }

    return { success: true, updated };
  },
});
