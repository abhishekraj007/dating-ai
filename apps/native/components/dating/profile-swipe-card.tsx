import { View, useWindowDimensions, StyleSheet, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, useThemeColor } from "heroui-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
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
  isFirst = false,
  cardHeight: propCardHeight,
  isAuthenticated = true,
}: ProfileSwipeCardProps) {
  const { width, height } = useWindowDimensions();
  // Front card is slightly narrower to show peek of behind card on sides
  const cardWidth = isFirst ? width - 40 : width - 32;
  // Use provided card height or calculate from window dimensions
  // Front card is slightly shorter so behind card peeks from top
  const cardHeight = propCardHeight
    ? isFirst
      ? propCardHeight - 16
      : propCardHeight
    : height * 0.65;

  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");

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
      translateY.value = event.translationY * 0.3;
      rotation.value = (event.translationX / width) * 15;
    })
    .onEnd((event) => {
      const swipedRight = event.translationX > SWIPE_THRESHOLD;
      const swipedLeft = event.translationX < -SWIPE_THRESHOLD;

      // If not authenticated and user swiped, snap back and prompt login
      if (!isAuthenticated && (swipedRight || swipedLeft)) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        runOnJS(handleAuthRequired)();
        return;
      }

      if (swipedRight) {
        // Swipe right - like
        translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeRight)();
        });
        rotation.value = withTiming(30);
      } else if (swipedLeft) {
        // Swipe left - skip
        translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)();
        });
        rotation.value = withTiming(-30);
      } else {
        // Snap back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  // Only use pan gesture - taps are handled by Pressable on the image area
  const composedGesture = panGesture;

  const animatedStyle = useAnimatedStyle(() => {
    if (!isFirst) {
      // Background card - no transforms, just sits behind
      return {
        transform: [],
      };
    }
    // Front card - offset down slightly so behind card peeks from top
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + 20 }, // Offset down to show behind card
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  // Like/Skip indicators
  const likeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const skipIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
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
          cachePolicy="memory-disk"
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
          style={styles.tapOverlay}
          onPress={onPress}
        />

        {/* Like Indicator */}
        <Animated.View
          style={[styles.indicator, styles.likeIndicator, likeIndicatorStyle]}
        >
          <Text className="text-green-500 text-3xl font-bold border-4 border-green-500 px-4 py-2 rounded-lg">
            LIKE
          </Text>
        </Animated.View>

        {/* Skip Indicator */}
        <Animated.View
          style={[styles.indicator, styles.skipIndicator, skipIndicatorStyle]}
        >
          <Text className="text-red-500 text-3xl font-bold border-4 border-red-500 px-4 py-2 rounded-lg">
            NOPE
          </Text>
        </Animated.View>

        {/* Profile Info */}
        <View style={styles.infoContainer}>
          <Text className="text-white text-3xl font-bold mb-2">
            {profile.name}
          </Text>

          <View className="flex-row items-center gap-2 mb-4">
            {profile.age && (
              <View className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white text-sm">♀ {profile.age}</Text>
              </View>
            )}
            {profile.zodiacSign && (
              <View className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white text-sm">{profile.zodiacSign}</Text>
              </View>
            )}
          </View>

          {/* Chat Button */}
          <Button
            size="lg"
            className="rounded-full px-8"
            style={{ backgroundColor: accentColor }}
            onPress={onPress}
          >
            <MessageCircle size={18} color="white" />
            <Button.Label className="text-white">Chat</Button.Label>
          </Button>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    borderRadius: 20,
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
    bottom: 180, // Leave room for the info container at bottom
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
  },
  likeIndicator: {
    left: 20,
    transform: [{ rotate: "-15deg" }],
  },
  skipIndicator: {
    right: 20,
    transform: [{ rotate: "15deg" }],
  },
});
