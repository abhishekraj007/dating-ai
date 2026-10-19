# Telegram Integration Plan

Branch: `feat/telegram-integration` (worktree: `/Users/abhishekraj/.local/share/opencode/worktree/801ec1/telegram-integration`)

## 1. Goal

Let users chat with their AI characters on Telegram:

- A "Continue on Telegram" link on each character (profile screen and chat menu).
- The chat runs through the same Convex backend: same character personality, same conversation memory, same relationship level, same credits, same media tools.
- Telegram is a second client for the existing chat system, not a separate product.

Not in scope: WhatsApp (policy-blocked: WhatsApp Business Messaging Policy prohibits dating services and adult products/services), voice notes (voice generation is still a TODO in `features/ai/actions.ts`), streaming drafts, group support, Telegram Stars monetization, web app.

## 2. Why Telegram (constraints confirmed from official docs, Oct 2026)

- Deep links support `https://t.me/<bot>?start=<payload>` with a payload up to 64 chars (base64url recommended).
- Bots may message a user any time after the user pressed Start. No 24h window, no templates, free.
- `createForumTopic` / `editForumTopic` allow private-chat topics (one topic per character) — this is the scalable per-character identity model. Telegram documents this for AI bots.
- Bots have `setMyName`, `setMyDescription`, `setMyProfilePhoto` (per-character bots possible later).
- Telegram Bot Platform documents explicitly welcome third-party AI bots.
- Rate limits: about 30 messages/second globally, about 1 message/second per chat.
- Risk to verify: private topics availability/eligibility in BotFather for our bot, and the 15% Telegram Stars fee on Stars purchases while topics are enabled (irrelevant unless we monetize through Stars inside the bot).

## 3. Decisions

1. **One shared bot** (e.g. `@feelchat_ai_bot`), one Telegram DM per user, **one private-chat topic per character**.
   - Fallback if topics are not available: single DM, sticky "active character" per user with a `/switch` command showing linked characters; all conversations still stored per character server-side.
2. **Same `aiConversations` row as the app** (keyed by `userId + aiProfileId`). Memory, credits, level, and media stay shared across clients.
3. **Transport: thin in-house Bot API client** (`fetch` calls) instead of the community `convex-telegram` component (v0.1.2, very young, single-token). We only need ~8 Bot API methods; a local client is ~150 LOC and gives full control over webhook timing and scheduling. The component remains an option if we want typed API types later.
4. **Webhook on the Convex deployment** (`https://<deployment>.convex.site/telegram/webhook`), verify `X-Telegram-Bot-Api-Secret-Token`, persist the raw update, return 200 fast, process asynchronously.
5. **SFW by default on Telegram.** Extend `nsfwEnabledPlatforms` with `"telegram"` but leave it off until reviewed.
6. **Link-first onboarding.** A Telegram user must be a linked app user (link token carries `userId`). No anonymous accounts created from Telegram in the MVP.

## 4. Data model additions (`packages/backend/convex/schema.ts`)

```ts
channelLinks: {
  platform: "telegram",
  platformUserId: string,        // Telegram user id
  platformChatId: string,        // Telegram private chat id
  linkId derived per character?  // see channelThreads
  userId: string,                // Better Auth user id
  status: "active" | "revoked",
  createdAt: number,
  updatedAt: number,
}
  .index("by_platform_and_platform_user", ["platform", "platformUserId"])
  .index("by_user", ["userId"])

channelLinkTokens: {
  tokenHash: string,             // SHA-256 of the raw token
  userId: string,
  aiProfileId: Id<"aiProfiles">,
  expiresAt: number,             // 15 minutes
  usedAt?: number,
  createdAt: number,
}
  .index("by_token_hash", ["tokenHash"])

channelThreads: {                // maps character <-> Telegram topic <-> conversation
  platform: "telegram",
  platformChatId: string,
  topicId?: number,              // Telegram message_thread_id
  userId: string,
  aiProfileId: Id<"aiProfiles">,
  conversationId: Id<"aiConversations">,
  activeCharacter: boolean,      // fallback single-DM mode: which char is active
  createdAt: number,
  updatedAt: number,
}
  .index("by_platform_and_chat", ["platform", "platformChatId"])
  .index("by_chat_and_topic", ["platformChatId", "topicId"])
  .index("by_user_and_profile", ["userId", "aiProfileId"])

telegramUpdates: {               // idempotency + debugging
  updateId: number,
  receivedAt: number,
  status: "received" | "processed" | "failed",
  messagePreview?: string,       // truncated, for debugging
  error?: string,
}
  .index("by_update_id", ["updateId"])

channelDeliveries: {             // one row per channel-origin prompt
  platform: "telegram",
  platformChatId: string,
  topicId?: number,
  userId: string,
  aiProfileId: Id<"aiProfiles">,
  conversationId: Id<"aiConversations">,
  promptMessageId: string,
  responseOrder?: number,
  kind: "chat" | "opening",
  status: "pending" | "text_sent" | "completed" | "failed",
  attempts: number,
  lastError?: string,
  createdAt: number,
  updatedAt: number,
}
  .index("by_prompt_message", ["promptMessageId"])
  .index("by_status", ["status"])
```

