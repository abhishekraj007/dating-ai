import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";

const billingCustomerValidator = v.object({
  authUserId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  dodoCustomerId: v.optional(v.string()),
});

export const getBillingCustomer = internalQuery({
  args: {
    authUserId: v.string(),
  },
  returns: v.union(billingCustomerValidator, v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.authUserId))
      .unique();

    if (!profile) {
      return null;
    }

    return {
      authUserId: profile.authUserId,
      email: profile.email,
      name: profile.name,
      dodoCustomerId: profile.dodoCustomerId,
    };
  },
});

export const getBillingCustomerByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.union(billingCustomerValidator, v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!profile) {
      return null;
    }

    return {
      authUserId: profile.authUserId,
      email: profile.email,
      name: profile.name,
      dodoCustomerId: profile.dodoCustomerId,
    };
  },
});

export const getBillingCustomerByDodoCustomerId = internalQuery({
  args: {
    dodoCustomerId: v.string(),
  },
  returns: v.union(billingCustomerValidator, v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_dodo_customer_id", (q) =>
        q.eq("dodoCustomerId", args.dodoCustomerId),
      )
      .unique();

    if (!profile) {
      return null;
    }

    return {
      authUserId: profile.authUserId,
      email: profile.email,
      name: profile.name,
      dodoCustomerId: profile.dodoCustomerId,
    };
  },
});
