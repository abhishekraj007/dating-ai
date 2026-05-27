import { View } from "react-native";
import Markdown from "react-native-markdown-display";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import { useMarkdownStyles } from "./useMarkdownStyles";
import { InlineVideoPreview } from "@/components/fullscreen-video";
import { BlurredPremiumImage } from "../blurred-premium-image";
import { useCredits } from "@/hooks/dating/useCredits";
import { useTranslation } from "@/hooks/use-translation";
import { MediaPlaceholder } from "./MediaPlaceholder";
import type {
  AIBubbleProps,
  VideoRequestData,
  VideoResponseData,
  VideoProcessingData,
  VideoFailedData,
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

interface ProcessingProps extends AIBubbleProps {
  data: VideoProcessingData;
}

export function VideoProcessingBubble({
  avatarUrl,
  profileName,
  time,
}: ProcessingProps) {
  const { t } = useTranslation();
  const markdownStyles = useMarkdownStyles();
  const previewSize = { width: 250, height: 300 };

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm overflow-hidden">
        <MediaPlaceholder {...previewSize} showSpinner />
        <View className="px-4 py-3">
          <Markdown style={markdownStyles}>
            {t("media.recordingVideo")}
          </Markdown>
        </View>
      </View>
    </AIBubbleWrapper>
  );
}

interface FailedProps extends AIBubbleProps {
  data: VideoFailedData;
}

export function VideoFailedBubble({
  data,
  avatarUrl,
  profileName,
  time,
}: FailedProps) {
  const markdownStyles = useMarkdownStyles();

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
        <Markdown style={markdownStyles}>
          {data.message ||
            "Sorry, I couldn't record that video right now. My camera seems to be acting up!"}
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
          <MediaPlaceholder {...previewSize} showSpinner />
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
            <MediaPlaceholder {...previewSize} showSpinner />
          )
        ) : !videoUrl && !posterUrl ? (
          <MediaPlaceholder {...previewSize} showSpinner />
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
