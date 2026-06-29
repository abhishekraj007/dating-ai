function readEnvBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value == null || value.trim() === "") {
    return fallback;
  }

  return value === "true";
}

/**
 * When true, web checkout is disabled and users are directed to the FeelChat
 * iOS app for credits and subscription purchases.
 *
 * Defaults to `true` (App Store download flow). Set
 * `NEXT_PUBLIC_DISABLE_WEB_PAYMENT=false` to enable Polar checkout on web.
 */
export const DISABLE_WEB_PAYMENT = readEnvBoolean(
  process.env.NEXT_PUBLIC_DISABLE_WEB_PAYMENT,
  true,
);

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
    title: "Get credits on the App Store",
    description:
      "Web payments are not available yet. Download FeelChat from the App Store to buy credits and keep chatting without interruption.",
  };
}
