import { query } from "../../_generated/server";
import { v } from "convex/values";
import {
  APP_CONFIG_KEY,
  buildUrlFromBase,
  DEFAULT_IOS_APP_STORE_ID,
  FALLBACK_ANDROID_APP_ID,
  normalizeNsfwEnabledPlatforms,
  resolveRevenueCatCreditProductIds,
} from "./shared";
import { requireAdmin } from "./guards";

const fallbackBaseWebUrl =
  process.env.SITE_URL ?? process.env.EXPO_PUBLIC_CONVEX_SITE_URL;

const nsfwEnabledPlatformsValidator = v.array(
  v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
);

const publicAppConfigValidator = v.object({
  baseWebUrl: v.optional(v.string()),
  termsUrl: v.optional(v.string()),
  privacyUrl: v.optional(v.string()),
  helpCenterUrl: v.optional(v.string()),
  supportUrl: v.optional(v.string()),
  shareUrl: v.optional(v.string()),
  iosAppStoreId: v.optional(v.string()),
  androidAppId: v.string(),
  showMyCreationTab: v.boolean(),
  nsfwEnabledPlatforms: nsfwEnabledPlatformsValidator,
  revenueCatCreditProductIds: v.array(v.string()),
  updatedAt: v.optional(v.number()),
});

const adminAppConfigValidator = v.object({
  baseWebUrl: v.optional(v.string()),
  termsUrl: v.optional(v.string()),
  privacyUrl: v.optional(v.string()),
  helpCenterUrl: v.optional(v.string()),
  supportUrl: v.optional(v.string()),
  shareUrl: v.optional(v.string()),
  iosAppStoreId: v.optional(v.string()),
  androidAppId: v.string(),
  showMyCreationTab: v.boolean(),
  nsfwEnabledPlatforms: nsfwEnabledPlatformsValidator,
  revenueCatCreditProductIds: v.array(v.string()),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.string()),
});

export const getPublicAppConfig = query({
  args: {},
  returns: publicAppConfigValidator,
  handler: async (ctx) => {
    const config = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", APP_CONFIG_KEY))
      .unique();

    const baseWebUrl = config?.baseWebUrl ?? fallbackBaseWebUrl;
    const termsUrl = config?.termsUrl ?? buildUrlFromBase(baseWebUrl, "/terms");
    const privacyUrl =
      config?.privacyUrl ?? buildUrlFromBase(baseWebUrl, "/privacy");
    const helpCenterUrl =
      config?.helpCenterUrl ?? buildUrlFromBase(baseWebUrl, "/help");
    const supportUrl =
      config?.supportUrl ?? buildUrlFromBase(baseWebUrl, "/support");
    const shareUrl = config?.shareUrl ?? baseWebUrl;

    return {
      baseWebUrl,
      termsUrl,
      privacyUrl,
      helpCenterUrl,
      supportUrl,
      shareUrl,
      iosAppStoreId: config?.iosAppStoreId ?? DEFAULT_IOS_APP_STORE_ID,
      androidAppId: config?.androidAppId ?? FALLBACK_ANDROID_APP_ID,
      showMyCreationTab: config?.showMyCreationTab ?? false,
      nsfwEnabledPlatforms: normalizeNsfwEnabledPlatforms(
        config?.nsfwEnabledPlatforms,
      ),
      revenueCatCreditProductIds: resolveRevenueCatCreditProductIds(
        config?.revenueCatCreditProductIds,
      ),
      updatedAt: config?.updatedAt,
    };
  },
});

export const getAdminAppConfig = query({
  args: {},
  returns: adminAppConfigValidator,
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const config = await ctx.db
      .query("appConfig")
      .withIndex("by_key", (q) => q.eq("key", APP_CONFIG_KEY))
      .unique();

    return {
      baseWebUrl: config?.baseWebUrl ?? fallbackBaseWebUrl,
      termsUrl: config?.termsUrl,
      privacyUrl: config?.privacyUrl,
      helpCenterUrl: config?.helpCenterUrl,
      supportUrl: config?.supportUrl,
      shareUrl: config?.shareUrl,
      iosAppStoreId: config?.iosAppStoreId ?? DEFAULT_IOS_APP_STORE_ID,
      androidAppId: config?.androidAppId ?? FALLBACK_ANDROID_APP_ID,
      showMyCreationTab: config?.showMyCreationTab ?? false,
      nsfwEnabledPlatforms: normalizeNsfwEnabledPlatforms(
        config?.nsfwEnabledPlatforms,
      ),
      revenueCatCreditProductIds: resolveRevenueCatCreditProductIds(
        config?.revenueCatCreditProductIds,
      ),
      updatedAt: config?.updatedAt,
      updatedBy: config?.updatedBy,
    };
  },
});
