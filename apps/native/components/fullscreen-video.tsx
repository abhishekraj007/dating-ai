import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useEventListener } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Spinner } from "heroui-native";
import { useVideoMutePreference } from "@/hooks/use-video-mute-preference";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const CONTROLS_HIDE_DELAY_MS = 2500;
const CONTROLS_FADE_DURATION_MS = 200;
const DISMISS_THRESHOLD = 80;

function useAutoHideControls(initialVisible = true) {
  const [controlsVisible, setControlsVisible] = useState(initialVisible);
  const opacity = useSharedValue(initialVisible ? 1 : 0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showControls = useCallback(() => {
    clearHideTimeout();
    setControlsVisible(true);
    opacity.value = withTiming(1, { duration: CONTROLS_FADE_DURATION_MS });
    hideTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
      opacity.value = withTiming(0, { duration: CONTROLS_FADE_DURATION_MS });
    }, CONTROLS_HIDE_DELAY_MS);
  }, [clearHideTimeout, opacity]);

  useEffect(() => {
    showControls();
    return () => clearHideTimeout();
  }, [clearHideTimeout, showControls]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { controlsVisible, showControls, animatedStyle };
}

interface CenterPlaybackButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  animatedStyle: ReturnType<typeof useAutoHideControls>["animatedStyle"];
  visible: boolean;
}

function CenterPlaybackButton({
  isPlaying,
  onPress,
  animatedStyle,
  visible,
}: CenterPlaybackButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.centerControlContainer, animatedStyle]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        style={styles.centerControlButton}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? (
          <Pause size={32} color="#fff" fill="#fff" />
        ) : (
          <Play
            size={32}
            color="#fff"
            fill="#fff"
            style={styles.playIconOffset}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

interface VideoPosterFrameProps {
  posterUrl?: string;
  isLoading: boolean;
  children?: ReactNode;
}

function VideoPosterFrame({
  posterUrl,
  isLoading,
  children,
}: VideoPosterFrameProps) {
  return (
    <>
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.posterFallback]} />
      )}

      {isLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <Spinner size="md" color="#ffffff" />
        </View>
      ) : null}

      {children}
    </>
  );
}

interface FullscreenVideoProps {
  videoUrl: string;
  posterUrl?: string;
  visible: boolean;
  onClose: () => void;
}

export function FullscreenVideo({
  videoUrl,
  posterUrl,
  visible,
  onClose,
}: FullscreenVideoProps) {
  const insets = useSafeAreaInsets();
  const { isMuted, toggleMuted } = useVideoMutePreference();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const { controlsVisible, showControls, animatedStyle } =
    useAutoHideControls();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dismissOpacity = useSharedValue(1);

  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true;
  });

  useEventListener(player, "playingChange", ({ isPlaying: playing }) => {
    setIsPlaying(playing);
  });

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay") {
      setIsVideoReady(true);
      player.play();
    }
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (!visible) {
      setIsVideoReady(false);
      setIsPlaying(false);
    }
  }, [visible]);

  const finishClose = useCallback(() => {
    player.pause();
    translateX.value = 0;
    translateY.value = 0;
    dismissOpacity.value = 1;
    onClose();
  }, [dismissOpacity, onClose, player, translateX, translateY]);

  const handleClose = useCallback(() => {
    dismissOpacity.value = withTiming(0, { duration: 180 }, () => {
      scheduleOnRN(finishClose);
    });
  }, [dismissOpacity, finishClose]);

  const toggleMute = () => {
    showControls();
    toggleMuted();
  };

  const togglePlayback = useCallback(() => {
    showControls();
    if (player.playing) {
      player.pause();
      return;
    }
    player.play();
  }, [player, showControls]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(15)
    .activeOffsetY(15)
    .onUpdate((event) => {
      translateX.value = Math.max(0, event.translationX);
      translateY.value = Math.max(0, event.translationY);
      const distance = Math.hypot(translateX.value, translateY.value);
      dismissOpacity.value = Math.max(0.35, 1 - distance / 320);
    })
    .onEnd((event) => {
      const swipedRight =
        event.translationX > DISMISS_THRESHOLD &&
        event.translationX > Math.abs(event.translationY);
      const swipedDown =
        event.translationY > DISMISS_THRESHOLD &&
        event.translationY > Math.abs(event.translationX);

      if (swipedRight || swipedDown) {
        translateX.value = withTiming(swipedRight ? screenWidth : 0, {
          duration: 180,
        });
        translateY.value = withTiming(swipedDown ? screenHeight : 0, {
          duration: 180,
        });
        dismissOpacity.value = withTiming(0, { duration: 180 }, () => {
          scheduleOnRN(finishClose);
        });
        return;
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      dismissOpacity.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(showControls)();
  });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dismissOpacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.fullscreenRoot}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[styles.fullscreenContent, containerAnimatedStyle]}
          >
            <View style={styles.mediaContainer}>
              <VideoPosterFrame
                posterUrl={posterUrl}
                isLoading={!isVideoReady}
              />

              <VideoView
                player={player}
                style={[
                  styles.fullscreenVideo,
                  !isVideoReady && styles.hiddenVideo,
                ]}
                contentFit="contain"
                nativeControls={false}
              />
            </View>

            <Animated.View
              style={[
                styles.topControls,
                { top: insets.top + 8 },
                animatedStyle,
              ]}
              pointerEvents={controlsVisible ? "box-none" : "none"}
            >
              <Pressable
                onPress={toggleMute}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={isMuted ? "Unmute video" : "Mute video"}
                hitSlop={8}
              >
                {isMuted ? (
                  <VolumeX size={22} color="#fff" />
                ) : (
                  <Volume2 size={22} color="#fff" />
                )}
              </Pressable>

              <Pressable
                onPress={handleClose}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Close video"
                hitSlop={8}
              >
                <X size={24} color="#fff" />
              </Pressable>
            </Animated.View>

            <CenterPlaybackButton
              isPlaying={isPlaying}
              onPress={togglePlayback}
              animatedStyle={animatedStyle}
              visible={controlsVisible && isVideoReady}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

