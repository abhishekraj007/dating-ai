"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterCard } from "./_components/character-card";
import { EditCharacterSheet } from "./_components/edit-character-sheet";
import { useCharacterEdit } from "./_hooks/use-character-edit";
import { ProtectedRoute } from "@/components/protected-route";
import { useCharacterGeneration } from "./_hooks/use-character-generation";
import { CharacterGenerationPanel } from "./_components/character-generation-panel";

export default function CharactersPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(api.user.fetchUserAndProfile, isAuthenticated ? {} : "skip");
  const canQueryProfiles = isAuthenticated && userData?.profile?.isAdmin === true;
  const profiles = useQuery(
    api.features.ai.queries.getSystemProfiles,
    canQueryProfiles ? {} : "skip",
  );
  const {
    isGenerating,
    triggerGeneration,
    retryGeneration,
    runningCount,
    completedCount,
    failedCount,
    jobs,
    generationOptions,
  } = useCharacterGeneration();
  const {
    selectedProfile,
    isSheetOpen,
    isSaving,
    isUploadingAvatar,
    isUploadingGallery,
    deletingImageKey,
    formData,
    newInterest,
    avatarInputRef,
    galleryInputRef,
    setFormData,
    setNewInterest,
    setIsSheetOpen,
    handleEdit,
    handleClose,
    handleAddInterest,
    handleRemoveInterest,
    handleAvatarUpload,
    handleGalleryUpload,
    handleDeleteImage,
    handleSave,
  } = useCharacterEdit(profiles);

  const loader = () => {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Characters</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      {authLoading || (isAuthenticated && userData === undefined) || profiles === undefined ? (
        loader()
      ) : (
        <div className="p-6">
          <CharacterGenerationPanel
            totalCharacters={profiles.length}
            isGenerating={isGenerating}
            runningCount={runningCount}
            completedCount={completedCount}
            failedCount={failedCount}
            jobs={jobs}
            onRetryFailed={retryGeneration}
            onGenerate={triggerGeneration}
            occupationOptions={generationOptions?.occupations ?? []}
            interestOptions={generationOptions?.interests ?? []}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {profiles.map((profile) => (
              <CharacterCard
                key={profile._id}
                profile={profile}
                onEdit={handleEdit}
              />
            ))}
          </div>

          <EditCharacterSheet
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            profile={selectedProfile}
            formData={formData}
            onFormChange={setFormData}
            newInterest={newInterest}
            onNewInterestChange={setNewInterest}
            onAddInterest={handleAddInterest}
            onRemoveInterest={handleRemoveInterest}
            isSaving={isSaving}
            isUploadingAvatar={isUploadingAvatar}
            isUploadingGallery={isUploadingGallery}
            deletingImageKey={deletingImageKey}
            avatarInputRef={avatarInputRef}
            galleryInputRef={galleryInputRef}
            onAvatarUpload={handleAvatarUpload}
            onGalleryUpload={handleGalleryUpload}
            onDeleteImage={handleDeleteImage}
            onSave={handleSave}
            onClose={handleClose}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
