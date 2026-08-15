"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@dating-ai/backend/convex/_generated/api";

type EmbedCheckoutOptions = {
  productId: string;
  customerExternalId: string;
  customerEmail?: string | null;
  customerName?: string | null;
};

export function usePolarEmbedCheckout() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createCheckout = useAction(api.features.dodo.actions.createCheckout);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    return () => {
      setLoadingProductId(null);
    };
  }, []);

  const preloadCheckout = () => {
    return;
  };

  const openCheckout = async ({ productId }: EmbedCheckoutOptions) => {
    setLoadingProductId(productId);

    const returnPath =
      currentPath.startsWith("/") && !currentPath.startsWith("//")
        ? currentPath
        : "/";

    try {
      const session = await createCheckout({
        productId,
        returnUrl: `${window.location.origin}${returnPath}`,
      });
      window.location.assign(session.checkout_url);
    } catch (error) {
      setLoadingProductId(null);
      console.error("Failed to open Dodo checkout:", error);
      toast.error("Failed to open checkout. Please try again.");
    }
  };

  return {
    openCheckout,
    preloadCheckout,
    loadingProductId,
  };
}
