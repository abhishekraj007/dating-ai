import { View, Text, Pressable, StyleSheet } from "react-native";
import { Avatar } from "heroui-native";
import { format } from "date-fns";
import { useThemeColor } from "heroui-native";
import Markdown from "react-native-markdown-display";
import { LogOut } from "lucide-react-native";

interface QuizQuestionData {
  type: "quiz_question";
  question: string;
  options: string[];
  correctIndex: number;
  message?: string;
}

interface QuizAnswerResultData {
  type: "quiz_answer_result";
  isCorrect: boolean;
  explanation?: string;
  message?: string;
}

interface ImageRequestData {
  type: "image_request";
  description: string;
  message: string;
  styleOptions?: {
    hairstyle?: string;
    clothing?: string;
    scene?: string;
  };
}

type StructuredContent =
  | QuizQuestionData
  | QuizAnswerResultData
  | ImageRequestData
  | { type: string; message?: string };

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: number;
  avatarUrl?: string | null;
  profileName?: string;
  onQuizAnswer?: (answer: string) => void;
  onEndQuiz?: () => void;
  onLongPress?: () => void;
}

/**
 * Try to parse structured content from the message.
 * Returns null if content is not valid JSON or doesn't have a type field.
 */
function parseStructuredContent(content: string): StructuredContent | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type) {
      return parsed as StructuredContent;
    }
  } catch {
    // Not JSON, return null
  }
  return null;
}

