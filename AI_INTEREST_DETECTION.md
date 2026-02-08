# AI Interest Detection

This feature uses OpenAI to automatically detect and suggest the most relevant interest for a post based on its content.

## How It Works

1. **As the user types**, the system monitors the post content
2. **After 20+ characters**, AI detection begins (with 1.5s debounce)
3. **OpenAI analyzes** the content against available interests
4. **If confidence ≥ 60%**, the interest is auto-selected
5. **User sees** "AI suggested" badge next to the interest dropdown

## Setup

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Navigate to API Keys
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)

### 2. Add to Environment

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important:** Never commit your `.env.local` file to git!

### 3. Restart the Development Server

```bash
npm run dev
```

## Usage

### For Users

1. **Start typing** a post in the composer
2. **Wait 1-2 seconds** after typing 20+ characters
3. **Watch** for the "AI detecting..." indicator
4. **Interest auto-selected** when detected with high confidence
5. **Override anytime** by manually selecting a different interest

### Example Posts

Here are examples that work well with AI detection:

**Technology:**
```
Just deployed my first Next.js app to production! The new App Router is amazing.
```

**Fitness:**
```
Completed my first 10K run today! Training for a half marathon next month.
```

**Music:**
```
Can't stop listening to the new album. The production quality is incredible!
```

**Business:**
```
Our startup just raised Series A! Excited to scale the team and expand to new markets.
```

## Technical Details

### API Endpoint

**POST** `/api/ai/detect-interest`

**Request:**
```json
{
  "content": "Post content here..."
}
```

**Response:**
```json
{
  "interest_id": "uuid-here",
  "interest_name": "Technology",
  "confidence": 0.85
}
```

### Model

- **Model:** `gpt-4o-mini` (fast, cost-effective)
- **Temperature:** 0.3 (focused, consistent)
- **Max Tokens:** 100 (minimal response)

### Confidence Levels

- **≥ 0.7:** High confidence (strong match)
- **0.5 - 0.7:** Medium confidence (reasonable match)
- **< 0.5:** Low confidence (no auto-selection)

Only suggestions with **≥ 0.6 confidence** trigger auto-selection.

### Debouncing

- **Minimum content:** 20 characters
- **Debounce delay:** 1.5 seconds
- **Prevents:** Excessive API calls while typing

## Cost Optimization

The system is designed to minimize API costs:

1. **Debouncing:** Only triggers after user stops typing
2. **Minimum length:** Requires 20+ characters
3. **Efficient model:** Uses `gpt-4o-mini` (cheapest)
4. **Single attempt:** No retries on detection
5. **Graceful fallback:** Works without API key

### Estimated Costs

- **Model:** GPT-4o-mini
- **Cost:** ~$0.00015 per detection
- **1000 posts:** ~$0.15
- **Very affordable** for most use cases

## Fallback Behavior

If `OPENAI_API_KEY` is not set:

- ✅ Post creation **still works**
- ✅ Manual interest selection **still works**
- ❌ AI detection **silently disabled**
- ✅ No errors shown to users

## Privacy & Security

- **Content:** Sent to OpenAI for analysis
- **No storage:** OpenAI doesn't store data by default
- **Auth required:** Only authenticated users can detect
- **Rate limiting:** Debouncing prevents abuse

## Troubleshooting

### "AI detecting..." never finishes

1. Check if `OPENAI_API_KEY` is set in `.env.local`
2. Verify API key is valid (starts with `sk-`)
3. Check browser console for errors
4. Restart dev server after adding the key

### Interest not auto-selected

This is normal if:
- Content is too short (< 20 chars)
- Confidence is low (< 60%)
- Content doesn't clearly match any interest
- User already manually selected an interest

### API rate limits

If you hit OpenAI rate limits:
1. Increase debounce delay (edit `PostComposer.tsx`)
2. Upgrade OpenAI plan
3. Disable feature temporarily

## Future Enhancements

Potential improvements:

- [ ] Cache common content patterns
- [ ] Support multiple interest suggestions
- [ ] Show confidence percentage to users
- [ ] Allow users to disable AI suggestions
- [ ] Add analytics for detection accuracy
- [ ] Support custom interests per user

## Support

For issues or questions:
1. Check OpenAI API key is valid
2. Verify environment variables loaded
3. Check browser console for errors
4. Review API logs in Vercel/hosting dashboard
