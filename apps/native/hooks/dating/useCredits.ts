import { api } from "@dating-ai/backend";
import { useQuery } from "convex-helpers/react/cache";

export const CREDIT_COSTS = {
  TEXT_MESSAGE: 1,
  IMAGE_REQUEST: 5,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export function useCredits() {
  const credits = useQuery(api.features.credits.queries.getUserCredits, {});

  const currentCredits = credits?.credits ?? 0;

  const hasEnoughCredits = (action: CreditAction): boolean => {
    return currentCredits >= CREDIT_COSTS[action];
  };

  const getRequiredCredits = (action: CreditAction): number => {
    return CREDIT_COSTS[action];
  };

  return {
    credits: currentCredits,
    isPremium: credits?.isPremium ?? false,
    isLoading: credits === undefined,
    hasEnoughCredits,
    getRequiredCredits,
  };
}
