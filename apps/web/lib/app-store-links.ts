const FALLBACK_ANDROID_APP_ID = "com.noosperai.feelchat";

export type AppStoreLinks = {
  iosUrl: string | null;
  androidUrl: string;
};

export function buildAppStoreLinks(config?: {
  iosAppStoreId?: string;
  androidAppId?: string;
}): AppStoreLinks {
  const androidAppId = config?.androidAppId ?? FALLBACK_ANDROID_APP_ID;
  const iosUrl = config?.iosAppStoreId
    ? `https://apps.apple.com/app/id${config.iosAppStoreId}`
    : null;

  return {
    iosUrl,
    androidUrl: `https://play.google.com/store/apps/details?id=${androidAppId}`,
  };
}
