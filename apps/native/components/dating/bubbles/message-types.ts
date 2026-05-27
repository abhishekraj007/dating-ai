// Shared types for message bubbles

export interface QuizQuestionData {
  type: "quiz_question";
  question: string;
  options: string[];
  correctIndex: number;
  message?: string;
}

export interface QuizAnswerResultData {
  type: "quiz_answer_result";
  isCorrect: boolean;
  explanation?: string;
  message?: string;
}

export interface QuizStartData {
  type: "quiz_start";
  message?: string;
}

export interface QuizEndData {
  type: "quiz_end" | "quiz_answer_check";
  message?: string;
}

export interface ImageRequestData {
  type: "image_request";
  description?: string;
  message?: string;
  prompt?: string;
  requestId?: string;
  styleOptions?: {
    hairstyle?: string;
    clothing?: string;
    scene?: string;
    description?: string;
  };
}

export interface ImageResponseData {
  type: "image_response";
  imageUrl?: string;
  imageKey?: string;
  prompt?: string;
}

export interface ChatErrorData {
  type: "chat_error";
  code?: "rate_limited" | "generation_failed";
  promptMessageId?: string;
  retryable?: boolean;
  message?: string;
}

export interface VideoRequestData {
  type: "video_request";
  description?: string;
  message?: string;
  prompt?: string;
  requestId?: string;
  styleOptions?: {
    hairstyle?: string;
    clothing?: string;
    scene?: string;
    description?: string;
  };
}

export interface VideoResponseData {
  type: "video_response";
  videoUrl?: string;
  videoKey?: string;
  prompt?: string;
}

export interface CreditsRequiredData {
  type: "credits_required";
  action?: "image_request" | "video_request" | string;
  requiredCredits?: number;
  currentCredits?: number;
  message?: string;
}

export type StructuredContent =
  | QuizQuestionData
  | QuizAnswerResultData
  | QuizStartData
  | QuizEndData
  | ImageRequestData
  | ImageResponseData
  | VideoRequestData
  | VideoResponseData
  | ChatErrorData
  | CreditsRequiredData
  | { type: string; message?: string };

// Shared props for AI bubble components
export interface AIBubbleProps {
  avatarUrl?: string | null;
  profileName?: string;
  time: string;
}

/**
 * Parse structured content from message string.
 * Returns null if not valid JSON or missing type field.
 */
export function parseStructuredContent(
  content: string,
): StructuredContent | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type) {
      return parsed as StructuredContent;
    }
  } catch {
    // Not JSON
  }
  return null;
}
