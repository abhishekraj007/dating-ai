// AI Dating Feature
// Exports all AI profile and conversation related functions

// Agent utilities
export {
  buildPersonalityPrompt,
  createAIProfileAgent,
  getVoiceId,
  calculateRelationshipLevel,
  calculateCompatibilityScore,
  DEFAULT_VOICES,
} from "./agent";

// Public queries
export {
  getProfiles,
  getProfile,
  getUserCreatedProfiles,
  getUserConversations,
  getConversation,
  getConversationByProfile,
  getMessages,
} from "./queries";

// Public mutations
export {
  startConversation,
  sendMessage,
  createAIProfile,
  updateAIProfile,
  archiveAIProfile,
  requestSelfie,
} from "./mutations";

