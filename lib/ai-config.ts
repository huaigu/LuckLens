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
    FORTUNE_COUNT: 6,
    PROVERB_COUNT: 10,
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
    FORTUNE_GENERATION: `Generate crypto trading fortune content for today's market conditions.

{marketContext}

Create {fortuneCount} distinct fortune categories covering the spectrum from very bullish to very bearish, plus neutral/cautious positions. Each category should have:
- A catchy name with appropriate emoji
- 2-4 short actionable "DO" items (yi) - keep each item 2-4 words
- 2-4 short "DON'T" items (ji) - keep each item 2-4 words  
- A luck score (1-100) reflecting the fortune's positivity
- Appropriate color coding (green for bullish, red for bearish, etc.)

Also generate {proverbCount} crypto wisdom proverbs that are:
- {proverbMinWords}-{proverbMaxWords} words each
- Memorable and quotable
- Related to crypto trading psychology
- Mix of serious wisdom and crypto culture humor

Make all content engaging, practical, and appropriate for mobile display. Focus on trading psychology, risk management, and crypto market dynamics.`,

    MARKET_CONTEXT: `Current Market Context: {context}`,
    
    FALLBACK_GENERATION: `Generate {fortuneCount} crypto trading fortune categories and {proverbCount} crypto proverbs for general market conditions. 

Create diverse fortune types from very bullish to very bearish:
1. Ultra bullish (90-100 score) - green color
2. Bullish (70-85 score) - yellow/green color  
3. Neutral/Steady (50-65 score) - blue color
4. Volatile/Uncertain (35-50 score) - orange color
5. Bearish (15-35 score) - red color
6. Cautious/Defensive (20-40 score) - cyan color

Each fortune needs:
- Catchy name with emoji
- 2-4 short DO actions (2-4 words each)
- 2-4 short DON'T actions (2-4 words each)
- Appropriate luck score and color

Plus {proverbCount} memorable crypto proverbs ({proverbMinWords}-{proverbMaxWords} words each) mixing wisdom with crypto culture.`,
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
