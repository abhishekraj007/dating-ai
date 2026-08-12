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

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { characters } = useOnboardingCharacters("both", 4);
  const hero = characters[0];
  const stacked = characters.slice(0, 3);

  return (
    <View style={styles.container}>
      <Image
        source={
          hero?.avatarUrl
            ? { uri: hero.avatarUrl }
            : require("@/assets/images/welcome.png")
        }
        style={styles.hero}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={300}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)", "#000"]}
        locations={[0, 0.38, 1]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View>
          <Animated.View entering={FadeIn.duration(500)} style={styles.avatars}>
            {stacked.map((character, index) => (
              <Image
                key={character._id}
                source={
                  character.avatarUrl
                    ? { uri: character.avatarUrl }
                    : require("@/assets/images/welcome.png")
                }
                style={[
                  styles.stackAvatar,
                  { marginLeft: index === 0 ? 0 : -16, zIndex: 3 - index },
                ]}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ))}
          </Animated.View>
          {stacked.length > 0 ? (
            <Text style={styles.online}>
              {stacked.map((character) => character.name).join(", ")}{" "}
              {t("welcome.online")}
            </Text>
          ) : null}
        </View>

        <View style={styles.content}>
          <SampleChatPreview
            bubbles={[
              {
                from: "them",
                text: t("welcome.sample.them"),
                avatarUrl: hero?.avatarUrl,
              },
              { from: "you", text: t("welcome.sample.you") },
              {
                from: "them",
                text: t("welcome.sample.themTwo"),
                avatarUrl: hero?.avatarUrl,
              },
            ]}
          />

          <Animated.View entering={FadeInDown.delay(700).duration(450)}>
            <Text style={styles.title}>{t("welcome.title")}</Text>
            <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(900).duration(450)}>
            <Button
              size="lg"
              onPress={() => router.push("/(root)/(onboarding)/gender")}
              className="w-full"
            >
              <Button.Label className="font-semibold">
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
    height: height * 0.62,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  avatars: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  online: {
    paddingHorizontal: 24,
    marginTop: 10,
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  stackAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#000",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 8,
  },
});
