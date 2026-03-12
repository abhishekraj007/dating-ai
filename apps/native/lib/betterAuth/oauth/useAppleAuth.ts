import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import { authClient } from "../client";

function isAppleSignInCancelled(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String(error.code) === "ERR_REQUEST_CANCELED"
  );
}

export const useAppleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Failed to get Apple identity token");
      }

      await authClient.signIn.social({
        provider: "apple",
        idToken: {
          token: credential.identityToken,
          nonce: credential.authorizationCode ?? undefined,
          accessToken: credential.identityToken,
        },
      });
    } catch (error) {
      if (!isAppleSignInCancelled(error)) {
        console.error("Apple sign in error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isLoading,
  };
};
