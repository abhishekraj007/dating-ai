// Client-side exports for the frontend
export {
  ConvexProvider,
  ConvexReactClient,
  useAction,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
export { api } from "./convex/_generated/api";
export type { Doc, Id } from "./convex/_generated/dataModel";

// Constants for filters
export {
  ZODIAC_SIGNS,
  INTERESTS,
  INTEREST_EMOJIS,
  type ZodiacSign,
  type Interest,
} from "./convex/lib/constants";
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageLabel,
  resolveChatLanguage,
  type AppLanguage,
} from "./convex/lib/languages";
