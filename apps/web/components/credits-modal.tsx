"use client";

import { useEffect } from "react";
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
import { usePolarProductsQuery } from "@/hooks/use-polar-catalog";
import { usePolarEmbedCheckout } from "@/hooks/use-polar-embed-checkout";
import { cn } from "@/lib/utils";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const userData = useConvexQuery(convexApi.user.fetchUserAndProfile);
  const { openCheckout, preloadCheckout, loadingProductId } =
    usePolarEmbedCheckout();
  const { data: products = [], isLoading, error } = usePolarProductsQuery(open);

  useEffect(() => {
    if (open) {
      preloadCheckout();
    }
  }, [open, preloadCheckout]);

  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Failed to load credit bundles"
        : null;

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

  const getCreditAmount = (product: (typeof products)[number]) => {
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
      <DialogContent
        className={cn(
          "max-w-md gap-0 overflow-hidden border-0 p-0 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:max-w-[420px] w-[80vw]",
          "dark:shadow-[0_28px_100px_-40px_rgba(0,0,0,0.85)] dark:ring-white/10",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            "bg-gradient-to-b from-primary/[0.12] via-background to-background",
            "dark:from-primary/[0.18] dark:via-popover dark:to-popover",
          )}
        >
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55)_0%,transparent_68%)] opacity-90 dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.14)_0%,transparent_65%)] dark:opacity-100"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl dark:bg-primary/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
            aria-hidden
          />

          <div className="relative max-h-[90vh] overflow-y-auto px-6 pb-7 pt-8 sm:px-8 sm:pb-9">
            <DialogHeader className="items-center gap-3.5 text-center sm:gap-4">
              <div
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                  "border border-primary/20 bg-background/80 shadow-sm backdrop-blur-md",
                  "dark:border-primary/25 dark:bg-background/40",
                )}
              >
                <Coins className="h-3.5 w-3.5 shrink-0 text-primary" />
                Credits
              </div>
              <DialogTitle className="font-heading text-balance text-3xl font-semibold tracking-tight sm:text-[1.75rem]">
                Buy credits
              </DialogTitle>
              <DialogDescription className="max-w-[min(100%,20rem)] text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
                Top up your balance to keep sending selfie requests and other
                paid chat actions.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-7 sm:mt-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                    <p className="mt-4 text-muted-foreground">
                      Loading credit bundles...
                    </p>
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="rounded-3xl border border-border/70 bg-muted/50 px-4 py-5 text-sm text-muted-foreground">
                  {errorMessage}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
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
                            ? "relative border-primary shadow-lg py-1"
                            : "relative py-1"
                        }
                      >
                        {item.badge ? (
                          <div className="absolute -top-3.5 left-3">
                            <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                              {item.badge}
                            </span>
                          </div>
                        ) : null}

                        <CardHeader className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 [&>svg]:h-6 [&>svg]:w-6 sm:[&>svg]:h-8 sm:[&>svg]:w-8">
                                {getIcon(index)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium sm:text-base">
                                  {item.product.name}
                                </span>
                                <span className="text-lg font-bold tabular-nums sm:text-xl">
                                  ${price}
                                </span>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleCheckout(item.product.id)}
                              disabled={loadingProductId === item.product.id}
                              className="shrink-0 cursor-pointer px-4 text-sm md:text-lg md:py-6 md:px-8 sm:min-w-24"
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
