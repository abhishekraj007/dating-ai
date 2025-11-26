import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button, Skeleton, useThemeColor } from "heroui-native";
import { Heart, SlidersHorizontal } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState, useCallback } from "react";
import { Header } from "@/components";
import { ProfileSwipeCard } from "@/components/dating/profile-swipe-card";
import {
  useForYouProfiles,
  useProfileInteraction,
} from "@/hooks/dating/useForYou";
import type { Id } from "@dating-ai/backend";

export default function ForYouScreen() {
  const router = useRouter();
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const { height } = useWindowDimensions();

  const { profiles, isLoading } = useForYouProfiles(20);
  const { likeProfile, skipProfile } = useProfileInteraction();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const handleSwipeLeft = useCallback(async () => {
    if (!currentProfile) return;
    await skipProfile(currentProfile._id as Id<"aiProfiles">);
    setCurrentIndex((prev) => prev + 1);
  }, [currentProfile, skipProfile]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentProfile) return;
    await likeProfile(currentProfile._id as Id<"aiProfiles">);
    // Navigate to profile detail or start chat
    router.push(`/profile/${currentProfile._id}`);
    setCurrentIndex((prev) => prev + 1);
  }, [currentProfile, likeProfile, router]);

  const handleCardPress = useCallback(() => {
    if (!currentProfile) return;
    router.push(`/profile/${currentProfile._id}`);
  }, [currentProfile, router]);

  const handleFilterPress = () => {
    router.push("/filter");
  };

  // Calculate card height based on window dimensions
  // Account for header (~56px), tab bar (~80px), safe area (~50px), and padding
  const cardHeight = height - 220;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Button variant="tertiary" size="sm" isIconOnly>
            <Heart size={24} color={accentColor} />
          </Button>
          <Text className="text-foreground text-xl font-bold">For You</Text>
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            onPress={handleFilterPress}
          >
            <SlidersHorizontal size={24} color={foregroundColor} />
          </Button>
        </View>

        {/* Card Stack */}
        <GestureHandlerRootView style={styles.cardContainer}>
          {isLoading ? (
            <View className="flex-1 items-center justify-center px-4">
              <Skeleton
                className="rounded-2xl"
                style={{ width: "100%", height: cardHeight }}
              />
            </View>
          ) : currentIndex >= profiles.length ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-foreground text-xl font-semibold mb-2">
                No more profiles
              </Text>
              <Text className="text-muted text-center mb-6">
                You've seen all available profiles. Adjust your filters or check
                back later!
              </Text>
              <Button onPress={handleFilterPress}>
                <Button.Label>Adjust Filters</Button.Label>
              </Button>
            </View>
          ) : (
            <>
              {/* Next card (behind) - slightly smaller and offset */}
              {nextProfile && (
                <ProfileSwipeCard
                  key={nextProfile._id}
                  profile={nextProfile}
                  onSwipeLeft={() => {}}
                  onSwipeRight={() => {}}
                  onPress={() => {}}
                  isFirst={false}
                  cardHeight={cardHeight}
                />
              )}
              {/* Current card (front) */}
              {currentProfile && (
                <ProfileSwipeCard
                  key={currentProfile._id}
                  profile={currentProfile}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onPress={handleCardPress}
                  isFirst={true}
                  cardHeight={cardHeight}
                />
              )}
            </>
          )}
        </GestureHandlerRootView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
