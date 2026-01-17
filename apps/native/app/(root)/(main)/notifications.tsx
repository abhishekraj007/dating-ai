import { View, ScrollView, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Button, Card, Spinner, TextField } from "heroui-native";
import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("Test Notification");
  const [body, setBody] = useState("This is a test notification");
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [permissionRefresh, setPermissionRefresh] = useState(0);

  const userData = useQuery(api.user.fetchUserAndProfile);
  const status = useQuery(api.pushNotifications.getMyPushNotificationStatus);
  const notifications = useQuery(api.pushNotifications.getMyNotifications, {
    limit: 20,
  });
  const sendNotification = useMutation(
    api.pushNotifications.sendPushNotification
  );
  const recordToken = useMutation(
    api.pushNotifications.recordPushNotificationToken
  );

  // Set up notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const handleRequestPermissions = async () => {
    setRequesting(true);
    try {
      // Check if running in Expo Go
      const isExpoGo = Constants.executionEnvironment === "storeClient";

      if (isExpoGo && Platform.OS === "ios") {
        Alert.alert(
          "Build Required",
          "Push notifications are not supported in Expo Go on iOS. Please create a development build using 'npx expo run:ios' or EAS Build to test push notifications.",
          [{ text: "OK" }]
        );
        setRequesting(false);
        return;
      }

      const { status: permStatus } =
        await Notifications.requestPermissionsAsync();
      if (permStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications in your device settings to receive push notifications."
        );
      } else {
        // Get and register the token
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
          console.log("Project ID:", projectId);

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          await recordToken({ token: tokenData.data });
          Alert.alert(
            "Success",
            "Notification permissions granted and device registered!"
          );
          setPermissionRefresh((prev) => prev + 1); // Trigger status refetch
        } catch (error) {
          console.error("Error getting/recording token:", error);

          // Check if it's the APS environment error
          if (
            error instanceof Error &&
            error.message.includes("aps-environment")
          ) {
            Alert.alert(
              "Development Build Required",
              "Push notifications require a development build. Run 'npx expo run:ios' or 'npx expo run:android' to create a proper build with push notification support."
            );
          } else {
            Alert.alert("Error", "Failed to register device for notifications");
          }
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to request permissions");
    } finally {
      setRequesting(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !body) {
      Alert.alert("Error", "Please enter both title and body");
      return;
    }

    if (!userData?.userMetadata._id) {
      Alert.alert("Error", "User not found");
      return;
    }

    setSending(true);
    try {
      await sendNotification({
        to: userData.userMetadata._id,
        title,
        body,
        data: { timestamp: Date.now() },
      });
      Alert.alert("Success", "Notification sent successfully!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send notification"
      );
    } finally {
      setSending(false);
    }
  };

  if (!status) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 60,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 16,
        gap: 16,
      }}
    >
      {/* Status Card */}
      <Card>
        <Card.Header>
          <Card.Title>Push Notification Status</Card.Title>
        </Card.Header>
        <Card.Body className="gap-2">
          <View>
            <Card.Description>
              {status.hasToken
                ? "Notifications enabled. Device registered."
                : "Notifications not enabled. Please allow notification permissions."}
            </Card.Description>
          </View>
          {!status.hasToken && (
            <Button
              variant="primary"
              onPress={handleRequestPermissions}
              isDisabled={requesting}
              className="mt-2"
            >
              {requesting ? "Requesting..." : "Enable Notifications"}
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* Send Test Notification */}
      {status.hasToken && (
        <Card>
          <Card.Header>
            <Card.Title>Send Test Notification</Card.Title>
            <Card.Description>Send a notification to yourself</Card.Description>
          </Card.Header>
          <Card.Body className="gap-4">
            <TextField>
              <TextField.Label>Title</TextField.Label>
              <TextField.Input
                value={title}
                onChangeText={setTitle}
                placeholder="Notification title"
              />
            </TextField>
            <TextField>
              <TextField.Label>Body</TextField.Label>
              <TextField.Input
                value={body}
                onChangeText={setBody}
                placeholder="Notification body"
                numberOfLines={3}
                multiline
              />
            </TextField>
            <Button
              variant="primary"
              onPress={handleSendNotification}
              isDisabled={sending}
            >
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Recent Notifications */}
      {notifications && notifications.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Recent Notifications</Card.Title>
            <Card.Description>
              {notifications.length} notification(s)
            </Card.Description>
          </Card.Header>
          <Card.Body className="gap-3">
            {notifications.map((notification, index) => (
              <Card key={index}>
                <Card.Body className="gap-1">
                  <Card.Title className="text-base">
                    {notification.title}
                  </Card.Title>
                  <Card.Description>{notification.body}</Card.Description>
                  <Card.Description className="text-xs">
                    {new Date(notification._creationTime).toLocaleString()}
                  </Card.Description>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      )}
    </ScrollView>
  );
}
