"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, X, ImagePlus, Loader2 } from "lucide-react";
import { GalleryUpload } from "@/components/gallery-upload";
import type {
  AIProfile,
  CharacterFormData,
} from "../_hooks/use-character-edit";

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

interface EditCharacterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AIProfile | null;
  formData: CharacterFormData;
  onFormChange: (data: CharacterFormData) => void;
  newInterest: string;
  onNewInterestChange: (value: string) => void;
  onAddInterest: () => void;
  onRemoveInterest: (interest: string) => void;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  isUploadingGallery: boolean;
  deletingImageKey: string | null;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteImage: (key: string, type: "avatar" | "gallery") => void;
  onSave: () => void;
  onClose: () => void;
}

export function EditCharacterSheet({
  isOpen,
  onOpenChange,
  profile,
  formData,
  onFormChange,
  newInterest,
  onNewInterestChange,
  onAddInterest,
  onRemoveInterest,
  isSaving,
  isUploadingAvatar,
  isUploadingGallery,
  deletingImageKey,
  avatarInputRef,
  galleryInputRef,
  onAvatarUpload,
  onGalleryUpload,
  onDeleteImage,
  onSave,
  onClose,
}: EditCharacterSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 h-full"
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Edit Character</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-6">
            {/* Avatar Preview */}
            {profile && (
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      className="object-cover position-top"
                      src={profile.avatarUrl ?? undefined}
                    />
                    <AvatarFallback className="text-2xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarUpload}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                  </Button>
                  {profile.avatarImageKey && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-0 right-0 h-6 w-6 rounded-full"
                      onClick={() =>
                        onDeleteImage(profile.avatarImageKey!, "avatar")
                      }
                      disabled={deletingImageKey === profile.avatarImageKey}
                    >
                      {deletingImageKey === profile.avatarImageKey ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  onFormChange({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) =>
                  onFormChange({ ...formData, age: e.target.value })
                }
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: "female" | "male") =>
                  onFormChange({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zodiac */}
            <div className="space-y-2">
              <Label>Zodiac Sign</Label>
              <Select
                value={formData.zodiacSign}
                onValueChange={(value) =>
                  onFormChange({ ...formData, zodiacSign: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zodiac sign" />
                </SelectTrigger>
                <SelectContent>
                  {ZODIAC_SIGNS.map((sign) => (
                    <SelectItem key={sign} value={sign}>
                      {sign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Occupation */}
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) =>
                  onFormChange({ ...formData, occupation: e.target.value })
                }
              />
            </div>

            {/* About me / Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">About me</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  onFormChange({ ...formData, bio: e.target.value })
                }
                rows={4}
              />
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => onRemoveInterest(interest)}
                  >
                    {interest}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add interest"
                  value={newInterest}
                  onChange={(e) => onNewInterestChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddInterest();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onAddInterest}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) =>
                  onFormChange({ ...formData, language: e.target.value })
                }
                placeholder="en"
              />
            </div>

            {/* Voice ID */}
            <div className="space-y-2">
              <Label htmlFor="voiceId">Voice ID</Label>
              <Input
                id="voiceId"
                value={formData.voiceId}
                onChange={(e) =>
                  onFormChange({ ...formData, voiceId: e.target.value })
                }
                placeholder="ElevenLabs voice ID"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "pending" | "archived") =>
                  onFormChange({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gallery Images */}
            {profile && (
              <>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onGalleryUpload}
                />
                <GalleryUpload
                  images={profile.profileImageUrls.map((url, i) => ({
                    url,
                    key: profile.profileImageKeys?.[i],
                  }))}
                  maxFiles={10}
                  isUploading={isUploadingGallery}
                  deletingKey={deletingImageKey}
                  onUpload={() => galleryInputRef.current?.click()}
                  onDelete={(key) => onDeleteImage(key, "gallery")}
                />
              </>
            )}
          </div>
        </div>

        <div className="border-t p-4 flex gap-2 shrink-0 bg-background">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
