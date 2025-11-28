import { View, Text, Pressable } from "react-native";
import { useThemeColor } from "heroui-native";
import { LogOut } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import { useMarkdownStyles } from "./useMarkdownStyles";
import type { AIBubbleProps, QuizQuestionData } from "./message-types";

interface Props extends AIBubbleProps {
  data: QuizQuestionData;
  isActive: boolean;
  onAnswer?: (answer: string) => void;
  onEndQuiz?: () => void;
}

/**
 * Quiz question bubble with interactive options.
 * Shows only question text when inactive (past questions).
 */
export function QuizQuestionBubble({
  data,
  isActive,
  onAnswer,
  onEndQuiz,
  avatarUrl,
  profileName,
  time,
}: Props) {
  const markdownStyles = useMarkdownStyles();
  const mutedForeground = useThemeColor("muted");

  // Inactive: show only question text
  if (!isActive) {
    return (
      <AIBubbleWrapper
        avatarUrl={avatarUrl}
        profileName={profileName}
        time={time}
      >
        <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
          <Markdown style={markdownStyles}>{data.question}</Markdown>
        </View>
      </AIBubbleWrapper>
    );
  }

  // Active: show question with options
  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
      maxWidth="max-w-[85%]"
      showTime={false}
    >
      {/* Question */}
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 mb-3">
        <Markdown style={markdownStyles}>{data.question}</Markdown>
      </View>

      {/* Options */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {data.options.map((option, index) => {
          const label = String.fromCharCode(65 + index);
          return (
            <Pressable
              key={index}
              onPress={() => onAnswer?.(option)}
              className="bg-surface border border-border rounded-full px-4 py-2 active:bg-pink-500/20 active:border-pink-500"
            >
              <Text className="text-foreground">
                {label}) {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* End quiz */}
      <Pressable
        onPress={onEndQuiz}
        className="flex-row items-center bg-surface/50 border border-border rounded-full px-4 py-2 self-start"
      >
        <LogOut size={16} color={mutedForeground} />
        <Text className="text-muted ml-2">End quiz</Text>
      </Pressable>

      <Text className="text-muted text-xs mt-2">{time}</Text>
    </AIBubbleWrapper>
  );
}
