import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PremiumProfileImage } from "@/components/public/premium-profile-image";
import { ProfileAvatarSection } from "@/components/public/profile-avatar-section";
import { CharacterCard, type PublicProfileCard } from "@/components/public/character-card";
import { getSegmentConfig, type PublicSegment } from "@/lib/public-segments";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

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
  profileImageKeys?: string[] | null;
  avatarUrl?: string | null;
};

type PublicProfilePageProps = {
  segment: PublicSegment;
  profile: PublicProfileDetails;
  relatedProfiles?: PublicProfileCard[];
};

export function buildPublicProfileFaqs(
  profile: Pick<
    PublicProfileDetails,
    "name" | "occupation" | "interests"
  >,
  segment: PublicSegment,
) {
  return [
    {
      question: `Who is ${profile.name}?`,
      answer: `${profile.name} is a virtual AI ${segment === "guys" ? "boyfriend" : "girlfriend"} companion on FeelAI${profile.occupation ? `, characterized as a ${profile.occupation}` : ""}. You can explore their personality, interests, and start private chat conversations.`,
    },
    {
      question: `What can I chat about with ${profile.name}?`,
      answer: `You can chat about daily life, dating-style romance, shared interests${profile.interests && profile.interests.length > 0 ? ` like ${profile.interests.slice(0, 3).join(", ")}` : ""}, emotional support, or interactive creative roleplay.`,
    },
    {
      question: `How do I start chatting with ${profile.name}?`,
      answer: `Click the Chat button to sign in or create a free account and begin your private conversation.`,
    },
  ];
}

export function PublicProfilePage({
  segment,
  profile,
  relatedProfiles = [],
}: PublicProfilePageProps) {
  const config = getSegmentConfig(segment);
  const placeholderImageUrl = "/placeholder.jpg";
  const categoryLabel = segment === "guys" ? "AI Boyfriends" : "AI Girlfriends";
  const profileFaqs = buildPublicProfileFaqs(profile, segment);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      {/* Profile Hero Card */}
      <section className="flex flex-col gap-6 rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/80 p-5 shadow-sm md:p-8">
        {/* Breadcrumb navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:text-sm"
        >
          <Link
            className="flex items-center gap-1 transition-colors hover:text-foreground"
            href="/"
          >
            <ArrowLeft className="size-3.5" />
            Home
          </Link>
          <span>/</span>
          <Link
            className="transition-colors hover:text-foreground"
            href={config.href}
          >
            {categoryLabel}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{profile.name}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <ProfileAvatarSection
            avatarUrl={profile.avatarUrl}
            name={profile.name}
            aiProfileId={profile._id}
          />

          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Sparkles className="size-3" />
                  AI Character &bull; 18+
                </span>
                {profile.zodiacSign ? (
                  <Badge variant="outline">{profile.zodiacSign}</Badge>
                ) : null}
                {profile.mbtiType ? (
                  <Badge variant="outline">{profile.mbtiType}</Badge>
                ) : null}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-pretty md:text-5xl">
                  {profile.name}
                  {profile.age ? (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {profile.age}
                    </span>
                  ) : null}
                </h1>
                {profile.username ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                ) : null}
                {profile.occupation ? (
                  <p className="mt-1 text-sm font-medium text-foreground/90 md:text-base">
                    {profile.occupation}
                  </p>
                ) : null}
              </div>
            </div>

            {profile.bio ? (
              <div className="space-y-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  About {profile.name}
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-pretty text-muted-foreground md:text-base md:leading-7">
                  {profile.bio}
                </p>
              </div>
            ) : null}

            {profile.personalityTraits &&
            profile.personalityTraits.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Personality
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.personalityTraits.map((trait) => (
                    <Badge key={trait} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {profile.interests && profile.interests.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span>Private, secure, and always-on conversations.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {profile.profileImageKeys && profile.profileImageKeys.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Gallery
          </h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {profile.profileImageKeys.map((imageKey, index) => (
              <div
                key={imageKey}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/70 bg-card"
              >
                <PremiumProfileImage
                  alt={`${profile.name} AI photo ${index + 1}`}
                  fallbackText={profile.name[0]}
                  imageKey={imageKey}
                  placeholderImageUrl={placeholderImageUrl}
                  profileId={profile._id}
                  profileName={profile.name}
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Profile Questions & Answers */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Questions about {profile.name}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {profileFaqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[calc(var(--radius)*1.25)] border border-border/70 bg-card/70 p-5"
            >
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {faq.question}
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground md:text-sm">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Related Companions */}
      {relatedProfiles.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                More {categoryLabel}
              </h2>
              <p className="text-xs text-muted-foreground md:text-sm">
                Discover other AI companions with distinct personalities.
              </p>
            </div>
            <Link
              href={config.href}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline md:text-sm"
            >
              Browse all {categoryLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {relatedProfiles.map((relatedProfile, index) => (
              <CharacterCard
                key={relatedProfile._id}
                isNew={index === 0}
                priority={false}
                profile={relatedProfile}
                segment={segment}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
