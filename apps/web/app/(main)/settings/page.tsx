import type { Metadata } from "next";
import { AccountScreen } from "@/components/settings/account-screen";

export const metadata: Metadata = {
  title: "Account | FeelAI",
  description: "Manage your FeelAI account, billing, and support options.",
};

export default function SettingsPage() {
  return <AccountScreen />;
}
