import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useTranslation } from "@/hooks/use-translation";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import { SampleChatPreview } from "@/components/onboarding/sample-chat-preview";

const { width, height } = Dimensions.get("window");
const FALLBACK_HERO = require("@/assets/images/onboarding/female.webp");

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { characters } = useOnboardingCharacters("both", 4);
  const hero =
    characters.find((character) => character.avatarUrl) ?? characters[0];
  const stacked = characters
    .filter((character) => character.avatarUrl)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Image
        source={hero?.avatarUrl ? { uri: hero.avatarUrl } : FALLBACK_HERO}
        style={styles.hero}
        contentFit="cover"
        contentPosition="top"
        cachePolicy="memory-disk"
        transition={300}
      />
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.35)",
          "transparent",
          "rgba(0,0,0,0.45)",
          "#000",
        ]}
        locations={[0, 0.18, 0.48, 0.7]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.liveRow}>
          {stacked.map((character, index) => (
            <Image
              key={character._id}
              source={{ uri: character.avatarUrl ?? "" }}
              style={[
                styles.stackAvatar,
                { marginLeft: index === 0 ? 0 : -12, zIndex: 3 - index },
              ]}
              contentFit="cover"
              contentPosition="top"
              cachePolicy="memory-disk"
            />
          ))}
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{t("welcome.live")}</Text>
          </View>
        </Animated.View>

        <View style={styles.content}>
          <SampleChatPreview
            bubbles={[
              { from: "them", text: t("welcome.sample.them") },
              { from: "you", text: t("welcome.sample.you") },
              { from: "them", text: t("welcome.sample.themTwo") },
            ]}
          />

          <Animated.View entering={FadeInDown.delay(640).duration(420)}>
            <Text style={styles.title}>{t("welcome.title")}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(820).duration(420)}>
            <Button
              size="lg"
              onPress={() => router.push("/(root)/(onboarding)/gender")}
              className="w-full"
            >
              <Button.Label className="font-semibold text-accent-foreground">
                {t("welcome.cta")}
              </Button.Label>
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  stackAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#000",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 38,
    letterSpacing: -0.7,
  },
});
