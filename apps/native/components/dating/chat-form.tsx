import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { KeyboardComposer } from "@launchhq/react-native-keyboard-composer";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  HelpCircle,
  Lightbulb,
  MessageSquare,
} from "lucide-react-native";
import { useTranslation } from "@/hooks/use-translation";
import { useColorScheme } from "@/lib/use-color-scheme";

const KEYBOARD_COMPOSER_GAP = 10;
const MIN_BOTTOM_PADDING = 16;

function useComposerGradientColors(backgroundColor: string) {
  const { isDarkColorScheme } = useColorScheme();

  if (backgroundColor.startsWith("#")) {
    return [
      `${backgroundColor}00`,
      `${backgroundColor}CC`,
      backgroundColor,
    ] as const;
  }

  return isDarkColorScheme
    ? (["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.82)", "rgb(0, 0, 0)"] as const)
    : ([
        "rgba(255, 255, 255, 0)",
        "rgba(255, 255, 255, 0.82)",
        "rgb(255, 255, 255)",
      ] as const);
}

interface ChatFormProps {
  composerHeight: number;
  onComposerHeightChange: (height: number) => void;
  onFormHeightChange: (height: number) => void;
  onKeyboardHeightChange: (height: number) => void;
  blurTrigger: number;
  isKeyboardOpen: boolean;
  showScrollToBottom: boolean;
  message: string;
  onChangeMessage: (text: string) => void;
  onSend: (text: string) => void;
  onScrollToBottom: () => void;
  onStopResponse: () => void;
  showTypingIndicator: boolean;
  isSending: boolean;
  isRequestingImage: boolean;
  onOpenImageSheet: () => void;
  onStartQuiz: () => void;
  onOpenTopicsSheet: () => void;
  onOpenSuggestionsSheet: () => void;
}

export function ChatForm({
  composerHeight,
  onComposerHeightChange,
  onFormHeightChange,
  onKeyboardHeightChange,
  blurTrigger,
  isKeyboardOpen,
  showScrollToBottom,
  message,
  onChangeMessage,
  onSend,
  onScrollToBottom,
  onStopResponse,
  showTypingIndicator,
  isSending,
  isRequestingImage,
  onOpenImageSheet,
  onStartQuiz,
  onOpenTopicsSheet,
  onOpenSuggestionsSheet,
}: ChatFormProps) {
  const { t } = useTranslation();
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  // const foregroundColor = useThemeColor("foreground");
  const foregroundColorMuted = useThemeColor("muted");
  const backgroundColor = useThemeColor("background");
  const composerGradientColors = useComposerGradientColors(backgroundColor);
  const actionButtonColor = "";
  const bottomOverlayInset = isKeyboardOpen
    ? KEYBOARD_COMPOSER_GAP
    : Math.max(safeAreaBottom, MIN_BOTTOM_PADDING);

  const handleFormLayout = (event: LayoutChangeEvent) => {
    onFormHeightChange(event.nativeEvent.layout.height);
  };

  return (
    <View
      pointerEvents="box-none"
      onLayout={handleFormLayout}
      style={[styles.container, { bottom: -bottomOverlayInset }]}
    >
      {/* {showScrollToBottom ? (
        <View pointerEvents="box-none" style={styles.scrollToBottomContainer}>
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            onPress={onScrollToBottom}
            className="rounded-full"
            style={styles.scrollToBottomButton}
          >
            <ChevronDown size={18} color={foregroundColor} />
          </Button>
        </View>
      ) : null} */}
      <LinearGradient
        pointerEvents="box-none"
        colors={composerGradientColors}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.composerGradient,
          { paddingBottom: bottomOverlayInset },
        ]}
      >
        <View pointerEvents="auto">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.actionsContent}
          >
            <Button
              variant="secondary"
              size="sm"
              onPress={onOpenImageSheet}
              isDisabled={isRequestingImage}
            >
              {isRequestingImage ? (
                <Spinner size="sm" />
              ) : (
                <Camera size={16} color={foregroundColorMuted} />
              )}
              <Button.Label className={actionButtonColor}>
                {t("chat.selfie")}
              </Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={onStartQuiz}
              isDisabled={isSending}
            >
              <HelpCircle size={16} color={foregroundColorMuted} />
              <Button.Label className={actionButtonColor}>
                {t("chat.quiz")}
              </Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={onOpenTopicsSheet}
              isDisabled={isSending}
            >
              <MessageSquare size={16} color={foregroundColorMuted} />
              <Button.Label className={actionButtonColor}>
                {t("chat.topic")}
              </Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={onOpenSuggestionsSheet}
              isDisabled={isSending}
            >
              <Lightbulb size={16} color={foregroundColorMuted} />
              <Button.Label className={actionButtonColor}>
                {t("chat.suggestion")}
              </Button.Label>
            </Button>
          </ScrollView>
          <View style={styles.composerRow}>
            <View
              style={[
                styles.composerWrapper,
                { height: composerHeight, flex: 1 },
              ]}
            >
              <KeyboardComposer
                text={message}
                placeholder={t("chat.typeMessage")}
                onSend={onSend}
                onStop={onStopResponse}
                onChangeText={onChangeMessage}
                onHeightChange={onComposerHeightChange}
                onKeyboardHeightChange={onKeyboardHeightChange}
                isStreaming={showTypingIndicator}
                blurTrigger={blurTrigger}
                editable={!isSending}
                minHeight={48}
                maxHeight={120}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  composerGradient: {
    paddingTop: 16,
  },
  scrollToBottomContainer: {
    position: "absolute",
    right: 8,
    zIndex: 10,
  },
  scrollToBottomButton: {
    width: 32,
    height: 32,
  },
  actionsContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    alignItems: "center",
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
  },
  composerWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
});
