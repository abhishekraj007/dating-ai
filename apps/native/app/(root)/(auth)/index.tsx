import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { useAppleAuth, useGoogleAuth } from "@/lib/betterAuth/oauth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/hooks/use-translation";
import { LanguageSheet } from "@/components/language/language-sheet";

const { height } = Dimensions.get("window");

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language, supportedLanguages } = useTranslation();
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const { signIn: signInWithGoogle, isLoading: isGoogleLoading } =
    useGoogleAuth();
  const { signIn: signInWithApple, isLoading: isAppleLoading } = useAppleAuth();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(root)/(main)");
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleAppleSignIn = async () => {
    await signInWithApple();
  };

  const isLoading = isGoogleLoading || isAppleLoading;

  return (
    <>
      <View style={{ flex: 1 }}>
        <Image
          // source={require("@/assets/images/login-bg.jpeg")}
          source={require("@/assets/images/welcome.png")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          // blurRadius={1}
          cachePolicy="memory-disk"
        />
        {/* Dark overlay */}
        {/* <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        /> */}

        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0.5)",
            "rgba(0,0,0,0.8)",
            "rgba(0,0,0,1)",
          ]}
          locations={[0, 0.5, 0.6, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: height,
          }}
        />

        {/* Close button - absolute positioned at top right */}
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => setIsLanguageSheetOpen(true)}
          style={{
            position: "absolute",
            top: insets.top,
            left: 16,
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: 20,
          }}
        >
          <Text className="text-white text-xs">
            {supportedLanguages.find((item) => item.code === language)?.label ??
              "English"}
          </Text>
        </Button>

        <Button
          variant="tertiary"
          size="sm"
          isIconOnly
          onPress={handleClose}
          style={{
            position: "absolute",
            top: insets.top,
            right: 16,
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: 20,
            width: 40,
            height: 40,
          }}
        >
          <X size={20} color="white" />
        </Button>

        <View
          className={`flex-1 justify-end gap-3 p-6 `}
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="flex-1 justify-end">
            <Text className="font-extrabold text-6xl text-white/90">
              ChatAI
            </Text>
            <Text className="text-white/80">{t("auth.tagline")}</Text>
          </View>
          <View className="w-full gap-4">
            {/* google */}
            <Button
              size="md"
              className="overflow-hidden rounded-full bg-white/20"
              variant="ghost"
              onPress={handleGoogleSignIn}
              isDisabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color="white" />
              <Text className="text-white">{t("auth.continueGoogle")}</Text>
            </Button>
            {/* apple */}
            <Button
              size="md"
              className="overflow-hidden rounded-full bg-white/20"
              variant="ghost"
              onPress={handleAppleSignIn}
              isDisabled={isLoading}
            >
              <Ionicons name="logo-apple" size={20} color={"white"} />
              <Text className="text-white">{t("auth.continueApple")}</Text>
            </Button>
          </View>
          <View className="justify-center gap-1 flex-row flex-wrap items-center ">
            <Text className="text-white/50 text-sm">
              {t("auth.agreePrefix")}
            </Text>
            <Text className="text-white/80 text-xs">{t("auth.terms")}</Text>
            <Text className="text-muted text-sm">{t("auth.and")}</Text>
            <Text className="text-white/80 text-xs">{t("auth.privacy")}</Text>
          </View>
        </View>
      </View>

      <LanguageSheet
        isOpen={isLanguageSheetOpen}
        onOpenChange={setIsLanguageSheetOpen}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </>
  );
}
