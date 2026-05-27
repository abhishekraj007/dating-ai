import { View } from "react-native";
import Markdown from "react-native-markdown-display";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import { useMarkdownStyles } from "./useMarkdownStyles";
import { Skeleton } from "heroui-native";
import { InlineVideoPreview } from "@/components/fullscreen-video";
import { BlurredPremiumImage } from "../blurred-premium-image";
import { useCredits } from "@/hooks/dating/useCredits";
import type {
  AIBubbleProps,
  VideoRequestData,
  VideoResponseData,
} from "./message-types";

interface RequestProps extends AIBubbleProps {
  data: VideoRequestData;
}

export function VideoRequestBubble({
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
          {data.message || "Let me send you a video..."}
        </Markdown>
      </View>
    </AIBubbleWrapper>
  );
}

interface ResponseProps extends AIBubbleProps {
  data: VideoResponseData;
}

export function VideoResponseBubble({
  data,
  avatarUrl,
  profileName,
  time,
}: ResponseProps) {
  const { isPremium, isLoading: isCreditsLoading } = useCredits();

  const freshUrl = useQuery(
    api.features.ai.queries.getChatVideoUrl,
    data.videoKey ? { videoKey: data.videoKey } : "skip",
  );

  const videoUrl = freshUrl ?? data.videoUrl;

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm overflow-hidden">
        {isCreditsLoading ? (
          <Skeleton style={{ width: 250, height: 350 }} />
        ) : !videoUrl ? (
          <Skeleton style={{ width: 250, height: 350 }} />
        ) : !isPremium ? (
          <BlurredPremiumImage
            imageUrl={videoUrl}
            width={250}
            height={350}
            profileName={profileName}
            profileAvatar={avatarUrl}
            borderRadius={0}
          />
        ) : (
          <InlineVideoPreview
            videoUrl={videoUrl}
            style={{ width: 250, height: 350 }}
          />
        )}
      </View>
    </AIBubbleWrapper>
  );
}
