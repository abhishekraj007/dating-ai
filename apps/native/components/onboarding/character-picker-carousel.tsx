import { useRef } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { CharacterPickCard } from "@/components/onboarding/character-pick-card";

const CARD_GAP = 14;
const LOOP_COPIES = 3;
const MIDDLE_COPY = 1;

type CharacterPickerItem = {
  _id: string;
  name: string;
  tagline: string;
  occupation: string | null;
  avatarUrl: string | null;
  isTrending: boolean;
};

type CharacterPickerCarouselProps = {
  profiles: CharacterPickerItem[];
  activeIndex: number;
  screenWidth: number;
  onIndexChange: (index: number) => void;
};

function buildLoopedProfiles(profiles: CharacterPickerItem[]) {
  if (profiles.length <= 1) {
    return profiles;
  }
  return Array.from({ length: LOOP_COPIES }, () => profiles).flat();
}

export function CharacterPickerCarousel({
  profiles,
  activeIndex,
  screenWidth,
  onIndexChange,
}: CharacterPickerCarouselProps) {
  const listRef = useRef<FlatList<CharacterPickerItem>>(null);
  const hasPositionedRef = useRef(false);
  const isJumpingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const profilesKey = profiles.map((profile) => profile._id).join("|");
  const profilesKeyRef = useRef(profilesKey);
  const loopedRef = useRef(buildLoopedProfiles(profiles));

  if (profilesKeyRef.current !== profilesKey) {
    profilesKeyRef.current = profilesKey;
    loopedRef.current = buildLoopedProfiles(profiles);
    hasPositionedRef.current = false;
  }

  const count = profiles.length;
  const canLoop = count > 1;
  const cardWidth = Math.min(screenWidth - 96, 340);
  const pageWidth = cardWidth + CARD_GAP;
  const sidePadding = (screenWidth - cardWidth) / 2;
  const looped = loopedRef.current;
  const safeIndex = Math.min(activeIndex, Math.max(count - 1, 0));

  const offsetForIndex = (index: number) => index * pageWidth;

  const realIndexFromOffset = (offsetX: number) => {
    if (pageWidth <= 0 || count === 0) {
      return { rawIndex: 0, realIndex: 0 };
    }
    const rawIndex = Math.round(offsetX / pageWidth);
    const wrapped = ((rawIndex % count) + count) % count;
    return { rawIndex, realIndex: wrapped };
  };

  const jumpToIndex = (index: number, animated: boolean) => {
    isJumpingRef.current = true;
    listRef.current?.scrollToOffset({
      offset: offsetForIndex(index),
      animated,
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isJumpingRef.current || !isDraggingRef.current) {
      return;
    }
    onIndexChange(
      realIndexFromOffset(event.nativeEvent.contentOffset.x).realIndex,
    );
  };

  const wrapToMiddleCopy = (offsetX: number) => {
    if (!canLoop) {
      return;
    }
    const { rawIndex, realIndex } = realIndexFromOffset(offsetX);
    const firstMiddleIndex = MIDDLE_COPY * count;
    if (rawIndex < firstMiddleIndex || rawIndex >= firstMiddleIndex + count) {
      jumpToIndex(firstMiddleIndex + realIndex, false);
    }
  };

  return (
    <FlatList
      ref={listRef}
      data={looped}
      extraData={safeIndex}
      keyExtractor={(item, index) => `${item._id}-${index}`}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={pageWidth}
      snapToAlignment="start"
      disableIntervalMomentum
      initialNumToRender={looped.length}
      windowSize={looped.length}
      contentContainerStyle={[styles.list, { paddingHorizontal: sidePadding }]}
      getItemLayout={(_, index) => ({
        length: pageWidth,
        offset: offsetForIndex(index),
        index,
      })}
      onLayout={() => {
        if (hasPositionedRef.current || !canLoop) {
          return;
        }
        hasPositionedRef.current = true;
        jumpToIndex(count, false);
      }}
      onScrollBeginDrag={() => {
        isDraggingRef.current = true;
      }}
      onScroll={handleScroll}
      onScrollEndDrag={(event) => {
        onIndexChange(
          realIndexFromOffset(event.nativeEvent.contentOffset.x).realIndex,
        );
      }}
      onMomentumScrollEnd={(event) => {
        isDraggingRef.current = false;
        isJumpingRef.current = false;
        wrapToMiddleCopy(event.nativeEvent.contentOffset.x);
      }}
      scrollEventThrottle={16}
      renderItem={({ item, index }) => (
        <View style={[styles.page, { width: pageWidth }]}>
          <CharacterPickCard
            name={item.name}
            tagline={item.tagline}
            occupation={item.occupation}
            avatarUrl={item.avatarUrl}
            isTrending={item.isTrending}
            selected={canLoop ? index % count === safeIndex : index === safeIndex}
            cardWidth={cardWidth}
            onPress={() => {
              const target = canLoop
                ? MIDDLE_COPY * count + (index % count)
                : index;
              jumpToIndex(target, true);
              onIndexChange(index % count);
            }}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    alignItems: "center",
    paddingBottom: 12,
  },
  page: {
    alignItems: "flex-start",
  },
});
