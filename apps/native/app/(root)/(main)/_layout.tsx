import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "heroui-native";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Crown, Coins } from "lucide-react-native";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { authClient } from "@/lib/betterAuth/client";
import { UpgradeToProSheet } from "@/components/upgrade-to-pro-sheet";
import { BuyCreditsSheet } from "@/components/buy-credits-sheet";

export default function MainLayout() {
  const { standard } = useNavigationOptions();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Home",
          headerLargeTitle: true,
          headerBackTitle: "Home",
          ...standard,
          headerRight: () => <HeaderButtons />,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerBackButtonDisplayMode: "generic",
          headerLargeTitle: true,
          ...standard,
          headerRight: () => <SignOutButton />,
        }}
      />
    </Stack>
  );
}

const HeaderButtons = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [showCreditsSheet, setShowCreditsSheet] = useState(false);

  return (
    <>
      <View className="flex-row items-center gap-2">
        <Pressable
          className="justify-center rounded-full p-2.5"
          onPress={() => setShowUpgradeSheet(true)}
        >
          <Crown size={18} color={colors.accent} />
        </Pressable>

        <Pressable
          className="justify-center rounded-full p-2.5"
          onPress={() => setShowCreditsSheet(true)}
        >
          <Coins size={18} color={colors.foreground} />
        </Pressable>

        <Pressable
          className="justify-center rounded-full p-2.5"
          onPress={() => {
            router.navigate("/settings");
          }}
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={colors.foreground}
          />
        </Pressable>
      </View>

      {/* <UpgradeToProSheet
        isOpen={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
      />

      <BuyCreditsSheet
        isOpen={showCreditsSheet}
        onClose={() => setShowCreditsSheet(false)}
      /> */}
    </>
  );
};

const SignOutButton = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    const { error, data } = await authClient.signOut(
      {},
      {
        onRequest: () => {
          setIsSigningOut(true);
        },
        onSuccess: () => {
          setIsSigningOut(false);
          console.log("Sign out successful");
        },
        onError: (ctx) => {
          console.error(ctx.error);
          Alert.alert("Error", ctx.error.message || "Failed to sign out");
          setIsSigningOut(false);
        },
      }
    );

    console.log(data, error);
  };

  return (
    <Pressable
      className="justify-center rounded-full px-3"
      disabled={isSigningOut}
      onPress={() => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sign Out",
            onPress: async () => {
              await handleSignOut();
            },
          },
        ]);
      }}
    >
      <Text className="text-foreground">Sign Out</Text>
    </Pressable>
  );
};
