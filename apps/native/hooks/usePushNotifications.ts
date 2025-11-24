import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import Constants from "expo-constants";

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

export function usePushNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordToken = useMutation(
    api.pushNotifications.recordPushNotificationToken
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          // Register token with backend
          recordToken({ token }).catch((err) => {
            console.error("Failed to record push token:", err);
            setError(err.message);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to get push token:", err);
        setError(err.message);
      });
  }, [userId, recordToken]);

  return { expoPushToken, error };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

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

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    token = tokenData.data;
  } catch (e) {
    console.error("Error getting push token:", e);
  }

  return token;
}
