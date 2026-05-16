import * as Linking from "expo-linking";
import { useState } from "react";
import { authClient } from "../client";

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    try {
      const callbackURL = Linking.createURL("");

      console.log("Starting Google sign in", { callbackURL });

      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (result?.error) {
        console.error("Google sign in returned an error:", result.error);
        throw new Error(result.error.message || "Google sign in failed");
      }

      const session = await authClient.getSession();

      if (!session.data) {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  return {
    signIn,
    isLoading,
  };
};
