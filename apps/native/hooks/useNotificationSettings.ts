import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useToast } from "heroui-native";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend/convex/_generated/api";
import Constants from "expo-constants";
import { useTranslation } from "@/hooks/use-translation";

export function useNotificationSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);

  const status = useQuery(api.pushNotifications.getMyPushNotificationStatus);
  const recordToken = useMutation(
    api.pushNotifications.recordPushNotificationToken,
  );
  const setNotificationsEnabled = useMutation(
    api.pushNotifications.setMyPushNotificationsEnabled,
  );

  const enableNotifications = async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      if (status?.hasToken) {
        await setNotificationsEnabled({ enabled: true });
        return true;
      }

      // Check if running in Expo Go
      const isExpoGo = Constants.executionEnvironment === "storeClient";

      if (isExpoGo && Platform.OS === "ios") {
        throw new Error(
          "Push notifications are not supported in Expo Go on iOS. Please create a development build.",
        );
      }

      const { status: permStatus } =
        await Notifications.requestPermissionsAsync();

      if (permStatus !== "granted") {
        throw new Error("Permission denied");
      }

      // Get and register the token
      const projectId =
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        throw new Error(
          "Missing EAS project ID. Run EAS project init for this app and rebuild the native app.",
        );
      }

      const tokenData = await getExpoPushTokenWithRetry(projectId);

      await recordToken({ token: tokenData.data });
      await setNotificationsEnabled({ enabled: true });
      return true;
    } catch (error) {
      console.error("Error enabling notifications:", error);

      if (!isPermissionDeniedError(error)) {
        toast.show({
          id: "notification-settings-enable-error",
          variant: "warning",
          label: t("notifications.statusTitle"),
          description: getNotificationErrorMessage(
            error,
            t("notifications.registerFailed"),
            t("alerts.tryAgainMoment"),
          ),
        });
      }

      throw error;
    } finally {
      setIsRequesting(false);
    }
  };

  const disableNotifications = async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      if (!status?.hasToken) {
        return true;
      }

      await setNotificationsEnabled({ enabled: false });
      return true;
    } catch (error) {
      console.error("Error disabling notifications:", error);

      toast.show({
        id: "notification-settings-disable-error",
        variant: "warning",
        label: t("notifications.statusTitle"),
        description: getNotificationErrorMessage(
          error,
          t("notifications.requestFailed"),
          t("alerts.tryAgainMoment"),
        ),
      });

      throw error;
    } finally {
      setIsRequesting(false);
    }
  };

  const checkPermissionStatus = async (): Promise<boolean> => {
    try {
      const { status: permStatus } = await Notifications.getPermissionsAsync();
      return permStatus === "granted";
    } catch (error) {
      console.error("Error checking permission status:", error);
      return false;
    }
  };

  return {
    isEnabled: Boolean(status?.hasToken && !status?.paused),
    isRequesting,
    hasRegisteredToken: Boolean(status?.hasToken),
    enableNotifications,
    disableNotifications,
    checkPermissionStatus,
  };
}

function isPermissionDeniedError(error: unknown) {
  return error instanceof Error && error.message === "Permission denied";
}

function getNotificationErrorMessage(
  error: unknown,
  fallbackMessage: string,
  retryHint: string,
) {
  if (error instanceof Error) {
    if (isNotificationNetworkError(error.message)) {
      return `${fallbackMessage}. ${retryHint}`;
    }

    return error.message || fallbackMessage;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    if (isNotificationNetworkError(error)) {
      return `${fallbackMessage}. ${retryHint}`;
    }

    return error;
  }

  return fallbackMessage;
}

function isNotificationNetworkError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("fetch failed") ||
    normalizedMessage.includes("aborted") ||
    normalizedMessage.includes("canceled") ||
    normalizedMessage.includes("cancelled") ||
    normalizedMessage.includes("network")
  );
}

async function getExpoPushTokenWithRetry(projectId: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await Notifications.getExpoPushTokenAsync({
        projectId,
      });
    } catch (error) {
      if (attempt === 1 || !shouldRetryNotificationTokenRequest(error)) {
        throw error;
      }
    }
  }

  throw new Error("Failed to get Expo push token.");
}

function shouldRetryNotificationTokenRequest(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return isNotificationNetworkError(error.message);
}