Existing table tweaks:

- `chatImages` / `chatVideos`: add optional `channelDeliveryId: v.optional(v.id("channelDeliveries"))` so media completion can be delivered to the right chat.
- Extend platform unions with `"telegram"` (see checklist in section 9).

## 5. Backend files

New folder `packages/backend/convex/features/telegram/`:

| File | Contents |
| --- | --- |
| `client.ts` | `callTelegram(method, payload)` using `process.env.TELEGRAM_BOT_TOKEN`; helpers: `sendMessage`, `sendPhoto`, `sendVideo`, `sendChatAction`, `createForumTopic`, `editForumTopic`, `deleteForumTopic`, `setMyCommands`, `setWebhook`. Throws typed errors; never logs the token. |
| `http.ts` | `telegramWebhookHandler` httpAction: method check, secret header check (`TELEGRAM_WEBHOOK_SECRET`), JSON parse, `ctx.runMutation(internal.features.telegram.webhook.recordUpdate, ...)`, `ctx.scheduler.runAfter(0, internal.features.telegram.webhook.processUpdate, ...)`, return 200. Non-POST → 405, bad secret → 401. |
| `webhook.ts` | `recordUpdate` (internalMutation, `telegramUpdates` insert, skips duplicates by `updateId`), `processUpdate` (internalAction: route commands and messages, see section 6). |
| `linking.ts` | `createLinkToken` (public mutation, auth required; returns `{ url, botUsername }`), `getLinkStatus` (public query by aiProfileId), `unlinkTelegram` (public mutation), internal `consumeLinkToken`, `ensureConversationForTelegram`. |
| `delivery.ts` | `deliverReply` (internalAction), `deliverMedia` (internalAction), `refreshTyping` (internalAction), splitting + sending helpers. |
| `queries.ts` | `getTelegramConfig` public query → `{ enabled, botUsername }` for the app. |
| `setup.ts` | internal actions: `setupWebhook` (calls `setWebhook` with secret + `allowed_updates: ["message"]`), `setupCommands` (`setMyCommands` for `/start`, `/help`, `/unlink`, `/privacy`). Run once per deployment. |

Modified files:

- `packages/backend/convex/http.ts`: register `POST /telegram/webhook`.
- `packages/backend/convex/features/ai/mutations.ts`:
  - Extract the body of `sendMessage` into `sendUserMessageInternal({ userId, conversationId, content, platform, channelDelivery })` (internalMutation). Public `sendMessage` authenticates then delegates. Telegram path calls the internal variant.
  - `startConversation`: add an internal variant that accepts a channel context so the opening message can be delivered to Telegram.
  - `updateChatImageRequest` / `updateChatVideoRequest`: on `status: "completed"`, if the row has `channelDeliveryId`, schedule `deliverMedia`.
- `packages/backend/convex/features/ai/actions.ts`:
  - `generateResponse`: accept optional `channelDelivery: v.optional(v.object({ platform, chatId, topicId }))`; pass it into `createChatImageRequestInternal` / `createChatVideoRequestInternal`; at each exit path (success, media tool found, all-providers-failed, cancelled) schedule `deliverReply` for the delivery row.
  - `generateOpeningMessage`: same delivery hook for `kind: "opening"`.
- `packages/backend/convex/features/ai/internalQueries.ts`: lookup helpers (delivery by prompt message, messages by thread + order).
- `packages/backend/convex/features/appConfig/*`: extend `NsfwPlatform` and validators with `"telegram"`.
- `.env.example`: add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`.

## 6. Flows

### 6.1 Linking (app → Telegram)

1. User taps "Continue on Telegram" on a character (profile screen or chat menu).
2. App calls `channels.createLinkToken({ aiProfileId })`:
   - 32 random bytes, base64url (43 chars — fits the 64-char start payload limit).
   - Store SHA-256 hash, `userId`, `aiProfileId`, 15-minute expiry.
   - Return `https://t.me/<botUsername>?start=<token>`.
3. App opens the URL with `Linking.openURL` from `expo-linking`.
4. Bot receives `/start <token>`:
   - Hash and look up the token; reject if missing, used, or expired (friendly message with instructions).
   - Mark used; upsert `channelLinks`.
   - Ensure `aiConversations` via existing conversation logic; call `generateOpeningMessage` if the thread is empty.
   - Create a topic named after the character when topics are enabled (store `topicId` in `channelThreads`); otherwise set it active in single-DM fallback mode.
   - Send a short welcome in the topic ("Hey, it's {name}. Say hi."), and deliver the opening message when ready.
