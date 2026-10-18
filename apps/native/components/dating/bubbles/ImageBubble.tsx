import { View } from "react-native";
import Markdown from "react-native-markdown-display";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import { useMarkdownStyles } from "./useMarkdownStyles";
import { ZoomableImage } from "@/components/zoomable-image";
import { BlurredPremiumImage } from "../blurred-premium-image";
import { useCredits } from "@/hooks/dating/useCredits";
import { useTranslation } from "@/hooks/use-translation";
import { MediaPlaceholder, MEDIA_PREVIEW_SIZE } from "./MediaPlaceholder";
import type {
  AIBubbleProps,
  ImageResponseData,
  ImageProcessingData,
  ImageFailedData,
} from "./message-types";

interface ProcessingProps extends AIBubbleProps {
  data: ImageProcessingData;
}

export function ImageProcessingBubble({
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
          label={t("media.takingPhoto")}
        />
      </View>
    </AIBubbleWrapper>
  );
}

interface FailedProps extends AIBubbleProps {
  data: ImageFailedData;
}

export function ImageFailedBubble({
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
            "Oops, I couldn't take that photo right now. My camera seems to be acting up!"}
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
  const { isPremium, isLoading: isCreditsLoading } = useCredits();

  const freshUrl = useQuery(
    api.features.ai.queries.getChatImageUrl,
    data.imageKey ? { imageKey: data.imageKey } : "skip",
  );

  const imageUrl = freshUrl ?? data.imageUrl;
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
        ) : !imageUrl ? (
          <MediaPlaceholder {...previewSize} showSpinner />
        ) : !isPremium ? (
          <View style={previewSize}>
            <BlurredPremiumImage
              imageUrl={imageUrl}
              width={previewSize.width}
              height={previewSize.height}
              profileName={profileName}
              profileAvatar={avatarUrl}
              borderRadius={0}
            />
          </View>
        ) : (
          <ZoomableImage
            source={{ uri: imageUrl }}
            style={previewSize}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
          />
        )}
      </View>
    </AIBubbleWrapper>
  );
}
