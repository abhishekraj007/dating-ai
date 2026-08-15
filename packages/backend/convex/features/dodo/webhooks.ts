import type { GenericActionCtx, GenericDataModel } from "convex/server";
import type { Payment, Subscription } from "@dodopayments/convex";
import { internal } from "../../_generated/api";
import { creditsFromMetadata, fetchDodoProduct } from "./catalog";

type DodoWebhookCtx = GenericActionCtx<GenericDataModel>;

type MappedSubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "past_due"
  | "trialing";

function readMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
}

function toTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(time)) {
    return undefined;
  }

  return time;
}

function mapSubscriptionStatus(subscription: Subscription): MappedSubscriptionStatus {
  if (subscription.cancel_at_next_billing_date && subscription.status === "active") {
    return "canceled";
  }

  if (subscription.status === "active") return "active";
  if (subscription.status === "cancelled") return "canceled";
  if (subscription.status === "expired") return "expired";
  if (subscription.status === "on_hold" || subscription.status === "paused") {
    return "past_due";
  }
  if (subscription.status === "pending") return "trialing";
  if (subscription.status === "failed") return "expired";

  return "active";
}

function getProductType(interval: Subscription["payment_frequency_interval"]) {
  if (interval === "Year") return "yearly";
  if (interval === "Month") return "monthly";
  return undefined;
}

function getBonusCredits(interval: Subscription["payment_frequency_interval"]) {
  return interval === "Year" ? 5000 : 1000;
}

async function resolveUserId(
  ctx: DodoWebhookCtx,
  args: {
    metadata: Record<string, unknown>;
    email?: string;
    dodoCustomerId?: string;
    platformSubscriptionId?: string;
  },
) {
  const metadataUserId = readMetadataString(args.metadata, "userId");
  if (metadataUserId) {
    return metadataUserId;
  }

  if (args.dodoCustomerId) {
    const byCustomer = await ctx.runQuery(
      internal.features.dodo.queries.getBillingCustomerByDodoCustomerId,
      { dodoCustomerId: args.dodoCustomerId },
    );
    if (byCustomer) {
      return byCustomer.authUserId;
    }
  }

  if (args.platformSubscriptionId) {
    const existing = await ctx.runQuery(
      internal.features.subscriptions.queries.getSubscriptionByPlatformSubscriptionId,
      { platformSubscriptionId: args.platformSubscriptionId },
    );
    if (existing) {
      return existing.userId;
    }
  }

  if (args.email) {
    const byEmail = await ctx.runQuery(
      internal.features.dodo.queries.getBillingCustomerByEmail,
      { email: args.email },
    );
    if (byEmail) {
      return byEmail.authUserId;
    }
  }

  return null;
}

async function storeDodoCustomerId(
  ctx: DodoWebhookCtx,
  authUserId: string,
  dodoCustomerId: string | undefined,
) {
  if (!dodoCustomerId) {
    return;
  }

  await ctx.runMutation(internal.features.dodo.mutations.setDodoCustomerId, {
    authUserId,
    dodoCustomerId,
  });
}

export async function processDodoPaymentSucceeded(
  ctx: DodoWebhookCtx,
  payment: Payment,
) {
  if (payment.subscription_id) {
    console.log(
      "[DODO WEBHOOK] Skipping subscription invoice payment",
      payment.payment_id,
    );
    return;
  }

  const productId = payment.product_cart?.[0]?.product_id;
  if (!productId) {
    console.error("[DODO WEBHOOK] Payment is missing product_cart", payment.payment_id);
    return;
  }

  const userId = await resolveUserId(ctx, {
    metadata: payment.metadata,
    email: payment.customer.email,
    dodoCustomerId: payment.customer.customer_id,
  });

  if (!userId) {
    console.error("[DODO WEBHOOK] No userId for payment", payment.payment_id);
    return;
  }

  await storeDodoCustomerId(ctx, userId, payment.customer.customer_id);

  const existingOrder = await ctx.runQuery(
    internal.features.subscriptions.queries.getOrderByPlatformOrderId,
    { platformOrderId: payment.payment_id },
  );

  if (existingOrder) {
    console.log("[DODO WEBHOOK] Order already processed", payment.payment_id);
    return;
  }

  const product = await fetchDodoProduct(productId);
  if (product.is_recurring) {
    console.log("[DODO WEBHOOK] Recurring product payment, skipping credits");
    return;
  }

  const creditAmount = parseInt(creditsFromMetadata(product.metadata ?? {}) ?? "0", 10);
  if (!creditAmount || creditAmount <= 0) {
    console.error(
      "[DODO WEBHOOK] Invalid or missing credit amount in product metadata",
      productId,
    );
    return;
  }

  await ctx.runMutation(internal.features.subscriptions.mutations.insertOrder, {
    userId,
    platform: "dodo",
    platformOrderId: payment.payment_id,
    platformProductId: productId,
    amount: creditAmount,
    status: "paid",
  });

  await ctx.runMutation(internal.features.credits.mutations.addCreditsToUser, {
    userId,
    amount: creditAmount,
  });

  console.log(
    `[DODO WEBHOOK] Added ${creditAmount} credits to user ${userId}`,
  );
}

export async function processDodoSubscriptionEvent(
  ctx: DodoWebhookCtx,
  subscription: Subscription,
  eventType: "active" | "renewed" | "updated" | "cancelled" | "expired" | "failed" | "on_hold",
) {
  const userId = await resolveUserId(ctx, {
    metadata: subscription.metadata,
    email: subscription.customer.email,
    dodoCustomerId: subscription.customer.customer_id,
    platformSubscriptionId: subscription.subscription_id,
  });

  if (!userId) {
    console.error(
      "[DODO WEBHOOK] No userId for subscription",
      subscription.subscription_id,
    );
    return;
  }

  await storeDodoCustomerId(ctx, userId, subscription.customer.customer_id);

  const mappedStatus = mapSubscriptionStatus(subscription);
  const productType = getProductType(subscription.payment_frequency_interval);

  const result = await ctx.runMutation(
    internal.features.subscriptions.mutations.upsertSubscription,
    {
      userId,
      platform: "dodo",
      platformCustomerId: subscription.customer.customer_id,
      platformSubscriptionId: subscription.subscription_id,
      platformProductId: subscription.product_id,
      customerEmail: subscription.customer.email,
      customerName: subscription.customer.name,
      status: mappedStatus,
      productType,
      currentPeriodStart: toTimestamp(subscription.previous_billing_date),
      currentPeriodEnd: toTimestamp(subscription.next_billing_date),
      canceledAt: toTimestamp(subscription.cancelled_at),
    },
  );

  const hasActiveSubscription = mappedStatus === "active";
  await ctx.runMutation(
    internal.features.premium.mutations.syncPremiumFromSubscription,
    {
      userId,
      hasActiveSubscription,
    },
  );

  const shouldGrantCredits =
    (eventType === "active" && result.isNew) ||
    (eventType === "renewed" && result.isRenewal);

  if (shouldGrantCredits) {
    const bonusCredits = getBonusCredits(subscription.payment_frequency_interval);
    await ctx.runMutation(internal.features.credits.mutations.addBonusCredits, {
      userId,
      bonusCredits,
    });
    console.log(
      `[DODO WEBHOOK] Added ${bonusCredits} bonus credits to user ${userId}`,
    );
  }
}
