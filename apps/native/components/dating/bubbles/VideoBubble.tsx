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
import { MediaPlaceholder, MEDIA_PREVIEW_SIZE } from "./MediaPlaceholder";
import type {
  AIBubbleProps,
  VideoResponseData,
  VideoProcessingData,
  VideoFailedData,
} from "./message-types";

interface ProcessingProps extends AIBubbleProps {
  data: VideoProcessingData;
}

export function VideoProcessingBubble({
  avatarUrl,
  profileName,
  time,
}: ProcessingProps) {
  const { t } = useTranslation();

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm overflow-hidden">
        <MediaPlaceholder
          {...MEDIA_PREVIEW_SIZE}
          showSpinner
          label={t("media.recordingVideo")}
        />
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
  const previewSize = MEDIA_PREVIEW_SIZE;

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
            <View style={previewSize}>
              <BlurredPremiumImage
                imageUrl={posterUrl}
                width={previewSize.width}
                height={previewSize.height}
                profileName={profileName}
                profileAvatar={avatarUrl}
                borderRadius={0}
              />
            </View>
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
