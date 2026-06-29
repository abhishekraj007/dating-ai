/**
 * When true, web checkout is disabled and users are directed to the mobile app
 * for credits and subscription purchases.
 *
 * Set `NEXT_PUBLIC_DISABLE_WEB_PAYMENT=true` in the environment to enable.
 */
export const DISABLE_WEB_PAYMENT =
  process.env.NEXT_PUBLIC_DISABLE_WEB_PAYMENT === "true";

export type DownloadAppReason = "credits" | "premium";

export function getDownloadAppCopy(reason: DownloadAppReason) {
  if (reason === "premium") {
    return {
      badge: "Premium",
      title: "Get premium on the App Store",
      description:
        "Subscriptions and premium access are managed in the FeelChat iOS app. Download it from the App Store to unlock photos, videos, and full chat features.",
    };
  }

  return {
    badge: "Credits",
    title: "Get credits in the app",
    description:
      "Web payments are not available yet. Download FeelChat from the App Store to buy credits and keep chatting without interruption.",
  };
}
