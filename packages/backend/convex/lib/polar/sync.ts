import { action } from "../../_generated/server";
import { polar } from "./client";
import { v } from "convex/values";

/**
 * Sync products from Polar to Convex database
 * Run this action once to sync products that were created before the component was set up
 * 
 * Usage: npx convex run lib/polar/sync:syncProducts
 */
export const syncProducts = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("[POLAR] Starting product sync...");
    await polar.syncProducts(ctx);
    console.log("[POLAR] Product sync completed");
    return null;
  },
});

