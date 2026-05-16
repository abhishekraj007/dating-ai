#!/usr/bin/env node
/**
 * Generate an Apple client secret JWT and set it in Convex automatically.
 *
 * Usage:
 *   node scripts/generate-apple-secret.mjs \
 *     --key-file ./AuthKey_web.p8 \
 *     --key-id VS4T668T95 \
 *     --team-id 27F5D9N82L \
 *     --client-id com.noosperai.feelchat.web
 *
 * Add --set to automatically update the Convex env var:
 *   node scripts/generate-apple-secret.mjs ... --set
 *
 * The generated JWT is valid for 180 days (Apple's max).
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { importPKCS8, SignJWT } from "jose";

function parseArgs(argv) {
  const args = {};
  const flags = new Set();
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--set") {
      flags.add("set");
      continue;
    }
    const key = argv[i]?.replace(/^--/, "");
    const val = argv[i + 1];
    if (key && val && !val.startsWith("--")) {
      args[key] = val;
      i++;
    }
  }
  return { args, flags };
}

const { args, flags } = parseArgs(process.argv);

const keyFile = args["key-file"];
const keyId = args["key-id"];
const teamId = args["team-id"];
const clientId = args["client-id"] || "com.noosperai.feelchat.web";

if (!keyFile || !keyId || !teamId) {
  console.error(
    "Usage: node scripts/generate-apple-secret.mjs \\\n" +
      "  --key-file ./AuthKey_web.p8 \\\n" +
      "  --key-id VS4T668T95 \\\n" +
      "  --team-id 27F5D9N82L \\\n" +
      "  --client-id com.noosperai.feelchat.web\n\n" +
      "Add --set to automatically update Convex env var.",
  );
  process.exit(1);
}

const privateKey = readFileSync(keyFile, "utf-8");
const key = await importPKCS8(privateKey, "ES256");
const now = Math.floor(Date.now() / 1000);

const secret = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: keyId })
  .setIssuer(teamId)
  .setSubject(clientId)
  .setAudience("https://appleid.apple.com")
  .setIssuedAt(now)
  .setExpirationTime(now + 180 * 24 * 60 * 60)
  .sign(key);

const expiresAt = new Date((now + 180 * 24 * 60 * 60) * 1000);

console.log("\n--- Apple Client Secret (JWT) ---\n");
console.log(secret);
console.log(`\nExpires: ${expiresAt.toISOString()}`);

if (flags.has("set")) {
  console.log("\nSetting APPLE_CLIENT_SECRET in Convex...");
  try {
    execSync(`npx convex env set APPLE_CLIENT_SECRET '${secret}'`, {
      stdio: "inherit",
    });
    console.log("Done. APPLE_CLIENT_SECRET updated in Convex.");
  } catch (e) {
    console.error("Failed to set Convex env var. Set it manually:");
    console.log(`  npx convex env set APPLE_CLIENT_SECRET '${secret}'`);
  }
} else {
  console.log(
    "\nTo auto-set in Convex, re-run with --set flag, or manually:\n" +
      `  npx convex env set APPLE_CLIENT_SECRET '<paste-above>'`,
  );
}

console.log(`\nReminder: regenerate before ${expiresAt.toLocaleDateString()}`);
