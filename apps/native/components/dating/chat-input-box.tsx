import { View, TextInput, Platform, Pressable } from "react-native";
import { Button, useThemeColor } from "heroui-native";
import { Plus, ArrowUp } from "lucide-react-native";
import { useRef } from "react";

interface ChatInputBoxProps {
  message: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachmentPress?: () => void;
  isSending?: boolean;
  placeholder?: string;
}

export function ChatInputBox({
  message,
  onChangeText,
  onSend,
  onAttachmentPress,
  isSending = false,
  placeholder = "Type a message ...",
}: ChatInputBoxProps) {
  const mutedColor = useThemeColor("muted");
  const surfaceColor = useThemeColor("surface");
  const foregroundColor = useThemeColor("foreground");
  const inputRef = useRef<TextInput>(null);

  const canSend = message.trim().length > 0 && !isSending;

  return (
    <View className="flex-row items-end px-4 py-3 border-t border-border gap-3">
      {/* Attachment button */}
      <Pressable
        onPress={onAttachmentPress}
        className="mb-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Plus size={28} color={mutedColor} />
      </Pressable>

      {/* Input box with send button inside */}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "flex-end",
          backgroundColor: surfaceColor,
          borderRadius: 24,
          paddingLeft: 16,
          paddingRight: 6,
          paddingVertical: 6,
          minHeight: 48,
        }}
      >
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          placeholderTextColor={mutedColor}
          value={message}
          onChangeText={onChangeText}
          onSubmitEditing={canSend ? onSend : undefined}
          blurOnSubmit={false}
          returnKeyType="default"
          multiline
          textAlignVertical="center"
          style={{
            flex: 1,
            color: foregroundColor,
            fontSize: 16,
            lineHeight: 22,
            paddingTop: Platform.OS === "ios" ? 8 : 6,
            paddingBottom: Platform.OS === "ios" ? 8 : 6,
            maxHeight: 120,
          }}
        />

        {/* Send button inside input */}
        <Button
          size="sm"
          isIconOnly
          className="rounded-full ml-2"
          onPress={onSend}
          isDisabled={!canSend}
          style={{ width: 36, height: 36 }}
        >
          <ArrowUp size={20} color="white" />
        </Button>
      </View>
    </View>
  );
}
