import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import Constants from "expo-constants";

export function useNotificationSettings() {
  const [isRequesting, setIsRequesting] = useState(false);

  const status = useQuery(api.pushNotifications.getMyPushNotificationStatus);
  const recordToken = useMutation(
    api.pushNotifications.recordPushNotificationToken
  );

  const enableNotifications = async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      // Check if running in Expo Go
      const isExpoGo = Constants.executionEnvironment === "storeClient";

      if (isExpoGo && Platform.OS === "ios") {
        throw new Error(
          "Push notifications are not supported in Expo Go on iOS. Please create a development build."
        );
      }

      const { status: permStatus } =
        await Notifications.requestPermissionsAsync();

      if (permStatus !== "granted") {
        throw new Error("Permission denied");
      }

      // Get and register the token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      await recordToken({ token: tokenData.data });
      return true;
    } catch (error) {
      console.error("Error enabling notifications:", error);
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
    isEnabled: status?.hasToken ?? false,
    isRequesting,
    enableNotifications,
    checkPermissionStatus,
  };
}
