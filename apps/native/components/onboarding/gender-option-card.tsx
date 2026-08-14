import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { useThemeColor } from "heroui-native";
import { Text } from "@/components/ui/text";
import type { GenderPreference } from "@/stores/onboarding-store";
import { GENDER_OPTIONS } from "@/stores/onboarding-store";

type GenderOption = (typeof GENDER_OPTIONS)[number];

type GenderOptionCardProps = {
  option: GenderOption;
  selected: boolean;
  label: string;
  onPress: (value: GenderPreference) => void;
};

export function GenderOptionCard({
  option,
  selected,
  label,
  onPress,
}: GenderOptionCardProps) {
  const accent = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const { width, height } = useWindowDimensions();
  const cardWidth = width - 48;
  const cardHeight = height / 6.4;

  return (
    <Pressable
      onPress={() => onPress(option.value)}
      style={[
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          borderColor: selected ? accent : "transparent",
        },
      ]}
    >
      <Image
        source={option.image}
        style={styles.cardImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.72)"]}
        style={styles.gradient}
      />
      <Text size="xl" weight="bold" style={styles.label}>
        {label}
      </Text>
      {selected ? (
        <View style={[styles.check, { backgroundColor: accent }]}>
          <Check size={14} color={accentForeground} strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  label: {
    position: "absolute",
    bottom: 16,
    left: 16,
    color: "#fff",
  },
  check: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
