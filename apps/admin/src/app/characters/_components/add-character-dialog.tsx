"use client";

import { useRef, useState } from "react";
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
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
  Check,
} from "lucide-react";

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
  referenceSubjectDescriptor?: string;
  referenceImageUrl?: string;
};

type ReferenceAnalysis = {
  subjectDescriptor: string;
  suggestedGender: "female" | "male";
  suggestedAge: number;
  suggestedOccupation?: string;
  suggestedVibe?: string;
  suggestedExpression?: string;
  referenceImageUrl: string;
};

interface AddCharacterDialogProps {
  isGenerating: boolean;
  occupationOptions: InterestOption[];
  interestOptions: InterestOption[];
  appearanceOptions?: AppearanceOptions;
  onGenerate: (input?: GenerateCharacterInput) => Promise<void>;
  isAnalyzingPhoto: boolean;
  onAnalyzePhoto: (file: File) => Promise<ReferenceAnalysis | null>;
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
  isAnalyzingPhoto,
  onAnalyzePhoto,
}: AddCharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"custom" | "reference">("custom");

  // --- Custom tab state ---
  const [gender, setGender] = useState<"female" | "male" | "">("");
  const [occupation, setOccupation] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showAppearance, setShowAppearance] = useState(false);
  const [skinTone, setSkinTone] = useState(PLACEHOLDER);
  const [hairColor, setHairColor] = useState(PLACEHOLDER);
  const [hairStyle, setHairStyle] = useState(PLACEHOLDER);
  const [eyeColor, setEyeColor] = useState(PLACEHOLDER);
  const [build, setBuild] = useState(PLACEHOLDER);
  const [outfit, setOutfit] = useState(PLACEHOLDER);
  const [vibe, setVibe] = useState(PLACEHOLDER);
  const [expression, setExpression] = useState(PLACEHOLDER);

  // --- Reference tab state ---
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referenceAnalysis, setReferenceAnalysis] =
    useState<ReferenceAnalysis | null>(null);
  const [refOccupation, setRefOccupation] = useState("");
  const [refInterests, setRefInterests] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shownInterests = interestOptions.slice(0, 40);
  const shownOccupations = occupationOptions.slice(0, 20);

  // Gender-aware options for custom tab
  const hairStyles =
    gender === "male"
      ? appearanceOptions?.hairStylesMale
      : gender === "female"
        ? appearanceOptions?.hairStylesFemale
        : [
            ...(appearanceOptions?.hairStylesFemale ?? []),
            ...(appearanceOptions?.hairStylesMale ?? []),
          ];
  const builds =
    gender === "male"
      ? appearanceOptions?.buildsMale
      : gender === "female"
        ? appearanceOptions?.buildsFemale
        : [
            ...(appearanceOptions?.buildsFemale ?? []),
            ...(appearanceOptions?.buildsMale ?? []),
          ];
  const outfits =
    gender === "male"
      ? appearanceOptions?.outfitsMale
      : gender === "female"
        ? appearanceOptions?.outfitsFemale
        : [
            ...(appearanceOptions?.outfitsFemale ?? []),
            ...(appearanceOptions?.outfitsMale ?? []),
          ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

  const toggleRefInterest = (interest: string) => {
    setRefInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

  const resetForm = () => {
    setTab("custom");
    // Custom state
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
    // Reference state
    setReferencePreview(null);
    setReferenceAnalysis(null);
    setRefOccupation("");
    setRefInterests([]);
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

  // --- Reference photo handlers ---
  const handleReferenceFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setReferencePreview(url);
    setReferenceAnalysis(null);

    const result = await onAnalyzePhoto(file);
    if (result) {
      setReferenceAnalysis(result);
      // Pre-fill occupation if suggested
      if (result.suggestedOccupation) {
        setRefOccupation(result.suggestedOccupation);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleReferenceFile(file);
    if (e.target) e.target.value = "";
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (tab !== "reference") return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await handleReferenceFile(file);
          return;
        }
      }
    }
  };

  const clearReference = () => {
    setReferencePreview(null);
    setReferenceAnalysis(null);
    setRefOccupation("");
    setRefInterests([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Generate handlers ---
  const handleGenerateCustom = async () => {
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
      // Keep dialog open
    }
  };

  const handleGenerateFromReference = async () => {
    if (!referenceAnalysis) return;
    try {
      await onGenerate({
        preferredGender: referenceAnalysis.suggestedGender,
        preferredOccupation:
          refOccupation || referenceAnalysis.suggestedOccupation || undefined,
        preferredInterests: refInterests.length > 0 ? refInterests : undefined,
        referenceSubjectDescriptor: referenceAnalysis.subjectDescriptor,
        referenceImageUrl: referenceAnalysis.referenceImageUrl,
      });
      setOpen(false);
      resetForm();
    } catch {
      // Keep dialog open
    }
  };

  const activeOverrideCount = [
    skinTone,
    hairColor,
    hairStyle,
    eyeColor,
    build,
    outfit,
    vibe,
    expression,
  ].filter((v) => v !== PLACEHOLDER).length;

  const canGenerateReference = referenceAnalysis !== null && !isAnalyzingPhoto;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Character
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto"
        onPaste={handlePaste}
      >
        <SheetHeader>
          <SheetTitle>Generate Character</SheetTitle>
          <SheetDescription>
            {tab === "custom"
              ? "Set constraints to guide profile generation, or leave empty for fully automatic."
              : "Upload a reference photo to create a character with a similar look and style."}
          </SheetDescription>
        </SheetHeader>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <Button
            type="button"
            size="sm"
            variant={tab === "custom" ? "default" : "outline"}
            onClick={() => setTab("custom")}
          >
            Custom
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "reference" ? "default" : "outline"}
            onClick={() => setTab("reference")}
          >
            <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
            Reference
          </Button>
        </div>

        {/* =================== CUSTOM TAB =================== */}
        {tab === "custom" && (
          <>
            <div className="space-y-4 px-4 pb-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Gender</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={gender === "female" ? "default" : "outline"}
                    onClick={() =>
                      setGender((prev) => (prev === "female" ? "" : "female"))
                    }
                  >
                    Female
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={gender === "male" ? "default" : "outline"}
                    onClick={() =>
                      setGender((prev) => (prev === "male" ? "" : "male"))
                    }
                  >
                    Male
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Occupation</p>
                <div className="max-h-28 overflow-y-auto rounded-md border border-border/60 p-2">
                  <div className="flex flex-wrap gap-2">
                    {shownOccupations.map((opt) => (
                      <Badge
                        key={opt.value}
                        className="cursor-pointer"
                        variant={
                          occupation === opt.value ? "default" : "secondary"
                        }
                        onClick={() =>
                          setOccupation((prev) =>
                            prev === opt.value ? "" : opt.value,
                          )
                        }
                      >
                        {opt.label}
                      </Badge>
                    ))}
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
                      {shownInterests.map((interest) => (
                        <Badge
                          key={interest.value}
                          className="cursor-pointer"
                          variant={
                            selectedInterests.includes(interest.value)
                              ? "default"
                              : "secondary"
                          }
                          onClick={() => toggleInterest(interest.value)}
                        >
                          {interest.label}
                          {interest.emoji ? ` ${interest.emoji}` : ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
              <Button
                type="button"
                onClick={handleGenerateCustom}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Generate
              </Button>
            </SheetFooter>
          </>
        )}

        {/* =================== REFERENCE TAB =================== */}
        {tab === "reference" && (
          <>
            <div className="space-y-4 px-4 pb-4">
              {/* Upload / Paste area */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Reference Photo</p>
                <p className="text-xs text-muted-foreground">
                  Upload or paste a photo. The AI will analyze it and generate a
                  new character with a similar (but unique) appearance.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInput}
                />
                {referencePreview ? (
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={referencePreview}
                        alt="Reference"
                        className="h-32 w-32 rounded-lg border border-border/60 object-cover"
                      />
                      {isAnalyzingPhoto && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-black/60">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                          <span className="text-[11px] text-white/80">
                            Analyzing...
                          </span>
                        </div>
                      )}
                      {!isAnalyzingPhoto && (
                        <button
                          type="button"
                          onClick={clearReference}
                          className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {referenceAnalysis && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-green-500">
                          <Check className="h-3.5 w-3.5" />
                          <span>Analysis complete</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {referenceAnalysis.suggestedGender === "female"
                            ? "Female"
                            : "Male"}
                          {" · ~"}
                          {referenceAnalysis.suggestedAge} years old
                        </p>
                        {referenceAnalysis.suggestedVibe && (
                          <p className="text-xs text-muted-foreground">
                            Vibe: {referenceAnalysis.suggestedVibe}
                          </p>
                        )}
                        <p className="mt-1.5 max-w-xs text-[11px] leading-relaxed text-muted-foreground/70 italic">
                          &ldquo;{referenceAnalysis.subjectDescriptor}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzingPhoto}
                    className="flex h-32 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span>Click to upload or paste an image</span>
                  </button>
                )}
              </div>

              {/* Only show profile fields after analysis is done */}
              {referenceAnalysis && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Occupation</p>
                    <div className="max-h-28 overflow-y-auto rounded-md border border-border/60 p-2">
                      <div className="flex flex-wrap gap-2">
                        {shownOccupations.map((opt) => (
                          <Badge
                            key={opt.value}
                            className="cursor-pointer"
                            variant={
                              refOccupation === opt.value
                                ? "default"
                                : "secondary"
                            }
                            onClick={() =>
                              setRefOccupation((prev) =>
                                prev === opt.value ? "" : opt.value,
                              )
                            }
                          >
                            {opt.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Interests</p>
                      <p className="text-xs text-muted-foreground">
                        {refInterests.length}/5 selected
                      </p>
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-md border border-border/60 p-2">
                      {shownInterests.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-muted-foreground">
                          No interest options configured.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {shownInterests.map((interest) => (
                            <Badge
                              key={interest.value}
                              className="cursor-pointer"
                              variant={
                                refInterests.includes(interest.value)
                                  ? "default"
                                  : "secondary"
                              }
                              onClick={() => toggleRefInterest(interest.value)}
                            >
                              {interest.label}
                              {interest.emoji ? ` ${interest.emoji}` : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <SheetFooter className="px-4 pb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isGenerating || isAnalyzingPhoto}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerateFromReference}
                disabled={isGenerating || !canGenerateReference}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Generate from Reference
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
