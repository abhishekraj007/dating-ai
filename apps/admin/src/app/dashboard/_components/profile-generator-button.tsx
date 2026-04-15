"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface ProfileGeneratorButtonProps {
  isGenerating: boolean;
  onGenerate: () => Promise<void>;
}

export function ProfileGeneratorButton({
  isGenerating,
  onGenerate,
}: ProfileGeneratorButtonProps) {
  return (
    <Button onClick={onGenerate} disabled={isGenerating} className="w-full sm:w-auto">
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Generate AI Profile
    </Button>
  );
}
