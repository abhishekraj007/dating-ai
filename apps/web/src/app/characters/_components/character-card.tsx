"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { AIProfile } from "../_hooks/use-character-edit";

interface CharacterCardProps {
  profile: AIProfile;
  onEdit: (profile: AIProfile) => void;
}

export function CharacterCard({ profile, onEdit }: CharacterCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              className="object-cover position-top"
              src={profile.avatarUrl ?? undefined}
            />
            <AvatarFallback>
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{profile.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{profile.gender === "female" ? "♀" : "♂"}</span>
              {profile.age && <span>{profile.age}</span>}
              {profile.zodiacSign && <span>• {profile.zodiacSign}</span>}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(profile)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {profile.occupation && (
        <p className="text-sm text-muted-foreground mb-2">
          {profile.occupation}
        </p>
      )}

      {profile.bio && (
        <p className="text-sm line-clamp-2 mb-3">{profile.bio}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {profile.interests?.slice(0, 3).map((interest) => (
            <Badge key={interest} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
          {(profile.interests?.length ?? 0) > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(profile.interests?.length ?? 0) - 3}
            </Badge>
          )}
        </div>
        <Badge variant={profile.status === "active" ? "default" : "secondary"}>
          {profile.status}
        </Badge>
      </div>

      {profile.profileImageUrls.length > 0 && (
        <div className="flex gap-1 mt-3">
          {profile.profileImageUrls.slice(0, 4).map((url, i) => (
            <div key={i} className="w-12 h-12 rounded overflow-hidden bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {profile.profileImageUrls.length > 4 && (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
              +{profile.profileImageUrls.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
