import { View, Text } from "react-native";
import { Heart } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

interface CompatibilityIndicatorProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { container: 48, heart: 32, text: 10 },
  md: { container: 64, heart: 44, text: 12 },
  lg: { container: 80, heart: 56, text: 14 },
};

export const CompatibilityIndicator = ({
  score,
  size = "md",
}: CompatibilityIndicatorProps) => {
  const scale = useSharedValue(1);
  const { container, heart, text } = sizes[size];

  useEffect(() => {
    // Pulse animation when score changes
    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: container,
          height: container,
        },
      ]}
      className="items-center justify-center"
    >
      {/* Background heart */}
      <View className="absolute">
        <Heart size={heart} color="#EC4899" fill="#EC4899" />
      </View>

      {/* Score text */}
      <Text
        className="text-white font-bold"
        style={{ fontSize: text }}
      >
        {score}%
      </Text>
    </Animated.View>
  );
};

