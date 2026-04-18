"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Check, X, Pencil, ZoomIn } from "lucide-react";
import { ImageLightbox } from "@/components/image-lightbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MAX_AVATAR_ATTEMPTS,
  type EditedCandidate,
  type PreviewJob,
} from "../_hooks/use-preview-approval";

type Props = {
  job: PreviewJob;
  interestOptions: { value: string; label: string; emoji?: string }[];
  onApprove: (edited?: EditedCandidate) => Promise<void>;
  onRegenerate: (editedPrompt?: string) => Promise<void>;
  onCancel: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

/**
 * Preview panel for a paused `awaiting_avatar_approval` job.
 * Admin can edit a narrow set of fields, regenerate the avatar, or approve.
 */
export function AvatarPreviewPanel({
  job,
  interestOptions,
  onApprove,
  onRegenerate,
  onCancel,
  onDirtyChange,
}: Props) {
  const preview = job.preview;
  const candidate = preview?.candidate;

  // Local editable state — initialized from the candidate on first load.
  const [name, setName] = useState(candidate?.name ?? "");
  const [age, setAge] = useState<string>(String(candidate?.age ?? ""));
  const [occupation, setOccupation] = useState(candidate?.occupation ?? "");
  const [location, setLocation] = useState(candidate?.location ?? "");
  const [bio, setBio] = useState(candidate?.bio ?? "");
  const [interests, setInterests] = useState<string[]>(
    candidate?.interests ?? [],
  );

  const [promptEditMode, setPromptEditMode] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(preview?.avatarPrompt ?? "");

  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // When the preview blob refreshes (e.g. new avatar after regeneration),
  // sync only fields that the admin hasn't touched. For simplicity we rebind
  // the prompt whenever it changes and we're not in edit mode.
  useEffect(() => {
    if (!promptEditMode) {
      setEditedPrompt(preview?.avatarPrompt ?? "");
    }
  }, [preview?.avatarPrompt, promptEditMode]);

  if (!candidate || !preview) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-10 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Waiting for preview data...</span>
      </div>
    );
  }

  const originalInterests = candidate.interests;
  const isDirty =
    name.trim() !== candidate.name ||
    age.trim() !== String(candidate.age) ||
    occupation.trim() !== candidate.occupation ||
    location.trim() !== candidate.location ||
    bio.trim() !== candidate.bio ||
    interests.length !== originalInterests.length ||
    interests.some((i, idx) => i !== originalInterests[idx]);

  // Report dirty state up so the parent can warn on close.
  useEffect(() => {
    onDirtyChange?.(isDirty || promptEditMode);
  }, [isDirty, promptEditMode, onDirtyChange]);

  const toggleInterest = (value: string) => {
    setInterests((prev) => {
      if (prev.includes(value)) return prev.filter((i) => i !== value);
      if (prev.length >= 7) return prev;
      return [...prev, value];
    });
  };

  const buildEditedPatch = (): EditedCandidate | undefined => {
    const patch: EditedCandidate = {};
    const trimmedName = name.trim();
    const parsedAge = Number.parseInt(age, 10);
    const trimmedOccupation = occupation.trim();
    const trimmedLocation = location.trim();
    const trimmedBio = bio.trim();

    if (trimmedName && trimmedName !== candidate.name) patch.name = trimmedName;
    if (
      !Number.isNaN(parsedAge) &&
      parsedAge > 0 &&
      parsedAge !== candidate.age
    ) {
      patch.age = parsedAge;
    }
    if (trimmedOccupation && trimmedOccupation !== candidate.occupation) {
      patch.occupation = trimmedOccupation;
    }
    if (trimmedLocation && trimmedLocation !== candidate.location) {
      patch.location = trimmedLocation;
    }
    if (trimmedBio && trimmedBio !== candidate.bio) patch.bio = trimmedBio;

    const normalizedInterests = interests.map((i) => i.trim()).filter(Boolean);
    const interestsChanged =
      normalizedInterests.length !== originalInterests.length ||
      normalizedInterests.some((i, idx) => i !== originalInterests[idx]);
    if (interestsChanged && normalizedInterests.length >= 4) {
      patch.interests = normalizedInterests;
    }

    return Object.keys(patch).length > 0 ? patch : undefined;
  };

  const canRegenerate =
    !isRegenerating &&
    !isApproving &&
    preview.avatarAttempts < MAX_AVATAR_ATTEMPTS;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(promptEditMode ? editedPrompt : undefined);
      setPromptEditMode(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleApprove = async () => {
    if (interests.length > 0 && interests.length < 4) {
      // Front-end guard to match the Zod minimum — server will reject too.
      return;
    }
    setIsApproving(true);
    try {
      await onApprove(buildEditedPatch());
    } catch {
      setIsApproving(false);
    }
  };

  const approveDisabled =
    isApproving ||
    isRegenerating ||
    (interests.length > 0 && interests.length < 4) ||
    !name.trim() ||
    !age.trim() ||
    !occupation.trim() ||
    !location.trim() ||
    bio.trim().length < 40;

  const progressMessage =
    job.status === "processing"
      ? (job.progress?.message ??
        "Generating showcase images — this takes a moment...")
      : job.status === "failed"
        ? (job.errorMessage ?? "Generation failed")
        : null;

  return (
    <div className="space-y-4 px-4 pb-4">
      {/* Avatar card */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => {
            if (job.previewAvatarUrl && !isRegenerating) setLightboxOpen(true);
          }}
          disabled={!job.previewAvatarUrl || isRegenerating}
          className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default disabled:hover:ring-0"
          aria-label={
            isRegenerating
              ? "Regenerating avatar"
              : job.previewAvatarUrl
                ? "View avatar in full size"
                : "Avatar loading"
          }
        >
          {job.previewAvatarUrl ? (
            <>
              <Image
                src={job.previewAvatarUrl}
                alt={candidate.name}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-5 w-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {(isRegenerating || job.status === "processing") && (
            <>
              <Skeleton aria-hidden className="absolute inset-0 rounded-none" />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <Loader2 className="h-5 w-5 animate-spin text-foreground/80" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {isRegenerating ? "Regenerating..." : "Continuing..."}
                </span>
              </div>
            </>
          )}
        </button>
        <div className="flex flex-col justify-between">
          <div className="space-y-0.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">@{candidate.username}</p>
            <p>
              {candidate.gender === "female" ? "Female" : "Male"} ·{" "}
              {candidate.zodiacSign}
            </p>
            <p>MBTI: {candidate.mbtiType}</p>
            <p className="max-w-[180px] italic">
              &ldquo;{candidate.relationshipGoal}&rdquo;
            </p>
          </div>
          <Badge variant="secondary" className="w-fit text-[10px]">
            Attempt {preview.avatarAttempts}/{MAX_AVATAR_ATTEMPTS}
          </Badge>
        </div>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-1">
          <p className="text-xs font-medium">Name</p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-xs"
            maxLength={60}
          />
        </div>
        <div className="space-y-1 col-span-1">
          <p className="text-xs font-medium">Age</p>
          <Input
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
            className="h-8 text-xs"
            inputMode="numeric"
            maxLength={2}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <p className="text-xs font-medium">Occupation</p>
          <Input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="h-8 text-xs"
            maxLength={80}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <p className="text-xs font-medium">Location</p>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-8 text-xs"
            maxLength={60}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Bio</p>
            <p className="text-[10px] text-muted-foreground">
              {bio.trim().length}/240 (min 40)
            </p>
          </div>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="text-xs min-h-[90px]"
            maxLength={240}
          />
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Interests</p>
          <p className="text-xs text-muted-foreground">
            {interests.length} selected (4–7)
          </p>
        </div>
        <div className="max-h-40 overflow-y-auto rounded-md border border-border/60 p-2">
          <div className="flex flex-wrap gap-2">
            {interestOptions.slice(0, 40).map((opt) => (
              <Badge
                key={opt.value}
                className="cursor-pointer"
                variant={
                  interests.includes(opt.value) ? "default" : "secondary"
                }
                onClick={() => toggleInterest(opt.value)}
              >
                {opt.label}
                {opt.emoji ? ` ${opt.emoji}` : ""}
              </Badge>
            ))}
            {interests
              .filter((i) => !interestOptions.some((o) => o.value === i))
              .map((custom) => (
                <Badge
                  key={custom}
                  className="cursor-pointer"
                  variant="default"
                  onClick={() => toggleInterest(custom)}
                >
                  {custom}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      {/* Read-only summary */}
      <div className="rounded-md border border-border/40 bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
        <p>
          <span className="font-medium text-foreground">Personality:</span>{" "}
          {candidate.personalityTraits.join(", ")}
        </p>
        <p>
          <span className="font-medium text-foreground">Subject:</span>{" "}
          {preview.subjectDescriptor}
        </p>
      </div>

      {/* Prompt edit toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Avatar Prompt</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setPromptEditMode((prev) => !prev)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            {promptEditMode ? "Done" : "Edit prompt"}
          </Button>
        </div>
        {promptEditMode ? (
          <Textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="text-[11px] min-h-[120px] font-mono"
          />
        ) : (
          <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md border border-border/40 bg-muted/30 p-2 text-[10px] font-mono text-muted-foreground">
            {preview.avatarPrompt}
          </pre>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isApproving || isRegenerating}
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={!canRegenerate}
          >
            {isRegenerating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Regenerate
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApprove}
            disabled={approveDisabled}
          >
            {isApproving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            Approve & Continue
          </Button>
        </div>
      </div>

      {progressMessage && (
        <p className="text-[11px] text-muted-foreground text-center">
          {progressMessage}
        </p>
      )}
      {preview.avatarAttempts >= MAX_AVATAR_ATTEMPTS && (
        <p className="text-[11px] text-amber-500 text-center">
          Maximum regeneration attempts reached. Approve or cancel.
        </p>
      )}

      <ImageLightbox
        images={job.previewAvatarUrl ? [job.previewAvatarUrl] : []}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
