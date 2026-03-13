import {
  View,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Platform,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { Skeleton } from "heroui-native";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { X, Heart } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileSwipeCard } from "@/components/dating/profile-swipe-card";
import { MatchModal } from "@/components/dating/match-modal";
import type { ForYouProfile } from "@/hooks/dating/useForYou";
import {
  useForYouProfiles,
  useProfileInteraction,
} from "@/hooks/dating/useForYou";
import { useStartConversation } from "@/hooks/dating";
import type { Id } from "@dating-ai/backend";

function ForYouSkeleton() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const bottomPadding =
    Platform.OS === "android" ? Math.max(insets.bottom, 8) : 24;
  const cardHeight = height - insets.bottom - 40;

  return (
    <View className="flex-1 bg-background">
      <View style={styles.cardContainer}>
        <View className="flex-1 items-center justify-center w-full">
          <View
            className="w-full relative bg-background overflow-hidden"
            style={{ height: cardHeight }}
          >
            <Skeleton className="w-full h-full" />
            <View className="absolute bottom-28 left-0 right-0 p-6 z-10">
              <Skeleton className="h-8 w-3/4 rounded-lg mb-3" />
              <View className="flex-row gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ForYouScreen() {
  return (
    <Suspense fallback={<ForYouSkeleton />}>
      <ForYouContent />
    </Suspense>
  );
}

function ForYouContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const {
    profiles,
    isLoading,
    status,
    loadMore,
    removeProfile,
    restoreProfile,
  } = useForYouProfiles(20);
  const { likeProfile, skipProfile, isAuthenticated } = useProfileInteraction();
  const [loadingChatting, setLoadingChatting] = useState(false);
  const { startConversation } = useStartConversation();
  const lastPrefetchAtMs = useRef(0);

  const currentProfile = profiles[0];
  const nextProfile = profiles[1];

  // Prefetch more profiles when nearing the end of loaded batch
  useEffect(() => {
    const remaining = profiles.length;
    const now = Date.now();
    if (
      remaining <= 5 &&
      status === "CanLoadMore" &&
      now - lastPrefetchAtMs.current > 600
    ) {
      lastPrefetchAtMs.current = now;
      loadMore(20);
    }
  }, [profiles.length, status, loadMore]);

  // Track drag position for button animations
  const dragX = useSharedValue(0);
  const SWIPE_THRESHOLD = 120;

  // Position buttons just above the tab bar
  const bottomPadding =
    Platform.OS === "android" ? Math.max(insets.bottom, 8) : 24;
  const actionButtonsBottom = bottomPadding;
  const bottomUiHeight = actionButtonsBottom + 120;

  // Animated styles for buttons
  const skipButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      dragX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.35, 0],
      [1.25, 1, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  const likeButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      dragX.value,
      [0, SWIPE_THRESHOLD * 0.35, SWIPE_THRESHOLD],
      [1, 1, 1.25],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<ForYouProfile | null>(
    null,
  );

  const navigateToLogin = useCallback(() => {
    router.push("/(root)/(auth)");
  }, [router]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentProfile) return;
    removeProfile(currentProfile._id as Id<"aiProfiles">);

    try {
      await skipProfile(currentProfile._id as Id<"aiProfiles">);
    } catch (error) {
      restoreProfile(currentProfile);
      console.error("Failed to skip profile:", error);
    }
  }, [currentProfile, removeProfile, restoreProfile, skipProfile]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentProfile) return;
    removeProfile(currentProfile._id as Id<"aiProfiles">);

    try {
      await likeProfile(currentProfile._id as Id<"aiProfiles">);
      setMatchedProfile(currentProfile);
      setShowMatchModal(true);
    } catch (error) {
      restoreProfile(currentProfile);
      console.error("Failed to like profile:", error);
    }
  }, [currentProfile, likeProfile, removeProfile, restoreProfile]);

  const handleSkipPress = useCallback(async () => {
    if (!currentProfile) return;
    dragX.value = 0;
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    removeProfile(currentProfile._id as Id<"aiProfiles">);

    try {
      await skipProfile(currentProfile._id as Id<"aiProfiles">);
    } catch (error) {
      restoreProfile(currentProfile);
      console.error("Failed to skip profile:", error);
    }
  }, [
    currentProfile,
    skipProfile,
    isAuthenticated,
    navigateToLogin,
    removeProfile,
    restoreProfile,
  ]);

  const handleLikePress = useCallback(async () => {
    if (!currentProfile) return;
    dragX.value = 0;
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    removeProfile(currentProfile._id as Id<"aiProfiles">);

    try {
      await likeProfile(currentProfile._id as Id<"aiProfiles">);
      setMatchedProfile(currentProfile);
      setShowMatchModal(true);
    } catch (error) {
      restoreProfile(currentProfile);
      console.error("Failed to like profile:", error);
    }
  }, [
    currentProfile,
    likeProfile,
    isAuthenticated,
    navigateToLogin,
    removeProfile,
    restoreProfile,
  ]);

  const handleMatchClose = useCallback(() => {
    setShowMatchModal(false);
    setMatchedProfile(null);
  }, []);

  const handleSkipForNow = useCallback(() => {
    setShowMatchModal(false);
    setMatchedProfile(null);
  }, []);

  const handleStartChatting = useCallback(async () => {
    if (matchedProfile) {
      try {
        setLoadingChatting(true);
        const conversationId = await startConversation({
          aiProfileId: matchedProfile._id as Id<"aiProfiles">,
        });
        setShowMatchModal(false);
        router.push(`/chat/${conversationId}`);
      } catch (error) {
        console.error("Failed to start conversation:", error);
      } finally {
        setLoadingChatting(false);
      }
      setMatchedProfile(null);
    }
  }, [matchedProfile, router, startConversation]);

  const handleCardPress = useCallback(() => {
    if (!currentProfile) return;
    router.push(`/profile/${currentProfile._id}`);
  }, [currentProfile, router]);

  // Full screen card (tab bar overlays)
  const cardHeight = height - insets.bottom - 40;

  return (
    <View className="flex-1 bg-background">
      {/* Card Stack - Full Screen */}
      <View style={styles.cardContainer}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center  w-full">
            {/* Card Skeleton */}
            <View
              className="w-full relative bg-background overflow-hidden"
              style={{ height: cardHeight }}
            >
              <Skeleton className="w-full h-full" />

              {/* Content Overlay Skeleton */}
              <View className="absolute bottom-28 left-0 right-0 p-6 z-10">
                <Skeleton className="h-8 w-3/4 rounded-lg mb-3" />
                <View className="flex-row gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </View>
              </View>
            </View>
          </View>
        ) : profiles.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            {status === "CanLoadMore" || status === "LoadingMore" ? (
              <View className="flex-1 items-center justify-center w-full">
                <View
                  className="w-full relative bg-background overflow-hidden"
                  style={{ height: cardHeight }}
                >
                  <Skeleton className="w-full h-full" />
                  <View className="absolute bottom-28 left-0 right-0 p-6 z-10">
                    <Skeleton className="h-8 w-3/4 rounded-lg mb-3" />
                    <View className="flex-row gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <>
                <Text className="text-xl font-semibold mb-2">
                  No more profiles
                </Text>
                <Text className="text-center text-muted">
                  You've seen all available profiles. Check back later for more!
                </Text>
              </>
            )}
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
                isAuthenticated={isAuthenticated}
                bottomUiHeight={bottomUiHeight}
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
                onAuthRequired={navigateToLogin}
                dragX={dragX}
                bottomUiHeight={bottomUiHeight}
                isFirst={true}
                cardHeight={cardHeight}
                isAuthenticated={isAuthenticated}
              />
            )}
          </>
        )}
      </View>

      {/* Fixed Action Buttons */}
      {currentProfile && !isLoading && (
        <View
          style={[
            styles.actionButtonsContainer,
            { bottom: actionButtonsBottom },
          ]}
        >
          <Animated.View style={skipButtonStyle}>
            <Pressable
              disabled={isLoading}
              onPress={handleSkipPress}
              style={[styles.actionButton, styles.skipButton]}
            >
              <X size={32} color="white" />
            </Pressable>
          </Animated.View>

          <Animated.View style={likeButtonStyle}>
            <Pressable
              disabled={isLoading}
              onPress={handleLikePress}
              style={[styles.actionButton, styles.likeButton]}
            >
              <Heart size={32} color="white" fill="white" />
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Match Modal */}
      <MatchModal
        visible={showMatchModal}
        profile={matchedProfile}
        onClose={handleMatchClose}
        onSkipForNow={handleSkipForNow}
        onStartChatting={handleStartChatting}
        isLoading={loadingChatting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  actionButtonsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  skipButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  likeButton: {
    backgroundColor: "#ec4899",
  },
});
