import { buildPrivatePageMetadata } from "@/lib/public-metadata";

export const metadata = buildPrivatePageMetadata({
  title: "Checkout",
  description: "Complete your FeelAI purchase.",
});

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
