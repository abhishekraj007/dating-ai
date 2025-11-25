import { View, Text } from "react-native";
import { Avatar } from "heroui-native";
import { format } from "date-fns";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: number;
  avatarUrl?: string | null;
  profileName?: string;
}

export const MessageBubble = ({
  content,
  isUser,
  timestamp,
  avatarUrl,
  profileName,
}: MessageBubbleProps) => {
  const time = format(new Date(timestamp), "HH:mm");

  if (isUser) {
    // User message - right aligned, pink background
    return (
      <View className="flex-row justify-end mb-3 px-4">
        <View className="max-w-[80%]">
          <View className="bg-pink-500 rounded-2xl rounded-br-sm px-4 py-3">
            <Text className="text-white">{content}</Text>
          </View>
          <Text className="text-muted-foreground text-xs text-right mt-1">
            {time}
          </Text>
        </View>
      </View>
    );
  }

  // AI message - left aligned, dark background with avatar
  return (
    <View className="flex-row mb-3 px-4">
      <Avatar size="sm" className="mr-2">
        {avatarUrl ? (
          <Avatar.Image source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
        )}
      </Avatar>
      <View className="max-w-[75%]">
        <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
          <Text className="text-foreground">{content}</Text>
        </View>
        <Text className="text-muted-foreground text-xs mt-1">{time}</Text>
      </View>
    </View>
  );
};
