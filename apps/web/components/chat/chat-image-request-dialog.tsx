"use client";

import { useEffect, useState } from "react";
import { Camera, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { ChatImageRequestOptions } from "@/hooks/use-request-chat-image";

const HAIRSTYLES = ["messy", "curly", "straight", "wavy", "sleek"];
const CLOTHING = ["casual", "dressy", "sporty", "cozy", "streetwear"];
const SCENES = [
  "mirror selfie",
  "bedroom",
  "beach",
  "city night",
  "coffee shop",
];

interface ChatImageRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (options: ChatImageRequestOptions) => Promise<void> | void;
  isSubmitting: boolean;
  creditsBalance?: number | null;
  onBuyCredits?: () => void;
}

export function ChatImageRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  creditsBalance,
  onBuyCredits,
}: ChatImageRequestDialogProps) {
  const [hairstyle, setHairstyle] = useState("");
  const [clothing, setClothing] = useState("");
  const [scene, setScene] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setHairstyle("");
      setClothing("");
      setScene("");
      setDescription("");
    }
  }, [open]);

  const hasEnoughCredits =
    creditsBalance === undefined ||
    creditsBalance === null ||
    creditsBalance >= 5;

  const handleSubmit = async () => {
    if (!hasEnoughCredits) {
      onBuyCredits?.();
      return;
    }

    await onSubmit({
      hairstyle: hairstyle || undefined,
      clothing: clothing || undefined,
      scene: scene || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-5">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Request a photo</DialogTitle>
            <Badge variant="outline" className="gap-1 rounded-full px-2.5 py-1">
              <Coins className="h-3.5 w-3.5" />5 credits
            </Badge>
          </div>
          <DialogDescription>
            Ask for a selfie with a few style details. The photo request is sent
            into the chat just like the native flow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={hairstyle} onValueChange={setHairstyle}>
            <SelectTrigger className="h-11 w-full rounded-2xl">
              <SelectValue placeholder="Hairstyle" />
            </SelectTrigger>
            <SelectContent>
              {HAIRSTYLES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clothing} onValueChange={setClothing}>
            <SelectTrigger className="h-11 w-full rounded-2xl">
              <SelectValue placeholder="Clothing" />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={scene} onValueChange={setScene}>
            <SelectTrigger className="h-11 w-full rounded-2xl">
              <SelectValue placeholder="Scene" />
            </SelectTrigger>
            <SelectContent>
              {SCENES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Extra details</p>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the vibe, pose, lighting, or anything else you want in the photo."
            className="min-h-28 rounded-3xl bg-muted/40"
            maxLength={280}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {creditsBalance === undefined || creditsBalance === null
                ? "Credits will be deducted after sending."
                : `${creditsBalance} credits available`}
            </span>
            <span>{description.trim().length}/280</span>
          </div>
        </div>

        {!hasEnoughCredits && (
          <div className="rounded-3xl border border-border/70 bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            You need at least 5 credits to request a new photo.
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-3xl sm:w-full"
          >
            <Camera className="h-4 w-4" />
            {isSubmitting
              ? "Sending request..."
              : hasEnoughCredits
                ? "Send photo request"
                : "Buy credits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