interface InlineVideoPreviewProps {
  videoUrl?: string;
  posterUrl?: string;
  style?: StyleProp<ViewStyle>;
}

function InlineVideoPreviewLoaded({
  videoUrl,
  posterUrl,
  style,
}: Required<Pick<InlineVideoPreviewProps, "videoUrl">> &
  Omit<InlineVideoPreviewProps, "videoUrl">) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEventListener(player, "statusChange", ({ status }) => {
    setIsVideoReady(status === "readyToPlay");
  });

  const openFullscreen = useCallback(() => {
    player.pause();
    setIsFullscreen(true);
  }, [player]);

  return (
    <>
      <Pressable
        onPress={openFullscreen}
        style={[styles.inlineContainer, style]}
      >
        <VideoPosterFrame posterUrl={posterUrl} isLoading={!isVideoReady} />

        {/* <VideoView
          player={player}
          style={[
            StyleSheet.absoluteFill,
            !isVideoReady && styles.hiddenVideo,
          ]}
          contentFit="cover"
          nativeControls={false}
        /> */}

        {isVideoReady ? (
          <View style={styles.inlineOverlay} pointerEvents="none">
            <View style={styles.inlinePlayButton}>
              <Play
                size={28}
                color="#fff"
                fill="#fff"
                style={styles.playIconOffset}
              />
            </View>
          </View>
        ) : null}
      </Pressable>

      {isFullscreen ? (
        <FullscreenVideo
          videoUrl={videoUrl}
          posterUrl={posterUrl}
          visible={isFullscreen}
          onClose={() => setIsFullscreen(false)}
        />
      ) : null}
    </>
  );
}

export function InlineVideoPreview({
  videoUrl,
  posterUrl,
  style,
}: InlineVideoPreviewProps) {
  if (!videoUrl) {
    return (
      <View style={[styles.inlineContainer, style]}>
        <VideoPosterFrame posterUrl={posterUrl} isLoading />
      </View>
    );
  }

  return (
    <InlineVideoPreviewLoaded
      videoUrl={videoUrl}
      posterUrl={posterUrl}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  fullscreenRoot: {
    flex: 1,
    backgroundColor: "black",
  },
  fullscreenContent: {
    flex: 1,
  },
  mediaContainer: {
    flex: 1,
    position: "relative",
  },
  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  topControls: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centerControlContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  centerControlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  inlineContainer: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  posterFallback: {
    backgroundColor: "#111",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 2,
  },
  hiddenVideo: {
    opacity: 0,
  },
  inlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  inlinePlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  playIconOffset: {
    marginLeft: 3,
  },
});
