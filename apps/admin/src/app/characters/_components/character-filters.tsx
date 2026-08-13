"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProfileFilter = "all" | "active" | "pending" | "new";
export type GenderFilter = "all" | "female" | "male";
export type TrendingFilter = "all" | "trending" | "not_trending";

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

const STATUS_OPTIONS: FilterOption<ProfileFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "new", label: "New (24h)" },
];

const GENDER_OPTIONS: FilterOption<GenderFilter>[] = [
  { value: "all", label: "All" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const TRENDING_OPTIONS: FilterOption<TrendingFilter>[] = [
  { value: "all", label: "All" },
  { value: "trending", label: "Trending" },
  { value: "not_trending", label: "Not trending" },
];

type CharacterFiltersProps = {
  profileFilter: ProfileFilter;
  genderFilter: GenderFilter;
  trendingFilter: TrendingFilter;
  onProfileFilterChange: (value: ProfileFilter) => void;
  onGenderFilterChange: (value: GenderFilter) => void;
  onTrendingFilterChange: (value: TrendingFilter) => void;
};

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onValueChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          const match = options.find((option) => option.value === nextValue);
          if (match) {
            onValueChange(match.value);
          }
        }}
      >
        <SelectTrigger size="sm" className="min-w-[8.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CharacterFilters({
  profileFilter,
  genderFilter,
  trendingFilter,
  onProfileFilterChange,
  onGenderFilterChange,
  onTrendingFilterChange,
}: CharacterFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterSelect
        label="Status"
        value={profileFilter}
        options={STATUS_OPTIONS}
        onValueChange={onProfileFilterChange}
      />
      <FilterSelect
        label="Gender"
        value={genderFilter}
        options={GENDER_OPTIONS}
        onValueChange={onGenderFilterChange}
      />
      <FilterSelect
        label="Trending"
        value={trendingFilter}
        options={TRENDING_OPTIONS}
        onValueChange={onTrendingFilterChange}
      />
    </div>
  );
}
