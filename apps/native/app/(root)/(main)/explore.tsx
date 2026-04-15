import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components";
import { ProfileCard } from "@/components/dating";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Spinner, Button } from "heroui-native";

export default function ExplorePage() {
  const router = useRouter();
  const [activeGender, setActiveGender] = useState<"female" | "male">("female");

  const profiles = useQuery(api.features.ai.profiles.getAIProfiles, {
    gender: activeGender,
    includeUserCreated: false,
  });

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]}>
        <Header />
      </SafeAreaView>

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold text-foreground mb-4">
            Explore
          </Text>

          {/* Gender Filter Tabs */}
          <View className="flex-row gap-2 mb-4">
            <Button
              onPress={() => setActiveGender("female")}
              variant={activeGender === "female" ? "primary" : "secondary"}
              className="flex-1"
            >
              <Button.Label>Female</Button.Label>
            </Button>

            <Button
              onPress={() => setActiveGender("male")}
              variant={activeGender === "male" ? "primary" : "secondary"}
              className="flex-1"
            >
              <Button.Label>Male</Button.Label>
            </Button>
          </View>

          {/* Profiles Grid */}
          {profiles === undefined ? (
            <View className="items-center justify-center py-20">
              <Spinner size="lg" />
            </View>
          ) : profiles.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">No profiles found</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {profiles.map((profile) => (
                <View key={profile._id} className="w-[48%]">
                  <ProfileCard
                    name={profile.name}
                    age={profile.age}
                    zodiacSign={profile.zodiacSign}
                    avatarUrl={profile.avatarUrl || undefined}
                    onPress={() =>
                      router.push(`/(root)/(main)/profile/${profile._id}`)
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
