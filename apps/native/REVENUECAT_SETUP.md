# RevenueCat Setup Guide

This guide will help you configure RevenueCat for in-app purchases.

## 1. Create RevenueCat Account

1. Go to [RevenueCat](https://www.revenuecat.com/) and create an account
2. Create a new project

## 2. Configure App Store Connect / Google Play Console

### iOS (App Store Connect)
1. Create your app in App Store Connect
2. Set up in-app purchases:
   - **Premium Subscription**: `premium_monthly` or `premium_yearly`
   - **Credits**: 
     - `credits_1000` - 1000 credits
     - `credits_2000` - 2000 credits
     - `credits_3000` - 3000 credits

### Android (Google Play Console)
1. Create your app in Google Play Console
2. Set up in-app products with the same identifiers as iOS

## 3. Connect Stores to RevenueCat

1. In RevenueCat dashboard, go to your project settings
2. Add your iOS app:
   - Enter Bundle ID
   - Upload App Store Connect API Key
3. Add your Android app:
   - Enter Package Name
   - Upload Google Play Service Account JSON

## 4. Create Offerings

1. In RevenueCat dashboard, go to "Offerings"
2. Create a new offering (e.g., "default")
3. Add packages:
   - Premium subscription package
   - Credit packages (1000, 2000, 3000)

## 5. Update API Keys

Update the API keys in `/apps/native/contexts/purchases-context.tsx`:

```typescript
const apiKey =
  Platform.OS === "ios"
    ? "YOUR_IOS_API_KEY_HERE"  // Get from RevenueCat dashboard
    : "YOUR_ANDROID_API_KEY_HERE";  // Get from RevenueCat dashboard
```

## 6. Configure Entitlements

In RevenueCat dashboard, create an entitlement called "premium" and attach your premium subscription to it.

## 7. Test Purchases

### iOS
1. Create a sandbox tester account in App Store Connect
2. Sign out of your Apple ID on the device
3. When making a purchase, sign in with the sandbox account

### Android
1. Add test users in Google Play Console
2. Use a test account to make purchases

## Product Identifiers

Make sure your product identifiers in the stores match these patterns:

- Premium: Should contain "premium" (e.g., `premium_monthly`)
- Credits: Should contain "credits_" followed by the amount (e.g., `credits_1000`, `credits_2000`, `credits_3000`)

## Notes

- The app automatically grants 1000 credits when a user upgrades to premium
- Credits are added to the user's profile in Convex when purchases are successful
- Premium status is tracked with an expiration date for subscriptions
