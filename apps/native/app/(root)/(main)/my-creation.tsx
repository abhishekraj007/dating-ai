import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components";
import { ProfileCard } from "@/components/dating";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Spinner, Button } from "heroui-native";
import { Plus } from "lucide-react-native";

export default function MyCreationPage() {
  const router = useRouter();
  const [activeGender, setActiveGender] = useState<"female" | "male">("female");

  const femaleProfiles = useQuery(api.features.ai.profiles.getUserCreatedProfiles, {
    gender: "female",
  });

  const maleProfiles = useQuery(api.features.ai.profiles.getUserCreatedProfiles, {
    gender: "male",
  });

  const profiles = activeGender === "female" ? femaleProfiles : maleProfiles;
  const femaleCount = femaleProfiles?.length ?? 0;
  const maleCount = maleProfiles?.length ?? 0;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]}>
        <Header />
      </SafeAreaView>

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold text-foreground mb-4">My Creation</Text>

          {/* Gender Filter Tabs with Counts */}
          <View className="flex-row gap-2 mb-4">
            <Button
              onPress={() => setActiveGender("female")}
              variant={activeGender === "female" ? "primary" : "secondary"}
              className="flex-1"
            >
              <Button.Label>Female ({femaleCount})</Button.Label>
            </Button>

            <Button
              onPress={() => setActiveGender("male")}
              variant={activeGender === "male" ? "primary" : "secondary"}
              className="flex-1"
            >
              <Button.Label>Male ({maleCount})</Button.Label>
            </Button>
          </View>

          {/* Profiles Grid */}
          {profiles === undefined ? (
            <View className="items-center justify-center py-20">
              <Spinner size="lg" />
            </View>
          ) : profiles.length === 0 ? (
            <View className="items-center justify-center py-20 px-8">
              <Text className="text-lg font-semibold text-foreground mb-2">
                No characters yet
              </Text>
              <Text className="text-center text-muted-foreground mb-6">
                Create your first AI character to start chatting!
              </Text>
              <Button
                onPress={() => router.push("/(root)/(main)/create-character")}
                variant="primary"
              >
                <Button.Label>Create Character</Button.Label>
              </Button>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {profiles.map((profile) => (
                <View key={profile._id} className="w-[48%]">
                  <ProfileCard
                    name={profile.name}
                    age={profile.age}
                    zodiacSign={profile.zodiacSign}
                    avatarUrl={profile.avatarUrl}
                    onPress={() =>
                      router.push(`/(root)/(main)/profile/${profile._id}`)
                    }
                    showMenu
                    onMenuPress={() => {
                      // TODO: Show menu options
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {profiles && profiles.length > 0 && (
        <Button
          onPress={() => router.push("/(root)/(main)/create-character")}
          variant="primary"
          isIconOnly
          size="lg"
          className="absolute bottom-6 right-6"
          style={{
            shadowColor: "#FF3B8E",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Button.Label>
            <Plus size={28} color="#FFFFFF" />
          </Button.Label>
        </Button>
      )}
    </View>
  );
}

