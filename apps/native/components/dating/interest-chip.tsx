import { Chip } from "heroui-native";
import {
  Plane,
  Camera,
  Music,
  Dumbbell,
  Book,
  Coffee,
  Palette,
  Code,
  Film,
  Heart,
} from "lucide-react-native";

interface InterestChipProps {
  interest: string;
  variant?: "default" | "selected";
}

const interestIcons: Record<string, any> = {
  Travel: Plane,
  Photography: Camera,
  Music: Music,
  Fitness: Dumbbell,
  Reading: Book,
  Coffee: Coffee,
  Art: Palette,
  Coding: Code,
  Films: Film,
  Fashion: Heart,
  Gaming: Code,
  Technology: Code,
};

export function InterestChip({ interest, variant = "default" }: InterestChipProps) {
  const Icon = interestIcons[interest] || Heart;

  return (
    <Chip
      variant={variant === "selected" ? "primary" : "secondary"}
      color={variant === "selected" ? "accent" : "default"}
      size="sm"
    >
      <Icon size={14} color={variant === "selected" ? "#FFFFFF" : "#666666"} />
      <Chip.Label>{interest}</Chip.Label>
    </Chip>
  );
}

