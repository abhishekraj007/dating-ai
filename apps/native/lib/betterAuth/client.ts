import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { convexClient } from "./convex-client";

const authBaseURL = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
const configuredScheme = Constants.expoConfig?.scheme;
const appScheme = Array.isArray(configuredScheme)
  ? configuredScheme[0]
  : configuredScheme;

if (!authBaseURL) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_SITE_URL for Better Auth client");
}

if (!appScheme) {
  throw new Error("Missing Expo app scheme for Better Auth client");
}

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [
    convexClient(),
    expoClient({
      scheme: appScheme,
      storagePrefix: appScheme,
      storage: SecureStore,
    }),
  ],
});
