"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useConversationByProfile,
  useStartConversation,
} from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle } from "lucide-react";

interface ProfileClientProps {
  profileId: string;
  initialProfile: any;
}

export function ProfileClient({
  profileId,
  initialProfile,
}: ProfileClientProps) {
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const profile = initialProfile;
  const { conversation } = useConversationByProfile(profileId);
  const { startConversation } = useStartConversation();

  const handleChat = async () => {
    if (!profileId) return;
    setIsStartingChat(true);

    try {
      if (conversation) {
        router.push(`/chat/${conversation._id}`);
      } else {
        const conversationId = await startConversation({
          aiProfileId: profileId as any,
        });
        router.push(`/chat/${conversationId}`);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{profile.name}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Hero Image */}
          <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-6xl font-bold text-muted-foreground">
                  {profile.name[0]}
                </span>
              </div>
            )}
          </div>

          {/* Name and basic info */}
          <div>
            <h2 className="text-2xl font-bold">
              {profile.name}
              {profile.age && (
                <span className="font-normal">, {profile.age}</span>
              )}
            </h2>
            {profile.username && (
              <p className="text-muted-foreground">@{profile.username}</p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {profile.zodiacSign && (
              <Badge variant="secondary">{profile.zodiacSign}</Badge>
            )}
            {profile.occupation && (
              <Badge variant="secondary">{profile.occupation}</Badge>
            )}
            {profile.mbtiType && (
              <Badge variant="secondary">{profile.mbtiType}</Badge>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Relationship Goal */}
          {profile.relationshipGoal && (
            <div>
              <h3 className="font-semibold mb-2">Looking for</h3>
              <p className="text-muted-foreground">
                {profile.relationshipGoal}
              </p>
            </div>
          )}

          {/* Personality Traits */}
          {profile.personalityTraits &&
            profile.personalityTraits.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Personality</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.personalityTraits.map((trait: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {profile.profileImageUrls && profile.profileImageUrls.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.profileImageUrls.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${profile.name} photo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Spacer for fixed button */}
          <div className="h-20" />
        </div>
      </div>

      {/* Fixed Chat Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          className="w-full"
          size="lg"
          onClick={handleChat}
          disabled={isStartingChat}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          {isStartingChat
            ? "Starting..."
            : conversation
              ? "Continue Chat"
              : "Start Chat"}
        </Button>
      </div>
    </div>
  );
}
