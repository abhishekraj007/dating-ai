import { View, Text } from "react-native";
import { Avatar } from "heroui-native";
import type { AIBubbleProps } from "./message-types";

interface Props extends AIBubbleProps {
  children: React.ReactNode;
  maxWidth?: string;
  showTime?: boolean;
}

/**
 * Shared wrapper for AI message bubbles.
 * Handles avatar and consistent layout.
 */
export function AIBubbleWrapper({
  avatarUrl,
  profileName,
  time,
  children,
  maxWidth = "max-w-[75%]",
  showTime = true,
}: Props) {
  return (
    <View className="flex-row mb-3 px-4">
      <Avatar alt="" size="sm" className="mr-2">
        {avatarUrl ? (
          <Avatar.Image source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
        )}
      </Avatar>
      <View className={maxWidth}>
        {children}
        {showTime && <Text className="text-muted text-xs mt-1">{time}</Text>}
      </View>
    </View>
  );
}
