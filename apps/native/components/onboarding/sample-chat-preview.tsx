import { View, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";

type SampleBubble = {
  from: "them" | "you";
  text: string;
  avatarUrl?: string | null;
};

type SampleChatPreviewProps = {
  bubbles: SampleBubble[];
};

export function SampleChatPreview({ bubbles }: SampleChatPreviewProps) {
  return (
    <View style={styles.wrap}>
      {bubbles.map((bubble, index) => {
        const isYou = bubble.from === "you";
        return (
          <Animated.View
            key={`${bubble.from}-${index}`}
            entering={FadeInDown.delay(180 + index * 220).duration(420)}
            style={[styles.row, isYou ? styles.rowYou : styles.rowThem]}
          >
            {!isYou && bubble.avatarUrl ? (
              <Image
                source={{ uri: bubble.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                contentPosition="top"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : null}
            <View style={[styles.bubble, isYou ? styles.bubbleYou : styles.bubbleThem]}>
              <Text style={[styles.text, isYou ? styles.textYou : styles.textThem]}>
                {bubble.text}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "92%",
  },
  rowThem: {
    alignSelf: "flex-start",
  },
  rowYou: {
    alignSelf: "flex-end",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  bubbleThem: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderBottomLeftRadius: 6,
  },
  bubbleYou: {
    backgroundColor: "#fff",
    borderBottomRightRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  textThem: {
    color: "#fff",
  },
  textYou: {
    color: "#111",
  },
});
