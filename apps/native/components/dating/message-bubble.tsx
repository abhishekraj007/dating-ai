import { format } from "date-fns";
import {
  parseStructuredContent,
  type QuizQuestionData,
  type QuizAnswerResultData,
  type ImageRequestData,
  type ImageResponseData,
} from "./bubbles";
import { QuizQuestionBubble } from "./bubbles/QuizQuestionBubble";
import { QuizResultBubble } from "./bubbles/QuizResultBubble";
import { QuizStartBubble } from "./bubbles/QuizStartBubble";
import { ImageRequestBubble, ImageResponseBubble } from "./bubbles/ImageBubble";
import {
  AITextBubble,
  UserTextBubble,
  UserImageRequestBubble,
} from "./bubbles/TextBubble";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: number;
  avatarUrl?: string | null;
  profileName?: string;
  isQuizActive?: boolean;
  onQuizAnswer?: (answer: string) => void;
  onEndQuiz?: () => void;
  onLongPress?: () => void;
}

/**
 * Message bubble router - delegates to specialized bubble components.
 * Keeps this file small and maintainable.
 */
export const MessageBubble = ({
  content,
  isUser,
  timestamp,
  avatarUrl,
  profileName,
  isQuizActive = false,
  onQuizAnswer,
  onEndQuiz,
  onLongPress,
}: MessageBubbleProps) => {
  const time = format(new Date(timestamp), "HH:mm");
  const structuredContent = parseStructuredContent(content);
  const bubbleProps = { avatarUrl, profileName, time };

  // User messages
  if (isUser) {
    if (structuredContent?.type === "image_request") {
      return (
        <UserImageRequestBubble
          data={structuredContent as ImageRequestData}
          time={time}
          onLongPress={onLongPress}
        />
      );
    }
    return (
      <UserTextBubble content={content} time={time} onLongPress={onLongPress} />
    );
  }

  // AI structured messages
  if (structuredContent) {
    switch (structuredContent.type) {
      case "quiz_question":
        return (
          <QuizQuestionBubble
            data={structuredContent as QuizQuestionData}
            isActive={isQuizActive}
            onAnswer={onQuizAnswer}
            onEndQuiz={onEndQuiz}
            {...bubbleProps}
          />
        );

      case "quiz_answer_result":
        return (
          <QuizResultBubble
            data={structuredContent as QuizAnswerResultData}
            {...bubbleProps}
          />
        );

      case "quiz_start":
        return (
          <QuizStartBubble
            message={structuredContent.message}
            {...bubbleProps}
          />
        );

      case "quiz_end":
      case "quiz_answer_check":
        return (
          <AITextBubble
            content={structuredContent.message || content}
            {...bubbleProps}
          />
        );

      case "image_request":
        return (
          <ImageRequestBubble
            data={structuredContent as ImageRequestData}
            {...bubbleProps}
          />
        );

      case "image_response":
        return (
          <ImageResponseBubble
            data={structuredContent as ImageResponseData}
            {...bubbleProps}
          />
        );
    }
  }

  // Default: AI text message
  return <AITextBubble content={content} {...bubbleProps} />;
};
