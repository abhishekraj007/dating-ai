import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { getSiteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const interHeading = Inter({subsets:['latin'],variable:'--font-heading'});

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "FeelAI",
    template: "%s | FeelAI",
  },
  description:
    "FeelAI is an AI dating app for immersive AI companions, AI friends, and always-on conversations.",
  keywords: [
    "ai dating",
    "ai companions",
    "ai friends",
    "ai girlfriend",
    "ai boyfriend",
    "ai chat",
    "ai nsfw chats",
  ],
  openGraph: {
    title: "FeelAI",
    description:
      "Discover AI companions built for AI dating, roleplay, and always-on chats.",
    siteName: "FeelAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeelAI",
    description:
      "Discover AI companions built for AI dating, roleplay, and always-on chats.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", roboto.variable, interHeading.variable)} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
