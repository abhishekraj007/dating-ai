# Environment Variables Setup

## Dating AI App - Required Environment Variables

### Convex Backend (`packages/backend/.env`)

Add these variables to your `packages/backend/.env` file (create it if it doesn't exist):

```bash
# AI Gateway API Key (Vercel AI Gateway for GPT-5.1)
# Get from: https://vercel.com/docs/ai-gateway
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key_here

# Replicate API Key (for Qwen-Image and Qwen-Image-Edit)
# Get from: https://replicate.com/account/api-tokens
REPLICATE_API_KEY=your_replicate_api_key_here

# Cloudflare R2 (Already configured in your existing setup)
# Make sure these are still present:
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET_NAME=...
```

### How to Get API Keys

#### 1. Vercel AI Gateway (for GPT-5.1 Chat)

1. Go to [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
2. Create an account or sign in
3. Navigate to your project settings
4. Generate an AI Gateway API key
5. Copy the key to `AI_GATEWAY_API_KEY` in `.env`

The AI Gateway allows you to access GPT-5.1 with built-in rate limiting, caching, and cost controls.

#### 2. Replicate (for Image Generation)

1. Go to [Replicate](https://replicate.com/account/api-tokens)
2. Sign up or log in
3. Navigate to API tokens section
4. Generate a new API token
5. Copy the token to `REPLICATE_API_KEY` in `.env`

Replicate is used for:

- `qwen-image`: Generating AI profile photos
- `qwen-image-edit`: Creating custom selfies for conversations

#### 3. Cloudflare R2 (Image Storage)

Your R2 setup is already configured. Images are stored using:

- Avatar images: `{userId}/ai-images/{uuid}`
- Profile images: Generated and stored during profile creation
- Selfie images: Generated and stored during selfie requests

### Testing Your Setup

After adding the environment variables:

1. Restart your Convex dev server:

   ```bash
   cd packages/backend
   npx convex dev
   ```

2. The agent will automatically use AI Gateway for GPT-5.1 chat responses

3. Image generation will use Replicate when:
   - Creating custom AI characters (10 credits)
   - Requesting selfies from AI profiles (5 credits)

### Credit Costs

- **Text message**: 1 credit
- **Custom selfie request**: 5 credits
- **AI character creation**: 10 credits (includes image generation)
- **Quiz/Topic**: 1 credit (when implemented)

### Agent Configuration

The dating AI uses the Convex Agent component with:

- **Language Model**: `openai/gpt-5.1` (via AI Gateway)
- **Embedding Model**: `openai/text-embedding-3-small`
- **Streaming**: Real-time websocket streaming enabled
- **Memory**: Automatic conversation history with vector search
- **Tools**: `sendSelfie` tool for dynamic selfie generation

### Security Notes

- Never commit `.env` files to git
- Keep API keys secure and rotate them regularly
- Set up proper rate limits in AI Gateway
- Monitor Replicate usage to control costs
