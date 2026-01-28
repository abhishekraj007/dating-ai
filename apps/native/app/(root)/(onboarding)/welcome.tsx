import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

// TODO: Replace with your actual video URL
const WELCOME_VIDEO_URL =
  "https://videos.pexels.com/video-files/3571264/3571264-uhd_1440_2560_30fps.mp4";

export default function WelcomeScreen() {
  const router = useRouter();

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
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Find your new AI bestfriend & more!</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Feeling alone? You’re not the only one. Come meet characters who
            actually listen and understand you.
          </Text>

          {/* Button */}
          <Button size="lg" onPress={handleGetStarted} className="w-full">
            <Button.Label className="font-semibold">Get Started</Button.Label>
          </Button>
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
