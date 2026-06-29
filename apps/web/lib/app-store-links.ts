export type AppStoreLinks = {
  iosUrl: string | null;
};

export function buildAppStoreLinks(config?: {
  iosAppStoreId?: string;
}): AppStoreLinks {
  const iosAppStoreId =
    config?.iosAppStoreId ?? process.env.NEXT_PUBLIC_IOS_APP_STORE_ID;

  const iosUrl = iosAppStoreId
    ? `https://apps.apple.com/app/id${iosAppStoreId}`
    : null;

  return { iosUrl };
}
