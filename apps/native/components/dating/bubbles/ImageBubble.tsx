import { View, Text } from "react-native";
import { Image } from "expo-image";
import Markdown from "react-native-markdown-display";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import { useMarkdownStyles } from "./useMarkdownStyles";
import type {
  AIBubbleProps,
  ImageRequestData,
  ImageResponseData,
} from "./message-types";

interface RequestProps extends AIBubbleProps {
  data: ImageRequestData;
}

/**
 * AI image request bubble (pending/generating state).
 */
export function ImageRequestBubble({
  data,
  avatarUrl,
  profileName,
  time,
}: RequestProps) {
  const markdownStyles = useMarkdownStyles();

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
        <Markdown style={markdownStyles}>
          {data.message || "Let me send you a photo..."}
        </Markdown>
      </View>
    </AIBubbleWrapper>
  );
}

interface ResponseProps extends AIBubbleProps {
  data: ImageResponseData;
}

/**
 * AI image response bubble showing the generated image.
 */
export function ImageResponseBubble({
  data,
  avatarUrl,
  profileName,
  time,
}: ResponseProps) {
  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm overflow-hidden">
        <Image
          source={{ uri: data.imageUrl }}
          style={{ width: 250, height: 350 }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      </View>
    </AIBubbleWrapper>
  );
}
