"use client";

import { useEffect, useState } from "react";
import { useQuery as useConvexQuery } from "convex/react";
import { api as convexApi } from "@dating-ai/backend/convex/_generated/api";
import { Crown, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePolarEmbedCheckout } from "@/hooks/use-polar-embed-checkout";

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
  const { openCheckout, loadingProductId } = usePolarEmbedCheckout();

  useEffect(() => {
    if (!open) {
      return;
    }

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
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background px-6 pb-6 pt-6">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_70%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_70%)]" />
          <DialogHeader className="relative items-center text-center">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Crown className="h-3.5 w-3.5 text-primary" />
              Premium access
            </div>
            <DialogTitle className="text-2xl font-semibold text-balance">
              {title}
            </DialogTitle>
            <DialogDescription className="max-w-sm text-sm leading-6 text-pretty">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-5 grid gap-3">
            {isLoadingProducts ? (
              <div className="rounded-3xl border border-border/70 bg-background/75 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
                Loading subscription plans...
              </div>
            ) : productsError ? (
              <div className="rounded-3xl border border-border/70 bg-background/75 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
                {productsError}
              </div>
            ) : (
              subscriptionPlans.map((plan) => (
                <button
                  key={plan.productId}
                  type="button"
                  onClick={() => handlePlanCheckout(plan.productId)}
                  disabled={
                    !userData?.profile?.authUserId ||
                    loadingProductId === plan.productId
                  }
                  className={
                    plan.featured
                      ? "rounded-3xl border border-primary/35 bg-background/92 px-4 py-4 text-left shadow-[0_18px_32px_-24px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.96]"
                      : "rounded-3xl border border-border/70 bg-background/85 px-4 py-4 text-left shadow-[0_14px_24px_-24px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.96]"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {plan.featured ? (
                          <Sparkles className="h-4 w-4 text-primary" />
                        ) : null}
                        <p className="font-medium text-foreground">
                          {plan.name}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground text-pretty">
                        {plan.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        ${plan.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {plan.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
                      {loadingProductId === plan.productId
                        ? "Opening checkout..."
                        : `Unlock ${plan.kind}`}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
