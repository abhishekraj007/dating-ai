import { View, Text } from "react-native";
import { Avatar, useThemeColor } from "heroui-native";
import Markdown from "react-native-markdown-display";
import { useMarkdownStyles } from "./useMarkdownStyles";
import type { AIBubbleProps } from "./message-types";

interface Props extends AIBubbleProps {
  message?: string;
}

/**
 * Quiz start bubble with divider and message.
 */
export function QuizStartBubble({
  message,
  avatarUrl,
  profileName,
  time,
}: Props) {
  const markdownStyles = useMarkdownStyles();
  const borderColor = useThemeColor("muted");

  return (
    <View className="mb-3">
      {/* Divider */}
      <View className="flex-row items-center gap-3 py-2 px-4">
        <View
          className="flex-1 h-px"
          style={{ backgroundColor: borderColor, opacity: 0.3 }}
        />
        <Text className="text-muted text-sm">Quiz started</Text>
        <View
          className="flex-1 h-px"
          style={{ backgroundColor: borderColor, opacity: 0.3 }}
        />
      </View>

      {/* Message */}
      <View className="flex-row px-4">
        <Avatar alt="" size="sm" className="mr-2">
          {avatarUrl ? (
            <Avatar.Image source={{ uri: avatarUrl }} />
          ) : (
            <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
          )}
        </Avatar>
        <View className="max-w-[75%]">
          <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
            <Markdown style={markdownStyles}>
              {message || "Let's play a quiz!"}
            </Markdown>
          </View>
          <Text className="text-muted text-xs mt-1">{time}</Text>
        </View>
      </View>
    </View>
  );
}
