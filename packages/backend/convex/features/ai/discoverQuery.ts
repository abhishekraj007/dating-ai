import type { QueryCtx } from "../../_generated/server";

type ActiveGenderFilter = "female" | "male" | "both" | undefined;

export function activeProfilesDiscoverQuery(
  ctx: QueryCtx,
  gender: ActiveGenderFilter,
) {
  if (gender && gender !== "both") {
    return ctx.db
      .query("aiProfiles")
      .withIndex("by_status_gender_trending_created", (q) =>
        q.eq("status", "active").eq("gender", gender),
      )
      .order("desc");
  }

  return ctx.db
    .query("aiProfiles")
    .withIndex("by_status_trending_created", (q) => q.eq("status", "active"))
    .order("desc");
}
