import type { MetadataRoute } from "next";
import { api, fetchQuery } from "@/lib/convex-client";
import { getSiteUrl } from "@/lib/site";
import { PUBLIC_SEGMENTS } from "@/lib/public-segments";
import { buildPublicProfileHref } from "@/lib/public-profile-routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [girlsProfiles, guysProfiles] = await Promise.all([
    fetchQuery(api.features.ai.queries.getPublicProfiles, {
      gender: "female",
      limit: 200,
    }),
    fetchQuery(api.features.ai.queries.getPublicProfiles, {
      gender: "male",
      limit: 200,
    }),
  ]);

  const profileEntries = [
    ...(girlsProfiles ?? []).flatMap((profile) => {
      const href = buildPublicProfileHref("girls", profile.username);
      return href
        ? [
            {
              url: `${siteUrl}${href}`,
              changeFrequency: "daily" as const,
              priority: 0.7,
              lastModified: new Date(),
            },
          ]
        : [];
    }),
    ...(guysProfiles ?? []).flatMap((profile) => {
      const href = buildPublicProfileHref("guys", profile.username);
      return href
        ? [
            {
              url: `${siteUrl}${href}`,
              changeFrequency: "daily" as const,
              priority: 0.7,
              lastModified: new Date(),
            },
          ]
        : [];
    }),
  ];

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
      lastModified: new Date(),
    },
    ...Object.values(PUBLIC_SEGMENTS).map((segment) => ({
      url: `${siteUrl}${segment.href}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
      lastModified: new Date(),
    })),
    ...profileEntries,
  ];
}