5. `/start` without a token: welcome text + instructions ("Open FeelChat, go to {name}, tap Continue on Telegram") and `/help`.
6. `/start` with an expired token: ask the user to generate a new link in the app.

### 6.2 Inbound message

1. Webhook persists the update, schedules `processUpdate`.
2. Resolve link by `chat.id`; if none, reply with a "connect your account" message and stop.
3. Resolve character: `message_thread_id` → `channelThreads` by topic; fallback mode → active character; if no active character, show an inline keyboard with the user's linked characters (`/switch`).
4. Rate limit per user (existing `@convex-dev/rate-limiter`); cap message length.
5. Call `sendUserMessageInternal` with `platform: "telegram"`, `channelDelivery` info. This keeps credits, free messages, `messageCount`, relationship level, and media detection identical to the app.
6. If credits are insufficient, the existing `credits_required` message is saved to the thread; delivery translates it to a Telegram message plus a link back to the app (deep link or store URL).
7. Non-text messages (MVP): reply "Text only for now" and log.
8. Commands: `/help`, `/unlink` (revoke `channelLinks`, delete topic mappings via `deleteForumTopic` when possible, stop), `/privacy` (link to the privacy policy URL).

### 6.3 Outbound delivery

1. `sendUserMessageInternal` creates a `channelDeliveries` row (`kind: "chat"`, status `pending`) before scheduling `generateResponse`.
2. `generateResponse` runs unchanged, then schedules `deliverReply({ deliveryId, responseOrder })` on every exit path (success, media tool found, failure, cancelled).
3. `deliverReply`:
   - Loads the delivery + assistant messages for the thread at `responseOrder` (skip tool-call parts).
   - Splits text with the same rules as `splitReplyIntoBubbles` in `apps/native/hooks/dating/useMessages.ts` (extract the pure function into `packages/backend/convex/features/ai/replyBubbles.ts`, import it from the native hook, keep one implementation).
   - Sends each bubble as a separate `sendMessage`, staggered ~1.1s via `ctx.scheduler.runAfter` to respect the per-chat 1 msg/s limit. Messages over 4096 chars are hard-split.
   - Plain text (no parse_mode) in the MVP; escaping-free and safe.
   - Mark `text_sent`; `completed` once media (if any) is delivered.
4. Typing indicator: while a delivery is pending, a `refreshTyping` action repeats `sendChatAction("typing")` every ~4s, max ~60s.
5. Media:
   - `createChatImageRequestInternal` / `createChatVideoRequestInternal` receive `channelDeliveryId` when the prompt came from Telegram.
   - When `updateChatImageRequest` / `updateChatVideoRequest` reaches `completed`, schedule `deliverMedia`: `sendPhoto` / `sendVideo` using an accessible URL (see risks: R2 signed URLs) plus the caption from the assistant message.
   - `failed` media → one short fallback line ("couldn't take that selfie right now, try again").
6. Provider failure (`all providers failed`): deliver a short "connection glitch, try again" message; the existing in-app retry flow is unchanged.
7. `generateOpeningMessage` schedules `deliverReply` for `kind: "opening"` deliveries.

## 7. Native app changes

- `apps/native/hooks/use-telegram-link.ts`: wraps `getTelegramConfig`, `getLinkStatus`, `createLinkToken`, `Linking.openURL`, loading/error state; a small `TelegramLinkSheet`/row component (heroui-native `Button`, `Card`, `Spinner`).
- Placement:
  - `apps/native/app/(root)/(main)/profile/[id].tsx`: "Continue on Telegram" action for the character.
  - `apps/native/app/(root)/(main)/chat/[id].tsx`: entry in the existing header `Popover` (next to chat language / video duration / clear chat) and/or a one-time hint card.
- Show "Connected" state (with unlink) when `getLinkStatus` reports an active link for that character.
- Translation entries in `apps/native/lib/i18n/messages/*.json` for all supported languages.
- Render only when `getTelegramConfig().enabled` is true.

## 8. Config and BotFather setup

Convex env vars (dev and prod deployments):

- `TELEGRAM_BOT_TOKEN` (BotFather)
- `TELEGRAM_WEBHOOK_SECRET` (random string, never committed)
- `TELEGRAM_BOT_USERNAME` (public, used for deep links)

BotFather steps (documented in the PR, not automated):

1. Create the bot; set name, description, profile photo.
2. Enable "Topics in private chats" (verify eligibility; this is the one external unknown).
3. Set the privacy policy URL and commands (`/start`, `/help`, `/unlink`, `/privacy`).
4. Run `internal.features.telegram.setup.setupWebhook` + `setupCommands` once per deployment (they use `CONVEX_SITE_URL` to build the webhook URL).

