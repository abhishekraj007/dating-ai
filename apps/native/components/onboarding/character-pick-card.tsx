import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/hooks/use-translation";

type CharacterPickCardProps = {
  name: string;
  tagline: string;
  occupation: string | null;
  avatarUrl: string | null;
  isTrending: boolean;
  selected: boolean;
  onPress: () => void;
};

export function CharacterPickCard({
  name,
  tagline,
  occupation,
  avatarUrl,
  isTrending,
  selected,
  onPress,
}: CharacterPickCardProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 340);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth, opacity: pressed ? 0.92 : 1 },
        selected ? styles.cardSelected : null,
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
          <Text style={styles.badgeText}>{t("onboarding.character.trending")}</Text>
        </View>
      ) : null}
      <View style={styles.meta}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.occupation} numberOfLines={1}>
          {occupation ?? tagline}
        </Text>
        {occupation ? (
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
    backgroundColor: "#111",
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#fff",
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
