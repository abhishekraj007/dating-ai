import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheet, Button } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
import type { AppLanguage } from "@/lib/i18n";
import { LanguageOptionCard } from "./language-option-card";

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
  const insets = useSafeAreaInsets();

  const isApp = variant === "app";
  const selectedLanguage = isApp ? language : chatLanguage;
  const [draft, setDraft] = useState<AppLanguage>(selectedLanguage);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(selectedLanguage);
  }, [isOpen, selectedLanguage]);

  const title = isApp ? t("account.sheet.title") : t("account.sheet.chatTitle");
  const subtitle = isApp
    ? t("account.sheet.subtitle")
    : t("account.sheet.chatSubtitle");

  const handleSave = () => {
    if (isApp) {
      void setLanguage(draft);
    } else {
      void setChatLanguage(draft);
    }
    onOpenChange(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["75%"]}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full"
        >
          <View className="flex-1 pt-2">
            <View className="gap-1 pb-4">
              <Text className="text-xl font-semibold text-foreground">
                {title}
              </Text>
              <Text className="text-sm text-muted">{subtitle}</Text>
            </View>

            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
            >
              {supportedLanguages.map((item) => (
                <LanguageOptionCard
                  key={item.code}
                  code={item.code}
                  label={item.label}
                  isSelected={draft === item.code}
                  onSelect={setDraft}
                />
              ))}
            </BottomSheetScrollView>

            <View
              className="pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 12) }}
            >
              <Button size="lg" className="w-full" onPress={handleSave}>
                <Button.Label>{t("common.save")}</Button.Label>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
