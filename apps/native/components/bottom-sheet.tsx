import { useEffect, useRef, type FC, type ReactNode } from "react";
import { useWindowDimensions } from "react-native";
import GorhomBottomSheet, {
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { BottomSheet, useThemeColor } from "heroui-native";

interface CustomBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: Array<string | number>;
  scrollBehavior?: "default" | "scrollable";
  keyboardBehavior?: "interactive" | "extend" | "fillParent";
  footerComponent?: FC<BottomSheetFooterProps>;
}

export function CustomBottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints,
  scrollBehavior = "default",
  keyboardBehavior = "interactive",
  footerComponent,
}: CustomBottomSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null);
  const { height } = useWindowDimensions();
  const overlayColor = useThemeColor("overlay");
  const separatorColor = useThemeColor("separator");
  const hasSnapPoints = Boolean(snapPoints?.length);

  useEffect(() => {
    if (scrollBehavior !== "scrollable") {
      return;
    }

    if (!isOpen) {
      sheetRef.current?.close();
      return;
    }

    if (hasSnapPoints) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    sheetRef.current?.expand();
  }, [hasSnapPoints, isOpen, scrollBehavior]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        {scrollBehavior === "scrollable" ? (
          <GorhomBottomSheet
            ref={sheetRef}
            index={-1}
            animateOnMount={false}
            onClose={onClose}
            keyboardBehavior={keyboardBehavior}
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            enableBlurKeyboardOnGesture
            enablePanDownToClose
            enableDynamicSizing={!hasSnapPoints}
            maxDynamicContentSize={hasSnapPoints ? undefined : height * 0.85}
            footerComponent={footerComponent}
            backgroundStyle={{
              backgroundColor: overlayColor,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderCurve: "continuous",
            }}
            handleIndicatorStyle={{ backgroundColor: separatorColor }}
            {...(hasSnapPoints ? { snapPoints } : {})}
          >
            {children}
          </GorhomBottomSheet>
        ) : (
          <BottomSheet.Content
            keyboardBehavior={keyboardBehavior}
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            enableBlurKeyboardOnGesture
            enableDynamicSizing={!snapPoints}
            {...(snapPoints ? { snapPoints } : {})}
          >
            {children}
          </BottomSheet.Content>
        )}
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
