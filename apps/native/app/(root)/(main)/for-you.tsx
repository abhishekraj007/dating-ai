import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components";
import { Card } from "heroui-native";

export default function ForYouPage() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]}>
        <Header />
      </SafeAreaView>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          <Text className="text-2xl font-bold text-foreground">For You</Text>
          
          <Card className="p-6">
            <Text className="text-center text-muted-foreground">
              Personalized recommendations coming soon!
            </Text>
            <Text className="text-center text-sm text-muted-foreground mt-2">
              We're working on an AI-powered recommendation system to help you find your perfect match.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

