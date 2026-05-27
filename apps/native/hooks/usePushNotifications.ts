import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useToast } from "heroui-native";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import Constants from "expo-constants";
import { useTranslation } from "@/hooks/use-translation";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type UsePushNotificationsOptions = {
  userId?: string;
  enabled?: boolean;
};

export function usePushNotifications({
  userId,
  enabled = true,
}: UsePushNotificationsOptions) {
  const { isAuthenticated } = useConvexAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasShownErrorToastRef = useRef(false);

  const recordToken = useMutation(
    api.pushNotifications.recordPushNotificationToken,
  );

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId) {
      return;
    }

    let isMounted = true;

    const reportFailure = (err: unknown) => {
      const message = getNotificationErrorMessage(
        err,
        t("notifications.registerFailed"),
        t("alerts.tryAgainMoment"),
      );

      console.error("Push notification registration failed:", err);

      if (isMounted) {
        setError(message);
      }

      if (!hasShownErrorToastRef.current) {
        hasShownErrorToastRef.current = true;
        toast.show({
          id: "push-notifications-registration-error",
          variant: "warning",
          label: t("notifications.statusTitle"),
          description: message,
        });
      }
    };

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          hasShownErrorToastRef.current = false;

          if (isMounted) {
            setExpoPushToken(token);
            setError(null);
          }

          // Register token with backend
          recordToken({ token }).catch((err) => {
            if (err?.message === "Not authenticated") {
              return;
            }

            reportFailure(err);
          });
        }
      })
      .catch((err) => {
        reportFailure(err);
      });

    return () => {
      isMounted = false;
    };
  }, [enabled, isAuthenticated, recordToken, t, toast, userId]);

  return { expoPushToken, error };
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

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    throw new Error(
      "Missing EAS project ID. Run EAS project init for this app and rebuild the native app.",
    );
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data;
    } catch (error) {
      if (attempt === 1 || !shouldRetryNotificationTokenRequest(error)) {
        throw error;
      }
    }
  }

  return null;
}

function shouldRetryNotificationTokenRequest(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return isNotificationNetworkError(error.message);
}
