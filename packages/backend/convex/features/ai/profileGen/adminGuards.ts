import { ConvexError } from "convex/values";
import { authComponent } from "../../../lib/betterAuth";

export async function assertAdmin(ctx: any) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");

  const userProfile = await ctx.db
    .query("profile")
    .withIndex("by_auth_user_id", (q: any) => q.eq("authUserId", user._id))
    .unique();

  if (!userProfile?.isAdmin) {
    throw new ConvexError("Admin access required");
  }
  return user;
}
