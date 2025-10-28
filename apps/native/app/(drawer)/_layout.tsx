import { Drawer } from "expo-router/drawer";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { LoginScreen } from "@/components/auth/login-screen";
import { View, ActivityIndicator } from "react-native";

export default function DrawerLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  return (
    <Drawer>
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          drawerLabel: "Home",
        }}
      />
    </Drawer>
  );
}
