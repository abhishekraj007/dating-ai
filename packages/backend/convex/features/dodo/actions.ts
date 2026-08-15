import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { authComponent } from "../../lib/betterAuth";
import { checkout, customerPortal } from "../../dodo";
import { catalogProductValidator, fetchDodoProducts } from "./catalog";

function resolveCheckoutReturnUrl(returnUrl?: string) {
  const siteUrl = process.env.SITE_URL;
  const fallback = siteUrl ? `${siteUrl}/chat` : undefined;
  if (!returnUrl) {
    return fallback;
  }

  const extraTrustedOrigins = (process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = [
    siteUrl,
    "http://localhost:3004",
    "http://localhost:3005",
    ...extraTrustedOrigins,
  ].filter((origin): origin is string => Boolean(origin));

  const isAllowed = allowedOrigins.some(
    (origin) => returnUrl === origin || returnUrl.startsWith(`${origin}/`),
  );

  return isAllowed ? returnUrl : fallback;
}

export const listCatalog = action({
  args: {
    recurring: v.boolean(),
  },
  returns: v.array(catalogProductValidator),
  handler: async (_ctx, args) => {
    return await fetchDodoProducts(args.recurring);
  },
});

export const createCheckout = action({
  args: {
    productId: v.string(),
    returnUrl: v.optional(v.string()),
  },
  returns: v.object({
    checkout_url: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const returnUrl = resolveCheckoutReturnUrl(args.returnUrl);

    const session = await checkout(ctx, {
      payload: {
        product_cart: [
          {
            product_id: args.productId,
            quantity: 1,
          },
        ],
        customer: {
          email: user.email,
          name: user.name,
        },
        return_url: returnUrl,
        metadata: {
          userId: user._id,
        },
        billing_currency: "USD",
        feature_flags: {
          allow_discount_code: true,
        },
      },
    });

    if (!session.checkout_url) {
      throw new Error("Checkout session did not return a checkout_url");
    }

    return session;
  },
});

export const getCustomerPortal = action({
  args: {},
  returns: v.union(
    v.object({
      portal_url: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const customer = await ctx.runQuery(
      internal.features.dodo.queries.getBillingCustomer,
      { authUserId: user._id },
    );

    if (!customer?.dodoCustomerId) {
      return null;
    }

    const portal = await customerPortal(ctx);
    if (!portal.portal_url) {
      throw new Error("Customer portal did not return a portal_url");
    }

    return portal;
  },
});
