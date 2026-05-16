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
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        throw new Error("Apple Sign-In is not available on this device");
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Failed to get Apple identity token");
      }

      const result = await authClient.signIn.social({
        provider: "apple",
        idToken: {
          token: credential.identityToken,
        },
      });

      if (result?.error) {
        throw new Error(result.error.message || "Apple sign in failed");
      }

      const session = await authClient.getSession();

      if (!session.data) {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);

      if (isAppleSignInCancelled(error)) {
        return;
      }

      console.error("Apple sign in error:", error);
      throw error;
    }
  };

  return {
    signIn,
    isLoading,
  };
};
