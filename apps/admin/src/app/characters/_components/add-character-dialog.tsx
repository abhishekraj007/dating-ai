"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";

type InterestOption = {
  value: string;
  label: string;
  emoji?: string;
};

type AppearanceOverrides = {
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  build?: string;
  outfit?: string;
  vibe?: string;
  expression?: string;
};

type AppearanceOptions = {
  skinTones: string[];
  hairColors: string[];
  hairStylesFemale: string[];
  hairStylesMale: string[];
  eyeColors: string[];
  buildsFemale: string[];
  buildsMale: string[];
  outfitsFemale: string[];
  outfitsMale: string[];
  vibes: string[];
  expressions: string[];
};

type GenerateCharacterInput = {
  preferredGender?: "female" | "male";
  preferredOccupation?: string;
  preferredInterests?: string[];
  appearanceOverrides?: AppearanceOverrides;
};

interface AddCharacterDialogProps {
  isGenerating: boolean;
  occupationOptions: InterestOption[];
  interestOptions: InterestOption[];
  appearanceOptions?: AppearanceOptions;
  onGenerate: (input?: GenerateCharacterInput) => Promise<void>;
}

const PLACEHOLDER = "__random__";

function AppearanceSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Random" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value={PLACEHOLDER}>Random</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AddCharacterDialog({
  isGenerating,
  occupationOptions,
  interestOptions,
  appearanceOptions,
  onGenerate,
}: AddCharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState<"female" | "male" | "">("");
  const [occupation, setOccupation] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showAppearance, setShowAppearance] = useState(false);

  // Appearance overrides state
  const [skinTone, setSkinTone] = useState(PLACEHOLDER);
  const [hairColor, setHairColor] = useState(PLACEHOLDER);
  const [hairStyle, setHairStyle] = useState(PLACEHOLDER);
  const [eyeColor, setEyeColor] = useState(PLACEHOLDER);
  const [build, setBuild] = useState(PLACEHOLDER);
  const [outfit, setOutfit] = useState(PLACEHOLDER);
  const [vibe, setVibe] = useState(PLACEHOLDER);
  const [expression, setExpression] = useState(PLACEHOLDER);

  const shownInterests = interestOptions.slice(0, 40);
  const shownOccupations = occupationOptions.slice(0, 20);

  // Gender-aware options
  const hairStyles = gender === "male"
    ? appearanceOptions?.hairStylesMale
    : gender === "female"
      ? appearanceOptions?.hairStylesFemale
      : [...(appearanceOptions?.hairStylesFemale ?? []), ...(appearanceOptions?.hairStylesMale ?? [])];
  const builds = gender === "male"
    ? appearanceOptions?.buildsMale
    : gender === "female"
      ? appearanceOptions?.buildsFemale
      : [...(appearanceOptions?.buildsFemale ?? []), ...(appearanceOptions?.buildsMale ?? [])];
  const outfits = gender === "male"
    ? appearanceOptions?.outfitsMale
    : gender === "female"
      ? appearanceOptions?.outfitsFemale
      : [...(appearanceOptions?.outfitsFemale ?? []), ...(appearanceOptions?.outfitsMale ?? [])];

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

  const resetForm = () => {
    setGender("");
    setOccupation("");
    setSelectedInterests([]);
    setSkinTone(PLACEHOLDER);
    setHairColor(PLACEHOLDER);
    setHairStyle(PLACEHOLDER);
    setEyeColor(PLACEHOLDER);
    setBuild(PLACEHOLDER);
    setOutfit(PLACEHOLDER);
    setVibe(PLACEHOLDER);
    setExpression(PLACEHOLDER);
    setShowAppearance(false);
  };

  const buildOverrides = (): AppearanceOverrides | undefined => {
    const overrides: AppearanceOverrides = {};
    if (skinTone !== PLACEHOLDER) overrides.skinTone = skinTone;
    if (hairColor !== PLACEHOLDER) overrides.hairColor = hairColor;
    if (hairStyle !== PLACEHOLDER) overrides.hairStyle = hairStyle;
    if (eyeColor !== PLACEHOLDER) overrides.eyeColor = eyeColor;
    if (build !== PLACEHOLDER) overrides.build = build;
    if (outfit !== PLACEHOLDER) overrides.outfit = outfit;
    if (vibe !== PLACEHOLDER) overrides.vibe = vibe;
    if (expression !== PLACEHOLDER) overrides.expression = expression;
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  };

  const handleGenerate = async () => {
    try {
      await onGenerate({
        preferredGender: gender || undefined,
        preferredOccupation: occupation || undefined,
        preferredInterests:
          selectedInterests.length > 0 ? selectedInterests : undefined,
        appearanceOverrides: buildOverrides(),
      });
      setOpen(false);
      resetForm();
    } catch {
      // Keep dialog open so admin can adjust constraints and retry quickly.
    }
  };

  const activeOverrideCount = [skinTone, hairColor, hairStyle, eyeColor, build, outfit, vibe, expression]
    .filter((v) => v !== PLACEHOLDER).length;

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

          {/* Appearance overrides section */}
          {appearanceOptions && (
            <div className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
                onClick={() => setShowAppearance((prev) => !prev)}
              >
                <span>
                  Appearance Cues
                  {activeOverrideCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {activeOverrideCount} set
                    </Badge>
                  )}
                </span>
                {showAppearance ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAppearance && (
                <div className="grid grid-cols-2 gap-3 rounded-md border border-border/40 p-3">
                  <AppearanceSelect
                    label="Skin Tone"
                    options={appearanceOptions.skinTones}
                    value={skinTone}
                    onChange={setSkinTone}
                  />
                  <AppearanceSelect
                    label="Hair Color"
                    options={appearanceOptions.hairColors}
                    value={hairColor}
                    onChange={setHairColor}
                  />
                  <AppearanceSelect
                    label="Hair Style"
                    options={hairStyles ?? []}
                    value={hairStyle}
                    onChange={setHairStyle}
                  />
                  <AppearanceSelect
                    label="Eye Color"
                    options={appearanceOptions.eyeColors}
                    value={eyeColor}
                    onChange={setEyeColor}
                  />
                  <AppearanceSelect
                    label="Build"
                    options={builds ?? []}
                    value={build}
                    onChange={setBuild}
                  />
                  <AppearanceSelect
                    label="Outfit"
                    options={outfits ?? []}
                    value={outfit}
                    onChange={setOutfit}
                  />
                  <AppearanceSelect
                    label="Vibe / Aesthetic"
                    options={appearanceOptions.vibes}
                    value={vibe}
                    onChange={setVibe}
                  />
                  <AppearanceSelect
                    label="Expression"
                    options={appearanceOptions.expressions}
                    value={expression}
                    onChange={setExpression}
                  />
                </div>
              )}
            </div>
          )}
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
