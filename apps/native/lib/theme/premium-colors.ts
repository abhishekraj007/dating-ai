/**
 * Premium button palette. Keep in sync with `global.css` @theme premium-* tokens.
 */
export const premiumColors = {
  gradient: ["#FFF4C2", "#F5D547", "#E6B800", "#C99400"] as const,
  gradientPressed: ["#E8D4A0", "#D4AF37", "#B8860B", "#8B6914"] as const,
  gradientHover: ["#FFF8DC", "#FFE566", "#F0C814", "#DBA400"] as const,
  foreground: "#1a1200",
  foregroundMuted: "#4a4030",
  shadow: "#E6B800",
  border: "rgba(255,255,255,0.45)",
  borderActive: "rgba(255,255,255,0.25)",
} as const;

export type PremiumColorKey = keyof typeof premiumColors;
