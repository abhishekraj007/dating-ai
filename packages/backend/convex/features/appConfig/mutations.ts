import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./guards";
import {
  APP_CONFIG_KEY,
  normalizeAndroidAppId,
  normalizeAppStoreId,
  normalizeUrl,
} from "./shared";

export const upsertAppConfig = mutation({
  args: {
    baseWebUrl: v.optional(v.string()),
    termsUrl: v.optional(v.string()),
    privacyUrl: v.optional(v.string()),
    helpCenterUrl: v.optional(v.string()),
    supportUrl: v.optional(v.string()),
    shareUrl: v.optional(v.string()),
    iosAppStoreId: v.optional(v.string()),
    androidAppId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userData = await requireAdmin(ctx);

    const payload = {
      key: APP_CONFIG_KEY,
      baseWebUrl: normalizeUrl(args.baseWebUrl),
      termsUrl: normalizeUrl(args.termsUrl),
      privacyUrl: normalizeUrl(args.privacyUrl),
      helpCenterUrl: normalizeUrl(args.helpCenterUrl),
      supportUrl: normalizeUrl(args.supportUrl),
      shareUrl: normalizeUrl(args.shareUrl),
      iosAppStoreId: normalizeAppStoreId(args.iosAppStoreId),
      androidAppId: normalizeAndroidAppId(args.androidAppId),
      updatedAt: Date.now(),
      updatedBy: userData.userMetadata._id,
    };

    const existing = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", APP_CONFIG_KEY))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { success: true, updated: true };
    }

    await ctx.db.insert("appConfig", payload);
    return { success: true, updated: false };
  },
});
