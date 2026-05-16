import { api, internal } from "../_generated/api";
import { httpAction } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { getCreditAmountFromProductId } from "../features/appConfig/shared";

/**
 * RevenueCat Webhook Handlers
 * Handles subscription events from RevenueCat for mobile apps
 *
 * Webhook URL: https://your-site.convex.site/revenuecat/webhooks
 *
 * RevenueCat Event Types:
 * - INITIAL_PURCHASE: First subscription purchase
 * - RENEWAL: Subscription renewed
 * - CANCELLATION: Subscription cancelled (still active until period end)
 * - UNCANCELLATION: Cancelled subscription reactivated
 * - NON_RENEWING_PURCHASE: One-time purchase
 * - EXPIRATION: Subscription expired
 * - BILLING_ISSUE: Payment failed
 * - PRODUCT_CHANGE: User changed subscription tier
 */

/**
 * RevenueCat webhook event structure
 */
interface RevenueCatEvent {
  api_version: string;
  event: {
    type: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    period_type: "TRIAL" | "INTRO" | "NORMAL";
    purchased_at_ms: number;
    expiration_at_ms?: number;
    store: "APP_STORE" | "PLAY_STORE" | "STRIPE" | "PROMOTIONAL";
    environment: "SANDBOX" | "PRODUCTION";
    entitlement_ids?: string[];
    entitlement_id?: string;
    presented_offering_id?: string;
    transaction_id?: string;
    original_transaction_id?: string;
    is_family_share?: boolean;
    country_code?: string;
    price?: number;
    currency?: string;
    subscriber_attributes?: Record<string, any>;
    takehome_percentage?: number;
    offer_code?: string;
    cancel_reason?:
      | "UNSUBSCRIBE"
      | "BILLING_ERROR"
      | "DEVELOPER_INITIATED"
      | "PRICE_INCREASE"
      | "CUSTOMER_SUPPORT"
      | "UNKNOWN";
  };
}

type SubscriptionUpsertResult = {
  subscriptionId: Id<"subscriptions">;
  isNew: boolean;
  isRenewal: boolean;
};

/**
 * Map RevenueCat product ID to our internal productType
 */
function getProductKey(productId: string): string | undefined {
  const normalizedProductId = productId.toLowerCase();

  if (normalizedProductId.includes("year")) {
    return "yearly";
  }

  if (normalizedProductId.includes("month")) {
    return "monthly";
  }

  const creditAmount = getCreditAmountFromProductId(productId);

  if (creditAmount) {
    return `credits${creditAmount}`;
  }

  return undefined;
}

/**
 * Determine if product is a subscription
 */
function isSubscriptionProduct(event: RevenueCatEvent["event"]): boolean {
  const productId = event.product_id.toLowerCase();

  return (
    event.entitlement_id === "premium" ||
    event.entitlement_ids?.includes("premium") ||
    productId.includes("pro_monthly") ||
    productId.includes("pro_yearly") ||
    productId.includes("premium") ||
    productId.includes("subscription") ||
    productId.includes("test_product")
  );
}

/**
 * Main webhook handler
 */
