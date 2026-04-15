import { useEffect, useRef, useState } from "react";
import { Keyboard, View } from "react-native";
import {
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetScrollView,
  BottomSheetTextInput,
  useBottomSheet,
} from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import {
  Button,
  Tabs,
  Chip,
  Spinner,
  TextField,
  Label,
  useThemeColor,
  BottomSheet,
  cn,
} from "heroui-native";
import { CustomBottomSheet } from "@/components/bottom-sheet";
import { Camera, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "@/hooks/use-translation";

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

interface ImageRequestSheetContentProps {
  activeTab: string;
  onChangeTab: (value: string) => void;
  selectedHairstyle: string | null;
  onSelectHairstyle: (value: string | null) => void;
  selectedClothing: string | null;
  onSelectClothing: (value: string | null) => void;
  selectedScene: string | null;
  onSelectScene: (value: string | null) => void;
  resetKey: number;
  onExtraDetailsChange: (value: string, hasDetails: boolean) => void;
}

function ImageRequestSheetContent({
  activeTab,
  onChangeTab,
  selectedHairstyle,
  onSelectHairstyle,
  selectedClothing,
  onSelectClothing,
  selectedScene,
  onSelectScene,
  resetKey,
  onExtraDetailsChange,
}: ImageRequestSheetContentProps) {
  const { t } = useTranslation();
  const { snapToIndex } = useBottomSheet();
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const borderColor = useThemeColor("border");
  const surfaceColor = useThemeColor("surface");
  const [extraDetails, setExtraDetails] = useState("");
  const trimmedExtraDetails = extraDetails.trim();

  useEffect(() => {
    setExtraDetails("");
  }, [resetKey]);

  const hasAnySelection = Boolean(
    selectedHairstyle ||
    selectedClothing ||
    selectedScene ||
    trimmedExtraDetails,
  );

  const handleChangeText = (value: string) => {
    setExtraDetails(value);
    onExtraDetailsChange(value, value.trim().length > 0);
  };

  const handleInputFocus = () => {
    snapToIndex(1);
  };

  const handleInputBlur = () => {
    Keyboard.dismiss();
    snapToIndex(0);
  };

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
    <View className="px-4 pt-5">
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

      <Text size="sm" variant="muted" className="mb-3">
        {t("imageRequest.subtitle")}
      </Text>

      <TextField className="mb-4">
        <BottomSheetTextInput
          value={extraDetails}
          onChangeText={handleChangeText}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={t("imageRequest.extraDetailsPlaceholder")}
          placeholderTextColor={mutedColor}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          style={{
            minHeight: 48,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 18,
            borderWidth: 1,
            borderColor,
            backgroundColor: surfaceColor,
            color: foregroundColor,
            fontSize: 16,
          }}
        />
      </TextField>

      <Tabs value={activeTab} onValueChange={onChangeTab} variant="secondary">
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingBottom: 144 }}
        >
          <Tabs.Content value="hairstyle">
            {renderChipList(
              HAIRSTYLE_OPTIONS,
              selectedHairstyle,
              onSelectHairstyle,
            )}
          </Tabs.Content>
          <Tabs.Content value="clothing">
            {renderChipList(
              CLOTHING_OPTIONS,
              selectedClothing,
              onSelectClothing,
            )}
          </Tabs.Content>
          <Tabs.Content value="scene">
            {renderChipList(SCENE_OPTIONS, selectedScene, onSelectScene)}
          </Tabs.Content>

          <View
            className={cn(
              "pt-4 border-border mt-4",
              hasAnySelection ? "border-t " : "",
            )}
          >
            {hasAnySelection && (
              <View className="gap-3">
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
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </Tabs>
    </View>
  );
}

export function ImageRequestSheet({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  credits = 0,
}: ImageRequestSheetProps) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("hairstyle");
  const [selectedHairstyle, setSelectedHairstyle] = useState<string | null>(
    null,
  );
  const [selectedClothing, setSelectedClothing] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [hasExtraDetails, setHasExtraDetails] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const extraDetailsRef = useRef("");
  const hasExtraDetailsRef = useRef(false);
  const accentForegroundColor = useThemeColor("accent-foreground");
  const hasAnySelection = Boolean(
    selectedHairstyle || selectedClothing || selectedScene || hasExtraDetails,
  );

  const handleExtraDetailsChange = (value: string, hasDetails: boolean) => {
    extraDetailsRef.current = value;
    if (hasDetails !== hasExtraDetailsRef.current) {
      hasExtraDetailsRef.current = hasDetails;
      setHasExtraDetails(hasDetails);
    }
  };

  const resetForm = () => {
    setSelectedHairstyle(null);
    setSelectedClothing(null);
    setSelectedScene(null);
    setHasExtraDetails(false);
    hasExtraDetailsRef.current = false;
    extraDetailsRef.current = "";
    setResetKey((k) => k + 1);
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    onSubmit({
      hairstyle: selectedHairstyle ?? undefined,
      clothing: selectedClothing ?? undefined,
      scene: selectedScene ?? undefined,
      description: extraDetailsRef.current.trim() || undefined,
    });
    resetForm();
  };

  const handleReset = () => {
    resetForm();
    Keyboard.dismiss();
  };

  const renderFooter = ({ animatedFooterPosition }: BottomSheetFooterProps) => (
    <BottomSheetFooter
      animatedFooterPosition={animatedFooterPosition}
      bottomInset={bottom}
    >
      <View className="px-4 pt-3 pb-3 border-t border-border bg-overlay">
        <View className="flex-row gap-3">
          {hasAnySelection && (
            <Button
              variant="outline"
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
    </BottomSheetFooter>
  );

  return (
    <CustomBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="scrollable"
      snapPoints={["70%", "92%"]}
      keyboardBehavior="fillParent"
      footerComponent={renderFooter}
    >
      <ImageRequestSheetContent
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        selectedHairstyle={selectedHairstyle}
        onSelectHairstyle={setSelectedHairstyle}
        selectedClothing={selectedClothing}
        onSelectClothing={setSelectedClothing}
        selectedScene={selectedScene}
        onSelectScene={setSelectedScene}
        resetKey={resetKey}
        onExtraDetailsChange={handleExtraDetailsChange}
      />
    </CustomBottomSheet>
  );
}
