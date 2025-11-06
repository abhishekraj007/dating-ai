import { query } from "../../_generated/server";
import { polar } from "./client";
import * as Users from "../../model/user";
import { v } from "convex/values";

/**
 * Get configured Polar products
 * Fetches from Polar API directly using polar.listProducts
 * According to Polar docs: https://www.convex.dev/components/polar
 */
export const getConfiguredProducts = query({
  args: {},
  returns: v.any(),
  handler: async (ctx): Promise<Record<string, any>> => {
    try {
      const productIds = {
        monthly: process.env.POLAR_PRODUCT_PRO_MONTHLY,
        yearly: process.env.POLAR_PRODUCT_PRO_YEARLY,
        credits1000: process.env.POLAR_PRODUCT_CREDITS_1000,
        credits2500: process.env.POLAR_PRODUCT_CREDITS_2500,
        credits5000: process.env.POLAR_PRODUCT_CREDITS_5000,
      };

      // Fetch all products directly from Polar API
      // According to docs, polar.listProducts fetches from Polar API
      const allProducts = await polar.listProducts(ctx);

      // Map products by configured keys
      const products: Record<string, any> = {};

      for (const [key, productId] of Object.entries(productIds)) {
        if (!productId || productId.startsWith("product_id_")) {
          console.warn(`[POLAR] Skipping ${key}: invalid product ID`);
          continue;
        }

        const product = Array.isArray(allProducts)
          ? allProducts.find((p: any) => p.id === productId)
          : null;

        if (product) {
          products[key] = product;
        } else {
          console.warn(
            `[POLAR] Product ${key} (${productId}) not found in Polar API`
          );
        }
      }

      return products;
    } catch (error: any) {
      console.error("[POLAR] Error fetching configured products:", error);
      throw error;
    }
  },
});

/**
 * Get current user with subscription info
 */
export const getCurrentUserWithSubscription = query({
  handler: async (ctx) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return null;
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: userData.userMetadata._id,
    });

    return {
      ...userData,
      subscription,
      isFree: !subscription,
      isPro:
        subscription?.productType === "monthly" ||
        subscription?.productType === "yearly",
    };
  },
});
