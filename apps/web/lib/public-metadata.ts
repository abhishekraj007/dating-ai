import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const DEFAULT_OG_IMAGE = {
  url: "/app-logo.png",
  alt: "FeelAI app logo",
};

export const noIndexRobots = {
  index: false,
  follow: false,
} as const;

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: string;
  image?: string;
};

export function buildPublicPageUrl(path: string) {
  const siteUrl = getSiteUrl();
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

export function buildPublicPageMetadata({
  title,
  description,
  path,
  absoluteTitle,
  image,
}: PublicPageMetadataInput): Metadata {
  const url = buildPublicPageUrl(path);
  const socialTitle = absoluteTitle ?? title;
  const images = image
    ? [{ url: image, alt: title }]
    : [DEFAULT_OG_IMAGE];

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: "FeelAI",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: images.map((item) => item.url),
    },
  };
}

export function buildPrivatePageMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    robots: noIndexRobots,
  };
}
