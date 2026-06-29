import {
  DEFAULT_IOS_APP_STORE_ID,
} from "@dating-ai/backend/convex/features/appConfig/shared";

export type AppStoreLinks = {
  iosUrl: string;
};

export function buildAppStoreLinks(config?: {
  iosAppStoreId?: string;
}): AppStoreLinks {
  const iosAppStoreId =
    config?.iosAppStoreId ??
    process.env.NEXT_PUBLIC_IOS_APP_STORE_ID ??
    DEFAULT_IOS_APP_STORE_ID;

  return {
    iosUrl: `https://apps.apple.com/app/id${iosAppStoreId}`,
  };
}
