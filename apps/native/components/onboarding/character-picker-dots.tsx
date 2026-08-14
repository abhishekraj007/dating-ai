import { StyleSheet, View } from "react-native";

type CharacterPickerDotsProps = {
  count: number;
  activeIndex: number;
  activeColor: string;
  inactiveColor: string;
};

export function CharacterPickerDots({
  count,
  activeIndex,
  activeColor,
  inactiveColor,
}: CharacterPickerDotsProps) {
  if (count <= 1) {
    return null;
  }

  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.slot}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex ? activeColor : inactiveColor,
                width: index === activeIndex ? 18 : 7,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    paddingBottom: 16,
  },
  slot: {
    width: 18,
    height: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});
