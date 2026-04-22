"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type EmbedCheckoutOptions = {
  productId: string;
  customerExternalId: string;
  customerEmail?: string | null;
  customerName?: string | null;
};

type PolarCheckoutEvent = Event & {
  preventDefault: () => void;
  detail?: {
    redirect?: boolean;
  };
};

type PolarCheckoutInstance = {
  close: () => void;
  addEventListener: (
    type: "success" | "close" | "confirmed",
    listener: (event: PolarCheckoutEvent) => void,
  ) => void;
};

export function usePolarEmbedCheckout() {
  const router = useRouter();
  const checkoutRef = useRef<PolarCheckoutInstance | null>(null);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      checkoutRef.current?.close();
      checkoutRef.current = null;
    };
  }, []);

  const openCheckout = async ({
    productId,
    customerExternalId,
    customerEmail,
    customerName,
  }: EmbedCheckoutOptions) => {
    setLoadingProductId(productId);

    try {
      const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");

      checkoutRef.current?.close();

      const params = new URLSearchParams({
        products: productId,
        customerExternalId,
      });

      if (customerEmail) {
        params.set("customerEmail", customerEmail);
      }

      if (customerName) {
        params.set("customerName", customerName);
      }

      const checkoutUrl = `${window.location.origin}/checkout?${params.toString()}`;
      const theme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";

      const checkout = (await PolarEmbedCheckout.create(checkoutUrl, {
        theme,
        onLoaded: () => {
          setLoadingProductId(null);
        },
      })) as PolarCheckoutInstance;

      checkoutRef.current = checkout;

      checkout.addEventListener("success", (event) => {
        event.preventDefault();
        checkoutRef.current?.close();
        checkoutRef.current = null;
        setLoadingProductId(null);
        toast.success("Purchase completed. Your account will update shortly.");
        router.refresh();
      });

      checkout.addEventListener("close", () => {
        checkoutRef.current = null;
        setLoadingProductId(null);
        router.refresh();
      });
    } catch (error) {
      setLoadingProductId(null);
      console.error("Failed to open Polar checkout:", error);
      toast.error("Failed to open checkout. Please try again.");
    }
  };

  return {
    openCheckout,
    loadingProductId,
  };
}
