import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { type Href, Stack, useSegments, useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
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
  const router = useRouter();
  const lastNavigationTarget = useRef<string | null>(null);
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

  const hasResolvedAuthenticatedUser = Boolean(userData?.userMetadata);
  const hasCompletedOnboarding = Boolean(
    userData?.profile?.hasCompletedOnboarding,
  );
  const isUserStatePending = isAuthenticated && userData == null;
  const needsOnboarding =
    hasResolvedAuthenticatedUser && !hasCompletedOnboarding;
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
  let nextRoute: Href | null = null;

  if (!showSplash && !isUserStatePending) {
    if (needsOnboarding && !isOnOnboarding) {
      nextRoute = "/(root)/(onboarding)/welcome";
    } else if (!needsOnboarding && isOnOnboarding) {
      nextRoute = "/(root)/(main)";
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
