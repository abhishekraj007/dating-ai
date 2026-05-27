import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { premiumColors } from "@/lib/theme/premium-colors";

const ICON_SIZE = 40;

type PremiumButtonBaseProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  startContent?: ReactNode;
};

type PremiumButtonPillProps = PremiumButtonBaseProps & {
  variant?: "pill";
  size?: "default" | "compact";
};

type PremiumButtonIconProps = PremiumButtonBaseProps & {
  variant: "icon";
};

export type PremiumButtonProps = PremiumButtonPillProps | PremiumButtonIconProps;

export function PremiumButton(props: PremiumButtonProps) {
  const {
    label,
    onPress,
    disabled = false,
    style,
    startContent,
  } = props;

  const isIcon = props.variant === "icon";
  const isCompact = !isIcon && props.size === "compact";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }) => [
        styles.button,
        isIcon && styles.buttonIcon,
        isCompact && styles.buttonCompact,
        style,
        disabled && styles.buttonDisabled,
        !disabled && (pressed || hovered) && styles.buttonActive,
      ]}
    >
      {({ pressed, hovered }) => {
        const colors = pressed
          ? premiumColors.gradientPressed
          : hovered
            ? premiumColors.gradientHover
            : premiumColors.gradient;

        return (
          <LinearGradient
            colors={[...colors]}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradient,
              isIcon && styles.gradientIcon,
              isCompact && styles.gradientCompact,
              !disabled && (pressed || hovered) && styles.gradientActive,
            ]}
          >
            <View style={[styles.content, isIcon && styles.contentIcon]}>
              {startContent}
              {!isIcon ? (
                <Text
                  style={[
                    styles.label,
                    isCompact && styles.labelCompact,
                    disabled && styles.labelDisabled,
                  ]}
                >
                  {label}
                </Text>
              ) : null}
            </View>
          </LinearGradient>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: premiumColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
  buttonCompact: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonActive: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: premiumColors.border,
  },
  gradientIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  gradientCompact: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  gradientActive: {
    borderColor: premiumColors.borderActive,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  contentIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  label: {
    color: premiumColors.foreground,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelDisabled: {
    color: premiumColors.foregroundMuted,
  },
});
