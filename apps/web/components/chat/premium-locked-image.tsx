"use client";

import { useEffect, useState } from "react";
import { Crown, Lock, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

interface PremiumLockedImageProps {
  imageUrl: string;
  profileName?: string;
  profileAvatar?: string | null;
  viewerName?: string | null;
  viewerEmail?: string | null;
  viewerAuthUserId?: string | null;
}

export function PremiumLockedImage({
  imageUrl,
  profileName = "AI",
  profileAvatar,
  viewerName,
  viewerEmail,
  viewerAuthUserId,
}: PremiumLockedImageProps) {
  const [open, setOpen] = useState(false);
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
    if (!viewerAuthUserId) {
      return;
    }

    void openCheckout({
      productId,
      customerExternalId: viewerAuthUserId,
      customerEmail: viewerEmail,
      customerName: viewerName,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative overflow-hidden rounded-3xl text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Premium photo from ${profileName}`}
          className="max-w-[260px] rounded-3xl object-cover blur-2xl saturate-75 transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 px-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg">
            <Lock className="h-5 w-5" />
          </div>
          <div className="rounded-full bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg">
            Tap to see photo
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Locked premium photo from ${profileName}`}
              className="h-72 w-full object-cover blur-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/75" />
          </div>

          <div className="relative -mt-12 space-y-5 px-6 pb-6">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                <AvatarImage
                  src={profileAvatar ?? undefined}
                  alt={profileName}
                />
                <AvatarFallback>{profileName[0] ?? "A"}</AvatarFallback>
              </Avatar>
            </div>

            <DialogHeader className="items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Crown className="h-3.5 w-3.5 text-primary" />
                Premium preview
              </div>
              <DialogTitle className="text-2xl font-semibold">
                Get closer to {profileName}
              </DialogTitle>
              <DialogDescription className="max-w-sm text-sm leading-6">
                Unlock premium to see every private photo clearly and keep
                exclusive chat moments unblurred.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              {isLoadingProducts ? (
                <div className="rounded-3xl border border-border/70 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
                  Loading subscription plans...
                </div>
              ) : productsError ? (
                <div className="rounded-3xl border border-border/70 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
                  {productsError}
                </div>
              ) : (
                subscriptionPlans.map((plan) => (
                  <button
                    key={plan.productId}
                    type="button"
                    onClick={() => handlePlanCheckout(plan.productId)}
                    disabled={
                      !viewerAuthUserId || loadingProductId === plan.productId
                    }
                    className={
                      plan.featured
                        ? "rounded-3xl border border-primary/40 bg-background/90 px-4 py-4 text-left shadow-lg transition-transform active:scale-[0.96]"
                        : "rounded-3xl border border-border/70 bg-background/85 px-4 py-4 text-left shadow-md transition-transform active:scale-[0.96]"
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
                        <p className="mt-1 text-sm text-muted-foreground">
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
    </>
  );
}
