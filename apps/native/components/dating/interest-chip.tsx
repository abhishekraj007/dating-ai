import { Chip } from "heroui-native";
import { useAppTheme } from "@/contexts/app-theme-context";

type SoftTone = {
  backgroundColor: string;
  textColor: string;
};

const LIGHT_TONES: SoftTone[] = [
  { backgroundColor: "#FEE2E2", textColor: "#9F1239" },
  { backgroundColor: "#FFEDD5", textColor: "#9A3412" },
  { backgroundColor: "#FEF3C7", textColor: "#92400E" },
  { backgroundColor: "#D1FAE5", textColor: "#065F46" },
  { backgroundColor: "#CFFAFE", textColor: "#155E75" },
  { backgroundColor: "#DBEAFE", textColor: "#1E3A8A" },
  { backgroundColor: "#E0E7FF", textColor: "#3730A3" },
  { backgroundColor: "#EDE9FE", textColor: "#5B21B6" },
  { backgroundColor: "#FCE7F3", textColor: "#9D174D" },
  { backgroundColor: "#E2E8F0", textColor: "#334155" },
];

const DARK_TONES: SoftTone[] = [
  { backgroundColor: "rgba(244, 63, 94, 0.28)", textColor: "#FECDD3" },
  { backgroundColor: "rgba(249, 115, 22, 0.28)", textColor: "#FED7AA" },
  { backgroundColor: "rgba(245, 158, 11, 0.28)", textColor: "#FDE68A" },
  { backgroundColor: "rgba(16, 185, 129, 0.28)", textColor: "#A7F3D0" },
  { backgroundColor: "rgba(6, 182, 212, 0.28)", textColor: "#A5F3FC" },
  { backgroundColor: "rgba(59, 130, 246, 0.28)", textColor: "#BFDBFE" },
  { backgroundColor: "rgba(99, 102, 241, 0.28)", textColor: "#C7D2FE" },
  { backgroundColor: "rgba(168, 85, 247, 0.28)", textColor: "#E9D5FF" },
  { backgroundColor: "rgba(236, 72, 153, 0.28)", textColor: "#FBCFE8" },
  { backgroundColor: "rgba(148, 163, 184, 0.28)", textColor: "#E2E8F0" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getSoftTone(seed: string | number, isDark: boolean): SoftTone {
  const tones = isDark ? DARK_TONES : LIGHT_TONES;
  const normalized =
    typeof seed === "number" ? seed.toString() : seed.trim().toLowerCase();
  return tones[hashSeed(normalized) % tones.length];
}

interface InterestChipProps {
  interest: string;
  colorSeed?: string | number;
  capitalize?: boolean;
}

function formatLabel(value: string, capitalizeLabel: boolean) {
  if (!capitalizeLabel) {
    return value;
  }

  return value
    .split(/\s+/)
    .map((word) =>
      word.length > 0
        ? `${word.charAt(0).toUpperCase()}${word.slice(1)}`
        : word,
    )
    .join(" ");
}

export function InterestChip({
  interest,
  colorSeed,
  capitalize = false,
}: InterestChipProps) {
  const { isDark } = useAppTheme();
  const tone = getSoftTone(colorSeed ?? interest, isDark);
  const label = formatLabel(interest, capitalize);

  return (
    <Chip
      variant="secondary"
      size="md"
      className="rounded-full px-3.5"
      style={{ backgroundColor: tone.backgroundColor }}
    >
      <Chip.Label
        className="text-sm font-semibold"
        style={{ color: tone.textColor }}
      >
        {label}
      </Chip.Label>
    </Chip>
  );
}
