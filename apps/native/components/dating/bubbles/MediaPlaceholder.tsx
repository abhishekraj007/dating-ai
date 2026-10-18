import { ActivityIndicator, Text, View } from "react-native";

const BUBBLE_ROW_MARGIN_BOTTOM = 12;

export const MEDIA_PREVIEW_SIZE = { width: 250, height: 350 };
export const MEDIA_ROW_HEIGHT =
  MEDIA_PREVIEW_SIZE.height + BUBBLE_ROW_MARGIN_BOTTOM;

type MediaPlaceholderProps = {
  width: number;
  height: number;
  showSpinner?: boolean;
  label?: string;
};

export function MediaPlaceholder({
  width,
  height,
  showSpinner = false,
  label,
}: MediaPlaceholderProps) {
  return (
    <View
      style={{ width, height }}
      className="items-center justify-center bg-white/10"
    >
      {showSpinner ? <ActivityIndicator size="large" color="#ec4899" /> : null}
      {label ? <Text className="mt-3 text-sm text-muted">{label}</Text> : null}
    </View>
  );
}
