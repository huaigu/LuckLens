# AI Integration with OpenRouter and DeepSeek V3

This document explains the AI integration for dynamic crypto fortune generation using Vercel AI SDK, OpenRouter, and DeepSeek V3 free model.

## Overview

The application now dynamically generates crypto fortune content using AI instead of static arrays. This includes:
- Fortune categories with DO/DON'T actions and luck scores
- Crypto wisdom proverbs
- Market context-aware content generation

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY="your_openrouter_api_key_here"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
DEEPSEEK_MODEL="deepseek/deepseek-chat"
```

### 2. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

### 3. Install Dependencies

The required dependencies are already installed:
- `ai` - Vercel AI SDK
- `@ai-sdk/openai-compatible` - OpenAI-compatible client for better compatibility
- `zod` - Schema validation

## API Endpoints

### `/api/generate-fortune`

Generates fortune content with market context.

**Methods:**
- `POST` - Generate with market context
- `GET` - Generate without market context (fallback)

**Request Body (POST):**
```json
{
  "marketContext": "Markets are in euphoria mode with massive green candles everywhere"
}
```

**Response:**
```json
{
  "fortunes": [
    {
      "text": "Moonshot 🚀",
      "color": "text-green-400",
      "yi": ["Ape in", "Claim airdrop", "Hold strong"],
      "ji": ["Hesitate", "Exit too early"],
      "score": 95
    }
  ],
  "proverbs": [
    "One day in crypto, three years in the real world."
  ]
}
```

### `/api/market-context`

Provides market context for fortune generation (currently simulated).

**Method:** `GET`

**Response:**
```json
{
  "sentiment": "bullish",
  "volatility": "high",
  "trend": "up",
  "description": "Positive momentum building with steady upward movement. Volatility is high with up trend."
}
```

### `/api/test-ai`

Test endpoint to verify AI integration is working.

**Method:** `GET`

**Response:**
```json
{
  "success": true,
  "message": "AI integration working",
  "generatedText": "Buy low, sell high, HODL strong.",
  "config": {
    "baseURL": "https://openrouter.ai/api/v1",
    "model": "deepseek/deepseek-chat",
    "hasApiKey": true
  }
}
```

## Content Generation Logic

### Fortune Structure

Each fortune contains:
- `text`: Category name with emoji (e.g., "Moonshot 🚀")
- `color`: Tailwind CSS color class for UI styling
- `yi`: Array of 2-4 short "DO" actions (2-4 words each)
- `ji`: Array of 2-4 short "DON'T" actions (2-4 words each)
- `score`: Luck score from 1-100

### Proverb Generation

- 10 crypto wisdom proverbs per generation
- 8-15 words each
- Mix of serious wisdom and crypto culture humor
- Memorable and quotable

### Caching Strategy

- Content is cached for 6 hours to reduce API calls
- Fallback to static content if generation fails
- Cache can be cleared manually for testing

## Integration Points

### Current Implementation

1. **Component Integration**: `components/lucky/CyberLuck.tsx`
   - Replaced static arrays with AI-generated content
   - Added loading states and error handling
   - Maintains existing UI structure

2. **Fortune Generator**: `lib/fortune-generator.ts`
   - Handles content generation and caching
   - Provides fallback content
   - Manages API calls and error handling

### Future Enhancements

1. **Real Market Data Integration**:
   - CoinGecko API for price data
   - Fear & Greed Index
   - Altcoin Season Index
   - Social sentiment analysis

2. **Advanced Context**:
   - User's wallet history
   - Portfolio composition
   - Trading patterns
   - Time-based variations

3. **Personalization**:
   - User preferences
   - Risk tolerance
   - Trading experience level
   - Historical fortune accuracy

## Testing

### Test AI Integration

Visit `/api/test-ai` to verify the setup:

```bash
curl http://localhost:3000/api/test-ai
```

### Test Fortune Generation

```bash
# Without market context
curl http://localhost:3000/api/generate-fortune

# With market context
curl -X POST http://localhost:3000/api/generate-fortune \
  -H "Content-Type: application/json" \
  -d '{"marketContext": "Bull market with high volatility"}'
```

### Test Market Context

```bash
curl http://localhost:3000/api/market-context
```

## Error Handling

The system includes comprehensive error handling:

1. **API Failures**: Falls back to cached or static content
2. **Invalid Responses**: Validates AI responses with Zod schemas
3. **Network Issues**: Graceful degradation to fallback content
4. **Rate Limits**: Caching reduces API calls

## Performance Considerations

1. **Caching**: 6-hour cache reduces API calls
2. **Fallback Content**: Always available for instant loading
3. **Lazy Loading**: Content loads after component initialization
4. **Error Boundaries**: Prevents crashes from AI failures

## Monitoring and Debugging

1. Check browser console for generation errors
2. Use `/api/test-ai` endpoint for connectivity testing
3. Monitor API usage in OpenRouter dashboard
4. Review server logs for detailed error information

## Cost Management

- DeepSeek V3 is free on OpenRouter
- Caching reduces API calls significantly
- Fallback content prevents excessive retries
- Consider rate limiting for production use
