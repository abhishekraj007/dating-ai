"use client";

import { useEffect, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "./_components/character-card";
import { EditCharacterSheet } from "./_components/edit-character-sheet";
import { useCharacterEdit } from "./_hooks/use-character-edit";
import { ProtectedRoute } from "@/components/protected-route";
import { useCharacterGeneration } from "./_hooks/use-character-generation";
import { CharacterGenerationPanel } from "./_components/character-generation-panel";
import { PageShell } from "@/components/admin/page-shell";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Search } from "lucide-react";

export default function CharactersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState<
    "all" | "active" | "pending" | "new"
  >("all");
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );
  const canQueryProfiles =
    isAuthenticated && userData?.profile?.isAdmin === true;
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const profiles = useQuery(
    api.features.ai.queries.getSystemProfiles,
    canQueryProfiles
      ? {
          search: debouncedSearch || undefined,
          statusFilter:
            profileFilter === "active" || profileFilter === "pending"
              ? profileFilter
              : undefined,
          recentOnly: profileFilter === "new" ? true : undefined,
          limit: 120,
        }
      : "skip",
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
    mode,
    avatarInputRef,
    galleryInputRef,
    setFormData,
    setNewInterest,
    setIsSheetOpen,
    setMode,
    handleView,
    handleEdit,
    handleClose,
    handleAddInterest,
    handleRemoveInterest,
    handleAvatarUpload,
    handleGalleryUpload,
    handleDeleteImage,
    handleSave,
  } = useCharacterEdit(profiles);

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const isAuthGateLoading =
    authLoading || (isAuthenticated && userData === undefined);
  const isProfilesLoading = profiles === undefined;
  const visibleProfiles = profiles ?? [];

  const loader = () => {
    return (
      <PageShell>
        <PageHeader
          title="Characters"
          subtitle="Loading system characters..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </PageShell>
    );
  };

  return (
    <ProtectedRoute>
      {isAuthGateLoading ? (
        loader()
      ) : (
        <PageShell>
          <PageHeader
            title="Characters"
            subtitle={
              isProfilesLoading
                ? "Loading system characters..."
                : `Showing ${visibleProfiles.length} system characters`
            }
          />
          <CharacterGenerationPanel
            isGenerating={isGenerating}
            runningCount={runningCount}
            completedCount={completedCount}
            failedCount={failedCount}
            jobs={jobs}
            onRetryFailed={retryGeneration}
            onGenerate={triggerGeneration}
            occupationOptions={generationOptions?.occupations ?? []}
            interestOptions={generationOptions?.interests ?? []}
            appearanceOptions={generationOptions?.appearance}
          />
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, bio, occupation, interests..."
                className="pl-8"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={profileFilter === "all" ? "default" : "outline"}
                onClick={() => setProfileFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={profileFilter === "active" ? "default" : "outline"}
                onClick={() => setProfileFilter("active")}
              >
                Active
              </Button>
              <Button
                size="sm"
                variant={profileFilter === "pending" ? "default" : "outline"}
                onClick={() => setProfileFilter("pending")}
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant={profileFilter === "new" ? "default" : "outline"}
                onClick={() => setProfileFilter("new")}
              >
                New (24h)
              </Button>
            </div>
          </div>

          {isProfilesLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="mb-2 h-5 w-28" />
                  <Skeleton className="mb-2 h-3 w-full" />
                  <Skeleton className="mb-3 h-3 w-4/5" />
                  <div className="mb-3 flex gap-1.5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-14 w-14 rounded-md" />
                </div>
              ))}
            </div>
          ) : visibleProfiles.length === 0 && runningCount === 0 ? (
            <EmptyState
              title="No characters found"
              description="Try clearing search or changing filters to see more profiles."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: runningCount }).map((_, i) => (
                <div
                  key={`generating-${i}`}
                  className="rounded-xl border border-primary/30 bg-card/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <span className="text-[11px] text-primary animate-pulse">
                      Generating...
                    </span>
                  </div>
                  <Skeleton className="mb-2 h-5 w-28" />
                  <Skeleton className="mb-2 h-3 w-full" />
                  <Skeleton className="mb-3 h-3 w-4/5" />
                  <div className="mb-3 flex gap-1.5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-14 w-14 rounded-md" />
                </div>
              ))}
              {visibleProfiles.map((profile) => {
                const isNew =
                  (profile.createdAt ?? profile._creationTime ?? 0) >=
                  oneDayAgo;
                return (
                  <CharacterCard
                    key={profile._id}
                    profile={profile}
                    onView={handleView}
                    onEdit={handleEdit}
                    isNew={isNew}
                  />
                );
              })}
            </div>
          )}

          <EditCharacterSheet
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            profile={selectedProfile}
            mode={mode}
            onModeChange={setMode}
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
        </PageShell>
      )}
    </ProtectedRoute>
  );
}
