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
import { usePolarSubscriptionsQuery } from "@/hooks/use-polar-catalog";
import { usePolarEmbedCheckout } from "@/hooks/use-polar-embed-checkout";
import { cn } from "@/lib/utils";

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
  const { openCheckout, preloadCheckout, loadingProductId } =
    usePolarEmbedCheckout();
  const {
    data: products = [],
    isLoading: isLoadingProducts,
    error,
  } = usePolarSubscriptionsQuery(open);

  useEffect(() => {
    if (open) {
      preloadCheckout();
    }
  }, [open, preloadCheckout]);

  const productsError =
    error instanceof Error
      ? error.message
      : error
        ? "Failed to load subscription plans"
        : null;

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
                Premium Access
              </div>
              <DialogTitle className="text-2xl font-semibold">
                Get closer to {profileName}
              </DialogTitle>
              <DialogDescription className="max-w-sm text-sm leading-6">
                Unlock premium to see every private photo and keep exclusive
                chat moments unblurred.
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
                  <div
                    key={plan.productId}
                    className={cn(
                      "rounded-full border px-4 pr-6 py-4 text-left shadow-lg transition-transform active:scale-[0.96]",
                      plan.featured
                        ? "border-primary/40 bg-background/90 "
                        : "rounded-full border border-border/70 bg-background/85",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Button
                        // type="button"
                        variant={"default"}
                        onClick={() => handlePlanCheckout(plan.productId)}
                        disabled={
                          !viewerAuthUserId ||
                          loadingProductId === plan.productId
                        }
                        className={"px-14 py-6 rounded-full min-w-[200px]"}
                      >
                        {loadingProductId === plan.productId
                          ? "Opening checkout..."
                          : `${
                              (plan.kind || "").toLocaleUpperCase() ===
                              "MONTHLY"
                                ? "Monthly"
                                : "Yearly"
                            }`}
                      </Button>

                      <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums text-foreground">
                          ${plan.price}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.frequency}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
