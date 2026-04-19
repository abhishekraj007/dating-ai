/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiProfiles_seedProfiles from "../aiProfiles/seedProfiles.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as features_ai_actions from "../features/ai/actions.js";
import type * as features_ai_agent from "../features/ai/agent.js";
import type * as features_ai_aiProviders from "../features/ai/aiProviders.js";
import type * as features_ai_genz_profiles_data from "../features/ai/genz_profiles_data.js";
import type * as features_ai_genz_profiles_male from "../features/ai/genz_profiles_male.js";
import type * as features_ai_imageGeneration from "../features/ai/imageGeneration.js";
import type * as features_ai_index from "../features/ai/index.js";
import type * as features_ai_internalQueries from "../features/ai/internalQueries.js";
import type * as features_ai_mutations from "../features/ai/mutations.js";
import type * as features_ai_profileGen_adminGuards from "../features/ai/profileGen/adminGuards.js";
import type * as features_ai_profileGen_appearance from "../features/ai/profileGen/appearance.js";
import type * as features_ai_profileGen_blueprintSchema from "../features/ai/profileGen/blueprintSchema.js";
import type * as features_ai_profileGen_candidate from "../features/ai/profileGen/candidate.js";
import type * as features_ai_profileGen_candidateLlm from "../features/ai/profileGen/candidateLlm.js";
import type * as features_ai_profileGen_constants from "../features/ai/profileGen/constants.js";
import type * as features_ai_profileGen_images from "../features/ai/profileGen/images.js";
import type * as features_ai_profileGen_progress from "../features/ai/profileGen/progress.js";
import type * as features_ai_profileGen_prompts from "../features/ai/profileGen/prompts.js";
import type * as features_ai_profileGen_showcase from "../features/ai/profileGen/showcase.js";
import type * as features_ai_profileGen_stages from "../features/ai/profileGen/stages.js";
import type * as features_ai_profileGen_textUtils from "../features/ai/profileGen/textUtils.js";
import type * as features_ai_profileGen_types from "../features/ai/profileGen/types.js";
import type * as features_ai_profileGen_vignettes from "../features/ai/profileGen/vignettes.js";
import type * as features_ai_profileGeneration from "../features/ai/profileGeneration.js";
import type * as features_ai_profileGenerationActions from "../features/ai/profileGenerationActions.js";
import type * as features_ai_profileGenerationData from "../features/ai/profileGenerationData.js";
import type * as features_ai_profiles from "../features/ai/profiles.js";
import type * as features_ai_queries from "../features/ai/queries.js";
import type * as features_ai_r2Helpers from "../features/ai/r2Helpers.js";
import type * as features_ai_seed from "../features/ai/seed.js";
import type * as features_ai_seed_genz from "../features/ai/seed_genz.js";
import type * as features_appConfig_guards from "../features/appConfig/guards.js";
import type * as features_appConfig_index from "../features/appConfig/index.js";
import type * as features_appConfig_mutations from "../features/appConfig/mutations.js";
import type * as features_appConfig_queries from "../features/appConfig/queries.js";
import type * as features_appConfig_shared from "../features/appConfig/shared.js";
import type * as features_credits_index from "../features/credits/index.js";
import type * as features_credits_mutations from "../features/credits/mutations.js";
import type * as features_credits_pricing from "../features/credits/pricing.js";
import type * as features_credits_queries from "../features/credits/queries.js";
import type * as features_filters_queries from "../features/filters/queries.js";
import type * as features_preferences_queries from "../features/preferences/queries.js";
import type * as features_premium_admin from "../features/premium/admin.js";
import type * as features_premium_guards from "../features/premium/guards.js";
import type * as features_premium_index from "../features/premium/index.js";
import type * as features_premium_mutations from "../features/premium/mutations.js";
import type * as features_premium_queries from "../features/premium/queries.js";
import type * as features_subscriptions_actions from "../features/subscriptions/actions.js";
import type * as features_subscriptions_index from "../features/subscriptions/index.js";
import type * as features_subscriptions_mutations from "../features/subscriptions/mutations.js";
import type * as features_subscriptions_queries from "../features/subscriptions/queries.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_aiProfileAvatar from "../lib/aiProfileAvatar.js";
import type * as lib_betterAuth_component from "../lib/betterAuth/component.js";
import type * as lib_betterAuth_createAuth from "../lib/betterAuth/createAuth.js";
import type * as lib_betterAuth_index from "../lib/betterAuth/index.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_revenuecatWebhooks from "../lib/revenuecatWebhooks.js";
import type * as lib_uploadValidation from "../lib/uploadValidation.js";
import type * as migrations_addCreditsToProfiles from "../migrations/addCreditsToProfiles.js";
import type * as model_user from "../model/user.js";
import type * as privateData from "../privateData.js";
import type * as purchases from "../purchases.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as uploads from "../uploads.js";
import type * as user from "../user.js";
import type * as util from "../util.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "aiProfiles/seedProfiles": typeof aiProfiles_seedProfiles;
  auth: typeof auth;
  crons: typeof crons;
  "features/ai/actions": typeof features_ai_actions;
  "features/ai/agent": typeof features_ai_agent;
  "features/ai/aiProviders": typeof features_ai_aiProviders;
  "features/ai/genz_profiles_data": typeof features_ai_genz_profiles_data;
  "features/ai/genz_profiles_male": typeof features_ai_genz_profiles_male;
  "features/ai/imageGeneration": typeof features_ai_imageGeneration;
  "features/ai/index": typeof features_ai_index;
  "features/ai/internalQueries": typeof features_ai_internalQueries;
  "features/ai/mutations": typeof features_ai_mutations;
  "features/ai/profileGen/adminGuards": typeof features_ai_profileGen_adminGuards;
  "features/ai/profileGen/appearance": typeof features_ai_profileGen_appearance;
  "features/ai/profileGen/blueprintSchema": typeof features_ai_profileGen_blueprintSchema;
  "features/ai/profileGen/candidate": typeof features_ai_profileGen_candidate;
  "features/ai/profileGen/candidateLlm": typeof features_ai_profileGen_candidateLlm;
  "features/ai/profileGen/constants": typeof features_ai_profileGen_constants;
  "features/ai/profileGen/images": typeof features_ai_profileGen_images;
  "features/ai/profileGen/progress": typeof features_ai_profileGen_progress;
  "features/ai/profileGen/prompts": typeof features_ai_profileGen_prompts;
  "features/ai/profileGen/showcase": typeof features_ai_profileGen_showcase;
  "features/ai/profileGen/stages": typeof features_ai_profileGen_stages;
  "features/ai/profileGen/textUtils": typeof features_ai_profileGen_textUtils;
  "features/ai/profileGen/types": typeof features_ai_profileGen_types;
  "features/ai/profileGen/vignettes": typeof features_ai_profileGen_vignettes;
  "features/ai/profileGeneration": typeof features_ai_profileGeneration;
  "features/ai/profileGenerationActions": typeof features_ai_profileGenerationActions;
  "features/ai/profileGenerationData": typeof features_ai_profileGenerationData;
  "features/ai/profiles": typeof features_ai_profiles;
  "features/ai/queries": typeof features_ai_queries;
  "features/ai/r2Helpers": typeof features_ai_r2Helpers;
  "features/ai/seed": typeof features_ai_seed;
  "features/ai/seed_genz": typeof features_ai_seed_genz;
  "features/appConfig/guards": typeof features_appConfig_guards;
  "features/appConfig/index": typeof features_appConfig_index;
  "features/appConfig/mutations": typeof features_appConfig_mutations;
  "features/appConfig/queries": typeof features_appConfig_queries;
  "features/appConfig/shared": typeof features_appConfig_shared;
  "features/credits/index": typeof features_credits_index;
  "features/credits/mutations": typeof features_credits_mutations;
  "features/credits/pricing": typeof features_credits_pricing;
  "features/credits/queries": typeof features_credits_queries;
  "features/filters/queries": typeof features_filters_queries;
  "features/preferences/queries": typeof features_preferences_queries;
  "features/premium/admin": typeof features_premium_admin;
  "features/premium/guards": typeof features_premium_guards;
  "features/premium/index": typeof features_premium_index;
  "features/premium/mutations": typeof features_premium_mutations;
  "features/premium/queries": typeof features_premium_queries;
  "features/subscriptions/actions": typeof features_subscriptions_actions;
  "features/subscriptions/index": typeof features_subscriptions_index;
  "features/subscriptions/mutations": typeof features_subscriptions_mutations;
  "features/subscriptions/queries": typeof features_subscriptions_queries;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/aiProfileAvatar": typeof lib_aiProfileAvatar;
  "lib/betterAuth/component": typeof lib_betterAuth_component;
  "lib/betterAuth/createAuth": typeof lib_betterAuth_createAuth;
  "lib/betterAuth/index": typeof lib_betterAuth_index;
  "lib/constants": typeof lib_constants;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/revenuecatWebhooks": typeof lib_revenuecatWebhooks;
  "lib/uploadValidation": typeof lib_uploadValidation;
  "migrations/addCreditsToProfiles": typeof migrations_addCreditsToProfiles;
  "model/user": typeof model_user;
  privateData: typeof privateData;
  purchases: typeof purchases;
  pushNotifications: typeof pushNotifications;
  uploads: typeof uploads;
  user: typeof user;
  util: typeof util;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  polar: import("@convex-dev/polar/_generated/component.js").ComponentApi<"polar">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  pushNotifications: import("@convex-dev/expo-push-notifications/_generated/component.js").ComponentApi<"pushNotifications">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