export const handleRevenueCatWebhook = httpAction(async (ctx, request) => {
  try {
    // Verify webhook signature (optional but recommended)
    const authHeader = request.headers.get("Authorization");
    const expectedAuth = process.env.REVENUECAT_WEBHOOK_SECRET;
    console.log(
      "[REVENUECAT WEBHOOK SECRETS] Received webhook with auth header:",
      {
        authHeader,
        expectedAuth,
      },
    );

    if (expectedAuth && authHeader !== expectedAuth) {
      console.error("[REVENUECAT WEBHOOK] Invalid authorization");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as RevenueCatEvent;
    const event = body.event;

    console.log("[REVENUECAT WEBHOOK] Event type:", event.type);
    console.log("[REVENUECAT WEBHOOK] Product ID:", event.product_id);
    console.log("[REVENUECAT WEBHOOK] User ID:", event.app_user_id);

    // Extract user ID (RevenueCat app_user_id should match our betterAuth user ID)
    const userId = event.app_user_id;

    if (!userId) {
      console.error("[REVENUECAT WEBHOOK] No app_user_id in event");
      return new Response("Missing user ID", { status: 400 });
    }

    // Route to appropriate handler based on event type
    switch (event.type) {
      case "INITIAL_PURCHASE":
        await handleInitialPurchase(ctx, event, userId);
        break;

      case "RENEWAL":
        await handleRenewal(ctx, event, userId);
        break;

      case "CANCELLATION":
        await handleCancellation(ctx, event, userId);
        break;

      case "UNCANCELLATION":
        await handleUncancellation(ctx, event, userId);
        break;

      case "NON_RENEWING_PURCHASE":
        await handleNonRenewingPurchase(ctx, event, userId);
        break;

      case "EXPIRATION":
        await handleExpiration(ctx, event, userId);
        break;

      case "BILLING_ISSUE":
        await handleBillingIssue(ctx, event, userId);
        break;

      case "PRODUCT_CHANGE":
        await handleProductChange(ctx, event, userId);
        break;

      default:
        // await handleInitialPurchase(ctx, event, userId);
        console.log("[REVENUECAT WEBHOOK] Unhandled event type:", event.type);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[REVENUECAT WEBHOOK] Error processing webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

/**
 * Handle initial purchase (first subscription or one-time purchase)
 */
async function handleInitialPurchase(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing initial purchase",
    JSON.stringify(event, null, 2),
  );

  const isSubscription = isSubscriptionProduct(event);

  if (isSubscription) {
    const result = await createOrUpdateSubscription(
      ctx,
      event,
      userId,
      "active",
    );

    await ctx.runMutation(
      internal.features.premium.mutations.syncPremiumFromSubscription,
      {
        userId,
        hasActiveSubscription: true,
      },
    );

    if (result.isNew) {
      await ctx.runMutation(
        internal.features.credits.mutations.addBonusCredits,
        {
          userId,
          bonusCredits: 1000,
        },
      );
      console.log("[REVENUECAT] Added 1000 bonus credits for new subscription");
    }
  } else {
    // Handle one-time credit purchase
    await handleCreditPurchase(ctx, event, userId);
  }
}

/**
 * Handle subscription renewal
 */
async function handleRenewal(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing renewal",
    JSON.stringify(event, null, 2),
  );

  const result = await createOrUpdateSubscription(ctx, event, userId, "active");

  // Ensure premium is still active
  await ctx.runMutation(
    internal.features.premium.mutations.syncPremiumFromSubscription,
    {
      userId,
      hasActiveSubscription: true,
    },
  );

  if (result.isRenewal) {
    await ctx.runMutation(internal.features.credits.mutations.addBonusCredits, {
      userId,
      bonusCredits: 1000,
    });
    console.log("[REVENUECAT] Added 1000 bonus credits for renewal");
  } else {
    console.log("[REVENUECAT] Renewal already processed, skipping credits");
  }
}

/**
 * Handle subscription cancellation
 */
async function handleCancellation(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing cancellation",
    JSON.stringify(event, null, 2),
  );
  console.log("[REVENUECAT] Cancel reason:", event.cancel_reason);

  // Update subscription status to canceled
  await createOrUpdateSubscription(ctx, event, userId, "canceled");

  // Note: Premium access continues until expiration_at_ms
  // We'll revoke it in the EXPIRATION event
  console.log(
    "[REVENUECAT] Subscription canceled, will expire at:",
    event.expiration_at_ms ? new Date(event.expiration_at_ms) : "unknown",
  );
}

/**
 * Handle subscription uncancellation (reactivation)
 */
async function handleUncancellation(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing uncancellation",
    JSON.stringify(event, null, 2),
  );

  await createOrUpdateSubscription(ctx, event, userId, "active");

  // Restore premium
  await ctx.runMutation(
    internal.features.premium.mutations.syncPremiumFromSubscription,
    {
      userId,
      hasActiveSubscription: true,
    },
  );
}

/**
 * Handle non-renewing purchase (one-time purchase)
 */
async function handleNonRenewingPurchase(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing non-renewing purchase",
    JSON.stringify(event, null, 2),
  );

  await handleCreditPurchase(ctx, event, userId);
}

/**
 * Handle subscription expiration
 */
