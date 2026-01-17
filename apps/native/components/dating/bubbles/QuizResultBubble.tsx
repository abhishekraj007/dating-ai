import { View, Text } from "react-native";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import type { AIBubbleProps, QuizAnswerResultData } from "./message-types";

interface Props extends AIBubbleProps {
  data: QuizAnswerResultData;
}

/**
 * Quiz answer result bubble showing correct/incorrect feedback.
 */
export function QuizResultBubble({
  data,
  avatarUrl,
  profileName,
  time,
}: Props) {
  const bgColor = data.isCorrect
    ? "bg-green-500/10 border-green-500"
    : "bg-red-500/10 border-red-500";
  const textColor = data.isCorrect ? "text-green-500" : "text-red-500";

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className={`rounded-2xl rounded-tl-sm px-4 py-3 border ${bgColor}`}>
        <Text className={`font-semibold ${textColor}`}>
          {data.isCorrect ? "Correct!" : "Not quite!"}
        </Text>
        {data.message && (
          <Text className="text-foreground mt-1">{data.message}</Text>
        )}
        {data.explanation && (
          <Text className="text-muted mt-1 text-sm">{data.explanation}</Text>
        )}
      </View>
    </AIBubbleWrapper>
  );
}
