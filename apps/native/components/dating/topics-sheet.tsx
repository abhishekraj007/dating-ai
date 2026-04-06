import { View, Pressable, ScrollView } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { BottomSheet, useThemeColor } from "heroui-native";
import { CustomBottomSheet } from "@/components/bottom-sheet";
import {
  Plane,
  Palette,
  Utensils,
  BookOpen,
  Film,
  Music,
  Heart,
  Briefcase,
  Gamepad2,
  Leaf,
  Camera,
  Dumbbell,
  type LucideIcon,
} from "lucide-react-native";

// Conversation topic categories
export const CONVERSATION_TOPICS = [
  {
    id: "travel",
    label: "Travel Experiences",
    icon: Plane,
    prompt:
      "Let's talk about travel! Tell me about your favorite destinations or dream trips.",
  },
  {
    id: "hobbies",
    label: "Hobbies and Interests",
    icon: Palette,
    prompt: "I'd love to know more about your hobbies and interests!",
  },
  {
    id: "food",
    label: "Food and Cuisine",
    icon: Utensils,
    prompt: "Let's chat about food?",
  },
  {
    id: "books",
    label: "Books and Literature",
    icon: BookOpen,
    prompt: "Do you enjoy reading?",
  },
  {
    id: "movies",
    label: "Movies and TV Shows",
    icon: Film,
    prompt: "What movies or TV shows have you been watching lately?",
  },
  {
    id: "music",
    label: "Music and Concerts",
    icon: Music,
    prompt: "Tell me about your music taste! Any favorite artists or genres?",
  },
  {
    id: "relationships",
    label: "Relationships and Dating",
    icon: Heart,
    prompt: "What are you looking for in a relationship?",
  },
  {
    id: "career",
    label: "Career and Ambitions",
    icon: Briefcase,
    prompt: "I'm curious about your career and goals. What drives you?",
  },
  {
    id: "gaming",
    label: "Gaming and Entertainment",
    icon: Gamepad2,
    prompt: "Are you into gaming? What games do you enjoy?",
  },
  {
    id: "wellness",
    label: "Health and Wellness",
    icon: Leaf,
    prompt: "How do you take care of yourself? Any wellness routines?",
  },
  {
    id: "photography",
    label: "Photography and Art",
    icon: Camera,
    prompt: "Do you enjoy photography or any form of art?",
  },
  {
    id: "fitness",
    label: "Fitness and Sports",
    icon: Dumbbell,
    prompt: "Are you into fitness or sports? What activities do you enjoy?",
  },
] as const;

export type TopicId = (typeof CONVERSATION_TOPICS)[number]["id"];

interface TopicItemProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

function TopicItem({ icon: Icon, label, onPress }: TopicItemProps) {
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const borderColor = useThemeColor("border");

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-4 border-b active:opacity-70"
      style={{ borderBottomColor: borderColor }}
    >
      <Icon size={20} color={accentColor} />
      <Text className="flex-1 text-foreground">{label}</Text>
    </Pressable>
  );
}

interface TopicsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: (typeof CONVERSATION_TOPICS)[number]) => void;
}

export function TopicsSheet({
  isOpen,
  onClose,
  onSelectTopic,
}: TopicsSheetProps) {
  const handleSelectTopic = (topic: (typeof CONVERSATION_TOPICS)[number]) => {
    onSelectTopic(topic);
    onClose();
  };

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-1 px-4">
        <BottomSheet.Title className="text-center">Topics</BottomSheet.Title>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {CONVERSATION_TOPICS.map((topic) => (
            <TopicItem
              key={topic.id}
              icon={topic.icon}
              label={topic.label}
              onPress={() => handleSelectTopic(topic)}
            />
          ))}
        </ScrollView>
      </View>
    </CustomBottomSheet>
  );
}
