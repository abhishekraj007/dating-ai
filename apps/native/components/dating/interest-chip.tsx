import { View, Text } from "react-native";
import { Chip } from "heroui-native";
import {
  Plane,
  Film,
  Music,
  Camera,
  Shirt,
  Book,
  Utensils,
  Dumbbell,
  Gamepad2,
  Palette,
  Heart,
} from "lucide-react-native";

// Map interest names to icons
const interestIcons: Record<string, typeof Plane> = {
  travel: Plane,
  movies: Film,
  music: Music,
  photography: Camera,
  fashion: Shirt,
  reading: Book,
  cooking: Utensils,
  fitness: Dumbbell,
  gaming: Gamepad2,
  art: Palette,
  default: Heart,
};

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
}

export const InterestChip = ({
  interest,
  showIcon = true,
  onRemove,
}: InterestChipProps) => {
  const normalizedInterest = interest.toLowerCase();
  const emoji = interestEmojis[normalizedInterest] || "";

  return (
    <Chip variant="secondary" size="sm">
      <Chip.Label>
        {showIcon && emoji && `${emoji} `}
        {interest}
      </Chip.Label>
    </Chip>
  );
};

