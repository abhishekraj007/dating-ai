import { query } from "../../_generated/server";
import { APP_CONFIG_KEY, buildUrlFromBase } from "./shared";
import { requireAdmin } from "./guards";

const fallbackBaseWebUrl = process.env.SITE_URL ?? process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
const fallbackAndroidAppId = "com.noosperai.quotes";

export const getPublicAppConfig = query({
  args: {},
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
      iosAppStoreId: config?.iosAppStoreId,
      androidAppId: config?.androidAppId ?? fallbackAndroidAppId,
      updatedAt: config?.updatedAt,
    };
  },
});

export const getAdminAppConfig = query({
  args: {},
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
      iosAppStoreId: config?.iosAppStoreId,
      androidAppId: config?.androidAppId ?? fallbackAndroidAppId,
      updatedAt: config?.updatedAt,
      updatedBy: config?.updatedBy,
    };
  },
});
