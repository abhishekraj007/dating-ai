import { useCredits } from "./useCredits";
import { usePurchases } from "@/contexts/purchases-context";
import { isPremiumRequiredError } from "@dating-ai/backend/convex/features/premium/errors";

export { isPremiumRequiredError };

export function useChatPremiumGate() {
  const { isPremium, isLoading } = useCredits();
  const { presentPaywall } = usePurchases();

  const requirePremiumToChat = async () => {
    if (isPremium) {
      return true;
    }

    await presentPaywall();
    return false;
  };

  return {
    isPremium,
    isLoading,
    requirePremiumToChat,
  };
}
