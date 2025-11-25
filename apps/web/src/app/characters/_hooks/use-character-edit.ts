import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { toast } from "sonner";

export type AIProfile = {
  _id: Id<"aiProfiles">;
  name: string;
  gender: "female" | "male";
  avatarUrl: string | null;
  profileImageUrls: string[];
  age?: number;
  zodiacSign?: string;
  occupation?: string;
  bio?: string;
  interests?: string[];
  personalityTraits?: string[];
  language?: string;
  voiceId?: string;
  status: "active" | "pending" | "archived";
  avatarImageKey?: string;
  profileImageKeys?: string[];
};

export type CharacterFormData = {
  name: string;
  gender: "female" | "male";
  age: string;
  zodiacSign: string;
  occupation: string;
  bio: string;
  interests: string[];
  language: string;
  voiceId: string;
  status: "active" | "pending" | "archived";
};

const initialFormData: CharacterFormData = {
  name: "",
  gender: "female",
  age: "",
  zodiacSign: "",
  occupation: "",
  bio: "",
  interests: [],
  language: "en",
  voiceId: "",
  status: "active",
};

export function useCharacterEdit() {
  const updateProfile = useMutation(
    api.features.ai.mutations.adminUpdateProfile
  );
  const generateUploadUrl = useMutation(
    api.features.ai.mutations.adminGenerateUploadUrl
  );
  const deleteProfileImage = useMutation(
    api.features.ai.mutations.adminDeleteProfileImage
  );
  const syncMetadata = useMutation(api.uploads.syncMetadata);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [selectedProfile, setSelectedProfile] = useState<AIProfile | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [deletingImageKey, setDeletingImageKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);
  const [newInterest, setNewInterest] = useState("");

  const handleEdit = (profile: AIProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      gender: profile.gender,
      age: profile.age?.toString() ?? "",
      zodiacSign: profile.zodiacSign ?? "",
      occupation: profile.occupation ?? "",
      bio: profile.bio ?? "",
      interests: profile.interests ?? [],
      language: profile.language ?? "en",
      voiceId: profile.voiceId ?? "",
      status: profile.status,
    });
    setIsSheetOpen(true);
  };

  const handleClose = () => {
    setIsSheetOpen(false);
    setSelectedProfile(null);
    setNewInterest("");
  };

  const handleAddInterest = () => {
    if (
      newInterest.trim() &&
      !formData.interests.includes(newInterest.trim())
    ) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()],
      });
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== interest),
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProfile) return;

    setIsUploadingAvatar(true);
    try {
      const { url, key } = await generateUploadUrl({
        profileId: selectedProfile._id,
        type: "avatar",
      });

      const response = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) throw new Error("Failed to upload image");

      await syncMetadata({ key });
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProfile) return;

    const currentCount = selectedProfile.profileImageUrls.length;
    const maxAllowed = 10 - currentCount;

    if (files.length > maxAllowed) {
      toast.error(`You can only upload ${maxAllowed} more images (max 10)`);
      return;
    }

    setIsUploadingGallery(true);
    try {
      for (const file of Array.from(files)) {
        const { url, key } = await generateUploadUrl({
          profileId: selectedProfile._id,
          type: "gallery",
        });

        const response = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
        await syncMetadata({ key });
      }
      toast.success(
        `${files.length} image${files.length > 1 ? "s" : ""} uploaded`
      );
    } catch (error) {
      toast.error("Failed to upload images");
      console.error(error);
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (
    imageKey: string,
    type: "avatar" | "gallery"
  ) => {
    if (!selectedProfile) return;

    setDeletingImageKey(imageKey);
    try {
      await deleteProfileImage({
        profileId: selectedProfile._id,
        imageKey,
        type,
      });
      toast.success("Image deleted");
    } catch (error) {
      toast.error("Failed to delete image");
      console.error(error);
    } finally {
      setDeletingImageKey(null);
    }
  };

  const handleSave = async () => {
    if (!selectedProfile) return;

    setIsSaving(true);
    try {
      await updateProfile({
        profileId: selectedProfile._id,
        name: formData.name,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        zodiacSign: formData.zodiacSign || undefined,
        occupation: formData.occupation || undefined,
        bio: formData.bio || undefined,
        interests:
          formData.interests.length > 0 ? formData.interests : undefined,
        language: formData.language || undefined,
        voiceId: formData.voiceId || undefined,
        status: formData.status,
      });
      toast.success("Character updated successfully");
      handleClose();
    } catch (error) {
      toast.error("Failed to update character");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // State
    selectedProfile,
    isSheetOpen,
    isSaving,
    isUploadingAvatar,
    isUploadingGallery,
    deletingImageKey,
    formData,
    newInterest,
    // Refs
    avatarInputRef,
    galleryInputRef,
    // Setters
    setFormData,
    setNewInterest,
    setIsSheetOpen,
    // Handlers
    handleEdit,
    handleClose,
    handleAddInterest,
    handleRemoveInterest,
    handleAvatarUpload,
    handleGalleryUpload,
    handleDeleteImage,
    handleSave,
  };
}
