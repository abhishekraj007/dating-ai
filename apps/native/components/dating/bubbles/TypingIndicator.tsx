import { View } from "react-native";
import { useEffect, useRef } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import type { AIBubbleProps } from "./message-types";

interface TypingIndicatorProps extends Omit<AIBubbleProps, "time"> {}

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-2 h-2 rounded-full bg-muted mx-0.5"
    />
  );
}

export function TypingIndicator({
  avatarUrl,
  profileName,
}: TypingIndicatorProps) {
  return (
    <AIBubbleWrapper avatarUrl={avatarUrl} profileName={profileName} time="">
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-4 flex-row items-center">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </AIBubbleWrapper>
  );
}
