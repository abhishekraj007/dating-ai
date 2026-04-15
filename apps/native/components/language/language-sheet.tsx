import { BottomSheet, RadioGroup } from "heroui-native";
import { Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

type LanguageSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const LanguageSheet = ({ isOpen, onOpenChange }: LanguageSheetProps) => {
  const { t, language, setLanguage, supportedLanguages } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["65%"]}>
          <View className="gap-4 py-4">
            <View className="gap-1">
              <Text className="text-xl font-semibold text-foreground">
                {t("account.sheet.title")}
              </Text>
              <Text className="text-sm text-muted">
                {t("account.sheet.subtitle")}
              </Text>
            </View>

            <RadioGroup
              value={language}
              onValueChange={(value) => {
                void setLanguage(value as typeof language);
              }}
              className="gap-3"
            >
              {supportedLanguages.map((item) => (
                <RadioGroup.Item key={item.code} value={item.code}>
                  {item.label}
                </RadioGroup.Item>
              ))}
            </RadioGroup>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
