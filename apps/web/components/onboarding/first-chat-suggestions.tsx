"use client";

import { Button } from "@/components/ui/button";

type FirstChatSuggestionsProps = {
  suggestions: string[];
  disabled?: boolean;
  onSelect: (text: string) => void;
};

export function getFirstChatSuggestions() {
  return [
    "Hey, how's your night going?",
    "What are you up to right now?",
    "Tell me something I wouldn't guess about you",
  ];
}

export function FirstChatSuggestions({
  suggestions,
  disabled,
  onSelect,
}: FirstChatSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled}
          className="shrink-0 rounded-full"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
