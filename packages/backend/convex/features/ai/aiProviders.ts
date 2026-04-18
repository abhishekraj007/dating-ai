import { createGateway } from "@ai-sdk/gateway";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// ── Shared constants ──────────────────────────────────────────────
export const AI_GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1/ai";

// ── Provider singletons ───────────────────────────────────────────
// Created once at module load and reused by every consumer
// (agent.ts, profileGenerationActions.ts, etc.).

export const gatewayProvider = process.env.AI_GATEWAY_API_KEY
  ? createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: AI_GATEWAY_BASE_URL,
    })
  : null;

export const openRouterProvider = process.env.OPENROUTER_API_KEY
  ? createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
  : null;
