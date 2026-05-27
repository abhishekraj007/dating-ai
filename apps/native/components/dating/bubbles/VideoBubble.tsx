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

  const freshVideoUrl = useQuery(
    api.features.ai.queries.getChatVideoUrl,
    isPremium && data.videoKey ? { videoKey: data.videoKey } : "skip",
  );

  const freshPosterUrl = useQuery(
    api.features.ai.queries.getChatVideoPosterUrl,
    data.posterKey ? { posterKey: data.posterKey } : "skip",
  );

  const videoUrl = freshVideoUrl ?? data.videoUrl;
  const posterUrl = freshPosterUrl ?? data.posterUrl;
  const previewSize = { width: 250, height: 350 };

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm overflow-hidden">
        {isCreditsLoading ? (
          <Skeleton style={previewSize} />
        ) : !isPremium ? (
          posterUrl ? (
            <BlurredPremiumImage
              imageUrl={posterUrl}
              width={previewSize.width}
              height={previewSize.height}
              profileName={profileName}
              profileAvatar={avatarUrl}
              borderRadius={0}
            />
          ) : (
            <Skeleton style={previewSize} />
          )
        ) : !videoUrl && !posterUrl ? (
          <Skeleton style={previewSize} />
        ) : (
          <InlineVideoPreview
            videoUrl={videoUrl}
            posterUrl={posterUrl}
            style={previewSize}
          />
        )}
      </View>
    </AIBubbleWrapper>
  );
}
