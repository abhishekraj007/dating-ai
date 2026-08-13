import { Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/betterAuth/client";
import { clearLocalUserCache } from "@/hooks/use-clear-app-cache";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useTranslation } from "@/hooks/use-translation";

export function useDeleteAccount() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const deleteAccount = async () => {
    setIsDeletingUser(true);
    const { error } = await authClient.deleteUser({});
    if (error) {
      setIsDeletingUser(false);
      Alert.alert(
        t("alerts.error"),
        error.message || "Failed to delete user",
      );
      return;
    }

    useOnboardingStore.getState().setForceAuthRedirect(true);
    await clearLocalUserCache();
    router.replace("/(root)/(auth)");
  };

  return {
    isDeletingUser,
    deleteAccount,
  };
}
