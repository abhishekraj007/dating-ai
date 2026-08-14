import type { PropsWithChildren, ReactElement } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colorKit, useThemeColor } from "heroui-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DetailParallaxScrollProps = PropsWithChildren<{
  headerImage: ReactElement;
  /** Fraction of window height for the cover. Default 0.45. */
  headerHeightRatio?: number;
  contentClassName?: string;
  contentContainerStyle?: ViewStyle;
}>;

export const DETAIL_PARALLAX_HEADER_HEIGHT_RATIO = 0.45;

export const getDetailParallaxHeaderHeight = (
  windowHeight: number,
  ratio = DETAIL_PARALLAX_HEADER_HEIGHT_RATIO,
) => windowHeight * ratio;

export function DetailParallaxScroll({
  children,
  headerImage,
  headerHeightRatio = DETAIL_PARALLAX_HEADER_HEIGHT_RATIO,
  contentClassName = "z-50 -mt-24 overflow-hidden px-4",
  contentContainerStyle,
}: DetailParallaxScrollProps) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const backgroundColor = useThemeColor("background");
  const headerHeight = getDetailParallaxHeaderHeight(
    height,
    headerHeightRatio,
  );
  const transparentBackground = colorKit.setAlpha(backgroundColor, 0).hex();

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollOffset.get(),
      [-headerHeight, 0, headerHeight / 2],
      [1, 1, 0],
    ),
    transform: [
      {
        translateY: interpolate(
          scrollOffset.get(),
          [-headerHeight, 0, headerHeight],
          [-headerHeight / 2, 0, headerHeight * 0.75],
        ),
      },
      {
        scale: interpolate(
          scrollOffset.get(),
          [-headerHeight, 0, headerHeight],
          [2, 1, 1],
        ),
      },
    ],
  }));

  return (
    <Animated.ScrollView
      ref={scrollRef}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[
        { paddingBottom: insets.bottom + 24 },
        contentContainerStyle,
      ]}
    >
      <Animated.View
        className="overflow-hidden"
        style={[{ height: headerHeight }, headerAnimatedStyle]}
      >
        {headerImage}
        <LinearGradient
          colors={[transparentBackground, backgroundColor]}
          style={styles.bottomGradient}
        />
      </Animated.View>
      <View className={contentClassName}>{children}</View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    pointerEvents: "none",
  },
});
