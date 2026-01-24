// Dating AI Hooks
// Custom hooks for managing dating AI state and API calls

export { useAIProfiles, useAIProfile } from "./useAIProfiles";
export {
  useConversations,
  useConversation,
  useConversationByProfile,
  useStartConversation,
} from "./useConversations";
export {
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useClearChat,
} from "./useMessages";
export { useChatScroll } from "./useChatScroll";
export {
  useUserCreatedProfiles,
  useCreateAIProfile,
  useUpdateAIProfile,
  useArchiveAIProfile,
} from "./useUserCreatedProfiles";
export { useRequestChatImage } from "./useImageRequest";
export type { ImageRequestOptions } from "./useImageRequest";
export {
  useForYouProfiles,
  useUserPreferences,
  useSavePreferences,
  useProfileInteraction,
  useLikedProfiles,
  useOnboardingStatus,
} from "./useForYou";
export type {
  GenderPreference,
  InteractionAction,
  UserPreferences,
  ForYouProfile,
} from "./useForYou";
export { useFilterOptions } from "./useFilterOptions";
export type {
  AgeRangeOption,
  GenderOption,
  ZodiacOption,
  InterestOption,
  FilterOptions,
} from "./useFilterOptions";
export { useChatScreen } from "./useChatScreen";
