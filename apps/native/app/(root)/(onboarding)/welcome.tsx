import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useTranslation } from "@/hooks/use-translation";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    router.push("/(root)/(onboarding)/languages");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/welcome.png")}
        style={styles.video}
        contentFit="cover"
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)", "rgba(0,0,0,1)"]}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("welcome.title")}</Text>

          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

          <Button size="lg" onPress={handleGetStarted} className="w-full">
            <Button.Label className="font-semibold">
              {t("welcome.cta")}
            </Button.Label>
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
