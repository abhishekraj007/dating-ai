import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { type Href, Stack, useSegments, useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen } from "@/components/splash-screen";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSyncOnboardingPreferences } from "@/hooks/useSyncOnboardingPreferences";
import { GUEST_ONBOARDING_KEY } from "@/hooks/use-finish-onboarding";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { api } from "@dating-ai/backend/convex/_generated/api";

export const unstable_settings = {
  initialRouteName: "(main)",
};

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isDark } = useAppTheme();
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");
  const segments = useSegments();
  const router = useRouter();
  const lastNavigationTarget = useRef<string | null>(null);
  const [hasFinishedInitialBootstrap, setHasFinishedInitialBootstrap] =
    useState(false);
  const [hasLoadedGuestOnboarding, setHasLoadedGuestOnboarding] =
    useState(false);
  const useLegacyHeaderBlur =
    Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) < 26;

  const isOnOnboarding = (segments as string[]).includes("(onboarding)");
  const isOnMain = (segments as string[]).includes("(main)");
  const isOnChat = (segments as string[]).includes("chat");
  const {
    pendingChatId,
    selectedCharacterId,
    guestOnboardingDone,
    setGuestOnboardingDone,
    setPendingChatId,
  } = useOnboardingStore();

  // Fetch user data when authenticated
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );

  useSyncOnboardingPreferences();

  const hasResolvedAuthenticatedUser = Boolean(userData?.userMetadata);
  const hasCompletedOnboarding = Boolean(
    userData?.profile?.hasCompletedOnboarding,
  );
  const isUserStatePending = isAuthenticated && userData == null;
  const needsOnboarding =
    hasResolvedAuthenticatedUser && !hasCompletedOnboarding;
  const isUserBootstrapPending = isAuthenticated && userData === undefined;

  const shouldRegisterPushNotifications =
    Boolean(userData?.userMetadata?._id) &&
    hasCompletedOnboarding &&
    !isOnOnboarding;

  usePushNotifications({
    userId: userData?.userMetadata._id,
    enabled: shouldRegisterPushNotifications,
  });

  useEffect(() => {
    const loadGuestFlag = async () => {
      const stored = await AsyncStorage.getItem(GUEST_ONBOARDING_KEY);
      if (stored === "1") {
        setGuestOnboardingDone(true);
      }
      setHasLoadedGuestOnboarding(true);
    };

    void loadGuestFlag();
  }, [setGuestOnboardingDone]);

  useEffect(() => {
    if (pendingChatId && isOnChat) {
      setPendingChatId(null);
    }
  }, [isOnChat, pendingChatId, setPendingChatId]);

  useEffect(() => {
    if (hasFinishedInitialBootstrap) {
      return;
    }

    if (!isLoading && !isUserBootstrapPending && hasLoadedGuestOnboarding) {
      setHasFinishedInitialBootstrap(true);
    }
  }, [
    hasFinishedInitialBootstrap,
    isLoading,
    isUserBootstrapPending,
    hasLoadedGuestOnboarding,
  ]);

  const showSplash = !hasFinishedInitialBootstrap;
  let nextRoute: Href | null = null;
  const skipForcedOnboarding =
    Boolean(selectedCharacterId) || guestOnboardingDone || isOnMain;

  if (!showSplash && !isUserStatePending) {
    if (pendingChatId && !isOnChat) {
      nextRoute = `/(root)/(main)/chat/${pendingChatId}`;
    } else if (!isAuthenticated && !guestOnboardingDone && !isOnOnboarding) {
      nextRoute = "/(root)/(onboarding)/welcome";
    } else if (needsOnboarding && !isOnOnboarding && !skipForcedOnboarding) {
      nextRoute = "/(root)/(onboarding)/welcome";
    } else if (!needsOnboarding && isOnOnboarding) {
      nextRoute = pendingChatId
        ? `/(root)/(main)/chat/${pendingChatId}`
        : "/(root)/(main)";
    }
  }

  // Keep onboarding routing imperative in one place.
  // Expo Router can report stale segments for a render after replace(), so we
  // guard against re-firing the same navigation target until the route updates.
  useEffect(() => {
    if (!nextRoute) {
      lastNavigationTarget.current = null;
      return;
    }

    if (lastNavigationTarget.current === nextRoute) {
      return;
    }

    lastNavigationTarget.current = nextRoute;
    router.replace(nextRoute);
  }, [nextRoute, router]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerTransparent: true,
          headerBlurEffect: useLegacyHeaderBlur
            ? isDark
              ? "dark"
              : "light"
            : undefined,
          headerTintColor: themeColorForeground,
          headerStyle: {
            backgroundColor: Platform.select({
              ios: undefined,
              android: themeColorBackground,
            }),
          },
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
          },
          // headerRight: _renderThemeToggle,
          headerBackButtonDisplayMode: "generic",
          gestureEnabled: true,
          gestureDirection: "horizontal",
          fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
          contentStyle: {
            backgroundColor: themeColorBackground,
          },
        }}
      >
        {/* Auth screen - shown when not authenticated */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
              // presentation: "modal",
            }}
          />
        </Stack.Protected>

        {/* Onboarding screens */}
        <Stack.Screen
          name="(onboarding)"
          options={{
            headerShown: false,
          }}
        />

        {/* Main app - accessible to all users */}
        <Stack.Screen
          name="(main)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      {showSplash && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 9999, backgroundColor: themeColorBackground },
          ]}
        >
          <SplashScreen />
        </View>
      )}
    </>
  );
}