async function handleExpiration(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing expiration",
    JSON.stringify(event, null, 2),
  );

  await createOrUpdateSubscription(ctx, event, userId, "expired");

  // Revoke premium access
  await ctx.runMutation(
    internal.features.premium.mutations.syncPremiumFromSubscription,
    {
      userId,
      hasActiveSubscription: false,
    },
  );

  console.log("[REVENUECAT] Subscription expired - premium revoked");
}

/**
 * Handle billing issue
 */
async function handleBillingIssue(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing billing issue",
    JSON.stringify(event, null, 2),
  );

  await createOrUpdateSubscription(ctx, event, userId, "past_due");

  // Optionally revoke premium immediately or wait for grace period
  // For now, we'll keep premium active during grace period
  console.log(
    "[REVENUECAT] Billing issue detected - subscription in grace period",
  );
}

/**
 * Handle product change (upgrade/downgrade)
 */
async function handleProductChange(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  console.log(
    "[REVENUECAT] Processing product change",
    JSON.stringify(event, null, 2),
  );

  await createOrUpdateSubscription(ctx, event, userId, "active");

  // Premium remains active
  await ctx.runMutation(
    internal.features.premium.mutations.syncPremiumFromSubscription,
    {
      userId,
      hasActiveSubscription: true,
    },
  );
}

/**
 * Create or update subscription record
 */
async function createOrUpdateSubscription(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
  status: "active" | "canceled" | "expired" | "past_due",
): Promise<SubscriptionUpsertResult> {
  const productType = getProductKey(event.product_id);

  console.log("createOrUpdateSubscription", {
    userId,
    event: JSON.stringify(event, null, 2),
    status,
    productType,
  });

  const result: SubscriptionUpsertResult = await ctx.runMutation(
    internal.features.subscriptions.mutations.upsertSubscription,
    {
      userId,
      platform: "revenuecat" as const,
      platformCustomerId: event.original_app_user_id,
      platformSubscriptionId:
        event.original_transaction_id ||
        event.transaction_id ||
        event.product_id,
      platformProductId: event.product_id,
      customerEmail: event.subscriber_attributes?.email?.value || "",
      customerName: event.subscriber_attributes?.name?.value,
      status,
      productType,
      currentPeriodStart: event.purchased_at_ms,
      currentPeriodEnd: event.expiration_at_ms,
      canceledAt: status === "canceled" ? Date.now() : undefined,
    },
  );

  return result;
}

/**
 * Handle credit purchase (one-time)
 */
async function handleCreditPurchase(
  ctx: ActionCtx,
  event: RevenueCatEvent["event"],
  userId: string,
) {
  const productId = event.product_id;
  const appConfig = await ctx.runQuery(
    api.features.appConfig.queries.getPublicAppConfig,
    {},
  );

  if (!appConfig.revenueCatCreditProductIds.includes(productId)) {
    console.log(
      "[REVENUECAT] Product is not a configured credit purchase:",
      productId,
    );
    return;
  }

  const creditAmount = getCreditAmountFromProductId(productId);

  console.log(
    "[REVENUECAT] Handling credit purchase",
    JSON.stringify({ productId, creditAmount }, null, 2),
  );

  if (!creditAmount) {
    console.log("[REVENUECAT] Could not derive credit amount:", productId);
    return;
  }

  // Check for duplicate processing (idempotency)
  const orderId =
    event.transaction_id || event.original_transaction_id || productId;
  const existingOrder = await ctx.runQuery(
    internal.features.subscriptions.queries.getOrderByPlatformOrderId,
    {
      platformOrderId: orderId,
    },
  );

  if (existingOrder) {
    console.log("[REVENUECAT] Order already processed:", existingOrder._id);
    return;
  }

  // Record the order
  await ctx.runMutation(internal.features.subscriptions.mutations.insertOrder, {
    userId,
    platform: "revenuecat" as const,
    platformOrderId: orderId,
    platformProductId: productId,
    amount: creditAmount,
    status: "paid" as const,
  });

  // Add credits to user
  await ctx.runMutation(internal.features.credits.mutations.addCreditsToUser, {
    userId,
    amount: creditAmount,
  });

  console.log(
    "[REVENUECAT] Added credits to user",
    JSON.stringify({ userId, creditAmount }, null, 2),
  );
}
