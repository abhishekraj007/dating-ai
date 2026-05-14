import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store Screenshots - FeelChat",
  description:
    "Export App Store and Google Play marketing screenshots for FeelChat.",
};

export default function StoreScreenshotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
