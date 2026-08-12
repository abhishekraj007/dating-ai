export const PREMIUM_REQUIRED_ERROR =
  "Premium access required. Please upgrade your account.";

export function isPremiumRequiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Premium access required");
}
