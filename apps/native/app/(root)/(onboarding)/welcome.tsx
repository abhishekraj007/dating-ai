import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { LanguageSheet } from "@/components/language/language-sheet";

const { width, height } = Dimensions.get("window");

// TODO: Replace with your actual video URL
const WELCOME_VIDEO_URL =
  "https://videos.pexels.com/video-files/3571264/3571264-uhd_1440_2560_30fps.mp4";

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, language, supportedLanguages } = useTranslation();
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);

  // Create video player with loop and autoplay
  //   const player = useVideoPlayer(WELCOME_VIDEO_URL, (player) => {
  //     player.loop = true;
  //     player.muted = true;
  //     player.play();
  //   });

  const handleGetStarted = () => {
    router.push("/(root)/(onboarding)/gender");
  };

  return (
    <View style={styles.container}>
      {/* Background Video */}
      {/* <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      /> */}
      <Image
        source={require("@/assets/images/welcome.png")}
        style={styles.video}
        contentFit="cover"
      />

      {/* Gradient Overlay at bottom */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)", "rgba(0,0,0,1)"]}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      />

      {/* Content */}
      <View style={styles.languageButtonWrapper}>
        <Button
          variant="ghost"
          size="sm"
          className="bg-black/45 rounded-full"
          onPress={() => setIsLanguageSheetOpen(true)}
        >
          {supportedLanguages.find((item) => item.code === language)?.label ??
            "English"}
        </Button>
      </View>

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{t("welcome.title")}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

          {/* Button */}
          <Button size="lg" onPress={handleGetStarted} className="w-full">
            <Button.Label className="font-semibold">
              {t("welcome.cta")}
            </Button.Label>
          </Button>
        </View>
      </SafeAreaView>

      <LanguageSheet
        isOpen={isLanguageSheetOpen}
        onOpenChange={setIsLanguageSheetOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.5,
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  languageButtonWrapper: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
  },
});
