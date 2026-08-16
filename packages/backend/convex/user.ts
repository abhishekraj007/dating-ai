import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import * as Users from "./model/user";
import { requireAdmin } from "./features/appConfig/guards";

export const fetchUserAndProfile = query({
  handler: async (ctx) => {
    return await Users.getUserAndProfile(ctx);
  },
});

/**
 * Mark onboarding as complete for the authenticated user
 */
export const markOnboardingComplete = mutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    const { profile } = await Users.getUserAndProfileOrThrow(ctx);

    await ctx.db.patch(profile._id, {
      hasCompletedOnboarding: true,
    });

    return { success: true };
  },
});

const premiumGrantedByValidator = v.union(
  v.literal("manual"),
  v.literal("subscription"),
  v.literal("lifetime"),
);

const adminUserListItemValidator = v.object({
  _id: v.id("profile"),
  _creationTime: v.number(),
  email: v.string(),
  name: v.optional(v.string()),
  credits: v.number(),
  isAdmin: v.boolean(),
  isPremium: v.boolean(),
  premiumGrantedBy: v.optional(premiumGrantedByValidator),
  hasCompletedOnboarding: v.boolean(),
});

function toAdminUserListItem(profile: Doc<"profile">) {
  return {
    _id: profile._id,
    _creationTime: profile._creationTime,
    email: profile.email,
    ...(profile.name ? { name: profile.name } : {}),
    credits: profile.credits ?? 0,
    isAdmin: profile.isAdmin === true,
    isPremium: profile.isPremium === true,
    ...(profile.premiumGrantedBy
      ? { premiumGrantedBy: profile.premiumGrantedBy }
      : {}),
    hasCompletedOnboarding: profile.hasCompletedOnboarding === true,
  };
}

async function findProfileByEmail(ctx: QueryCtx, email: string) {
  const exactEmail = email.trim();
  const normalizedEmail = exactEmail.toLowerCase();

  return (
    (await ctx.db
      .query("profile")
      .withIndex("by_email", (q) => q.eq("email", exactEmail))
      .unique()) ??
    (normalizedEmail !== exactEmail
      ? await ctx.db
          .query("profile")
          .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
          .unique()
      : null)
  );
}

/**
 * Admin: list app users (profiles) with optional name/email search.
 */
export const adminListUsers = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    users: v.array(adminUserListItemValidator),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = Math.max(1, Math.min(args.limit ?? 40, 200));
    const search = args.search?.trim();
    const normalizedSearch = search?.toLowerCase();

    if (search?.includes("@")) {
      const exactMatch = await findProfileByEmail(ctx, search);
      if (exactMatch) {
        return {
          users: [toAdminUserListItem(exactMatch)],
          hasMore: false,
        };
      }
    }

    const hasSearch = Boolean(normalizedSearch);
    const scanLimit = Math.max(limit * (hasSearch ? 8 : 2), 80);
    const profiles = await ctx.db.query("profile").order("desc").take(scanLimit);

    const filteredProfiles = normalizedSearch
      ? profiles.filter((profile) => {
          const haystack = `${profile.email} ${profile.name ?? ""}`.toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : profiles;

    const page = filteredProfiles.slice(0, limit);

    return {
      users: page.map(toAdminUserListItem),
      hasMore:
        filteredProfiles.length > limit || profiles.length === scanLimit,
    };
  },
});
