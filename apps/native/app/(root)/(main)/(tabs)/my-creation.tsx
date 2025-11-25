import { View, Text, FlatList, Dimensions, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Skeleton, Button } from "heroui-native";
import { Plus } from "lucide-react-native";
import { Header } from "@/components";
import { ProfileCard, GenderTabs } from "@/components/dating";
import { useUserCreatedProfiles, useStartConversation } from "@/hooks/dating";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 48) / 2;

export default function MyCreationScreen() {
  const router = useRouter();
  const [gender, setGender] = useState<"female" | "male">("female");
  const { profiles, isLoading } = useUserCreatedProfiles(gender);
  const { startConversation } = useStartConversation();

  const femaleProfiles = useUserCreatedProfiles("female").profiles;
  const maleProfiles = useUserCreatedProfiles("male").profiles;

  const handleProfilePress = (profileId: string) => {
    router.push(`/(root)/(main)/profile/${profileId}`);
  };

  const handleChatPress = async (profileId: string) => {
    const conversationId = await startConversation({
      aiProfileId: profileId as any,
    });
    router.push(`/(root)/(main)/chat/${conversationId}`);
  };

  const handleCreatePress = () => {
    router.push("/(root)/(main)/create-character");
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
        onMenuPress={() => {}}
        showChatButton
        onChatPress={() => handleChatPress(item._id)}
      />
    </View>
  );

  const renderSkeleton = () => (
    <View className="flex-row flex-wrap px-4">
      {[1, 2, 3, 4].map((i) => (
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
        <Header title="My Creation" showSearch />

        {/* Gender tabs with counts */}
        <View className="px-4 py-3">
          <GenderTabs
            value={gender}
            onChange={setGender}
            showCounts
            femaleCount={femaleProfiles.length}
            maleCount={maleProfiles.length}
          />
        </View>

        {/* Profile grid */}
        {isLoading ? (
          renderSkeleton()
        ) : profiles.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-foreground text-xl font-semibold mb-2">
              No Characters Yet
            </Text>
            <Text className="text-muted-foreground text-center mb-4">
              Create your first {gender} AI character and start chatting!
            </Text>
            <Button onPress={handleCreatePress}>
              <Plus size={20} color="white" />
              <Button.Label>Create Character</Button.Label>
            </Button>
          </View>
        ) : (
          <FlatList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating create button */}
        {profiles.length > 0 && (
          <View className="absolute bottom-6 right-6">
            <Button
              isIconOnly
              className="w-14 h-14 rounded-full shadow-lg"
              onPress={handleCreatePress}
            >
              <Plus size={24} color="white" />
            </Button>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

