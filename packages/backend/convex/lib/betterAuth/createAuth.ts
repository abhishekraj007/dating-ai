import { type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import type { DataModel } from "../../_generated/dataModel";
import { betterAuth } from "better-auth";
import { authComponent } from "./component";

const siteUrl = process.env.SITE_URL!;
const nativeAppUrl = process.env.NATIVE_APP_URL || "quotes://";

export function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false },
) {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    trustedOrigins: [
      siteUrl,
      nativeAppUrl,
      // Local development
      "http://localhost:3004", // admin local
      "http://localhost:3005", // web local
      // Production (Railway)
      "https://admin-dating.up.railway.app",
      "https://web-dating.up.railway.app",
    ],
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
    },
    // crossDomain plugin enables multi-app OAuth by skipping state cookie check
    plugins: [expo(), convex(), crossDomain({ siteUrl })],
  });
}
