import { BottomSheet } from "heroui-native";

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
  snapPoints,
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
        <BottomSheet.Content
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          enableBlurKeyboardOnGesture
          {...(snapPoints ? { snapPoints } : {})}
        >
          {children}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
