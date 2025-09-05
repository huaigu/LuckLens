// AI Configuration for OpenRouter and DeepSeek V3
export const AI_CONFIG = {
  // OpenRouter configuration
  OPENROUTER: {
    BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    API_KEY: process.env.OPENROUTER_API_KEY,
    MODEL: process.env.DEEPSEEK_MODEL || 'deepseek/deepseek-chat',
  },
  
  // Generation parameters
  GENERATION: {
    TEMPERATURE: 0.8, // Higher for more creativity
    MAX_TOKENS: 2000, // Sufficient for fortune content
    CACHE_DURATION: 1000 * 60 * 60 * 6, // 6 hours
  },
  
  // Content constraints
  CONTENT: {
    FORTUNE_COUNT: 1, // Now generating single fortune per request
    PROVERB_COUNT: 1, // Now generating single proverb per request
    MAX_YI_ITEMS: 4,
    MAX_JI_ITEMS: 4,
    MIN_SCORE: 1,
    MAX_SCORE: 100,
    PROVERB_MIN_WORDS: 8,
    PROVERB_MAX_WORDS: 15,
  },
  
  // Available colors for fortune categories
  COLORS: [
    'text-green-400',   // Very bullish
    'text-yellow-300',  // Bullish
    'text-blue-300',    // Neutral/Steady
    'text-orange-400',  // Volatile
    'text-red-400',     // Bearish
    'text-cyan-300',    // Cautious
    'text-purple-400',  // Special
    'text-pink-400',    // Alternative
  ] as const,
  
  // Prompt templates
  PROMPTS: {
    FORTUNE_GENERATION: `Generate a single crypto trading fortune based on current real-time market conditions.

CURRENT MARKET DATA:
{marketContext}

MARKET ANALYSIS INSTRUCTIONS:
- If market cap change is positive (>0%), lean towards bullish fortune with green/yellow colors
- If market cap change is negative (<0%), lean towards bearish fortune with red/orange colors
- If BTC dominance is high (>45%), focus on Bitcoin-related advice
- If BTC dominance is low (<40%), emphasize altcoin opportunities
- If volatility is high, include risk management advice
- If volatility is low, suggest accumulation strategies

Create one fortune that reflects the current market sentiment and data. The fortune should have:
- A catchy name with appropriate emoji that matches market conditions
- 2-4 short actionable "DO" items (yi) - keep each item 2-4 words, relevant to current market
- 2-4 short "DON'T" items (ji) - keep each item 2-4 words, relevant to current market risks
- A luck score (1-100) reflecting both the fortune's positivity AND current market conditions
- Color coding that matches market sentiment (green for bullish, red for bearish, etc.)

Also generate one crypto wisdom proverb that is:
- {proverbMinWords}-{proverbMaxWords} words
- Memorable and quotable
- Related to current market conditions and crypto trading psychology
- Mix of serious wisdom and crypto culture humor
- Should reference current market trends when possible

Make all content engaging, practical, and appropriate for mobile display. Focus on trading psychology, risk management, and current crypto market dynamics.

IMPORTANT: Please respond with valid JSON in the following exact format:
{
  "fortune": {
    "text": "Fortune name with emoji",
    "color": "text-green-400",
    "yi": ["DO action 1", "DO action 2"],
    "ji": ["DON'T action 1", "DON'T action 2"],
    "score": 85
  },
  "proverb": "Single crypto wisdom proverb here"
}

Use only these color values: text-green-400, text-yellow-300, text-blue-300, text-orange-400, text-red-400, text-cyan-300, text-purple-400, text-pink-400`,

    MARKET_CONTEXT: `Current Market Context: {context}`,
    
    FALLBACK_GENERATION: `Generate one crypto trading fortune and one crypto proverb for general market conditions (market data unavailable).

Create a single fortune with balanced sentiment that works in any market condition:
- Catchy name with emoji
- 2-4 short DO actions (2-4 words each) - focus on timeless trading wisdom
- 2-4 short DON'T actions (2-4 words each) - focus on common trading mistakes
- Moderate luck score (40-70) suitable for uncertain conditions
- Neutral colors (blue, cyan, purple) for balanced sentiment

Plus one memorable crypto proverb ({proverbMinWords}-{proverbMaxWords} words) mixing timeless wisdom with crypto culture.

IMPORTANT: Please respond with valid JSON in the following exact format:
{
  "fortune": {
    "text": "Fortune name with emoji",
    "color": "text-blue-300",
    "yi": ["DO action 1", "DO action 2"],
    "ji": ["DON'T action 1", "DON'T action 2"],
    "score": 55
  },
  "proverb": "Single crypto wisdom proverb here"
}

Use only these color values: text-green-400, text-yellow-300, text-blue-300, text-orange-400, text-red-400, text-cyan-300, text-purple-400, text-pink-400`,
  },
};

// Helper function to check if AI is properly configured
export function isAIConfigured(): boolean {
  return !!(
    AI_CONFIG.OPENROUTER.API_KEY &&
    AI_CONFIG.OPENROUTER.BASE_URL &&
    AI_CONFIG.OPENROUTER.MODEL
  );
}

// Helper function to get formatted prompt
export function getFortunePrompt(marketContext?: string): string {
  let prompt = AI_CONFIG.PROMPTS.FORTUNE_GENERATION;
  
  // Replace placeholders
  prompt = prompt.replace('{fortuneCount}', AI_CONFIG.CONTENT.FORTUNE_COUNT.toString());
  prompt = prompt.replace('{proverbCount}', AI_CONFIG.CONTENT.PROVERB_COUNT.toString());
  prompt = prompt.replace('{proverbMinWords}', AI_CONFIG.CONTENT.PROVERB_MIN_WORDS.toString());
  prompt = prompt.replace('{proverbMaxWords}', AI_CONFIG.CONTENT.PROVERB_MAX_WORDS.toString());
  
  // Add market context if provided
  if (marketContext) {
    const contextText = AI_CONFIG.PROMPTS.MARKET_CONTEXT.replace('{context}', marketContext);
    prompt = prompt.replace('{marketContext}', contextText);
  } else {
    prompt = prompt.replace('{marketContext}', 'Generate general crypto trading fortunes.');
  }
  
  return prompt;
}

// Helper function to get fallback prompt
export function getFallbackPrompt(): string {
  let prompt = AI_CONFIG.PROMPTS.FALLBACK_GENERATION;
  
  // Replace placeholders
  prompt = prompt.replace(/{fortuneCount}/g, AI_CONFIG.CONTENT.FORTUNE_COUNT.toString());
  prompt = prompt.replace(/{proverbCount}/g, AI_CONFIG.CONTENT.PROVERB_COUNT.toString());
  prompt = prompt.replace(/{proverbMinWords}/g, AI_CONFIG.CONTENT.PROVERB_MIN_WORDS.toString());
  prompt = prompt.replace(/{proverbMaxWords}/g, AI_CONFIG.CONTENT.PROVERB_MAX_WORDS.toString());
  
  return prompt;
}

// Type definitions for better TypeScript support
export type FortuneColor = typeof AI_CONFIG.COLORS[number];

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  marketContext?: string;
  useCache?: boolean;
}

// JSON parsing helper with fallback
export function parseAIResponse(text: string): any {
  try {
    // Try to find JSON in the response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    console.error('Raw response:', text);
    throw new Error('Invalid JSON response from AI');
  }
}

// Clean and validate AI response
export function cleanAIResponse(text: string): string {
  // Remove common markdown formatting that might interfere with JSON
  return text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*```[\s\S]*?```\s*$/g, '')
    .trim();
}
