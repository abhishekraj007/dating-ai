import { AccountScreen } from "@/components/settings/account-screen";
import { buildPrivatePageMetadata } from "@/lib/public-metadata";

export const metadata = buildPrivatePageMetadata({
  title: "Account",
  description: "Manage your FeelAI account, billing, and support options.",
});

export default function SettingsPage() {
  return <AccountScreen />;
}
