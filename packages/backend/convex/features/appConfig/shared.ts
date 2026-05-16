export const APP_CONFIG_KEY = "global";

export type NsfwPlatform = "ios" | "android" | "web";

export const DEFAULT_REVENUECAT_CREDIT_PRODUCT_IDS: Array<string> = [
  "feelchat.rc_credit_1999",
  "feelchat.rc_credit_3900",
  "feelchat.rc_credit_4999",
  "feelchat.rc_credit_8999",
];

export const productIdToCreditAmountMap: Record<string, number> = {
  "feelchat.rc_credit_1999": 2000,
  "feelchat.rc_credit_3900": 4000,
  "feelchat.rc_credit_4999": 5000,
  "feelchat.rc_credit_8999": 10000,
};

export const normalizeNsfwEnabledPlatforms = (
  value?: Array<NsfwPlatform> | null,
): Array<NsfwPlatform> => {
  if (!value || value.length === 0) {
    return [];
  }

  return Array.from(new Set(value));
};

export const normalizeRevenueCatCreditProductIds = (
  value?: Array<string> | null,
): Array<string> => {
  if (!value || value.length === 0) {
    return [];
  }

  const normalized = value
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const uniqueProductIds = Array.from(new Set(normalized));

  for (const productId of uniqueProductIds) {
    if (!/^[a-zA-Z0-9._-]+$/.test(productId)) {
      throw new Error(
        "RevenueCat credit product IDs can only contain letters, numbers, dots, underscores, and hyphens",
      );
    }
  }

  return uniqueProductIds;
};

export const resolveRevenueCatCreditProductIds = (
  value?: Array<string> | null,
): Array<string> => {
  const normalized = normalizeRevenueCatCreditProductIds(value);

  if (normalized.length === 0) {
    return DEFAULT_REVENUECAT_CREDIT_PRODUCT_IDS;
  }

  return normalized;
};

export const getCreditAmountFromProductId = (productId: string) => {
  // const match = productId
  //   .toLowerCase()
  //   .match(/(?:^|[._-])(?:rc[._-])?credits?[._-](\d+)(?:$|[._-])/);

  // if (!match) {
  //   return undefined;
  // }

  // const amount = Number(match[1]);

  // if (!Number.isFinite(amount) || amount <= 0) {
  //   return undefined;
  // }

  return productIdToCreditAmountMap[productId];
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isLocalhostHost = (hostname: string) => {
  return hostname === "localhost" || hostname === "127.0.0.1";
};

export const normalizeUrl = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = new URL(trimmed);
  const isHttps = parsed.protocol === "https:";
  const isLocalHttp =
    parsed.protocol === "http:" && isLocalhostHost(parsed.hostname);

  if (!isHttps && !isLocalHttp) {
    throw new Error(
      "Only https URLs are allowed (http allowed only for localhost)",
    );
  }

  return trimTrailingSlash(parsed.toString());
};

export const normalizeAppStoreId = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error("iOS App Store ID must contain only digits");
  }

  return normalized;
};

export const normalizeAndroidAppId = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (!/^[a-zA-Z0-9_.]+$/.test(normalized)) {
    throw new Error("Android app id contains invalid characters");
  }

  return normalized;
};

export const buildUrlFromBase = (baseWebUrl?: string, path?: string) => {
  if (!baseWebUrl || !path) {
    return undefined;
  }

  try {
    return new URL(path, `${baseWebUrl}/`).toString().replace(/\/+$/, "");
  } catch {
    return undefined;
  }
};
