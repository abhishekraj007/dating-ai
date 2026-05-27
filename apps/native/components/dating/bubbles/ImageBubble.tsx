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
import { MediaPlaceholder } from "./MediaPlaceholder";
import type {
  AIBubbleProps,
  ImageRequestData,
  ImageResponseData,
  ImageProcessingData,
  ImageFailedData,
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

interface ProcessingProps extends AIBubbleProps {
  data: ImageProcessingData;
}

export function ImageProcessingBubble({
  avatarUrl,
  profileName,
  time,
}: ProcessingProps) {
  const { t } = useTranslation();
  const markdownStyles = useMarkdownStyles();
  const previewSize = { width: 250, height: 350 };

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm overflow-hidden">
        <MediaPlaceholder {...previewSize} showSpinner />
        <View className="px-4 py-3">
          <Markdown style={markdownStyles}>{t("media.takingPhoto")}</Markdown>
        </View>
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
        ) : !imageUrl ? (
          <MediaPlaceholder {...previewSize} showSpinner />
        ) : !isPremium ? (
          <BlurredPremiumImage
            imageUrl={imageUrl}
            width={previewSize.width}
            height={previewSize.height}
            profileName={profileName}
            profileAvatar={avatarUrl}
            borderRadius={0}
          />
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
