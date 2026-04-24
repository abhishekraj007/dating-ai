"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

let polarEmbedCheckoutModulePromise: Promise<
  typeof import("@polar-sh/checkout/embed")
> | null = null;

function loadPolarEmbedCheckoutModule() {
  if (!polarEmbedCheckoutModulePromise) {
    polarEmbedCheckoutModulePromise = import("@polar-sh/checkout/embed");
  }

  return polarEmbedCheckoutModulePromise;
}

function shouldUseRedirectCheckout() {
  const { hostname, protocol } = window.location;

  if (protocol !== "https:") {
    return true;
  }

  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

export function usePolarEmbedCheckout() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkoutRef = useRef<PolarCheckoutInstance | null>(null);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    return () => {
      checkoutRef.current?.close();
      checkoutRef.current = null;
    };
  }, []);

  const preloadCheckout = () => {
    if (shouldUseRedirectCheckout()) {
      return;
    }

    void loadPolarEmbedCheckoutModule();
  };

  const openCheckout = async ({
    productId,
    customerExternalId,
    customerEmail,
    customerName,
  }: EmbedCheckoutOptions) => {
    setLoadingProductId(productId);

    try {
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

      params.set("returnPath", currentPath);

      const checkoutUrl = `${window.location.origin}/checkout?${params.toString()}`;

      if (shouldUseRedirectCheckout()) {
        window.location.assign(checkoutUrl);
        return;
      }

      const { PolarEmbedCheckout } = await loadPolarEmbedCheckoutModule();

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
    preloadCheckout,
    loadingProductId,
  };
}
