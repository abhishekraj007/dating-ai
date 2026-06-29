"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { buildAppStoreLinks } from "@/lib/app-store-links";

export function useAppStoreLinks() {
  const appConfig = useQuery(api.features.appConfig.queries.getPublicAppConfig);

  return buildAppStoreLinks({
    iosAppStoreId: appConfig?.iosAppStoreId,
  });
}
