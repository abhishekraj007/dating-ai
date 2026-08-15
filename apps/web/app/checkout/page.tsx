"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useConvexAuth } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";

function CheckoutRedirect() {
  const searchParams = useSearchParams();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const createCheckout = useAction(api.features.dodo.actions.createCheckout);
  const [error, setError] = useState<string | null>(null);
  const productId = searchParams.get("products");
  const returnPathParam = searchParams.get("returnPath") || "/";
  const returnPath =
    returnPathParam.startsWith("/") && !returnPathParam.startsWith("//")
      ? returnPathParam
      : "/";

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setError("Please sign in to continue checkout.");
      return;
    }

    if (!productId) {
      setError("Product is required");
      return;
    }

    void createCheckout({
      productId,
      returnUrl: `${window.location.origin}${returnPath}`,
    })
      .then((session) => {
        window.location.assign(session.checkout_url);
      })
      .catch((checkoutError: unknown) => {
        console.error("Failed to open Dodo checkout:", checkoutError);
        setError("Failed to open checkout. Please try again.");
      });
  }, [createCheckout, isAuthenticated, isLoading, productId, returnPath]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      {error ? (
        <p className="text-center text-sm text-muted-foreground">{error}</p>
      ) : (
        <Spinner className="h-8 w-8" />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <CheckoutRedirect />
    </Suspense>
  );
}
