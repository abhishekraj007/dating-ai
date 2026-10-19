import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  PressableFeedback,
  cn,
  useThemeColor,
} from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle } from "lucide-react-native";
import { CustomBottomSheet } from "@/components/bottom-sheet";
import { useTranslation } from "@/hooks/use-translation";
import { useVideoDurationPreference } from "@/hooks/dating/useVideoDurationPreference";
import {
  VIDEO_DURATION_OPTIONS,
  videoCreditCost,
  type VideoDuration,
} from "@/lib/video-duration";

type VideoDurationSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VideoDurationSheet({
  isOpen,
  onOpenChange,
}: VideoDurationSheetProps) {
  const { t } = useTranslation();
  const { videoDuration, setVideoDuration } = useVideoDurationPreference();
  const insets = useSafeAreaInsets();
  const accent = useThemeColor("accent");

  const [draft, setDraft] = useState<VideoDuration>(videoDuration);

  useEffect(() => {
    if (isOpen) {
      setDraft(videoDuration);
    }
  }, [isOpen, videoDuration]);

  const handleSave = () => {
    void setVideoDuration(draft);
    onOpenChange(false);
  };

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={() => onOpenChange(false)}>
      <View className="gap-1 pb-4">
        <Text className="text-xl font-semibold text-foreground">
          {t("videoDuration.title")}
        </Text>
        <Text className="text-sm text-muted">
          {t("videoDuration.subtitle")}
        </Text>
      </View>

      <View className="gap-2">
        {VIDEO_DURATION_OPTIONS.map((option) => (
          <PressableFeedback
            key={option}
            onPress={() => setDraft(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: draft === option }}
            className="rounded-4xl"
          >
            <Card
              variant={draft === option ? "secondary" : "default"}
              className={cn(
                "flex-row items-center justify-between rounded-4xl border px-4 py-2.5",
                draft === option ? "border-accent" : "border-transparent",
              )}
            >
              <View>
                <Text className="text-base font-medium text-foreground">
                  {t("imageRequest.durationSeconds", { count: option })}
                </Text>
                <Text className="text-xs text-muted">
                  {t("videoDuration.credits", {
                    count: videoCreditCost(option),
                  })}
                </Text>
              </View>
              {draft === option ? (
                <CheckCircle size={18} color={accent} strokeWidth={2.5} />
              ) : null}
            </Card>
          </PressableFeedback>
        ))}
      </View>

      <View
        className="pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button size="lg" className="w-full" onPress={handleSave}>
          <Button.Label>{t("common.save")}</Button.Label>
        </Button>
      </View>
    </CustomBottomSheet>
  );
}
