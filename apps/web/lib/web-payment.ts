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
 * `NEXT_PUBLIC_DISABLE_WEB_PAYMENT=false` to enable Dodo checkout on web.
 */
export const DISABLE_WEB_PAYMENT = readEnvBoolean(
  process.env.NEXT_PUBLIC_DISABLE_WEB_PAYMENT,
  true,
);

/**
 * When true, web login and chat sign-in are hidden. Existing auth code stays
 * in place; callers still open the auth modal, which shows an App Store
 * download prompt instead.
 *
 * Defaults to `true`. Set `NEXT_PUBLIC_DISABLE_WEB_LOGIN=false` to restore
 * the web login flow.
 */
export const DISABLE_WEB_LOGIN = readEnvBoolean(
  process.env.NEXT_PUBLIC_DISABLE_WEB_LOGIN,
  true,
);

export type DownloadAppReason = "credits" | "premium" | "login";

export function getDownloadAppCopy(reason: DownloadAppReason) {
  if (reason === "premium") {
    return {
      badge: "Premium",
      title: "Get premium on the App Store",
      description:
        "Subscriptions and premium access are managed in the FeelChat iOS app. Download it from the App Store to unlock photos, videos, and full chat features.",
    };
  }

  if (reason === "login") {
    return {
      badge: "Chat",
      title: "Continue in the FeelChat app",
      description:
        "Sign in and chat are available in the FeelChat iOS app. Download it from the App Store to start conversations and pick up where you left off.",
    };
  }

  return {
    badge: "Credits",
    title: "Get credits on the App Store",
    description:
      "Web payments are not available yet. Download FeelChat from the App Store to buy credits and keep chatting without interruption.",
  };
}
