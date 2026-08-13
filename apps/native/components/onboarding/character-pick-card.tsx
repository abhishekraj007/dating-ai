import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "heroui-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/hooks/use-translation";

type CharacterPickCardProps = {
  name: string;
  tagline: string;
  occupation: string | null;
  avatarUrl: string | null;
  isTrending: boolean;
  selected: boolean;
  cardWidth: number;
  onPress: () => void;
};

export function CharacterPickCard({
  name,
  tagline,
  occupation,
  avatarUrl,
  isTrending,
  selected,
  cardWidth,
  onPress,
}: CharacterPickCardProps) {
  const { t } = useTranslation();
  const accent = useThemeColor("accent");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          opacity: pressed ? 0.92 : 1,
          // borderColor: selected ? accent : "transparent",
        },
      ]}
    >
      <Image
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require("@/assets/images/welcome.png")
        }
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.92)"]}
        locations={[0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      {isTrending ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t("onboarding.character.trending")}
          </Text>
        </View>
      ) : null}
      <View style={styles.meta}>
        <Text weight="extrabold" style={styles.name}>
          {name}
        </Text>
        <Text weight="semibold" style={styles.occupation} numberOfLines={1}>
          {occupation ?? tagline}
        </Text>
        {occupation && tagline && tagline !== occupation ? (
          <Text style={styles.tagline} numberOfLines={2}>
            {tagline}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 460,
    borderRadius: 28,
    overflow: "hidden",
    borderColor: "transparent",
  },
  badge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  meta: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 22,
    gap: 4,
  },
  name: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  occupation: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    fontWeight: "600",
  },
  tagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
