"use client";

import { useQuery as useConvexQuery } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@convex-starter/backend/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    credtis?: string; // Handle typo
  };
}

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const router = useRouter();
  const userData = useConvexQuery(api.user.fetchUserAndProfile);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Fetch products using react-query for caching
  const { data: polarProducts = [], isLoading } = useQuery({
    queryKey: ["polar-products"],
    queryFn: async () => {
      const response = await fetch("/api/polar/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json() as Promise<PolarProduct[]>;
    },
    enabled: open, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleCheckout = async (productId: string | undefined) => {
    if (!productId) {
      console.error("No product ID provided");
      return;
    }

    setCheckoutLoading(productId);

    const userId = userData!.profile?.authUserId || "";
    const userEmail = userData!.userMetadata.email || "";
    const userName = userData!.profile?.name || userData!.userMetadata.name;

    const params = new URLSearchParams({
      products: productId,
      customerEmail: userEmail,
      customerExternalId: userId,
      customerName: userName,
    });

    const url = `/checkout?${params.toString()}` as any;
    router.push(url);
  };

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

  // Extract credit amount from product name or metadata
  const getCreditAmount = (product: PolarProduct) => {
    // Try metadata first
    const metadata = (product as any).metadata;
    if (metadata?.credits) {
      return parseInt(metadata.credits);
    }
    if (metadata?.credtis) {
      // Handle typo in your data
      return parseInt(metadata.credtis);
    }

    // Fallback to parsing from name
    const match = product.name?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Get badge for product
  const getBadge = (credits: number) => {
    if (credits === 2500) return "Popular";
    return undefined;
  };

  // Convert products object to sorted array
  const creditProducts = polarProducts
    .filter((product): product is PolarProduct => !!product)
    .map((product) => {
      const credits = getCreditAmount(product);
      return {
        product,
        credits,
        badge: getBadge(credits),
      };
    })
    .sort((a, b) => a.credits - b.credits); // Sort by credit amount ascending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Buy Credits</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading options...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {creditProducts?.map((item, index: number) => {
              const price = item.product?.prices?.[0]?.priceAmount
                ? (item.product.prices[0].priceAmount / 100).toFixed(2)
                : "0.00";

              return (
                <Card
                  key={item.product.id}
                  className={
                    item.badge === "Popular"
                      ? "border-primary shadow-lg relative"
                      : "relative"
                  }
                >
                  {item.badge && (
                    <div className="absolute top-[-16px] left-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          item.badge === "Popular"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">{getIcon(index)}</div>
                        <div className="flex flex-col">
                          <span className="text-lg">{item.product.name}</span>
                          <span className="text-xl font-bold">${price}</span>
                          {/* <CardDescription className="text-sm">{item.product.description}</CardDescription> */}
                        </div>
                      </div>
                      <div>
                        {item.product?.id ? (
                          <Button
                            className="w-full"
                            onClick={() => handleCheckout(item.product?.id)}
                            disabled={checkoutLoading === item.product.id}
                          >
                            {checkoutLoading === item.product.id
                              ? "Processing..."
                              : "Buy Now"}
                          </Button>
                        ) : (
                          <Button className="w-full" disabled>
                            Unavailable
                          </Button>
                        )}
                      </div>
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
