import { View, Text } from "react-native";
import { Heart } from "lucide-react-native";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

interface CompatibilityIndicatorProps {
  score: number;
}

export function CompatibilityIndicator({ score }: CompatibilityIndicatorProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Animate on score change
  useEffect(() => {
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
  }, [score, scale]);

  return (
    <Animated.View
      className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 rounded-full p-3 items-center justify-center"
      style={[
        animatedStyle,
        {
          shadowColor: "#FF3B8E",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
      ]}
    >
      <Heart size={24} color="#FF3B8E" fill="#FF3B8E" />
      <Text className="text-pink-500 font-bold text-sm mt-1">{score}%</Text>
    </Animated.View>
  );
}

