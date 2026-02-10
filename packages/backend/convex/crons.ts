import { cronJobs } from "convex/server";

const crons = cronJobs();

// Auto-generate one new system profile every 6 hours.
crons.interval(
  "auto generate ai profile",
  { hours: 6 },
  "features/ai/profileGeneration:enqueueCronProfileGeneration" as any,
  {},
);

export default crons;
