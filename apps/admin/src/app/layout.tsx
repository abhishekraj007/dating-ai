import type { Metadata } from "next";
import { Geist_Mono, Figtree } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import { LayoutContent } from "@/components/layout-content";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dating AI",
  description: "Dating AI - Date with AIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", figtree.variable)}
    >
      <body className={`${geistMono.variable} font-mono antialiased`}>
        <Providers>
          <TooltipProvider>
            <LayoutContent>{children}</LayoutContent>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
