import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import { LayoutContent } from "@/components/layout-content";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistMono.variable} font-mono antialiased`}>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
