# Polar Webhook Integration

This document explains how the Polar webhook integration works with Convex backend.

## Overview

The Polar webhook handler is implemented in Next.js API routes and calls Convex mutations to sync subscription and payment data. This is different from the RevenueCat integration which runs entirely in Convex HTTP actions.

## Architecture

```
Polar → Next.js Webhook API → Convex HTTP Client → Convex Mutations
```

### Why Next.js for Polar?

- **Better Integration**: Uses official `@polar-sh/nextjs` SDK with built-in webhook verification
- **Type Safety**: Polar SDK provides TypeScript types for webhook payloads
- **Flexibility**: Easier to add custom logic before/after Convex mutations
- **Authentication**: Uses Convex deployment key for admin-level access

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT_KEY=your_deployment_key_here

# Polar
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
```

### 2. Polar Dashboard Configuration

1. Go to Polar Dashboard → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhook/polar`
3. Select events to listen to:
   - `subscription.created`
   - `subscription.active`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.revoked`
   - `checkout.updated` (for one-time purchases)
4. Copy the webhook secret to `POLAR_WEBHOOK_SECRET`

### 3. Product Mapping

Update the `getProductKey` function in `/apps/web/src/app/api/webhook/polar/route.ts`:

```typescript
function getProductKey(productId: string): string | undefined {
  const productMap: Record<string, string> = {
    prod_abc123: "monthly",
    prod_def456: "yearly",
    // Add your Polar product IDs here
  };

  return productMap[productId];
}
```

### 4. User ID Metadata

When creating a Polar checkout, include the user ID in metadata:

```typescript
await polar.checkouts.custom.create({
  metadata: {
    userId: user._id, // Better Auth user ID
  },
  // ... other checkout data
});
```

## Webhook Events

### subscription.created

- Creates new subscription in Convex
- Grants premium access
- Awards 1000 bonus credits (first time only)

### subscription.active

- Updates subscription status to active
- Grants/restores premium access
- Awards 1000 bonus credits (for renewals)

### subscription.updated

- Updates subscription details
- Syncs premium status based on subscription state

### subscription.canceled

- Updates subscription status to canceled
- Premium access continues until period end
- Does not immediately revoke premium

### subscription.revoked

- Updates subscription status to expired
- Immediately revokes premium access
- Triggered when subscription actually expires

### checkout.updated

- Handles one-time purchases
- Can be used for credit packs or other products

## Convex Mutations

The following public mutations are called from the webhook:

### Subscriptions

- `api.features.subscriptions.mutations.upsertSubscriptionPublic`
  - Creates or updates subscription records
  - Returns `{ subscriptionId, isNew }`

### Premium

- `api.features.premium.mutations.syncPremiumFromSubscriptionPublic`
  - Grants or revokes premium based on subscription status
  - Only affects subscription-based premium (not manual/lifetime)

### Credits

- `api.features.credits.mutations.addBonusCreditsPublic`
  - Adds bonus credits for new subscriptions and renewals
  - Defaults to 1000 credits

### Orders

- `api.features.subscriptions.mutations.insertOrderPublic`
  - Records one-time purchase orders
  - Used for credit packs or other non-subscription products

## Authentication

The webhook uses `createAdminConvexClient()` which authenticates with the Convex deployment key. This provides admin-level access to call public mutations that would normally require authentication.

## Error Handling

All webhook handlers wrap their logic in try-catch blocks and log errors to console. Errors are re-thrown to signal Polar that the webhook failed, triggering automatic retries.

## Testing

### Local Testing with ngrok

1. Start your Next.js dev server:

```bash
cd apps/web
pnpm dev
```

2. Start ngrok:

```bash
ngrok http 3000
```

3. Update Polar webhook URL to your ngrok URL:

```
https://abc123.ngrok.io/api/webhook/polar
```

4. Create test subscriptions in Polar dashboard or using Polar CLI

### Debugging

Check logs in:

- Next.js console (local development)
- Vercel logs (production)
- Polar webhook dashboard (shows delivery attempts and responses)

## Comparison with RevenueCat

| Feature     | RevenueCat                             | Polar                             |
| ----------- | -------------------------------------- | --------------------------------- |
| Location    | Convex HTTP Action                     | Next.js API Route                 |
| Auth        | RevenueCat webhook secret              | Polar SDK + Convex deployment key |
| Type Safety | Manual types                           | Polar SDK types                   |
| Mutations   | Internal mutations via ctx.runMutation | Public mutations via HTTP client  |
| Platform    | Mobile (iOS/Android)                   | Web                               |

## Security

- ✅ Webhook signature verification (automatic via Polar SDK)
- ✅ Admin authentication for Convex mutations (deployment key)
- ✅ User ID validation
- ✅ Idempotency checks (duplicate processing prevention)
- ✅ Error logging and monitoring

## Best Practices

1. **Always include userId in metadata** when creating checkouts
2. **Map product IDs** in the webhook handler for consistent naming
3. **Test webhooks locally** with ngrok before deploying
4. **Monitor webhook logs** in Polar dashboard
5. **Handle all webhook events** even if just logging for now
6. **Use idempotency** to prevent duplicate processing
