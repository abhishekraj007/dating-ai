import { View, Pressable } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { BottomSheet, Spinner, useThemeColor } from "heroui-native";
import { CustomBottomSheet } from "@/components/bottom-sheet";
import { RefreshCw } from "lucide-react-native";

// Default conversation suggestions when AI-generated ones aren't available
export const DEFAULT_SUGGESTIONS = [
  "If you could travel anywhere in the world right now, where would you go and why?",
  "What's the most exciting hobby or activity you've picked up recently?",
  "Share your favorite recipe or dish that you love to cook at home.",
  "Can you recommend a book or movie that left a lasting impression on you?",
  "What song always puts you in a good mood no matter what?",
  "Tell me about your ideal weekend - how would you spend it?",
  "What's a skill you've always wanted to learn but haven't yet?",
  "If you could have dinner with anyone, living or dead, who would it be?",
] as const;

interface SuggestionItemProps {
  suggestion: string;
  onPress: () => void;
  isLast?: boolean;
}

function SuggestionItem({ suggestion, onPress, isLast }: SuggestionItemProps) {
  const borderColor = useThemeColor("border");

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-4  active:opacity-70"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: borderColor }
      }
    >
      <Text className="text-foreground leading-6">{suggestion}</Text>
    </Pressable>
  );
}

interface SuggestionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestion: (suggestion: string) => void;
  suggestions?: string[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SuggestionsSheet({
  isOpen,
  onClose,
  onSelectSuggestion,
  suggestions = [...DEFAULT_SUGGESTIONS],
  isLoading = false,
  onRefresh,
}: SuggestionsSheetProps) {
  const mutedColor = useThemeColor("muted");

  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    onClose();
  };

  return (
    <CustomBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="scrollable"
    >
      <View className="px-4 pt-5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="w-10" />
          <BottomSheet.Title className="text-center">
            Suggestion
          </BottomSheet.Title>
          {onRefresh ? (
            <Pressable
              onPress={onRefresh}
              disabled={isLoading}
              className="w-10 h-10 items-center justify-center active:opacity-70"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw size={20} color={mutedColor} />
              )}
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-4 py-12">
          <Spinner size="lg" />
          <Text className="text-muted-foreground mt-4">
            Generating suggestions...
          </Text>
        </View>
      ) : (
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={`${suggestion.slice(0, 20)}-${index}`}
              suggestion={suggestion}
              onPress={() => handleSelectSuggestion(suggestion)}
              isLast={index === suggestions.length - 1}
            />
          ))}
        </BottomSheetScrollView>
      )}
    </CustomBottomSheet>
  );
}
