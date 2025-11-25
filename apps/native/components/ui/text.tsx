import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from "react-native";
import { useThemeColor } from "heroui-native";

type TextVariant =
  | "default"
  | "muted"
  | "accent"
  | "success"
  | "warning"
  | "danger";

type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

type TextWeight = "normal" | "medium" | "semibold" | "bold" | "extrabold";

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
  children: React.ReactNode;
}

const sizeStyles: Record<TextSize, { fontSize: number; lineHeight: number }> = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  "2xl": { fontSize: 24, lineHeight: 32 },
  "3xl": { fontSize: 30, lineHeight: 36 },
  "4xl": { fontSize: 36, lineHeight: 40 },
};

const weightStyles: Record<TextWeight, TextStyle["fontWeight"]> = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

export function Text({
  variant = "default",
  size = "base",
  weight = "normal",
  style,
  children,
  ...props
}: TextProps) {
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");
  const dangerColor = useThemeColor("danger");

  const variantColors: Record<TextVariant, string> = {
    default: foregroundColor,
    muted: mutedColor,
    accent: accentColor,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
  };

  const color = variantColors[variant];
  const sizeStyle = sizeStyles[size];
  const fontWeight = weightStyles[weight];

  return (
    <RNText style={[{ color, fontWeight }, sizeStyle, style]} {...props}>
      {children}
    </RNText>
  );
}
