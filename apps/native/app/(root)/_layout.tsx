import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { Stack, Redirect, useSegments } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/splash-screen";
import { usePushNotifications } from "@/hooks/usePushNotifications";
// import { useSyncOnboardingPreferences } from "@/hooks/useSyncOnboardingPreferences";
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
  const [hasFinishedInitialBootstrap, setHasFinishedInitialBootstrap] =
    useState(false);

  // Check if we're already on onboarding screens
  const isOnOnboarding = (segments as string[]).includes("(onboarding)");

  // Fetch user data when authenticated
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );

  // Register for push notifications when user is authenticated
  usePushNotifications(userData?.userMetadata._id);

  // Sync onboarding preferences after login (if any stored)
  // useSyncOnboardingPreferences();

  // Check if user needs onboarding
  const hasCompletedOnboarding =
    userData?.profile?.hasCompletedOnboarding ?? false;
  const needsOnboarding =
    isAuthenticated && !hasCompletedOnboarding && userData !== undefined;
  const isUserBootstrapPending = isAuthenticated && userData === undefined;

  useEffect(() => {
    if (hasFinishedInitialBootstrap) {
      return;
    }

    if (!isLoading && !isUserBootstrapPending) {
      setHasFinishedInitialBootstrap(true);
    }
  }, [hasFinishedInitialBootstrap, isLoading, isUserBootstrapPending]);

  // Only block the UI during the initial app bootstrap.
  // Re-showing this overlay during OAuth handoffs causes visible flicker.
  const showSplash = !hasFinishedInitialBootstrap;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {needsOnboarding && !isOnOnboarding && !showSplash && (
        <Redirect href="/(root)/(onboarding)/welcome" />
      )}
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerTransparent: true,
          headerBlurEffect: isDark ? "dark" : "light",
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
