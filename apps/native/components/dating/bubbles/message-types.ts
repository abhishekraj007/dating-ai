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
  };
}

export interface ImageResponseData {
  type: "image_response";
  imageUrl: string;
  imageKey: string;
  prompt?: string;
}

export type StructuredContent =
  | QuizQuestionData
  | QuizAnswerResultData
  | QuizStartData
  | QuizEndData
  | ImageRequestData
  | ImageResponseData
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
  content: string
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
