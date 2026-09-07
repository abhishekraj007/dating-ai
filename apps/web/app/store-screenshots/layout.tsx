import { buildPrivatePageMetadata } from "@/lib/public-metadata";

export const metadata = buildPrivatePageMetadata({
  title: "Store Screenshots",
  description:
    "Export App Store and Google Play marketing screenshots for FeelAI.",
});

export default function StoreScreenshotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
