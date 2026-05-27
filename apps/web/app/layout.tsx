import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import Providers from "@/components/providers";
import { getSiteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "FeelAI",
  category: "AI dating",
  title: {
    default: "FeelAI - AI Dating App for Virtual Companions",
    template: "%s | FeelAI",
  },
  description:
    "FeelAI is an AI dating app for discovering AI girlfriends, AI boyfriends, virtual companions, and immersive AI chat experiences.",
  keywords: [
    "ai dating",
    "ai dating app",
    "ai companions",
    "ai friends",
    "ai girlfriend",
    "ai boyfriend",
    "ai chat",
    "virtual companion",
    "roleplay chat",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FeelAI - AI Dating App for Virtual Companions",
    description:
      "Discover AI girlfriends, AI boyfriends, and virtual companions built for dating, roleplay, and always-on chats.",
    url: "/",
    siteName: "FeelAI",
    type: "website",
    images: [
      {
        url: "/app-logo.png",
        alt: "FeelAI app logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FeelAI - AI Dating App for Virtual Companions",
    description:
      "Discover AI girlfriends, AI boyfriends, and virtual companions built for dating, roleplay, and always-on chats.",
    images: ["/app-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable, interHeading.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
