"use client";

import { useEffect, useState } from "react";
import { useQuery as useConvexQuery } from "convex/react";
import { api as convexApi } from "@dating-ai/backend/convex/_generated/api";
import { Coins, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePolarEmbedCheckout } from "@/hooks/use-polar-embed-checkout";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PolarProduct {
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

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const userData = useConvexQuery(convexApi.user.fetchUserAndProfile);
  const [products, setProducts] = useState<PolarProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openCheckout, loadingProductId } = usePolarEmbedCheckout();

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCancelled = false;

    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/polar/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const nextProducts = (await response.json()) as PolarProduct[];

        if (!isCancelled) {
          setProducts(nextProducts);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load credit bundles",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [open]);

  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Coins className="h-8 w-8 text-foreground" />;
      case 1:
        return <Sparkles className="h-8 w-8 text-foreground" />;
      case 2:
        return <Zap className="h-8 w-8 text-foreground" />;
      default:
        return <Coins className="h-8 w-8 text-foreground" />;
    }
  };

  const getCreditAmount = (product: PolarProduct) => {
    if (product.metadata?.credits) {
      return parseInt(product.metadata.credits, 10);
    }

    if (product.metadata?.credtis) {
      return parseInt(product.metadata.credtis, 10);
    }

    const match = product.name.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const creditProducts = products
    .filter(Boolean)
    .map((product) => ({
      product,
      credits: getCreditAmount(product),
      badge: getCreditAmount(product) === 2500 ? "Popular" : undefined,
    }))
    .sort((left, right) => left.credits - right.credits);

  const handleCheckout = (productId?: string) => {
    if (!productId || !userData) {
      return;
    }

    void openCheckout({
      productId,
      customerExternalId: userData.profile?.authUserId || "",
      customerEmail: userData.userMetadata.email || "",
      customerName: userData.profile?.name || userData.userMetadata.name || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto w-[80vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Buy credits</DialogTitle>
          <DialogDescription>
            Top up your balance to keep sending selfie requests and other paid
            chat actions.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-muted-foreground">
                Loading credit bundles...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-border/70 bg-muted/50 px-4 py-5 text-sm text-muted-foreground">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {creditProducts.map((item, index) => {
              const priceAmount = item.product.prices?.[0]?.priceAmount;
              const price = priceAmount
                ? (priceAmount / 100).toFixed(2)
                : "0.00";

              return (
                <Card
                  key={item.product.id}
                  className={
                    item.badge === "Popular"
                      ? "relative border-primary shadow-lg"
                      : "relative"
                  }
                >
                  {item.badge ? (
                    <div className="absolute -top-4 left-3">
                      <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                        {item.badge}
                      </span>
                    </div>
                  ) : null}

                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0">{getIcon(index)}</div>
                        <div className="flex flex-col">
                          <span className="text-lg">{item.product.name}</span>
                          <span className="text-xl font-bold tabular-nums">
                            ${price}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCheckout(item.product.id)}
                        disabled={loadingProductId === item.product.id}
                        className="min-w-24 cursor-pointer"
                      >
                        {loadingProductId === item.product.id ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          "Buy now"
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
