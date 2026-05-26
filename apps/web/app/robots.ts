import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const PRIVATE_PATHS = [
  "/api/",
  "/chat/",
  "/checkout",
  "/login",
  "/onboarding/",
  "/portal",
  "/profile/",
  "/settings",
  "/store-screenshots/",
];

const DISCOVERY_BOTS = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;

  return {
    rules: [
      ...DISCOVERY_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host,
  };
}
