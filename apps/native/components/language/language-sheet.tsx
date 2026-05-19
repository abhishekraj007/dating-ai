import { BottomSheet, RadioGroup } from "heroui-native";
import { Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
import type { AppLanguage } from "@/lib/i18n/types";

type LanguageSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "app" | "chat";
};

export const LanguageSheet = ({
  isOpen,
  onOpenChange,
  variant,
}: LanguageSheetProps) => {
  const { t, language, setLanguage, supportedLanguages } = useTranslation();
  const { chatLanguage, setChatLanguage } = useChatLanguage();

  const isApp = variant === "app";
  const selectedLanguage = isApp ? language : chatLanguage;
  const title = isApp
    ? t("account.sheet.title")
    : t("account.sheet.chatTitle");
  const subtitle = isApp
    ? t("account.sheet.subtitle")
    : t("account.sheet.chatSubtitle");

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["65%"]}>
          <View className="gap-4 py-4">
            <View className="gap-1">
              <Text className="text-xl font-semibold text-foreground">
                {title}
              </Text>
              <Text className="text-sm text-muted">{subtitle}</Text>
            </View>

            <RadioGroup
              value={selectedLanguage}
              onValueChange={(value) => {
                const nextLanguage = value as AppLanguage;
                if (isApp) {
                  void setLanguage(nextLanguage);
                  return;
                }
                void setChatLanguage(nextLanguage);
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
