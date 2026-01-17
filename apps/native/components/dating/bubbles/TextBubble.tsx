import { View, Text, Pressable } from "react-native";
import { Camera } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import { useMarkdownStyles } from "./useMarkdownStyles";
import type { AIBubbleProps, ImageRequestData } from "./message-types";

interface AITextProps extends AIBubbleProps {
  content: string;
}

/**
 * Generic AI text bubble with markdown support.
 */
export function AITextBubble({
  content,
  avatarUrl,
  profileName,
  time,
}: AITextProps) {
  const markdownStyles = useMarkdownStyles();

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
        <Markdown style={markdownStyles}>{content}</Markdown>
      </View>
    </AIBubbleWrapper>
  );
}

interface UserTextProps {
  content: string;
  time: string;
  onLongPress?: () => void;
}

/**
 * User text bubble (right-aligned, pink).
 */
export function UserTextBubble({ content, time, onLongPress }: UserTextProps) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={500}>
      <View className="flex-row justify-end mb-3 px-4">
        <View className="max-w-[80%]">
          <View className="bg-pink-500 rounded-2xl rounded-br-sm px-4 py-3">
            <Text className="text-white">{content}</Text>
          </View>
          <Text className="text-muted text-xs text-right mt-1">{time}</Text>
        </View>
      </View>
    </Pressable>
  );
}

interface UserImageRequestProps {
  data: ImageRequestData;
  time: string;
  onLongPress?: () => void;
}

/**
 * User image request bubble.
 */
export function UserImageRequestBubble({
  data,
  time,
  onLongPress,
}: UserImageRequestProps) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={500}>
      <View className="flex-row justify-end mb-3 px-4">
        <View className="max-w-[80%]">
          <View className="bg-pink-500 rounded-2xl rounded-br-sm px-4 py-3 flex-row items-center">
            <Camera size={18} color="white" />
            <Text className="text-white ml-2">
              {data.message || "Send me a selfie"}
            </Text>
          </View>
          <Text className="text-muted text-xs text-right mt-1">{time}</Text>
        </View>
      </View>
    </Pressable>
  );
}
