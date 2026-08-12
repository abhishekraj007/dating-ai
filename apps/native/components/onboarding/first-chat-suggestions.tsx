import { ScrollView, StyleSheet, View } from "react-native";
import { Button } from "heroui-native";

export function getFirstChatSuggestions(t: (key: string) => string) {
  return [
    t("chat.firstReply.hey"),
    t("chat.firstReply.whatsUp"),
    t("chat.firstReply.aboutYou"),
  ];
}

type FirstChatSuggestionsProps = {
  suggestions: string[];
  disabled?: boolean;
  onSelect: (text: string) => void;
};

export function FirstChatSuggestions({
  suggestions,
  disabled,
  onSelect,
}: FirstChatSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            size="sm"
            variant="secondary"
            isDisabled={disabled}
            onPress={() => onSelect(suggestion)}
            className="rounded-full"
          >
            <Button.Label>{suggestion}</Button.Label>
          </Button>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
});
