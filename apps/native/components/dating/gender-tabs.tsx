import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";

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
  const indicatorPosition = useSharedValue(value === "female" ? 0 : 1);

  useEffect(() => {
    indicatorPosition.value = withSpring(value === "female" ? 0 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [value]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * 50 + "%" }],
    left: 0,
    width: "50%",
  }));

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
    <View className="flex-row bg-surface rounded-full p-1 relative">
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

