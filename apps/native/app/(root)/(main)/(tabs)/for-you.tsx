import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components";

export default function ForYouScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header title="For You" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-xl font-semibold mb-2">
            Coming Soon
          </Text>
          <Text className="text-muted-foreground text-center">
            Personalized AI recommendations based on your preferences will appear here.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

