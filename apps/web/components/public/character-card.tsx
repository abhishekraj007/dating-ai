import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildPublicProfileHref } from "@/lib/public-profile-routes";
import type { PublicSegment } from "@/lib/public-segments";

export type PublicProfileCard = {
  _id: string;
  name: string;
  username: string | null;
  age: number | null;
  avatarUrl: string | null;
  tagline: string;
  interests: string[];
  occupation: string | null;
  zodiacSign: string | null;
};

type CharacterCardProps = {
  segment: PublicSegment;
  profile: PublicProfileCard;
  priority?: boolean;
  isNew?: boolean;
};

export function CharacterCard({
  segment,
  profile,
  priority = false,
  isNew = false,
}: CharacterCardProps) {
  const profileHref = buildPublicProfileHref(segment, profile.username);

  const card = (
    <Card className="group border-border/70 bg-card/90 py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-primary/35">
      <div className="relative aspect-[3/4] overflow-hidden">
        {profile.avatarUrl ? (
          <Image
            alt={profile.name}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
            src={profile.avatarUrl}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-5xl font-semibold text-muted-foreground">
            {profile.name[0]}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {isNew ? (
          <Badge className="absolute right-3 top-3 bg-primary/95 text-primary-foreground">
            New
          </Badge>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 space-y-3 p-4 text-white">
          <div className="space-y-1">
            <h3 className="relative z-20 text-[1.05rem] md:text-xl font-semibold tracking-tight">
              {profile.name}
              {profile.age ? (
                <span className="ml-1 text-white/72">{profile.age}</span>
              ) : null}
            </h3>
            <p className="relative z-20 line-clamp-1 md:line-clamp-2 text-sm leading-5 text-white/78">
              {profile.tagline}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );

  if (profileHref) {
    return (
      <Link href={profileHref} aria-label={`View ${profile.name} profile`}>
        {card}
      </Link>
    );
  }

  return card;
}
