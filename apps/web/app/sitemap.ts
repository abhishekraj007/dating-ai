import type { MetadataRoute } from "next";
import { api, fetchQuery } from "@/lib/convex-client";
import { getSiteUrl } from "@/lib/site";
import { PUBLIC_SEGMENTS } from "@/lib/public-segments";
import { buildPublicProfileHref } from "@/lib/public-profile-routes";
import { PUBLIC_SEO_PAGE_LIST } from "@/lib/public-seo-pages";

const STATIC_LAST_MODIFIED = new Date("2026-05-26T00:00:00.000Z");

const STATIC_PUBLIC_PATHS = [
  "/help",
  "/support",
  "/contact",
  "/privacy",
  "/terms",
  "/llms.txt",
  "/llms-full.txt",
];

export const dynamic = "force-dynamic";

type SitemapProfile = {
  gender: "female" | "male";
  lastModified: number;
  username: string;
};

async function getSitemapProfiles(): Promise<SitemapProfile[]> {
  try {
    return await fetchQuery(
      api.features.ai.queries.getPublicSitemapProfiles,
      {},
    );
  } catch {
    const [girlsProfiles, guysProfiles] = await Promise.all([
      fetchQuery(api.features.ai.queries.getPublicProfiles, {
        gender: "female",
        limit: 500,
      }).catch(() => []),
      fetchQuery(api.features.ai.queries.getPublicProfiles, {
        gender: "male",
        limit: 500,
      }).catch(() => []),
    ]);

    return [...girlsProfiles, ...guysProfiles].flatMap((profile) =>
      profile.username
        ? [
            {
              gender: profile.gender,
              username: profile.username,
              lastModified: profile._creationTime,
            },
          ]
        : [],
    );
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const sitemapProfiles = await getSitemapProfiles();

  const profileEntries = (sitemapProfiles ?? []).flatMap((profile) => {
    const href = buildPublicProfileHref(
      profile.gender === "male" ? "guys" : "girls",
      profile.username,
    );

    return href
      ? [
          {
            url: `${siteUrl}${href}`,
            changeFrequency: "weekly" as const,
            priority: 0.7,
            lastModified: new Date(profile.lastModified),
          },
        ]
      : [];
  });

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
      lastModified: STATIC_LAST_MODIFIED,
    },
    ...Object.values(PUBLIC_SEGMENTS).map((segment) => ({
      url: `${siteUrl}${segment.href}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
      lastModified: STATIC_LAST_MODIFIED,
    })),
    ...PUBLIC_SEO_PAGE_LIST.map((page) => ({
      url: `${siteUrl}${page.path}`,
      changeFrequency: "weekly" as const,
      priority: 0.85,
      lastModified: STATIC_LAST_MODIFIED,
    })),
    ...STATIC_PUBLIC_PATHS.map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "monthly" as const,
      priority: path.startsWith("/llms") ? 0.4 : 0.5,
      lastModified: STATIC_LAST_MODIFIED,
    })),
    ...profileEntries,
  ];
}
