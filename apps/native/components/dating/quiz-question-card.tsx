import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, useThemeColor } from "heroui-native";
import { Check, X, LogOut } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // ["A) Paris", "B) Rome", ...]
  correctIndex: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  isActive: boolean;
  onAnswer: (questionId: string, answerIndex: number) => void;
  onEndQuiz: () => void;
  showEndButton?: boolean;
}

export function QuizQuestionCard({
  question,
  isActive,
  onAnswer,
  onEndQuiz,
  showEndButton = true,
}: QuizQuestionCardProps) {
  const accentColor = useThemeColor("accent");
  const successColor = useThemeColor("success");
  const dangerColor = useThemeColor("danger");
  const foregroundColor = useThemeColor("foreground");
  const surfaceColor = useThemeColor("surface-secondary");

  const hasAnswered = question.userAnswer !== undefined;

  const handleAnswer = (index: number) => {
    if (hasAnswered || !isActive) return;
    onAnswer(question.id, index);
  };

  const getOptionStyle = (index: number) => {
    if (!hasAnswered) {
      return {
        backgroundColor: surfaceColor,
        borderColor: "transparent",
      };
    }

    const isSelected = question.userAnswer === index;
    const isCorrectOption = question.correctIndex === index;

    if (isCorrectOption) {
      return {
        backgroundColor: accentColor,
        borderColor: accentColor,
      };
    }

    if (isSelected && !question.isCorrect) {
      return {
        backgroundColor: dangerColor,
        borderColor: dangerColor,
      };
    }

    return {
      backgroundColor: surfaceColor,
      borderColor: "transparent",
    };
  };

  const getOptionTextColor = (index: number) => {
    if (!hasAnswered) return foregroundColor;

    const isSelected = question.userAnswer === index;
    const isCorrectOption = question.correctIndex === index;

    if (isCorrectOption || (isSelected && !question.isCorrect)) {
      return "#FFFFFF";
    }

    return foregroundColor;
  };

  return (
    <View className="gap-3">
      {/* Question */}
      <View className="bg-surface-secondary rounded-2xl px-4 py-3">
        <Text size="base">{question.question}</Text>
      </View>

      {/* Options */}
      <View className="gap-2">
        {question.options.map((option, index) => {
          const optionStyle = getOptionStyle(index);
          const textColor = getOptionTextColor(index);
          const isSelected = question.userAnswer === index;
          const isCorrectOption = question.correctIndex === index;

          return (
            <Pressable
              key={index}
              onPress={() => handleAnswer(index)}
              disabled={hasAnswered || !isActive}
              className="rounded-full px-5 py-3 border-2"
              style={{
                backgroundColor: optionStyle.backgroundColor,
                borderColor: optionStyle.borderColor,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text style={{ color: textColor }}>{option}</Text>
                {hasAnswered && isCorrectOption && (
                  <Check size={18} color="#FFFFFF" />
                )}
                {hasAnswered && isSelected && !question.isCorrect && (
                  <X size={18} color="#FFFFFF" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* End Quiz Button */}
      {showEndButton && isActive && (
        <Button
          variant="secondary"
          size="sm"
          onPress={onEndQuiz}
          className="self-start mt-2"
        >
          <LogOut size={16} color={accentColor} />
          <Button.Label>End quiz</Button.Label>
        </Button>
      )}
    </View>
  );
}
