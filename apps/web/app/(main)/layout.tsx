import { MainAppShell } from "@/components/main-app-shell";
import { buildPrivatePageMetadata } from "@/lib/public-metadata";

export const metadata = buildPrivatePageMetadata({
  title: "Account",
  description: "Private FeelAI chats, settings, and account pages.",
});

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainAppShell>{children}</MainAppShell>;
}
