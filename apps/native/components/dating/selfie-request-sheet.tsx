import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import { Button, Card, Chip } from "heroui-native";
import { X, Camera } from "lucide-react-native";

interface SelfieRequestSheetProps {
  visible: boolean;
  onClose: () => void;
  onRequest: (options: SelfieStyleOptions) => void;
  creditCost?: number;
}

export interface SelfieStyleOptions {
  hairstyle?: string;
  clothing?: string;
  scene?: string;
}

const HAIRSTYLES = [
  "Long flowing hair",
  "Short bob",
  "Curly hair",
  "Ponytail",
  "Braided",
  "Messy bun",
  "Straight",
  "Wavy",
];

const CLOTHING = [
  "Casual outfit",
  "Elegant dress",
  "Business attire",
  "Sportswear",
  "Beach wear",
  "Winter coat",
  "Summer dress",
  "Hoodie",
];

const SCENES = [
  "Cozy cafe",
  "Beach sunset",
  "City street",
  "Home interior",
  "Park",
  "Mountain view",
  "Night club",
  "Gym",
];

export function SelfieRequestSheet({
  visible,
  onClose,
  onRequest,
  creditCost = 5,
}: SelfieRequestSheetProps) {
  const [activeTab, setActiveTab] = useState<"hairstyle" | "clothing" | "scene">("hairstyle");
  const [selectedHairstyle, setSelectedHairstyle] = useState<string | undefined>();
  const [selectedClothing, setSelectedClothing] = useState<string | undefined>();
  const [selectedScene, setSelectedScene] = useState<string | undefined>();

  const handleRequest = () => {
    onRequest({
      hairstyle: selectedHairstyle,
      clothing: selectedClothing,
      scene: selectedScene,
    });
    onClose();
    // Reset selections
    setSelectedHairstyle(undefined);
    setSelectedClothing(undefined);
    setSelectedScene(undefined);
  };

  const hasSelections = selectedHairstyle || selectedClothing || selectedScene;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-background rounded-t-3xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">
              Request a Selfie
            </Text>
            <Button
              onPress={onClose}
              variant="ghost"
              isIconOnly
              size="sm"
            >
              <Button.Label>
                <X size={20} color="#666666" />
              </Button.Label>
            </Button>
          </View>

          {/* Tabs */}
          <View className="flex-row gap-2 px-4 py-3 border-b border-border">
            <Button
              onPress={() => setActiveTab("hairstyle")}
              variant={activeTab === "hairstyle" ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
            >
              <Button.Label>Hairstyle</Button.Label>
            </Button>
            <Button
              onPress={() => setActiveTab("clothing")}
              variant={activeTab === "clothing" ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
            >
              <Button.Label>Clothing</Button.Label>
            </Button>
            <Button
              onPress={() => setActiveTab("scene")}
              variant={activeTab === "scene" ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
            >
              <Button.Label>Scene</Button.Label>
            </Button>
          </View>

          {/* Content */}
          <ScrollView className="max-h-96">
            <View className="p-4">
              {activeTab === "hairstyle" && (
                <View className="flex-row flex-wrap gap-2">
                  {HAIRSTYLES.map((style) => (
                    <Chip
                      key={style}
                      variant={selectedHairstyle === style ? "primary" : "secondary"}
                      onPress={() => setSelectedHairstyle(style)}
                    >
                      <Chip.Label>{style}</Chip.Label>
                    </Chip>
                  ))}
                </View>
              )}

              {activeTab === "clothing" && (
                <View className="flex-row flex-wrap gap-2">
                  {CLOTHING.map((item) => (
                    <Chip
                      key={item}
                      variant={selectedClothing === item ? "primary" : "secondary"}
                      onPress={() => setSelectedClothing(item)}
                    >
                      <Chip.Label>{item}</Chip.Label>
                    </Chip>
                  ))}
                </View>
              )}

              {activeTab === "scene" && (
                <View className="flex-row flex-wrap gap-2">
                  {SCENES.map((location) => (
                    <Chip
                      key={location}
                      variant={selectedScene === location ? "primary" : "secondary"}
                      onPress={() => setSelectedScene(location)}
                    >
                      <Chip.Label>{location}</Chip.Label>
                    </Chip>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Preview */}
          {hasSelections && (
            <Card className="mx-4 mt-2 p-3 bg-muted">
              <Text className="text-xs text-muted-foreground mb-2">Selected options:</Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedHairstyle && (
                  <Chip size="sm" variant="primary">
                    <Chip.Label>{selectedHairstyle}</Chip.Label>
                  </Chip>
                )}
                {selectedClothing && (
                  <Chip size="sm" variant="primary">
                    <Chip.Label>{selectedClothing}</Chip.Label>
                  </Chip>
                )}
                {selectedScene && (
                  <Chip size="sm" variant="primary">
                    <Chip.Label>{selectedScene}</Chip.Label>
                  </Chip>
                )}
              </View>
            </Card>
          )}

          {/* Action Button */}
          <View className="px-4 py-4">
            <Button
              onPress={handleRequest}
              variant="primary"
              size="lg"
              isDisabled={!hasSelections}
              className="flex-row items-center justify-center gap-2"
            >
              <Button.Label>
                <Camera size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">
                  Request Selfie ({creditCost} credits)
                </Text>
              </Button.Label>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

