import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useThemeColor } from "heroui-native";
import { Check, X } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useEffect } from "react";

interface QuizFeedbackToastProps {
  isCorrect: boolean;
  visible: boolean;
}

export function QuizFeedbackToast({ isCorrect, visible }: QuizFeedbackToastProps) {
  const successColor = useThemeColor("success");
  const dangerColor = useThemeColor("danger");
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      scale.value = 0;
    }
  }, [visible, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="absolute inset-0 items-center justify-center"
      pointerEvents="none"
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: isCorrect ? successColor : dangerColor,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 50,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          },
        ]}
      >
        {isCorrect ? (
          <Check size={20} color="#FFFFFF" />
        ) : (
          <X size={20} color="#FFFFFF" />
        )}
        <Text size="base" weight="semibold" style={{ color: "#FFFFFF" }}>
          {isCorrect ? "Correct!" : "Wrong!"}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
