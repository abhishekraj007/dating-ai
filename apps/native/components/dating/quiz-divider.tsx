import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useThemeColor } from "heroui-native";

interface QuizDividerProps {
  type: "started" | "ended";
}

export function QuizDivider({ type }: QuizDividerProps) {
  const borderColor = useThemeColor("border");
  const mutedColor = useThemeColor("muted");

  return (
    <View className="flex-row items-center gap-3 py-4">
      <View className="flex-1 h-px" style={{ backgroundColor: borderColor }} />
      <Text size="sm" style={{ color: mutedColor }}>
        {type === "started" ? "Quiz started" : "Quiz ended"}
      </Text>
      <View className="flex-1 h-px" style={{ backgroundColor: borderColor }} />
    </View>
  );
}