export const MessageBubble = ({
  content,
  isUser,
  timestamp,
  avatarUrl,
  profileName,
  onQuizAnswer,
  onEndQuiz,
  onLongPress,
}: MessageBubbleProps) => {
  const time = format(new Date(timestamp), "HH:mm");
  const foreground = useThemeColor("foreground");
  const mutedForeground = useThemeColor("muted-foreground");
  const background = useThemeColor("background");

  // Markdown styles
  const markdownStyles = StyleSheet.create({
    body: {
      color: foreground,
      fontSize: 15,
      lineHeight: 22,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
    },
    strong: {
      fontWeight: "700",
    },
    em: {
      fontStyle: "italic",
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      marginVertical: 2,
    },
    code_inline: {
      backgroundColor: background,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: "monospace",
    },
    fence: {
      backgroundColor: background,
      padding: 8,
      borderRadius: 8,
      marginVertical: 8,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: "#ec4899",
      paddingLeft: 12,
      opacity: 0.8,
    },
  });

  // Try to parse structured content
  const structuredContent = !isUser ? parseStructuredContent(content) : null;

  if (isUser) {
    // User message - right aligned, pink background
    return (
      <Pressable onLongPress={onLongPress} delayLongPress={500}>
        <View className="flex-row justify-end mb-3 px-4">
          <View className="max-w-[80%]">
            <View className="bg-pink-500 rounded-2xl rounded-br-sm px-4 py-3">
              <Text className="text-white">{content}</Text>
            </View>
            <Text className="text-muted-foreground text-xs text-right mt-1">
              {time}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Handle structured content types
  if (structuredContent) {
    switch (structuredContent.type) {
      case "quiz_question": {
        const quizData = structuredContent as QuizQuestionData;
        return (
          <View className="flex-row mb-3 px-4">
            <Avatar size="sm" className="mr-2">
              {avatarUrl ? (
                <Avatar.Image source={{ uri: avatarUrl }} />
              ) : (
                <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
              )}
            </Avatar>
            <View className="max-w-[85%]">
              {/* Question bubble */}
              <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 mb-3">
                <Markdown style={markdownStyles}>{quizData.question}</Markdown>
              </View>

              {/* Answer options as clickable chips */}
              <View className="flex-row flex-wrap gap-2 mb-2">
                {quizData.options.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                  return (
                    <Pressable
                      key={index}
                      onPress={() => onQuizAnswer?.(`${optionLabel}`)}
                      className="bg-surface border border-border rounded-full px-4 py-2 active:bg-pink-500/20 active:border-pink-500"
                    >
                      <Text className="text-foreground">
                        {optionLabel}) {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* End quiz button */}
              <Pressable
                onPress={onEndQuiz}
                className="flex-row items-center bg-surface/50 border border-border rounded-full px-4 py-2 self-start"
              >
                <LogOut size={16} color={mutedForeground} />
                <Text className="text-muted-foreground ml-2">End quiz</Text>
              </Pressable>

              <Text className="text-muted-foreground text-xs mt-2">{time}</Text>
            </View>
          </View>
        );
      }

      case "quiz_answer_result": {
        const resultData = structuredContent as QuizAnswerResultData;
        const bgColor = resultData.isCorrect
          ? "bg-green-500/10 border-green-500"
          : "bg-red-500/10 border-red-500";
        const textColor = resultData.isCorrect
          ? "text-green-500"
          : "text-red-500";

        return (
          <View className="flex-row mb-3 px-4">
            <Avatar size="sm" className="mr-2">
              {avatarUrl ? (
                <Avatar.Image source={{ uri: avatarUrl }} />
              ) : (
                <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
              )}
            </Avatar>
            <View className="max-w-[75%]">
              <View
                className={`rounded-2xl rounded-tl-sm px-4 py-3 border ${bgColor}`}
              >
                <Text className={`font-semibold ${textColor}`}>
                  {resultData.isCorrect ? "Correct! 🎉" : "Not quite! 😅"}
                </Text>
                {resultData.message && (
                  <Text className="text-foreground mt-1">
                    {resultData.message}
                  </Text>
                )}
                {resultData.explanation && (
                  <Text className="text-muted-foreground mt-1 text-sm">
                    {resultData.explanation}
                  </Text>
                )}
              </View>
              <Text className="text-muted-foreground text-xs mt-1">{time}</Text>
            </View>
          </View>
        );
      }

      case "quiz_start": {
        // Quiz started - show divider and message
        const borderColor = mutedForeground;
        return (
          <View className="mb-3">
            {/* Quiz started divider */}
            <View className="flex-row items-center gap-3 py-2 px-4">
              <View
                className="flex-1 h-px"
                style={{ backgroundColor: borderColor, opacity: 0.3 }}
              />
              <Text className="text-muted-foreground text-sm">
                Quiz started
              </Text>
              <View
                className="flex-1 h-px"
                style={{ backgroundColor: borderColor, opacity: 0.3 }}
              />
            </View>

            {/* Message bubble */}
            <View className="flex-row px-4">
              <Avatar size="sm" className="mr-2">
                {avatarUrl ? (
                  <Avatar.Image source={{ uri: avatarUrl }} />
                ) : (
                  <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
                )}
              </Avatar>
              <View className="max-w-[75%]">
                <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
                  <Markdown style={markdownStyles}>
                    {structuredContent.message || content}
                  </Markdown>
                </View>
                <Text className="text-muted-foreground text-xs mt-1">
                  {time}
                </Text>
              </View>
            </View>
          </View>
        );
      }

      case "quiz_end":
      case "quiz_answer_check":
        // These are just text messages with markdown
        return (
          <View className="flex-row mb-3 px-4">
            <Avatar size="sm" className="mr-2">
              {avatarUrl ? (
                <Avatar.Image source={{ uri: avatarUrl }} />
              ) : (
                <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
              )}
            </Avatar>
            <View className="max-w-[75%]">
              <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
                <Markdown style={markdownStyles}>
                  {structuredContent.message || content}
                </Markdown>
              </View>
              <Text className="text-muted-foreground text-xs mt-1">{time}</Text>
            </View>
          </View>
        );

      case "image_request": {
        const imageData = structuredContent as ImageRequestData;
        return (
          <View className="flex-row mb-3 px-4">
            <Avatar size="sm" className="mr-2">
              {avatarUrl ? (
                <Avatar.Image source={{ uri: avatarUrl }} />
              ) : (
                <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
              )}
            </Avatar>
            <View className="max-w-[75%]">
              <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
                <Markdown style={markdownStyles}>{imageData.message}</Markdown>
              </View>
              <Text className="text-muted-foreground text-xs mt-1">{time}</Text>
            </View>
          </View>
        );
      }
    }
  }

  // Default: AI message - left aligned, with markdown support
  return (
    <View className="flex-row mb-3 px-4">
      <Avatar size="sm" className="mr-2">
        {avatarUrl ? (
          <Avatar.Image source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Fallback>{profileName?.[0] ?? "AI"}</Avatar.Fallback>
        )}
      </Avatar>
      <View className="max-w-[75%]">
        <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
          <Markdown style={markdownStyles}>{content}</Markdown>
        </View>
        <Text className="text-muted-foreground text-xs mt-1">{time}</Text>
      </View>
    </View>
  );
};
