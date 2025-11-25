import { View, Text, Pressable, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

type Gender = "female" | "male";

interface GenderTabsProps {
  value: Gender;
  onChange: (value: Gender) => void;
  femaleCount?: number;
  maleCount?: number;
  showCounts?: boolean;
}

export const GenderTabs = ({
  value,
  onChange,
  femaleCount,
  maleCount,
  showCounts = false,
}: GenderTabsProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorPosition = useSharedValue(value === "female" ? 0 : 1);

  useEffect(() => {
    indicatorPosition.value = withTiming(value === "female" ? 0 : 1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = containerWidth / 2;
    return {
      transform: [{ translateX: indicatorPosition.value * tabWidth }],
      width: tabWidth,
    };
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const getFemaleLabel = () => {
    if (showCounts && femaleCount !== undefined) {
      return `Female (${femaleCount})`;
    }
    return "Female";
  };

  const getMaleLabel = () => {
    if (showCounts && maleCount !== undefined) {
      return `Male (${maleCount})`;
    }
    return "Male";
  };

  return (
    <View
      className="flex-row bg-surface rounded-full p-1 relative"
      onLayout={handleLayout}
    >
      {/* Animated indicator */}
      <Animated.View
        style={indicatorStyle}
        className="absolute top-1 bottom-1 bg-pink-500 rounded-full"
      />

      {/* Female tab */}
      <Pressable
        onPress={() => onChange("female")}
        className="flex-1 py-3 items-center z-10"
      >
        <Text
          className={`font-semibold ${
            value === "female" ? "text-white" : "text-foreground"
          }`}
        >
          {getFemaleLabel()}
        </Text>
      </Pressable>

      {/* Male tab */}
      <Pressable
        onPress={() => onChange("male")}
        className="flex-1 py-3 items-center z-10"
      >
        <Text
          className={`font-semibold ${
            value === "male" ? "text-white" : "text-foreground"
          }`}
        >
          {getMaleLabel()}
        </Text>
      </Pressable>
    </View>
  );
};
