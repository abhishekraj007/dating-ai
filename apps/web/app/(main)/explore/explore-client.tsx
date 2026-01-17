"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAIProfiles } from "@/hooks/use-ai-profiles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Gender = "female" | "male";

interface ExploreClientProps {
  initialProfiles: any[];
}

export function ExploreClient({ initialProfiles }: ExploreClientProps) {
  const router = useRouter();
  const [gender, setGender] = useState<Gender>("female");

  // Use initial data for first render, then hydrate with live data
  const { profiles: liveProfiles, isLoading } = useAIProfiles({
    gender,
    limit: 50,
    excludeExistingConversations: true,
  });

  // Use live data once available, otherwise fall back to initial
  const profiles =
    liveProfiles.length > 0
      ? liveProfiles
      : gender === "female"
        ? initialProfiles
        : [];

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold mb-4">Explore</h1>

        {/* Gender Tabs */}
        <div className="flex gap-2">
          <Button
            variant={gender === "female" ? "default" : "outline"}
            onClick={() => setGender("female")}
            className="flex-1"
          >
            Female
          </Button>
          <Button
            variant={gender === "male" ? "default" : "outline"}
            onClick={() => setGender("male")}
            className="flex-1"
          >
            Male
          </Button>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && profiles.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No profiles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {profiles.map((profile) => (
              <Card
                key={profile._id}
                className="overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary transition-all"
                onClick={() => handleProfileClick(profile._id)}
              >
                <div className="relative aspect-[3/4]">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground">
                        {profile.name[0]}
                      </span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Profile info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="font-semibold truncate">
                      {profile.name}
                      {profile.age ? `, ${profile.age}` : ""}
                    </p>
                    {profile.zodiacSign && (
                      <p className="text-sm text-white/70">
                        {profile.zodiacSign}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
