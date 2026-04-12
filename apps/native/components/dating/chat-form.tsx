import { ScrollView, StyleSheet, View } from "react-native";
import { KeyboardComposer } from "@launchhq/react-native-keyboard-composer";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Camera,
  ChevronDown,
  HelpCircle,
  Lightbulb,
  MessageSquare,
} from "lucide-react-native";
import { useTranslation } from "@/hooks/use-translation";

interface ChatFormProps {
  composerHeight: number;
  onComposerHeightChange: (height: number) => void;
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
  const { bottom } = useSafeAreaInsets();
  const foregroundColor = useThemeColor("foreground");

  return (
    <KeyboardStickyView>
      <View>
        {showScrollToBottom ? (
          <View style={styles.scrollToBottomContainer}>
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
        ) : null}
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0)",
            "rgba(0, 0, 0, 0.8)",
            "rgba(0, 0, 0, 1)",
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.composerContainer,
            {
              paddingBottom: isKeyboardOpen ? 8 : Math.max(bottom, 8),
            },
          ]}
        >
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
                <Camera size={16} color={foregroundColor} />
              )}
              <Button.Label>{t("chat.selfie")}</Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={onStartQuiz}
              isDisabled={isSending}
            >
              <HelpCircle size={16} color={foregroundColor} />
              <Button.Label>{t("chat.quiz")}</Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={onOpenTopicsSheet}
              isDisabled={isSending}
            >
              <MessageSquare size={16} color={foregroundColor} />
              <Button.Label>{t("chat.topic")}</Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={onOpenSuggestionsSheet}
              isDisabled={isSending}
            >
              <Lightbulb size={16} color={foregroundColor} />
              <Button.Label>{t("chat.suggestion")}</Button.Label>
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
        </LinearGradient>
      </View>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  composerContainer: {
    paddingTop: 8,
  },
  scrollToBottomContainer: {
    position: "absolute",
    top: -48,
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