## 9. Platform union extension checklist

Extend the `"ios" | "android" | "web"` unions with `"telegram"`:

- `packages/backend/convex/schema.ts` (chatImages.platform ~L272, chatVideos.platform ~L307, appConfig.nsfwEnabledPlatforms ~L534)
- `packages/backend/convex/features/ai/actions.ts` (~L187), `mutations.ts` (~L221)
- `packages/backend/convex/features/appConfig/shared.ts` (`NsfwPlatform`), `queries.ts` (~L17), `mutations.ts` (~L27)
- `packages/backend/convex/features/ai/chatMediaGeneration.ts` (~L223)
- `apps/admin/src/app/app-config/page.tsx` (add a "Telegram" NSFW toggle next to iOS/Android/Web, ~L377-389)
- Do **not** add Telegram to `aiProfiles.visibleOn` (that field is client visibility, not chat platforms).

## 10. Compliance and safety

- Link tokens: hashed, single-use, 15-minute expiry.
- Webhook: secret header check, duplicate `updateId` rejection, always fast 200.
- Only linked users get replies; no unsolicited messages; `/unlink` is honored immediately.
- Account deletion (`apps/native/hooks/use-delete-account.ts` → better-auth `deleteUser`): add channel cleanup — revoke `channelLinks`, delete `channelThreads` and pending deliveries for that user. Find the existing user-deletion cleanup path (better-auth hooks or server-side) and extend it; if no hook exists, add a scheduled cleanup for orphaned links.
- Telegram Bot Developer ToS: privacy policy required (link it in BotFather), delete user data on request, no scraping/public-content dataset use for AI, no impersonation of real people (audit character names/faces), no spam.
- NSFW: `nsfwEnabledPlatforms` gates generation per platform; Telegram starts disabled. The bot must not advertise NSFW; 18+ gates stay in-app.
- Logs: never log the bot token; truncate message previews in `telegramUpdates`.

## 11. Testing

- `convex-test`: link token create/consume/expire/reuse; duplicate update idempotency; thread/topic resolution; bubble splitting; delivery on success, failure, and media completion; credits exhaustion message.
- Manual dev loop: create a dev bot, point its webhook at the dev deployment, link two test Telegram accounts, verify text, image, and video flows, `/unlink`, and app↔Telegram history sharing.
- `pnpm check-types` from the repo root.

## 12. Phases

- **Phase 0** — Bot creation + transport skeleton: schema, webhook, client, `setupWebhook`, echo/ping verification. No chat logic.
- **Phase 1** — Linking + text chat: link tokens, `/start`, `sendUserMessageInternal` refactor, `channelDeliveries`, `deliverReply`, credits handling, opening message, commands.
- **Phase 2** — Topics + app UI: private topics, `channelThreads` mapping, `/switch` fallback, profile/chat buttons, i18n, connected state.
- **Phase 3** — Media: image/video delivery hooks, R2 URL strategy, typing indicators, failure fallbacks.
- **Phase 4** — Hardening: rate limiting tuning, account deletion cleanup, admin enable/disable flag in `appConfig`, analytics counters, privacy policy update.

## 13. Risks and open questions

1. **Private topics availability** — verify in BotFather; fallback is the `/switch` single-DM mode. The 15% Stars fee only matters if we sell Stars inside the bot (we do not, in the MVP).
2. **R2 signed URLs** — Telegram must fetch media URLs; if signed URLs expire too fast, reuse the existing `/ai-profiles/avatar` proxy pattern to add a stable Telegram-safe media URL.
3. **Concurrency** — app and Telegram can prompt the same conversation at once. `pendingPromptMessageId` allows one response at a time; decide whether a Telegram message is rejected ("wait a second") or queued while one is pending.
4. **Per-character bots later** — BotFather caps bots per account (about 20, extensible on request); Telegram Managed Bots require per-bot owner confirmation. Topics remain the scalable path.
5. **Branding** — bot username/name must not imply Telegram affiliation and must not impersonate real people.
6. **Privacy policy** — must describe Telegram linking data; update the existing policy before launch.

## 14. Appendix: `@convex-dev/mcp` evaluation

`@convex-dev/mcp` (alpha 0.1.0-alpha.7, official Convex org) turns a Convex app into an **MCP server** so *users' external AI agents* (Claude, ChatGPT, Cursor, Claude Code) can call app tools over OAuth with a consent page.

Verdict for this plan: **not useful for Telegram integration.** It has no overlap with the Bot API, webhooks, message threads, or delivery. It is a distribution channel of its own ("chat with your characters from Claude/ChatGPT"), which is a separate future initiative, and it is still alpha. Do not add it to this branch.
