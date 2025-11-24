import { Button } from "heroui-native";
import { ReactNode } from "react";

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}

export function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <Button
      onPress={onPress}
      variant="tertiary"
      size="sm"
      className="flex-1 flex-col h-auto py-2 gap-1"
    >
      {icon}
      <Button.Label className="text-xs">{label}</Button.Label>
    </Button>
  );
}

