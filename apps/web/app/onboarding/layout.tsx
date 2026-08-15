import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { buildPrivatePageMetadata } from "@/lib/public-metadata";

export const metadata = buildPrivatePageMetadata({
  title: "Onboarding",
  description: "Set up your FeelAI account and companion preferences.",
});

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
