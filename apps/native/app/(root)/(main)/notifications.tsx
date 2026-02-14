import { View, ScrollView, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Button, Card, Spinner, TextField } from "heroui-native";
import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useTranslation } from "@/hooks/use-translation";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(t("notifications.defaultTitle"));
  const [body, setBody] = useState(t("notifications.defaultBody"));
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
          t("notifications.buildRequired"),
          t("notifications.buildRequiredDescription"),
          [{ text: t("common.ok") }],
        );
        setRequesting(false);
        return;
      }

      const { status: permStatus } =
        await Notifications.requestPermissionsAsync();
      if (permStatus !== "granted") {
        Alert.alert(
          t("notifications.permissionDenied"),
          t("notifications.permissionDeniedDescription"),
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
            t("alerts.success"),
            t("notifications.permissionsGranted"),
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
              t("notifications.buildRequired"),
              t("notifications.devBuildRequiredDescription"),
            );
          } else {
            Alert.alert(t("alerts.error"), t("notifications.registerFailed"));
          }
        }
      }
    } catch (error) {
      Alert.alert(t("alerts.error"), t("notifications.requestFailed"));
    } finally {
      setRequesting(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !body) {
      Alert.alert(t("alerts.error"), t("notifications.enterTitleBody"));
      return;
    }

    if (!userData?.userMetadata._id) {
      Alert.alert(t("alerts.error"), t("notifications.userNotFound"));
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
      Alert.alert(t("alerts.success"), t("notifications.sentSuccess"));
    } catch (error) {
      Alert.alert(
        t("alerts.error"),
        error instanceof Error ? error.message : t("notifications.sendFailed"),
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
          <Card.Title>{t("notifications.statusTitle")}</Card.Title>
        </Card.Header>
        <Card.Body className="gap-2">
          <View>
            <Card.Description>
              {status.hasToken
                ? t("notifications.enabledRegistered")
                : t("notifications.disabledPrompt")}
            </Card.Description>
          </View>
          {!status.hasToken && (
            <Button
              variant="primary"
              onPress={handleRequestPermissions}
              isDisabled={requesting}
              className="mt-2"
            >
              {requesting
                ? t("notifications.requesting")
                : t("notifications.enable")}
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* Send Test Notification */}
      {status.hasToken && (
        <Card>
          <Card.Header>
            <Card.Title>{t("notifications.sendTestTitle")}</Card.Title>
            <Card.Description>{t("notifications.sendToSelf")}</Card.Description>
          </Card.Header>
          <Card.Body className="gap-4">
            <TextField>
              <TextField.Label>{t("notifications.titleLabel")}</TextField.Label>
              <TextField.Input
                value={title}
                onChangeText={setTitle}
                placeholder={t("notifications.titlePlaceholder")}
              />
            </TextField>
            <TextField>
              <TextField.Label>{t("notifications.bodyLabel")}</TextField.Label>
              <TextField.Input
                value={body}
                onChangeText={setBody}
                placeholder={t("notifications.bodyPlaceholder")}
                numberOfLines={3}
                multiline
              />
            </TextField>
            <Button
              variant="primary"
              onPress={handleSendNotification}
              isDisabled={sending}
            >
              {sending ? t("notifications.sending") : t("notifications.send")}
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Recent Notifications */}
      {notifications && notifications.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>{t("notifications.recentTitle")}</Card.Title>
            <Card.Description>
              {t("notifications.count", { count: notifications.length })}
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
