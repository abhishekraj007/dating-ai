import { Chip } from "heroui-native";
import { getChipTone } from "@/utils";

// Map interest names to emojis (fallback)
const interestEmojis: Record<string, string> = {
  travel: "\u2708\ufe0f",
  movies: "\ud83c\udfac",
  music: "\ud83c\udfb5",
  photography: "\ud83d\udcf7",
  fashion: "\ud83d\udc57",
  reading: "\ud83d\udcda",
  cooking: "\ud83c\udf73",
  fitness: "\ud83d\udcaa",
  gaming: "\ud83c\udfae",
  art: "\ud83c\udfa8",
};

interface InterestChipProps {
  interest: string;
  showIcon?: boolean;
  onRemove?: () => void;
  colorSeed?: string | number;
}

export const InterestChip = ({
  interest,
  showIcon = true,
  colorSeed,
}: InterestChipProps) => {
  const normalizedInterest = interest.toLowerCase();
  const emoji = interestEmojis[normalizedInterest] || "";
  const tone = getChipTone(colorSeed ?? normalizedInterest);

  return (
    <Chip
      variant="secondary"
      size="sm"
      style={{
        backgroundColor: tone.backgroundColor,
        borderColor: tone.borderColor,
        borderWidth: 0.5,
      }}
    >
      <Chip.Label style={{ color: tone.textColor }}>
        {showIcon && emoji && `${emoji} `}
        {interest}
      </Chip.Label>
    </Chip>
  );
};
