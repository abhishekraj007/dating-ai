import { useState } from "react";
import { View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import {
  Button,
  Tabs,
  Chip,
  Spinner,
  TextArea,
  TextField,
  Label,
  useThemeColor,
  BottomSheet,
} from "heroui-native";
import { CustomBottomSheet } from "@/components/bottom-sheet";
import { Camera, Sparkles } from "lucide-react-native";

import { useTranslation } from "@/hooks/use-translation";

// Style options matching the backend
const HAIRSTYLE_OPTIONS = [
  "Straight hair",
  "Wavy hair",
  "Curly hair",
  "Bangs",
  "Bob cut",
  "Pixie cut",
  "Ponytails",
  "Shag",
  "Cornrows",
  "Choppy bob",
  "Curtained hair",
  "Asymmetrical lob",
];

const CLOTHING_OPTIONS = [
  "Casual outfit",
  "Formal dress",
  "Swimwear",
  "Athletic wear",
  "Cozy sweater",
  "Summer dress",
  "Evening gown",
  "Streetwear",
  "Business casual",
  "Vintage style",
];

const SCENE_OPTIONS = [
  "Bedroom",
  "Beach",
  "Coffee shop",
  "Park",
  "City street",
  "Restaurant",
  "Gym",
  "Living room",
  "Sunset background",
  "Studio portrait",
];

export interface ImageRequestOptions {
  hairstyle?: string;
  clothing?: string;
  scene?: string;
  description?: string;
}

interface ImageRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: ImageRequestOptions) => void;
  isLoading?: boolean;
  credits?: number;
}

