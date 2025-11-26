import { View, Text, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Skeleton } from "heroui-native";
import { Header } from "@/components";
import { ProfileCard, GenderTabs } from "@/components/dating";
import { useAIProfiles } from "@/hooks/dating";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 48) / 2; // 2 columns with padding

export default function ExploreScreen() {
  const router = useRouter();
  const [gender, setGender] = useState<"female" | "male">("female");
  const { profiles, isLoading } = useAIProfiles(gender, 50);

  const handleProfilePress = (profileId: string) => {
    router.push(`/(root)/(main)/profile/${profileId}`);
  };

  const renderProfile = ({ item, index }: { item: any; index: number }) => (
    <View
      style={{ width: cardWidth, marginLeft: index % 2 === 0 ? 0 : 8 }}
      className="mb-3"
    >
      <ProfileCard
        name={item.name}
        age={item.age}
        zodiacSign={item.zodiacSign}
        avatarUrl={item.avatarUrl}
        gender={item.gender}
        onPress={() => handleProfilePress(item._id)}
      />
    </View>
  );

  const renderSkeleton = () => (
    <View className="flex-row flex-wrap px-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          style={{ width: cardWidth, marginLeft: i % 2 === 0 ? 8 : 0 }}
          className="mb-3"
        >
          <Skeleton className="rounded-2xl aspect-[3/4]" />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header title="Explore" showSearch />

        {/* Gender tabs */}
        <View className="px-4 py-3">
          <GenderTabs value={gender} onChange={setGender} />
        </View>

        {/* Profile grid */}
        {isLoading ? (
          renderSkeleton()
        ) : profiles.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-foreground text-xl font-semibold mb-2">
              No Profiles Found
            </Text>
            <Text className="text-muted text-center">
              {gender === "female" ? "Female" : "Male"} AI profiles will appear
              here once they are added.
            </Text>
          </View>
        ) : (
          <FlatList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
