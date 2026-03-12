import { BottomSheet } from "heroui-native";
import { View } from "react-native";

interface CustomBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: string[];
}

export function CustomBottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = ["65%"],
}: CustomBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={snapPoints}>
          <View className="flex-1 px-6 pb-6">{children}</View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
