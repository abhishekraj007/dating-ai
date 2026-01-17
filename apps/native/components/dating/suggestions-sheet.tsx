import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Spinner, useThemeColor } from "heroui-native";
import { CustomBottomSheet } from "@/components/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageSquare, RefreshCw } from "lucide-react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import { forwardRef } from "react";

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
}

function SuggestionItem({ suggestion, onPress }: SuggestionItemProps) {
  const borderColor = useThemeColor("border");
  const foregroundColor = useThemeColor("foreground");

  return (
    <Pressable
      onPress={onPress}
      className="py-4 border-b active:opacity-70"
      style={{ borderBottomColor: borderColor }}
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

export const SuggestionsSheet = forwardRef<BottomSheet, SuggestionsSheetProps>(
  (
    {
      isOpen,
      onClose,
      onSelectSuggestion,
      suggestions = [...DEFAULT_SUGGESTIONS],
      isLoading = false,
      onRefresh,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const accentColor = useThemeColor("accent");
    const mutedColor = useThemeColor("muted");

    const handleSelectSuggestion = (suggestion: string) => {
      onSelectSuggestion(suggestion);
      onClose();
    };

    return (
      <CustomBottomSheet
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        snapPoints={["70%"]}
      >
        <View className="flex-1 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="w-10" />
            <Text className="text-lg font-semibold text-foreground text-center">
              Suggestion
            </Text>
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

          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <Spinner size="lg" />
              <Text className="text-muted-foreground mt-4">
                Generating suggestions...
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 32) + 16,
              }}
            >
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={`${suggestion.slice(0, 20)}-${index}`}
                  suggestion={suggestion}
                  onPress={() => handleSelectSuggestion(suggestion)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </CustomBottomSheet>
    );
  }
);

SuggestionsSheet.displayName = "SuggestionsSheet";
