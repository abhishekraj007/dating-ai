import { type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import type { DataModel } from "../../_generated/dataModel";
import { betterAuth } from "better-auth";
import { authComponent } from "./component";

// web client id com.noosperai.feelchat.web

const siteUrl = process.env.SITE_URL!;
const authBaseUrl = process.env.CONVEX_SITE_URL ?? siteUrl;
const nativeAppUrl = process.env.NATIVE_APP_URL || "feelchat://";
const iosAppBundleIdentifier = "com.noosperai.feelchat";
const appleClientId = process.env.APPLE_CLIENT_ID || iosAppBundleIdentifier;
// Generated via: node scripts/generate-apple-secret.mjs
const appleClientSecret = process.env.APPLE_CLIENT_SECRET;

const appleAudience = Array.from(
  new Set([appleClientId, iosAppBundleIdentifier]),
);
const extraTrustedOrigins = (process.env.TRUSTED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const trustedOrigins = Array.from(
  new Set([
    siteUrl,
    authBaseUrl,
    nativeAppUrl,
    // Local development
    "http://localhost:3004", // admin local
    "http://localhost:3005", // web local
    // Production (Railway)
    "https://dating-ai.up.railway.app",
    "https://admin-dating.up.railway.app",
    "https://web-dating.up.railway.app",
    "https://admin-dating-dev.up.railway.app",
    "https://appleid.apple.com",
    ...extraTrustedOrigins,
  ]),
);

export function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false },
) {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: authBaseUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
      apple: {
        clientId: appleClientId,
        ...(appleClientSecret ? { clientSecret: appleClientSecret } : {}),
        appBundleIdentifier: iosAppBundleIdentifier,
        audience: appleAudience,
      },
    },
    // crossDomain plugin enables multi-app OAuth by skipping state cookie check
    plugins: [expo(), convex(), crossDomain({ siteUrl })],
  });
}
