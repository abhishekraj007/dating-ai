import { cronJobs } from "convex/server";

const crons = cronJobs();

// Auto-generate one new system profile every 6 hours.
crons.interval(
  "auto generate ai profile",
  { hours: 72 },
  "features/ai/profileGeneration:enqueueCronProfileGeneration" as any,
  {},
);

// Clean up terminal generation jobs older than retention window.
crons.interval(
  "cleanup old ai profile generation jobs",
  { hours: 24 },
  "features/ai/profileGeneration:cleanupOldProfileGenerationJobsInternal" as any,
  {},
);

export default crons;
