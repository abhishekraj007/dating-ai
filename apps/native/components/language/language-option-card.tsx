import { Card, PressableFeedback, cn, useThemeColor } from "heroui-native";
import { Check } from "lucide-react-native";
import { Text } from "react-native";
import type { AppLanguage } from "@/lib/i18n";

type LanguageOptionCardProps = {
  code: AppLanguage;
  label: string;
  isSelected: boolean;
  onSelect: (code: AppLanguage) => void;
};

export function LanguageOptionCard({
  code,
  label,
  isSelected,
  onSelect,
}: LanguageOptionCardProps) {
  const accent = useThemeColor("accent");

  return (
    <PressableFeedback
      onPress={() => onSelect(code)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className="rounded-2xl"
    >
      <Card
        variant={isSelected ? "secondary" : "default"}
        className={cn(
          "flex-row items-center justify-between rounded-2xl border px-4 py-2.5",
          isSelected ? "border-accent" : "border-transparent",
        )}
      >
        <Text className="text-base font-medium text-foreground">{label}</Text>
        {isSelected ? (
          <Check size={18} color={accent} strokeWidth={2.5} />
        ) : null}
      </Card>
    </PressableFeedback>
  );
}
