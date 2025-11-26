import { useState } from "react";
import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, Tabs, Chip, Spinner, useThemeColor } from "heroui-native";
import { CustomBottomSheet } from "@/components/bottom-sheet";
import { Camera, Sparkles } from "lucide-react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import { forwardRef } from "react";

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
}

interface ImageRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: ImageRequestOptions) => void;
  isLoading?: boolean;
  credits?: number;
}

export const ImageRequestSheet = forwardRef<BottomSheet, ImageRequestSheetProps>(
  ({ isOpen, onClose, onSubmit, isLoading = false, credits = 0 }, ref) => {
    const [activeTab, setActiveTab] = useState("hairstyle");
    const [selectedHairstyle, setSelectedHairstyle] = useState<string | null>(null);
    const [selectedClothing, setSelectedClothing] = useState<string | null>(null);
    const [selectedScene, setSelectedScene] = useState<string | null>(null);
    const accentColor = useThemeColor("accent");
    const accentForegroundColor = useThemeColor("accent-foreground");

    const handleSubmit = () => {
      onSubmit({
        hairstyle: selectedHairstyle ?? undefined,
        clothing: selectedClothing ?? undefined,
        scene: selectedScene ?? undefined,
      });
    };

    const handleReset = () => {
      setSelectedHairstyle(null);
      setSelectedClothing(null);
      setSelectedScene(null);
    };

    const hasAnySelection = selectedHairstyle || selectedClothing || selectedScene;

    const renderChipList = (
      options: string[],
      selected: string | null,
      onSelect: (value: string | null) => void
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
      <CustomBottomSheet
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        snapPoints={["70%"]}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Camera size={24} color={accentColor} />
              <Text size="xl" weight="semibold">Request Photo</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-surface-secondary px-3 py-1.5 rounded-full">
              <Sparkles size={14} color={accentColor} />
              <Text size="sm" variant="accent">
                5 credits
              </Text>
            </View>
          </View>

          <Text size="sm" variant="muted" className="mb-4">
            Customize the photo you want to receive. Each selection is optional.
          </Text>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} variant="pill">
            <Tabs.List className="mb-2">
              <Tabs.ScrollView contentContainerClassName="gap-2">
                <Tabs.Indicator />
                <Tabs.Trigger value="hairstyle">
                  <Tabs.Label>Hairstyle</Tabs.Label>
                  {selectedHairstyle && (
                    <View className="w-2 h-2 rounded-full bg-accent ml-1" />
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger value="clothing">
                  <Tabs.Label>Clothing</Tabs.Label>
                  {selectedClothing && (
                    <View className="w-2 h-2 rounded-full bg-accent ml-1" />
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger value="scene">
                  <Tabs.Label>Scene</Tabs.Label>
                  {selectedScene && (
                    <View className="w-2 h-2 rounded-full bg-accent ml-1" />
                  )}
                </Tabs.Trigger>
              </Tabs.ScrollView>
            </Tabs.List>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
            >
              <Tabs.Content value="hairstyle">
                {renderChipList(
                  HAIRSTYLE_OPTIONS,
                  selectedHairstyle,
                  setSelectedHairstyle
                )}
              </Tabs.Content>
              <Tabs.Content value="clothing">
                {renderChipList(
                  CLOTHING_OPTIONS,
                  selectedClothing,
                  setSelectedClothing
                )}
              </Tabs.Content>
              <Tabs.Content value="scene">
                {renderChipList(SCENE_OPTIONS, selectedScene, setSelectedScene)}
              </Tabs.Content>
            </ScrollView>
          </Tabs>

          {/* Summary & Actions */}
          <View className="pt-4 border-t border-border mt-4">
            {hasAnySelection && (
              <View className="flex-row flex-wrap gap-2 mb-4">
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
            )}

            <View className="flex-row gap-3">
              {hasAnySelection && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onPress={handleReset}
                  isDisabled={isLoading}
                >
                  <Button.Label>Reset</Button.Label>
                </Button>
              )}
              <Button
                className="flex-1"
                onPress={handleSubmit}
                isDisabled={isLoading || credits < 5}
              >
                {isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Camera size={18} color={accentForegroundColor} />
                    <Button.Label>Generate Photo</Button.Label>
                  </>
                )}
              </Button>
            </View>

            {credits < 5 && (
              <Text size="xs" variant="danger" className="text-center mt-2">
                Insufficient credits. You need at least 5 credits.
              </Text>
            )}
          </View>
        </View>
      </CustomBottomSheet>
    );
  }
);

ImageRequestSheet.displayName = "ImageRequestSheet";