export function ImageRequestSheet({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  credits = 0,
}: ImageRequestSheetProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("hairstyle");
  const [selectedHairstyle, setSelectedHairstyle] = useState<string | null>(
    null,
  );
  const [selectedClothing, setSelectedClothing] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [extraDetails, setExtraDetails] = useState("");
  const accentColor = useThemeColor("accent");
  const accentForegroundColor = useThemeColor("accent-foreground");
  const trimmedExtraDetails = extraDetails.trim();

  const handleSubmit = () => {
    onSubmit({
      hairstyle: selectedHairstyle ?? undefined,
      clothing: selectedClothing ?? undefined,
      scene: selectedScene ?? undefined,
      description: trimmedExtraDetails || undefined,
    });
  };

  const handleReset = () => {
    setSelectedHairstyle(null);
    setSelectedClothing(null);
    setSelectedScene(null);
    setExtraDetails("");
  };

  const hasAnySelection = Boolean(
    selectedHairstyle ||
    selectedClothing ||
    selectedScene ||
    trimmedExtraDetails,
  );

  const renderChipList = (
    options: string[],
    selected: string | null,
    onSelect: (value: string | null) => void,
  ) => (
    <View className="flex-row flex-wrap gap-2 py-4">
      {options.map((option) => (
        <Chip
          key={option}
          size="md"
          variant={selected === option ? "primary" : "secondary"}
          color={selected === option ? "accent" : "default"}
          onPress={() => onSelect(selected === option ? null : option)}
        >
          <Chip.Label>{option}</Chip.Label>
        </Chip>
      ))}
    </View>
  );

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <BottomSheet.Title className="text-center">
            {t("imageRequest.title")}
          </BottomSheet.Title>
          <View className="flex-row items-center gap-1 bg-surface-secondary px-3 py-1.5 rounded-full">
            <Sparkles size={14} color={accentColor} />
            <Text size="sm" variant="accent">
              {t("imageRequest.credits", { count: 5 })}
            </Text>
          </View>
        </View>

        <Text size="sm" variant="muted" className="mb-4">
          {t("imageRequest.subtitle")}
        </Text>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          variant="secondary"
          className="flex-1"
        >
          <Tabs.List className="mb-2">
            <Tabs.ScrollView
              scrollAlign="center"
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-grow justify-center gap-2"
            >
              <Tabs.Indicator />
              <Tabs.Trigger value="hairstyle">
                <Tabs.Label>{t("imageRequest.hairstyle")}</Tabs.Label>
                {selectedHairstyle && (
                  <View className="w-2 h-2 rounded-full bg-accent ml-1" />
                )}
              </Tabs.Trigger>
              <Tabs.Trigger value="clothing">
                <Tabs.Label>{t("imageRequest.clothing")}</Tabs.Label>
                {selectedClothing && (
                  <View className="w-2 h-2 rounded-full bg-accent ml-1" />
                )}
              </Tabs.Trigger>
              <Tabs.Trigger value="scene">
                <Tabs.Label>{t("imageRequest.scene")}</Tabs.Label>
                {selectedScene && (
                  <View className="w-2 h-2 rounded-full bg-accent ml-1" />
                )}
              </Tabs.Trigger>
            </Tabs.ScrollView>
          </Tabs.List>

          <BottomSheetScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <Tabs.Content value="hairstyle">
              {renderChipList(
                HAIRSTYLE_OPTIONS,
                selectedHairstyle,
                setSelectedHairstyle,
              )}
            </Tabs.Content>
            <Tabs.Content value="clothing">
              {renderChipList(
                CLOTHING_OPTIONS,
                selectedClothing,
                setSelectedClothing,
              )}
            </Tabs.Content>
            <Tabs.Content value="scene">
              {renderChipList(SCENE_OPTIONS, selectedScene, setSelectedScene)}
            </Tabs.Content>

            <View className="pt-2">
              <TextField>
                <Label>{t("imageRequest.extraDetailsLabel")}</Label>
                <TextArea
                  value={extraDetails}
                  onChangeText={setExtraDetails}
                  placeholder={t("imageRequest.extraDetailsPlaceholder")}
                  numberOfLines={4}
                  style={{ height: 104 }}
                />
              </TextField>
            </View>
          </BottomSheetScrollView>
        </Tabs>

        {/* Summary & Actions */}
        <View className="pt-4 border-t border-border mt-4">
          {hasAnySelection && (
            <View className="mb-4 gap-3">
              <View className="flex-row flex-wrap gap-2">
                {selectedHairstyle && (
                  <Chip size="sm" variant="soft" color="accent">
                    <Chip.Label>{selectedHairstyle}</Chip.Label>
                  </Chip>
                )}
                {selectedClothing && (
                  <Chip size="sm" variant="soft" color="accent">
                    <Chip.Label>{selectedClothing}</Chip.Label>
                  </Chip>
                )}
                {selectedScene && (
                  <Chip size="sm" variant="soft" color="accent">
                    <Chip.Label>{selectedScene}</Chip.Label>
                  </Chip>
                )}
              </View>
              {trimmedExtraDetails && (
                <View className="rounded-2xl bg-surface-secondary px-4 py-3">
                  <Text size="xs" variant="muted" className="mb-1">
                    {t("imageRequest.extraDetailsLabel")}
                  </Text>
                  <Text size="sm">{trimmedExtraDetails}</Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-row gap-3">
            {hasAnySelection && (
              <Button
                variant="outline"
                // className="flex-1"
                onPress={handleReset}
                isDisabled={isLoading}
              >
                <Button.Label>{t("common.reset")}</Button.Label>
              </Button>
            )}
            <Button
              className="flex-1"
              onPress={handleSubmit}
              isDisabled={isLoading || credits < 5}
            >
              {isLoading ? (
                <Spinner color={accentForegroundColor} size="sm" />
              ) : (
                <>
                  <Camera size={18} color={accentForegroundColor} />
                  <Button.Label>{t("imageRequest.generatePhoto")}</Button.Label>
                </>
              )}
            </Button>
          </View>

          {credits < 5 && (
            <Text size="xs" variant="danger" className="text-center mt-2">
              {t("imageRequest.insufficientCredits")}
            </Text>
          )}
        </View>
      </View>
    </CustomBottomSheet>
  );
}
