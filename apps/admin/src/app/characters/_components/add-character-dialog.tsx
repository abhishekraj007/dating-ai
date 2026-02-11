"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Plus } from "lucide-react";

type InterestOption = {
  value: string;
  label: string;
  emoji?: string;
};

type GenerateCharacterInput = {
  preferredGender?: "female" | "male";
  preferredOccupation?: string;
  preferredInterests?: string[];
};

interface AddCharacterDialogProps {
  isGenerating: boolean;
  occupationOptions: InterestOption[];
  interestOptions: InterestOption[];
  onGenerate: (input?: GenerateCharacterInput) => Promise<void>;
}

export function AddCharacterDialog({
  isGenerating,
  occupationOptions,
  interestOptions,
  onGenerate,
}: AddCharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState<"female" | "male" | "">("");
  const [occupation, setOccupation] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const shownInterests = useMemo(
    () => interestOptions.slice(0, 40),
    [interestOptions],
  );
  const shownOccupations = useMemo(
    () => occupationOptions.slice(0, 20),
    [occupationOptions],
  );

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((item) => item !== interest);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleGenerate = async () => {
    try {
      await onGenerate({
        preferredGender: gender || undefined,
        preferredOccupation: occupation || undefined,
        preferredInterests:
          selectedInterests.length > 0 ? selectedInterests : undefined,
      });
      setOpen(false);
      setGender("");
      setOccupation("");
      setSelectedInterests([]);
    } catch {
      // Keep dialog open so admin can adjust constraints and retry quickly.
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Character
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Generate Character</SheetTitle>
          <SheetDescription>
            Optional constraints to guide profile generation. Leave fields empty
            for fully automatic generation.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Gender</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={gender === "female" ? "default" : "outline"}
                onClick={() => setGender((prev) => (prev === "female" ? "" : "female"))}
              >
                Female
              </Button>
              <Button
                type="button"
                size="sm"
                variant={gender === "male" ? "default" : "outline"}
                onClick={() => setGender((prev) => (prev === "male" ? "" : "male"))}
              >
                Male
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Occupation</p>
            <div className="max-h-28 overflow-y-auto rounded-md border border-border/60 p-2">
              <div className="flex flex-wrap gap-2">
                {shownOccupations.map((occupationOption) => {
                  const selected = occupation === occupationOption.value;
                  return (
                    <Badge
                      key={occupationOption.value}
                      className="cursor-pointer"
                      variant={selected ? "default" : "secondary"}
                      onClick={() =>
                        setOccupation((prev) =>
                          prev === occupationOption.value
                            ? ""
                            : occupationOption.value,
                        )
                      }
                    >
                      {occupationOption.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Interests</p>
              <p className="text-xs text-muted-foreground">
                {selectedInterests.length}/5 selected
              </p>
            </div>
            <div className="max-h-52 overflow-y-auto rounded-md border border-border/60 p-2">
              {shownInterests.length === 0 ? (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  No interest options configured.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {shownInterests.map((interest) => {
                    const selected = selectedInterests.includes(interest.value);
                    return (
                      <Badge
                        key={interest.value}
                        className="cursor-pointer"
                        variant={selected ? "default" : "secondary"}
                        onClick={() => toggleInterest(interest.value)}
                      >
                        {interest.label}
                        {interest.emoji ? ` ${interest.emoji}` : ""}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="px-4 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
