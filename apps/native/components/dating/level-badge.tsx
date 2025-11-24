import { Chip } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md";
}

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  return (
    <Chip
      variant="primary"
      size={size}
      className="overflow-hidden"
      style={{
        shadowColor: "#FF3B8E",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={["#ec4899", "#f43f5e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Chip.Label className="text-white font-bold">Lv.{level}</Chip.Label>
    </Chip>
  );
}

