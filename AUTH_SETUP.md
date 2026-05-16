# OAuth Setup Guide -- Google & Apple Login

Step-by-step guide for setting up Google and Apple social login using Better Auth + Convex.

---

## Environment Variables Summary

| Variable | Provider | Required for |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google | All Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Google | All Google sign-in |
| `APPLE_CLIENT_ID` | Apple | Web Apple sign-in (optional, defaults to bundle ID) |
| `APPLE_CLIENT_SECRET` | Apple | Web Apple sign-in (JWT generated from `.p8` key) |

Set all variables in Convex:
```bash
npx convex env set VARIABLE_NAME 'value'
```

---

## Part 1: Google Login

### Step 1 -- Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)

### Step 2 -- Configure the OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type, click **Create**
3. Fill in:
   - **App name**: Your app name
   - **User support email**: your email
   - **Developer contact email**: your email
4. Under **Scopes**, add: `email`, `profile`, `openid`
5. Save and continue

### Step 3 -- Create OAuth Credentials (Web)

Used by Better Auth on the server for the OAuth code exchange.

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Add **Authorized redirect URIs**:
   - `https://<your-convex-site-url>/api/auth/callback/google`
   - Any web app URLs that need Google sign-in:
     ```
     https://yourdomain.com/api/auth/callback/google
     ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Step 4 -- Create OAuth Credentials (iOS)

For native Google sign-in on iOS.

1. Click **Create Credentials > OAuth client ID** again
2. Select **iOS**
3. Set **Bundle ID**: your iOS bundle identifier
4. Click **Create**
5. Copy the **iOS Client ID** (used in your Expo/native app config)

> **Note**: The native iOS Google sign-in uses the iOS client ID on the device, but the **Web client ID and secret** are what Better Auth uses server-side. Both are needed.

### Step 5 -- Set Convex Environment Variables

```bash
npx convex env set GOOGLE_CLIENT_ID 'your-web-client-id.apps.googleusercontent.com'
npx convex env set GOOGLE_CLIENT_SECRET 'GOCSPX-your-client-secret'
```

---

## Part 2: Apple Login

Apple Sign-In has two flows: **native iOS** (handled by the OS, no client secret needed) and **web** (standard OAuth, requires client secret).

### Step 1 -- Enable Sign in with Apple on your App ID

1. Go to [Apple Developer > Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
2. Find your App ID (your iOS bundle identifier)
3. Click on it, scroll to **Capabilities**
4. Enable **Sign in with Apple**
5. Save

### Step 2 -- Create a Services ID (for web OAuth)

1. Go to **Identifiers** and click the **+** button
2. Select **Services IDs**, click **Continue**
3. Fill in:
   - **Description**: Your App Web
   - **Identifier**: `com.yourdomain.yourapp.web`
4. Click **Register**
5. Go back to the Services ID, click on it
6. Enable **Sign in with Apple**, click **Configure**
7. Set:
   - **Primary App ID**: select your app
   - **Domains and Subdomains** (bare domains, NO `https://`):
     ```
     yourdomain.com
     api.yourdomain.com
     ```
   - **Return URLs**:
     ```
     https://yourdomain.com/api/auth/callback/apple
     https://api.yourdomain.com/api/auth/callback/apple
     ```
8. Click **Save**, then **Continue**, then **Save**

### Step 3 -- Create a Sign in with Apple Key

1. Go to [Apple Developer > Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Click the **+** button
3. Set **Key Name** (e.g., "Sign In Key")
4. Enable **Sign in with Apple**
5. Click **Configure**, select your primary App ID
6. Click **Save**, then **Continue**, then **Register**
7. **Download the `.p8` key file** -- you can only download it once
8. Note the **Key ID** displayed on the page

> Store the `.p8` file securely. `*.p8` is already in `.gitignore`.

### Step 4 -- Find your Team ID

Found at the top-right of the [Apple Developer portal](https://developer.apple.com/account) or under **Membership Details**. It's a 10-character alphanumeric string.

### Step 5 -- Generate the Apple Client Secret (JWT)

Apple requires a JWT signed with your `.p8` private key as the client secret. Valid for a maximum of 6 months (Apple's limit).

Run the provided script:

```bash
node scripts/generate-apple-secret.mjs \
  --key-file ./path/to/AuthKey.p8 \
  --key-id YOUR_KEY_ID \
  --team-id YOUR_TEAM_ID \
  --client-id com.yourdomain.yourapp.web \
  --set
```

| Parameter | Description |
|---|---|
| `--key-file` | Path to the downloaded `.p8` file |
| `--key-id` | Key ID from Apple Developer Keys page |
| `--team-id` | Your 10-char Apple Team ID |
| `--client-id` | The Services ID created in Step 2 |
| `--set` | Auto-runs `npx convex env set APPLE_CLIENT_SECRET` |

Without `--set`, the script prints the JWT for manual setup.

### Step 6 -- Set Convex Environment Variables

If you used `--set` above, `APPLE_CLIENT_SECRET` is already configured. Otherwise:

```bash
npx convex env set APPLE_CLIENT_SECRET 'eyJhbGciOiJFUzI1NiIs...'
npx convex env set APPLE_CLIENT_ID 'com.yourdomain.yourapp.web'
```

> `APPLE_CLIENT_ID` is optional. If not set, defaults to the iOS bundle identifier, which works for native sign-in.

### How native vs web Apple Sign-In works

- **Native iOS**: The OS handles authentication and sends an `idToken`. Better Auth verifies it using Apple's public keys. No client secret needed.
- **Web OAuth**: Standard redirect flow. Apple sends an authorization code, Better Auth exchanges it using the client secret.

The code handles both automatically:

```ts
apple: {
  clientId: appleClientId,  // Services ID or bundle ID
  ...(appleClientSecret ? { clientSecret: appleClientSecret } : {}),
  appBundleIdentifier: "com.yourdomain.yourapp",
  audience: [clientId, bundleId],  // accepts both
},
```

---

## Renewal Schedule

| Item | Expiry | Action |
|---|---|---|
| Google Client ID/Secret | Never | None |
| Apple `.p8` key file | Never | Keep stored securely |
| Apple Client Secret JWT | 6 months | Re-run `generate-apple-secret.mjs --set` |

Set a calendar reminder ~5 months after generating the Apple secret.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Google: "redirect_uri_mismatch" | Add the exact callback URL to Google Console > Authorized redirect URIs |
| Apple: "invalid_client" | Client secret JWT expired or wrong client ID. Regenerate with the script. |
| Apple: "JWTClaimValidationFailed: unexpected aud" | `appBundleIdentifier` doesn't match. Check the value in `createAuth.ts` |
| Apple: user name missing after first sign-in | Apple only sends the name on first consent. Better Auth stores it on first auth. |
| "Invalid Origin" error | Add the domain to `trustedOrigins` in `createAuth.ts` |
