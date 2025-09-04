// Types for fortune data structure
export interface FortuneItem {
  text: string;
  color: string;
  yi: string[];
  ji: string[];
  score: number;
}

export interface GeneratedContent {
  fortunes: FortuneItem[];
  proverbs: string[];
}

import { AI_CONFIG } from './ai-config';

// Cache for generated content to avoid excessive API calls
let contentCache: {
  data: GeneratedContent | null;
  timestamp: number;
  expiresIn: number; // milliseconds
} = {
  data: null,
  timestamp: 0,
  expiresIn: AI_CONFIG.GENERATION.CACHE_DURATION,
};

// Fallback static content in case AI generation fails
const fallbackContent: GeneratedContent = {
  fortunes: [
    {
      text: "Moonshot 🚀",
      color: "text-green-400",
      yi: ["Ape in", "Claim airdrop", "Hold strong"],
      ji: ["Hesitate", "Exit too early"],
      score: 95
    },
    {
      text: "Bullish 💰",
      color: "text-yellow-300",
      yi: ["Watch new tokens", "Ride the trend"],
      ji: ["Overtrade", "Leverage up"],
      score: 80
    },
    {
      text: "Steady 🤖",
      color: "text-blue-300",
      yi: ["DCA", "Learn something new"],
      ji: ["FOMO buy", "Panic sell"],
      score: 60
    },
    {
      text: "Volatile ⚡",
      color: "text-orange-400",
      yi: ["Set stop-loss", "Review your plan"],
      ji: ["All-in one coin", "Emotional trade"],
      score: 40
    },
    {
      text: "Bearish 🥲",
      color: "text-red-400",
      yi: ["Take a break", "Reflect"],
      ji: ["Chase pumps", "Buy the dip blindly"],
      score: 20
    },
    {
      text: "Cautious 🧊",
      color: "text-cyan-300",
      yi: ["Check wallet safety", "Backup keys"],
      ji: ["Trust rumors", "Forget backup"],
      score: 30
    },
  ],
  proverbs: [
    "One day in crypto, three years in the real world.",
    "Don't fear buying in, don't panic selling out.",
    "If you don't harvest the leeks, there will be more next year.",
    "Stay calm in the bear, stay humble in the bull.",
    "No matter how much you gain, always secure profits.",
    "Lose money on rumors, win on trends.",
    "Invest within your means, it's not about the number of coins.",
    "Everything can go to zero, only your private key lasts forever.",
    "HODL till dawn, survive the night.",
    "Sideways markets reveal wisdom, pumps reveal human nature."
  ]
};

// Generate fresh content with market context
export async function generateFortuneContent(useMarketContext: boolean = true): Promise<GeneratedContent> {
  try {
    // Check cache first
    const now = Date.now();
    if (contentCache.data && (now - contentCache.timestamp) < contentCache.expiresIn) {
      return contentCache.data;
    }

    let marketContext = '';
    
    // Fetch market context if requested
    if (useMarketContext) {
      try {
        const marketResponse = await fetch('/api/market-context');
        if (marketResponse.ok) {
          const market = await marketResponse.json();
          marketContext = market.description;
        }
      } catch (error) {
        console.warn('Failed to fetch market context:', error);
      }
    }

    // Generate new content
    const response = await fetch('/api/generate-fortune', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ marketContext }),
    });

    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status}`);
    }

    const generatedContent = await response.json();
    
    // Validate the generated content structure
    if (!generatedContent.fortunes || !generatedContent.proverbs) {
      throw new Error('Invalid generated content structure');
    }

    // Update cache
    contentCache = {
      data: generatedContent,
      timestamp: now,
      expiresIn: contentCache.expiresIn,
    };

    return generatedContent;
  } catch (error) {
    console.error('Failed to generate fortune content:', error);
    
    // Return fallback content if generation fails
    return fallbackContent;
  }
}

// Get cached content or fallback
export function getCachedFortuneContent(): GeneratedContent {
  const now = Date.now();
  if (contentCache.data && (now - contentCache.timestamp) < contentCache.expiresIn) {
    return contentCache.data;
  }
  return fallbackContent;
}

// Clear cache (useful for testing or manual refresh)
export function clearFortuneCache(): void {
  contentCache = {
    data: null,
    timestamp: 0,
    expiresIn: contentCache.expiresIn,
  };
}

// Get a random fortune from the current content
export function getRandomFortune(content?: GeneratedContent): FortuneItem {
  const fortuneContent = content || getCachedFortuneContent();
  const randomIndex = Math.floor(Math.random() * fortuneContent.fortunes.length);
  return fortuneContent.fortunes[randomIndex];
}

// Get a random proverb from the current content
export function getRandomProverb(content?: GeneratedContent): string {
  const fortuneContent = content || getCachedFortuneContent();
  const randomIndex = Math.floor(Math.random() * fortuneContent.proverbs.length);
  return fortuneContent.proverbs[randomIndex];
}
