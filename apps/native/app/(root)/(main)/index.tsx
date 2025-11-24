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
        <View className="p-4">
          <Text className="text-2xl font-bold mb-4">Home</Text>
          <Button onPress={() => router.push("/(root)/(main)/uploads")}>
            Go to Uploads
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
