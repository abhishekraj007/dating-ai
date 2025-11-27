import { useQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";

export interface AgeRangeOption {
  value: string;
  label: string;
  min: number;
  max: number;
}

export interface GenderOption {
  value: string;
  label: string;
}

export interface ZodiacOption {
  value: string;
  label: string;
}

export interface InterestOption {
  value: string;
  label: string;
  emoji: string;
}

export interface FilterOptions {
  ageRanges: AgeRangeOption[];
  genders: GenderOption[];
  zodiacSigns: ZodiacOption[];
  interests: InterestOption[];
}

/**
 * Hook to get filter options from the database
 * Returns all filter categories: age ranges, genders, zodiac signs, and interests
 */
export function useFilterOptions() {
  const options = useQuery(api.features.filters.queries.getFilterOptions);

  return {
    options: options ?? {
      ageRanges: [],
      genders: [],
      zodiacSigns: [],
      interests: [],
    },
    isLoading: options === undefined,
  };
}
