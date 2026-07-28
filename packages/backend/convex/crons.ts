import { cronJobs } from "convex/server";

const crons = cronJobs();

// Disabled: auto-generate one new system profile every 72 hours.
// Uncomment to re-enable.
// crons.interval(
//   "auto generate ai profile",
//   { hours: 72 },
//   "features/ai/profileGeneration:enqueueCronProfileGeneration" as any,
//   {},
// );

// Clean up terminal generation jobs older than retention window.
crons.interval(
  "cleanup old ai profile generation jobs",
  { hours: 24 },
  "features/ai/profileGeneration:cleanupOldProfileGenerationJobsInternal" as any,
  {},
);

export default crons;
