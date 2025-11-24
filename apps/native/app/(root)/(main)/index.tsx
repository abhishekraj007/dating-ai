import { Header } from "@/components";
import { Button, Chip } from "heroui-native";
import { FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function HomeRoute() {
  const router = useRouter();

  return (
    <View className="flex-1">
      <SafeAreaView>
        <Header />
        <View className="p-4 gap-3">
          <Text className="text-2xl font-bold mb-2">Home</Text>
          <Button onPress={() => router.push("/(root)/(main)/uploads")}>
            Go to Uploads
          </Button>
          <Button onPress={() => router.push("/(root)/(main)/notifications")}>
            Go to Notifications
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
