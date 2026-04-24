"use client";

import { useEffect, useState } from "react";
import { useQuery as useConvexQuery } from "convex/react";
import { api as convexApi } from "@dating-ai/backend/convex/_generated/api";
import { Crown, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePolarEmbedCheckout } from "@/hooks/use-polar-embed-checkout";
import { cn } from "@/lib/utils";

interface PolarSubscriptionProduct {
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

interface PremiumSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function PremiumSubscriptionModal({
  open,
  onOpenChange,
  title = "Unlock premium",
  description = "Get unlimited premium access and unlock the full experience across private photos and subscription perks.",
}: PremiumSubscriptionModalProps) {
  const userData = useConvexQuery(convexApi.user.fetchUserAndProfile);
  const [products, setProducts] = useState<PolarSubscriptionProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const { openCheckout, preloadCheckout, loadingProductId } =
    usePolarEmbedCheckout();

  useEffect(() => {
    if (!open) {
      return;
    }

    preloadCheckout();

    let isCancelled = false;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setProductsError(null);

      try {
        const response = await fetch("/api/polar/subscriptions", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch subscription plans");
        }

        const nextProducts =
          (await response.json()) as PolarSubscriptionProduct[];

        if (!isCancelled) {
          setProducts(nextProducts);
        }
      } catch (error) {
        if (!isCancelled) {
          setProductsError(
            error instanceof Error
              ? error.message
              : "Failed to load subscription plans",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [open]);

  const subscriptionPlans = products
    .map((product) => {
      const monthlyPrice = product.prices?.find(
        (price) => price.recurringInterval === "month",
      );
      const yearlyPrice = product.prices?.find(
        (price) => price.recurringInterval === "year",
      );

      if (monthlyPrice) {
        return {
          productId: product.id,
          name: product.name || "Monthly Pro",
          description: product.description || "Monthly subscription",
          price: (monthlyPrice.priceAmount || 0) / 100,
          frequency: "/month",
          kind: "monthly" as const,
          featured: false,
        };
      }

      if (yearlyPrice) {
        return {
          productId: product.id,
          name: product.name || "Yearly Pro",
          description: product.description || "Yearly subscription",
          price: (yearlyPrice.priceAmount || 0) / 100,
          frequency: "/year",
          kind: "yearly" as const,
          featured: true,
        };
      }

      return null;
    })
    .filter((plan): plan is NonNullable<typeof plan> => Boolean(plan))
    .sort((left, right) => {
      if (left.kind === right.kind) {
        return 0;
      }
      return left.kind === "yearly" ? -1 : 1;
    });

  const handlePlanCheckout = (productId: string) => {
    const authUserId = userData?.profile?.authUserId;
    if (!authUserId) {
      return;
    }

    void openCheckout({
      productId,
      customerExternalId: authUserId,
      customerEmail: userData?.userMetadata?.email,
      customerName: userData?.profile?.name || userData?.userMetadata?.name,
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

          <div className="relative px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
            <DialogHeader className="items-center gap-3.5 text-center sm:gap-4">
              <div
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                  "border border-primary/20 bg-background/80 shadow-sm backdrop-blur-md",
                  "dark:border-primary/25 dark:bg-background/40",
                )}
              >
                <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />
                Premium access
              </div>
              <DialogTitle className="font-heading text-balance text-3xl font-semibold tracking-tight sm:text-[1.75rem]">
                {title}
              </DialogTitle>
              <DialogDescription className="max-w-[min(100%,20rem)] text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
                {description}
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-7 grid gap-3.5 sm:mt-8">
              {isLoadingProducts ? (
                <div
                  className={cn(
                    "flex min-h-[7.5rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground",
                    "dark:border-border/60 dark:bg-muted/20",
                  )}
                >
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>Loading subscription plans…</span>
                </div>
              ) : productsError ? (
                <div
                  className={cn(
                    "rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-5 text-center text-sm text-destructive",
                    "dark:border-destructive/35 dark:bg-destructive/10",
                  )}
                >
                  {productsError}
                </div>
              ) : (
                subscriptionPlans.map((plan) => {
                  const isBusy = loadingProductId === plan.productId;
                  const isDisabled = !userData?.profile?.authUserId || isBusy;

                  return (
                    <div
                      key={plan.productId}
                      className={cn(
                        "w-full rounded-2xl p-px transition-shadow duration-200",
                        plan.featured
                          ? cn(
                              "bg-gradient-to-b from-primary/50 via-primary/35 to-primary/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]",
                              "dark:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.78)]",
                            )
                          : cn(
                              "bg-border/60 dark:bg-border/40",
                              "shadow-[0_8px_28px_-24px_rgba(0,0,0,0.35)] dark:shadow-[0_12px_36px_-28px_rgba(0,0,0,0.65)]",
                            ),
                      )}
                    >
                      <div
                        className={cn(
                          "relative rounded-[calc(1rem-1px)] px-4 pb-4 sm:px-5 sm:pb-5",
                          plan.featured
                            ? cn(
                                "border border-primary/20 bg-gradient-to-b from-card/95 to-card/90 pt-6 sm:pt-7",
                                "dark:from-card/90 dark:to-card/75 dark:border-primary/30",
                              )
                            : cn(
                                "border border-border/90 bg-card/90 pt-4 backdrop-blur-sm sm:pt-5",
                                "dark:border-border/80 dark:bg-card/55",
                              ),
                        )}
                      >
                        {plan.featured ? (
                          <span
                            className={cn(
                              "absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase",
                              "bg-primary/12 ring-1 ring-primary/25 dark:bg-primary/18 dark:ring-primary/30",
                            )}
                          >
                            Best value
                          </span>
                        ) : null}

                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {plan.featured ? (
                                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                              ) : null}
                              <p className="font-semibold text-foreground">
                                {plan.name}
                              </p>
                            </div>
                            <p className="mt-1 text-sm leading-snug text-muted-foreground text-pretty">
                              {plan.description}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                              ${plan.price}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                              {plan.frequency}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePlanCheckout(plan.productId)}
                          disabled={isDisabled}
                          className={cn(
                            "mt-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
                            "bg-primary text-primary-foreground shadow-sm",
                            "hover:bg-primary/90 dark:hover:bg-primary/95",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            "disabled:pointer-events-none disabled:opacity-60",
                            "active:scale-[0.99]",
                          )}
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Opening checkout…
                            </>
                          ) : (
                            `Unlock ${plan.kind}`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
