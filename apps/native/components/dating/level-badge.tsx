import { View, Text } from "react-native";
import { Chip } from "heroui-native";

interface LevelBadgeProps {
  level: number; // 1-5
  size?: "sm" | "md";
}

export const LevelBadge = ({ level, size = "sm" }: LevelBadgeProps) => {
  // Different colors for different levels
  const getBgColor = () => {
    switch (level) {
      case 1:
        return "bg-gray-500";
      case 2:
        return "bg-blue-500";
      case 3:
        return "bg-purple-500";
      case 4:
        return "bg-orange-500";
      case 5:
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <View
      className={`${getBgColor()} rounded-full px-2 py-0.5 border border-pink-400`}
    >
      <Text
        className={`text-white font-semibold ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        Lv.{level}
      </Text>
    </View>
  );
};

