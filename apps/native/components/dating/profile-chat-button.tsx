import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { MessageCircleHeart } from "lucide-react-native";
import { useTranslation } from "@/hooks/use-translation";

type ProfileChatButtonProps = {
  profileName: string;
  isLoading: boolean;
  onPress: () => void;
};

export function ProfileChatButton({
  profileName,
  isLoading,
  onPress,
}: ProfileChatButtonProps) {
  const { t } = useTranslation();
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");

  return (
    <View
      style={{
        shadowColor: accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 10,
      }}
    >
      <Button
        size="lg"
        feedbackVariant="scale-ripple"
        animation={{
          scale: { value: 0.97, ignoreScaleCoefficient: true },
          ripple: {
            backgroundColor: { value: "#FFFFFF" },
            opacity: { value: [0, 0.4, 0] },
          },
        }}
        onPress={onPress}
        isDisabled={isLoading}
        className="h-14 overflow-hidden rounded-full border-0"
      >
        <LinearGradient
          colors={[accent, "#A855F7", "#F472B6"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          className="bg-white/10"
        />

        {isLoading ? (
          <Spinner color={accentForeground} size="sm" />
        ) : (
          <>
            <MessageCircleHeart
              size={22}
              color={accentForeground}
              strokeWidth={2.25}
            />
            <Button.Label
              className="text-base font-bold text-accent-foreground"
              pointerEvents="none"
            >
              {t("profile.chatWith", { name: profileName })}
            </Button.Label>
          </>
        )}
      </Button>
    </View>
  );
}
