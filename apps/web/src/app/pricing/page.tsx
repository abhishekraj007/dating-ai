"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { LoginModal } from "@/components/login-modal";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { POLAR_PRICES } from "../contstants/pricing";

export default function PricingPage() {
  const router = useRouter();

  const userData = useQuery(api.user.fetchUserAndProfile);
  const userSubscriptions = useQuery(
    api.features.subscriptions.queries.getUserSubscriptions
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const isLoading = userData === undefined || userSubscriptions === undefined;
  const isAuthenticated = userData !== null && userData !== undefined;

  const customerId = userSubscriptions?.subscriptions?.[0]?.platformCustomerId;

  const handleCheckout = (productId: string | undefined) => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    if (!productId) return;

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

  const goToPortal = async () => {
    // find the customer id associated with this user
    if (!customerId) {
      console.error("No customer ID found");
      return;
    }
    router.push(`/portal?userId=${customerId}` as any);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading pricing...</p>
        </div>
      </div>
    );
  }

  const hasActiveSubscription =
    userSubscriptions?.hasActiveSubscription || false;
  const currentProductKey = userSubscriptions?.subscriptions?.find(
    (sub) => sub.status === "active"
  )?.productType;

  // Get pricing tiers from constants
  const freeTier = POLAR_PRICES.find((p) => p.id === "free")!;
  const monthlyTier = POLAR_PRICES.find((p) => p.id === "monthly")!;
  const yearlyTier = POLAR_PRICES.find((p) => p.id === "yearly")!;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Select the perfect plan for your needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Tier */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-2xl">{freeTier.name}</CardTitle>
            <CardDescription>{freeTier.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">${freeTier.price}</span>
              <span className="text-muted-foreground">
                {freeTier.frequency}
              </span>
            </div>
            <ul className="space-y-3">
              {freeTier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
              {!hasActiveSubscription ? "Current Plan" : "Free Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Monthly Pro */}
        <Card className="relative border-primary shadow-lg">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              Popular
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">{monthlyTier.name}</CardTitle>
            <CardDescription>{monthlyTier.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">${monthlyTier.price}</span>
              <span className="text-muted-foreground">
                {monthlyTier.frequency}
              </span>
            </div>
            <ul className="space-y-3">
              {monthlyTier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {!isAuthenticated ? (
              <Button
                className="w-full"
                onClick={() => setLoginModalOpen(true)}
              >
                Get Started
              </Button>
            ) : currentProductKey === "monthly" ? (
              <Button onClick={goToPortal} className="w-full">
                Manage Subscription
              </Button>
            ) : hasActiveSubscription ? (
              <Button className="w-full" variant="outline" disabled>
                Already Subscribed
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() =>
                  handleCheckout(monthlyTier.productId || undefined)
                }
                disabled={checkoutLoading === monthlyTier.productId}
              >
                {checkoutLoading === monthlyTier.productId
                  ? "Loading..."
                  : "Get Started"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Yearly Pro */}
        <Card className="relative">
          <div className="absolute top-0 right-4">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-b-lg text-xs font-semibold">
              Save 17%
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">{yearlyTier.name}</CardTitle>
            <CardDescription>{yearlyTier.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="text-4xl font-bold">${yearlyTier.price}</span>
              <span className="text-muted-foreground">
                {yearlyTier.frequency}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              ${((yearlyTier.price || 0) / 12).toFixed(2)}/month billed annually
            </p>
            <ul className="space-y-3">
              {yearlyTier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {!isAuthenticated ? (
              <Button
                className="w-full"
                onClick={() => setLoginModalOpen(true)}
              >
                Get Started
              </Button>
            ) : currentProductKey === "yearly" ? (
              <Button onClick={goToPortal} className="w-full">
                Manage Subscription
              </Button>
            ) : hasActiveSubscription ? (
              <Button className="w-full" variant="outline" disabled>
                Already Subscribed
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() =>
                  handleCheckout(yearlyTier.productId || undefined)
                }
                disabled={checkoutLoading === yearlyTier.productId}
              >
                {checkoutLoading === yearlyTier.productId
                  ? "Loading..."
                  : "Get Started"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        returnUrl="/pricing"
      />
    </div>
  );
}
