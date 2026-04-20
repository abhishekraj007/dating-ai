import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type PublicProfileCard = {
  _id: string;
  name: string;
  age: number | null;
  avatarUrl: string | null;
  tagline: string;
  interests: string[];
  occupation: string | null;
  zodiacSign: string | null;
};

type CharacterCardProps = {
  profile: PublicProfileCard;
  priority?: boolean;
  isNew?: boolean;
};

export function CharacterCard({
  profile,
  priority = false,
  isNew = false,
}: CharacterCardProps) {
  return (
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
            <h3 className="text-2xl font-semibold tracking-tight">
              {profile.name}
              {profile.age ? (
                <span className="ml-1 text-white/72">{profile.age}</span>
              ) : null}
            </h3>
            <p className="line-clamp-2 text-sm leading-5 text-white/78">
              {profile.tagline}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap gap-2">
              {profile.zodiacSign ? (
                <Badge variant="secondary" className="bg-white/12 text-white">
                  {profile.zodiacSign}
                </Badge>
              ) : null}
              {profile.interests.slice(0, 1).map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="bg-white/12 text-white"
                >
                  {interest}
                </Badge>
              ))}
            </div>

            <Button asChild size="sm" className="rounded-full px-3">
              <Link href="/login">Chat</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
