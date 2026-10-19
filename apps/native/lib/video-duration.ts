export const VIDEO_DURATION_OPTIONS = [5, 10, 15] as const;

export type VideoDuration = (typeof VIDEO_DURATION_OPTIONS)[number];

export const DEFAULT_VIDEO_DURATION: VideoDuration = 5;

const VIDEO_DURATION_CREDIT_COSTS: Record<VideoDuration, number> = {
  5: 200,
  10: 400,
  15: 600,
};

export function normalizeVideoDuration(
  value: number | null | undefined,
): VideoDuration {
  return value === 10 || value === 15 ? value : DEFAULT_VIDEO_DURATION;
}

export function videoCreditCost(duration: VideoDuration): number {
  return VIDEO_DURATION_CREDIT_COSTS[duration];
}
