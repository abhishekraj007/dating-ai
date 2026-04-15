import {
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useThemeColor } from "heroui-native";
import { Skeleton } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ForYouSkeletonProps = {
  cardHeight?: number;
};

export function ForYouHeroUISkeleton({ cardHeight }: { cardHeight: number }) {
  const insets = useSafeAreaInsets();
  const bottomPadding =
    Platform.OS === "android" ? Math.max(insets.bottom, 48) : 48;

  return (
    <View className="flex-1 w-full bg-background">
      <View style={styles.cardContainer}>
        <View className="w-full overflow-hidden" style={{ height: cardHeight }}>
          <Skeleton className="h-full w-full rounded-none" />

          <View style={styles.heroSkeletonStatusPillWrap}>
            <Skeleton className="h-3 w-32 rounded-full" />
          </View>

          <View style={styles.heroSkeletonContentWrap}>
            <Skeleton className="h-9 w-40 rounded-xl mb-4" />
            <Skeleton className="h-5 w-[92%] rounded-lg mb-2" />
            <Skeleton className="h-5 w-[76%] rounded-lg mb-5" />

            <View style={styles.heroSkeletonChipRow}>
              <Skeleton className="h-7 w-40 rounded-full" />
              <Skeleton className="h-7 w-32 rounded-full" />
            </View>
            <View style={styles.heroSkeletonChipRow}>
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-36 rounded-full" />
            </View>
          </View>

          <View
            style={[styles.heroSkeletonButtonsRow, { bottom: bottomPadding }]}
          >
            <Skeleton className="h-[72px] w-[72px] rounded-full" />
            <Skeleton className="h-[72px] w-[72px] rounded-full" />
          </View>
        </View>
      </View>
    </View>
  );
}

function SkeletonBlock({
  style,
  color,
  opacity = 0.18,
}: {
  style?: StyleProp<ViewStyle>;
  color: string;
  opacity?: number;
}) {
  return <View style={[style, { backgroundColor: color, opacity }]} />;
}

export function ForYouSkeleton({ cardHeight }: ForYouSkeletonProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const surfaceColor = useThemeColor("surface");
  const borderColor = useThemeColor("border");
  const mutedColor = useThemeColor("muted");

  const resolvedCardHeight = cardHeight ?? height - insets.bottom - 40;
  const actionButtonsBottom =
    Platform.OS === "android" ? Math.max(insets.bottom, 8) : 24;

  return (
    <View className="flex-1 w-full self-stretch bg-background">
      <View style={styles.cardContainer}>
        <View
          className="w-full overflow-hidden"
          style={[
            styles.card,
            {
              height: resolvedCardHeight,
              backgroundColor: surfaceColor,
              borderColor,
            },
          ]}
        >
          <SkeletonBlock
            color={mutedColor}
            opacity={0.28}
            style={styles.statusPill}
          />

          <View style={styles.contentWrap}>
            <SkeletonBlock
              color={mutedColor}
              opacity={0.48}
              style={styles.title}
            />
            <SkeletonBlock
              color={mutedColor}
              opacity={0.36}
              style={styles.bioLineLong}
            />
            <SkeletonBlock
              color={mutedColor}
              opacity={0.36}
              style={styles.bioLineShort}
            />

            <View style={styles.chipRow}>
              <SkeletonBlock
                color={borderColor}
                opacity={1}
                style={[styles.chip, styles.chipWide]}
              />
              <SkeletonBlock
                color={borderColor}
                opacity={1}
                style={[styles.chip, styles.chipMedium]}
              />
            </View>
            <View style={styles.chipRow}>
              <SkeletonBlock
                color={borderColor}
                opacity={1}
                style={[styles.chip, styles.chipNarrow]}
              />
              <SkeletonBlock
                color={borderColor}
                opacity={1}
                style={[styles.chip, styles.chipShort]}
              />
            </View>
          </View>

          <View style={[styles.buttonsRow, { bottom: actionButtonsBottom }]}>
            <View
              style={[
                styles.actionButton,
                styles.leftButton,
                { backgroundColor: surfaceColor, borderColor },
              ]}
            >
              <SkeletonBlock
                color={mutedColor}
                opacity={0.42}
                style={styles.buttonGlyph}
              />
            </View>
            <View
              style={[
                styles.actionButton,
                styles.rightButton,
                { backgroundColor: surfaceColor, borderColor },
              ]}
            >
              <SkeletonBlock
                color={mutedColor}
                opacity={0.42}
                style={styles.buttonGlyph}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSkeletonStatusPillWrap: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  heroSkeletonContentWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 160,
  },
  heroSkeletonChipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  heroSkeletonButtonsRow: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  card: {
    position: "relative",
    width: "100%",
    borderWidth: 1,
  },
  statusPill: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    width: 126,
    height: 12,
    borderRadius: 999,
    zIndex: 1,
  },
  contentWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 160,
  },
  title: {
    height: 34,
    width: "54%",
    borderRadius: 12,
    marginBottom: 16,
  },
  bioLineLong: {
    height: 18,
    width: "92%",
    borderRadius: 10,
    marginBottom: 8,
  },
  bioLineShort: {
    height: 18,
    width: "78%",
    borderRadius: 10,
    marginBottom: 18,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    height: 28,
    borderRadius: 999,
  },
  chipWide: {
    width: 170,
  },
  chipMedium: {
    width: 152,
  },
  chipNarrow: {
    width: 132,
  },
  chipShort: {
    width: 176,
  },
  buttonsRow: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  leftButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  rightButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  buttonGlyph: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
