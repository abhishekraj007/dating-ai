import { ActivityIndicator, View } from "react-native";

type MediaPlaceholderProps = {
  width: number;
  height: number;
  showSpinner?: boolean;
};

export function MediaPlaceholder({
  width,
  height,
  showSpinner = false,
}: MediaPlaceholderProps) {
  return (
    <View
      style={{ width, height }}
      className="items-center justify-center bg-white/10"
    >
      {showSpinner ? (
        <ActivityIndicator size="large" color="#ec4899" />
      ) : null}
    </View>
  );
}
