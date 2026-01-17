import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Header } from "@/components";

export default function AccountScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        style={{
          flex: 1,
        }}
        edges={["top"]}
      >
        <Header title="Account" />
        <ScrollView className="flex-1 px-4 py-4">
          <View className="gap-3">
            <Button
              variant="secondary"
              onPress={() => router.push("/(root)/(main)/settings")}
            >
              <Button.Label>Settings</Button.Label>
            </Button>
            <Button
              variant="secondary"
              onPress={() => router.push("/(root)/(main)/buy-credits")}
            >
              <Button.Label>Buy Credits</Button.Label>
            </Button>
            <Button
              variant="secondary"
              onPress={() => router.push("/(root)/(main)/notifications")}
            >
              <Button.Label>Notifications</Button.Label>
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
