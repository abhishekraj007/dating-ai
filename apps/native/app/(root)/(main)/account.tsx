import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components";
import { Button, Card } from "heroui-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";

export default function AccountPage() {
  const router = useRouter();
  const credits = useQuery(api.features.ai.profiles.getUserCredits);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]}>
        <Header />
      </SafeAreaView>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          <Text className="text-2xl font-bold text-foreground">Account</Text>
          
          <Card className="p-4">
            <Text className="text-sm text-muted-foreground mb-2">Credits Balance</Text>
            <Text className="text-3xl font-bold text-foreground">
              {credits ?? 0}
            </Text>
            <Button
              className="mt-4"
              onPress={() => router.push("/(root)/(main)/buy-credits")}
            >
              Buy Credits
            </Button>
          </Card>

          <Card className="p-4 gap-2">
            <Button
              variant="flat"
              onPress={() => router.push("/(root)/(main)/settings")}
            >
              Settings
            </Button>
            <Button
              variant="flat"
              onPress={() => router.push("/(root)/(main)/notifications")}
            >
              Notifications
            </Button>
            <Button
              variant="flat"
              onPress={() => router.push("/(root)/(main)/uploads")}
            >
              Uploads
            </Button>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

