import {
  View,
  useWindowDimensions,
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
} from "react-native";
// import { Text } from "@/components/ui/text";
import { Chip } from "heroui-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { ForYouProfile } from "@/hooks/dating/useForYou";

const SWIPE_THRESHOLD = 120;

interface ProfileSwipeCardProps {
  profile: ForYouProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPress: () => void;
  onAuthRequired?: () => void;
  dragX?: SharedValue<number>;
  bottomUiHeight?: number;
  isFirst?: boolean;
  cardHeight?: number;
  isAuthenticated?: boolean;
}

export function ProfileSwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  onAuthRequired,
  dragX,
  bottomUiHeight,
  isFirst = false,
  cardHeight: propCardHeight,
  isAuthenticated = true,
}: ProfileSwipeCardProps) {
  const { width, height } = useWindowDimensions();
  const cardWidth = width;
  const cardHeight = propCardHeight ?? height;

  const reservedBottomUi = bottomUiHeight ?? 220;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleAuthRequired = () => {
    if (onAuthRequired) {
      onAuthRequired();
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotation.value = (event.translationX / width) * 15;

      if (dragX) dragX.value = event.translationX;

      // Scale down based on drag distance (both X and Y)
      const dragDistance = Math.sqrt(
        event.translationX ** 2 + event.translationY ** 2,
      );
      const newScale = interpolate(
        dragDistance,
        [0, 200],
        [1, 0.85],
        Extrapolation.CLAMP,
      );
      scale.value = newScale;
    })
    .onEnd((event) => {
      const swipedRight = event.translationX > SWIPE_THRESHOLD;
      const swipedLeft = event.translationX < -SWIPE_THRESHOLD;

      // If not authenticated and user swiped, snap back and prompt login
      if (!isAuthenticated && (swipedRight || swipedLeft)) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        scale.value = withSpring(1);
        if (dragX) dragX.value = withSpring(0);
        runOnJS(handleAuthRequired)();
        return;
      }

      if (swipedRight) {
        // Swipe right - like
        if (dragX) dragX.value = withTiming(0, { duration: 150 });
        translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeRight)();
        });
        rotation.value = withTiming(30);
        scale.value = withTiming(0.8);
      } else if (swipedLeft) {
        // Swipe left - skip
        if (dragX) dragX.value = withTiming(0, { duration: 150 });
        translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)();
        });
        rotation.value = withTiming(-30);
        scale.value = withTiming(0.8);
      } else {
        // Snap back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        scale.value = withSpring(1);
        if (dragX) dragX.value = withSpring(0);
      }
    });

  // Only use pan gesture - taps are handled by Pressable on the image area
  const composedGesture = panGesture;

  const animatedStyle = useAnimatedStyle(() => {
    if (!isFirst) {
      // Background card - stays centered
      return {
        transform: [],
      };
    }
    // Front card - follows drag with scale and rotation
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      borderRadius: interpolate(scale.value, [0.85, 1], [24, 0]),
    };
  });

  // Like/Skip indicators
  const likeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const skipIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <GestureDetector gesture={isFirst ? composedGesture : Gesture.Race()}>
      <Animated.View
        style={[
          styles.cardContainer,
          isFirst ? styles.frontCard : styles.backCard,
          {
            width: cardWidth,
            height: cardHeight,
            zIndex: isFirst ? 2 : 1,
          },
          animatedStyle,
        ]}
      >
        {/* Profile Image */}
        <Image
          source={{ uri: profile.avatarUrl ?? undefined }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
          locations={[0.4, 0.65, 1]}
          style={styles.gradient}
        />

        {/* Tap overlay for profile navigation - covers upper portion only */}
        <Pressable
          style={[styles.tapOverlay, { bottom: reservedBottomUi + 60 }]}
          onPress={onPress}
        />

        {/* Like Indicator */}
        <Animated.View
          style={[styles.indicator, styles.likeIndicator, likeIndicatorStyle]}
        >
          <Text
            className="font-bold rounded-lg"
            style={[styles.indicatorText, styles.likeIndicator]}
          >
            LIKE
          </Text>
        </Animated.View>

        {/* Skip Indicator */}
        <Animated.View
          style={[styles.indicator, styles.skipIndicator, skipIndicatorStyle]}
        >
          <Text
            className="font-bold rounded-lg"
            style={[styles.indicatorText, styles.skipIndicator]}
          >
            SKIP
          </Text>
        </Animated.View>

        {/* Profile Info */}
        <View
          style={[styles.infoContainer, { paddingBottom: reservedBottomUi }]}
        >
          <Text className="text-white text-3xl font-bold">
            {profile.name}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>

          {profile.bio && (
            <Text className="text-white/80 text-base mt-2" numberOfLines={2}>
              {profile.bio}
            </Text>
          )}

          {/* Interest Tags */}
          {profile.interests && profile.interests.length > 0 && (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 8,
                marginTop: 12,
                flexWrap: "wrap",
              }}
              // horizontal
              // showsHorizontalScrollIndicator={false}
              // contentContainerStyle={{ gap: 8, marginTop: 12 }}
            >
              {profile.interests.slice(0, 5).map((interest, index) => {
                const colors = ["accent", "success", "warning"] as const;
                const color = colors[index % colors.length];
                return (
                  <Chip
                    // style={{

                    // }}
                    key={index}
                    size="md"
                    variant={"soft"}
                    color={color}
                  >
                    <Chip.Label>{interest}</Chip.Label>
                  </Chip>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  frontCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  backCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  tapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  infoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  indicator: {
    position: "absolute",
    top: 50,
    zIndex: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorText: {
    fontSize: 48,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderRadius: 20,
  },
  likeIndicator: {
    left: 20,
    color: "#15ed4f",
    borderColor: "#15ed4f",
    transform: [{ rotate: "-15deg" }],
  },
  skipIndicator: {
    right: 20,
    color: "#333",
    borderColor: "#333",
    transform: [{ rotate: "15deg" }],
  },
});
