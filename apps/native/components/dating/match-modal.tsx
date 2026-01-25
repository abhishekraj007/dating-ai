import { View, StyleSheet, Dimensions, Modal } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, Spinner } from "heroui-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  ZoomIn,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import type { ForYouProfile } from "@/hooks/dating/useForYou";

const { width, height } = Dimensions.get("window");

const HEART_COUNT = 18;

type HeartConfig = {
  left: number;
  size: number;
  delayMs: number;
  durationMs: number;
  rotateDeg: number;
};

function FloatingHeart({ config }: { config: HeartConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.delayMs,
      withTiming(1, { duration: config.durationMs }),
    );
  }, [config.delayMs, config.durationMs, progress]);

  const style = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [40, -height * 0.8],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.15, 0.85, 1],
      [0, 0.9, 0.9, 0],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 0.2, 1],
      [0.6, 1, 1.05],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        { translateY },
        { rotate: `${config.rotateDeg}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heart,
        {
          left: config.left,
          bottom: 0,
          width: config.size,
          height: config.size,
        },
        style,
      ]}
    >
      <Heart size={config.size} color="#fb7185" fill="#fb7185" />
    </Animated.View>
  );
}

interface MatchModalProps {
  visible: boolean;
  profile: ForYouProfile | null;
  onClose: () => void;
  onSkipForNow: () => void;
  onStartChatting: () => void;
  isLoading: boolean;
}

export function MatchModal({
  visible,
  profile,
  onClose,
  onSkipForNow,
  onStartChatting,
  isLoading,
}: MatchModalProps) {
  const insets = useSafeAreaInsets();
  const isOpen = visible && !!profile;

  const [heartsActive, setHeartsActive] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHeartsActive(false);
      return;
    }
    setHeartsActive(true);
    const t = setTimeout(() => setHeartsActive(false), 3500);
    return () => clearTimeout(t);
  }, [isOpen]);

  const hearts = useMemo<HeartConfig[]>(() => {
    if (!isOpen) return [];
    return Array.from({ length: HEART_COUNT }).map(() => {
      const size = 18 + Math.round(Math.random() * 22);
      return {
        left: Math.round(Math.random() * (width - size - 24)) + 12,
        size,
        delayMs: Math.round(Math.random() * 900),
        durationMs: 2200 + Math.round(Math.random() * 1400),
        rotateDeg: -20 + Math.round(Math.random() * 40),
      };
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(250)} style={styles.overlay}>
        <LinearGradient
          colors={["#831843", "#581c87", "#1e1b4b"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {heartsActive && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {hearts.map((h, idx) => (
              <FloatingHeart key={idx} config={h} />
            ))}
          </View>
        )}

        <View
          style={[
            styles.container,
            {
              paddingTop: Math.max(insets.top, 16) + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 24,
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.imageWrapper}>
              <Animated.View
                entering={ZoomIn.delay(120).duration(350)}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: profile.avatarUrl ?? undefined }}
                  style={styles.profileImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              </Animated.View>
            </View>

            <Animated.View entering={FadeIn.delay(220).duration(350)}>
              <Text style={styles.matchTitle}>It's a Match!</Text>
              <Text style={styles.matchSubtitle}>
                You and {profile.name} like each other{"\n"}
                What's your next move?
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeIn.delay(350).duration(350)}
            style={styles.buttonsContainer}
          >
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              style={styles.skipButton}
              onPress={onSkipForNow}
            >
              <Button.Label style={styles.skipButtonText}>
                Skip for Now
              </Button.Label>
            </Button>

            <Button
              size="lg"
              className="rounded-full"
              style={styles.chatButton}
              onPress={onStartChatting}
              isDisabled={isLoading}
            >
              {isLoading && <Spinner size="sm" />}
              {!isLoading && (
                <Button.Label style={styles.chatButtonText}>
                  Start Chatting
                </Button.Label>
              )}
            </Button>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 10,
  },
  imageWrapper: {
    transform: [{ rotate: "-6deg" }],
    marginBottom: 28,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 100,
  },
  imageContainer: {
    width: width * 0.6,
    height: width * 0.75,
    borderRadius: 24,
    overflow: "hidden",
    shadowRadius: 32,
    elevation: 100,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  matchTitle: {
    fontSize: 46,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    lineHeight: 52,
    marginBottom: 10,
  },
  matchSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 0,
  },
  buttonsContainer: {
    width: "100%",
    gap: 12,
    paddingBottom: 6,
  },
  skipButton: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  skipButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
  },
  chatButton: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  chatButtonText: {
    color: "#581c87",
    fontWeight: "600",
    fontSize: 18,
  },
  heart: {
    position: "absolute",
  },
});
