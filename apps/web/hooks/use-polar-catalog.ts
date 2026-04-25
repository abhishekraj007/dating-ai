"use client";

import { useQuery } from "@tanstack/react-query";

const POLAR_CATALOG_STALE_TIME = 5 * 60 * 1000;
const POLAR_CATALOG_GC_TIME = 30 * 60 * 1000;

export interface PolarProduct {
  id: string;
  name: string;
  description?: string;
  prices?: Array<{
    priceAmount: number;
    priceCurrency: string;
  }>;
  metadata?: {
    credits?: string;
    credtis?: string;
  };
}

export interface PolarSubscriptionProduct {
  id: string;
  name: string;
  description?: string;
  prices?: Array<{
    type: string;
    priceAmount: number;
    priceCurrency: string;
    recurringInterval?: string;
  }>;
}

async function fetchPolarProducts() {
  const response = await fetch("/api/polar/products", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return (await response.json()) as PolarProduct[];
}

async function fetchPolarSubscriptions() {
  const response = await fetch("/api/polar/subscriptions", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch subscription plans");
  }

  return (await response.json()) as PolarSubscriptionProduct[];
}

export function usePolarProductsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["polar", "products"],
    queryFn: fetchPolarProducts,
    enabled,
    staleTime: POLAR_CATALOG_STALE_TIME,
    gcTime: POLAR_CATALOG_GC_TIME,
  });
}

export function usePolarSubscriptionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["polar", "subscriptions"],
    queryFn: fetchPolarSubscriptions,
    enabled,
    staleTime: POLAR_CATALOG_STALE_TIME,
    gcTime: POLAR_CATALOG_GC_TIME,
  });
}
