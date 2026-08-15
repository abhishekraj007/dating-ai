import { v } from "convex/values";
import { getDodoApiBaseUrl, requireEnv } from "./env";

export const catalogProductValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  prices: v.optional(
    v.array(
      v.object({
        type: v.optional(v.string()),
        priceAmount: v.number(),
        priceCurrency: v.string(),
        recurringInterval: v.optional(v.string()),
      }),
    ),
  ),
  metadata: v.optional(
    v.object({
      credits: v.optional(v.string()),
      credtis: v.optional(v.string()),
    }),
  ),
});

export type CatalogProduct = {
  id: string;
  name: string;
  description?: string;
  prices?: Array<{
    type?: string;
    priceAmount: number;
    priceCurrency: string;
    recurringInterval?: string;
  }>;
  metadata?: {
    credits?: string;
    credtis?: string;
  };
};

type DodoRecurringInterval = "Day" | "Week" | "Month" | "Year";

type DodoPriceDetail = {
  type?: string;
  price?: number;
  currency?: string;
  payment_frequency_interval?: DodoRecurringInterval;
};

type DodoProductListItem = {
  product_id: string;
  name?: string | null;
  description?: string | null;
  is_recurring: boolean;
  price?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown>;
  price_detail?: DodoPriceDetail | null;
};

type DodoProductListResponse = {
  items: DodoProductListItem[];
};

function toPolarInterval(interval?: DodoRecurringInterval) {
  if (interval === "Month") return "month";
  if (interval === "Year") return "year";
  return undefined;
}

export function creditsFromMetadata(metadata: Record<string, unknown>) {
  const credits = metadata.credits ?? metadata.credtis;
  if (typeof credits === "string" && credits.length > 0) {
    return credits;
  }
  if (typeof credits === "number" && Number.isFinite(credits)) {
    return String(credits);
  }
  return undefined;
}

export function mapDodoProductToCatalog(
  product: DodoProductListItem,
): CatalogProduct {
  const interval = toPolarInterval(
    product.price_detail?.payment_frequency_interval,
  );
  const priceAmount = product.price_detail?.price ?? product.price ?? 0;
  const priceCurrency =
    product.price_detail?.currency ?? product.currency ?? "USD";
  const credits = creditsFromMetadata(product.metadata ?? {});
  const description = product.description ?? undefined;

  const mapped: CatalogProduct = {
    id: product.product_id,
    name: product.name ?? "",
    prices: [
      {
        type: product.is_recurring ? "recurring" : "one_time",
        priceAmount,
        priceCurrency,
        ...(interval ? { recurringInterval: interval } : {}),
      },
    ],
  };

  if (description) {
    mapped.description = description;
  }

  if (credits) {
    mapped.metadata = { credits };
  }

  return mapped;
}

function isDodoProductListItem(value: unknown): value is DodoProductListItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return typeof item.product_id === "string" && typeof item.is_recurring === "boolean";
}

export async function fetchDodoProducts(recurring: boolean) {
  const apiKey = requireEnv("DODO_PAYMENTS_API_KEY");
  const url = new URL("/products", getDodoApiBaseUrl());
  url.searchParams.set("recurring", recurring ? "true" : "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("page_size", "100");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Dodo products");
  }

  const payload = (await response.json()) as DodoProductListResponse;
  const items = Array.isArray(payload.items) ? payload.items : [];

  return items.filter(isDodoProductListItem).map(mapDodoProductToCatalog);
}

export async function fetchDodoProduct(productId: string) {
  const apiKey = requireEnv("DODO_PAYMENTS_API_KEY");
  const response = await fetch(
    `${getDodoApiBaseUrl()}/products/${productId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Dodo product ${productId}`);
  }

  const product: unknown = await response.json();
  if (!isDodoProductListItem(product)) {
    throw new Error(`Invalid Dodo product ${productId}`);
  }

  return product;
}
