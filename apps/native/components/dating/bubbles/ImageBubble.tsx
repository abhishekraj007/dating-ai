import { View, Text } from "react-native";
import Markdown from "react-native-markdown-display";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import { useMarkdownStyles } from "./useMarkdownStyles";
import { Skeleton } from "heroui-native";
import { ZoomableImage } from "@/components/zoomable-image";
import { BlurredPremiumImage } from "../blurred-premium-image";
import { useCredits } from "@/hooks/dating/useCredits";
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
 * Uses imageKey to fetch a fresh signed URL that won't expire.
 */
export function ImageResponseBubble({
  data,
  avatarUrl,
  profileName,
  time,
}: ResponseProps) {
  const { isPremium } = useCredits();

  // Fetch fresh signed URL using permanent imageKey
  // This prevents expired URL issues
  const freshUrl = useQuery(
    api.features.ai.queries.getChatImageUrl,
    data.imageKey ? { imageKey: data.imageKey } : "skip",
  );

  // Use fresh URL if available, fall back to stored URL (might be expired)
  const imageUrl = freshUrl ?? data.imageUrl;

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm overflow-hidden">
        {!imageUrl ? (
          <Skeleton style={{ width: 250, height: 350 }} />
        ) : isPremium ? (
          <ZoomableImage
            source={{ uri: imageUrl }}
            style={{ width: 250, height: 350 }}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
          />
        ) : (
          <BlurredPremiumImage
            imageUrl={imageUrl}
            width={250}
            height={350}
            profileName={profileName}
            profileAvatar={avatarUrl}
            borderRadius={0}
          />
        )}
      </View>
    </AIBubbleWrapper>
  );
}
