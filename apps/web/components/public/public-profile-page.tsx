import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { PremiumProfileImage } from "@/components/public/premium-profile-image";
import { getSegmentConfig, type PublicSegment } from "@/lib/public-segments";

type PublicProfileDetails = {
  _id: string;
  name: string;
  gender: "female" | "male";
  age?: number | null;
  username?: string | null;
  bio?: string | null;
  zodiacSign?: string | null;
  occupation?: string | null;
  mbtiType?: string | null;
  relationshipGoal?: string | null;
  personalityTraits?: string[] | null;
  interests?: string[] | null;
  profileImageUrls?: string[] | null;
  avatarUrl?: string | null;
};

type PublicProfilePageProps = {
  segment: PublicSegment;
  profile: PublicProfileDetails;
};

export function PublicProfilePage({
  segment,
  profile,
}: PublicProfilePageProps) {
  const config = getSegmentConfig(segment);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/80 p-5 shadow-sm md:p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link className="transition-colors hover:text-foreground" href="/">
            Home
          </Link>
          <span>/</span>
          <Link
            className="transition-colors hover:text-foreground"
            href={config.href}
          >
            {config.metaTitle}
          </Link>
          <span>/</span>
          <span className="text-foreground">{profile.name}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="relative aspect-[4/5]">
              {profile.avatarUrl ? (
                <Image
                  alt={profile.name}
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 360px"
                  src={profile.avatarUrl}
                  //   unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-6xl font-semibold text-muted-foreground">
                  {profile.name[0]}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div>
                <h1 className="text-4xl text-pretty font-semibold tracking-tight md:text-5xl">
                  {profile.name}
                  {profile.age ? (
                    <span className="ml-2 text-muted-foreground">
                      {profile.age}
                    </span>
                  ) : null}
                </h1>
                {profile.username ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.zodiacSign ? (
                  <Badge variant="outline">{profile.zodiacSign}</Badge>
                ) : null}
                {profile.occupation ? (
                  <Badge variant="outline">{profile.occupation}</Badge>
                ) : null}
                {profile.mbtiType ? (
                  <Badge variant="outline">{profile.mbtiType}</Badge>
                ) : null}
              </div>
            </div>

            {profile.bio ? (
              <p className="max-w-3xl text-base text-pretty  text-muted-foreground">
                {profile.bio}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <OpenAuthModalButton className="min-w-40" size="lg">
                Chat
              </OpenAuthModalButton>
              <OpenAuthModalButton size="lg" variant="outline">
                Save this companion
              </OpenAuthModalButton>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {profile.relationshipGoal ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Looking for</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {profile.relationshipGoal}
            </CardContent>
          </Card>
        ) : null}
        {profile.personalityTraits && profile.personalityTraits.length > 0 ? (
          <Card className="border-border/70 bg-card/90 lg:col-span-2">
            <CardHeader>
              <CardTitle>Personality</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile.personalityTraits.map((trait) => (
                <Badge key={trait} variant="outline">
                  {trait}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </section>

      {profile.interests && profile.interests.length > 0 ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <Badge key={interest} variant="outline">
                {interest}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {profile.profileImageUrls && profile.profileImageUrls.length > 0 ? (
        <section className="space-y-4 pb-4">
          <h2 className="text-2xl font-semibold tracking-tight">Gallery</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profile.profileImageUrls.map((url, index) => (
              <div
                key={url}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/70 bg-card"
              >
                <PremiumProfileImage
                  alt={`${profile.name} photo ${index + 1}`}
                  fallbackText={profile.name[0]}
                  imageUrl={url}
                  profileName={profile.name}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
