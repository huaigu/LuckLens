import { NextRequest, NextResponse } from 'next/server';

// Market sentiment analysis based on various indicators
interface MarketContext {
  sentiment: 'extremely_bullish' | 'bullish' | 'neutral' | 'bearish' | 'extremely_bearish';
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  trend: 'strong_up' | 'up' | 'sideways' | 'down' | 'strong_down';
  description: string;
  marketData?: {
    btcDominance: number;
    ethDominance: number;
    marketCapChange24h: number;
    totalMarketCap: number;
  };
}

// CoinGecko API response interface
interface CoinGeckoGlobalResponse {
  data: {
    market_cap_percentage: {
      btc: number;
      eth: number;
      [key: string]: number;
    };
    market_cap_change_percentage_24h_usd: number;
    total_market_cap: {
      usd: number;
    };
  };
}

// Cache for market data (1 hour cache)
let marketDataCache: {
  data: MarketContext | null;
  timestamp: number;
  expiresIn: number;
} = {
  data: null,
  timestamp: 0,
  expiresIn: 1000 * 60 * 60, // 1 hour cache
};

// Fetch real market data from CoinGecko API
async function fetchCoinGeckoData(): Promise<CoinGeckoGlobalResponse | null> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LuckLens-App/1.0'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch CoinGecko data:', error);
    return null;
  }
}

// Analyze market sentiment based on real data
function analyzeMarketSentiment(marketCapChange24h: number, btcDominance: number): {
  sentiment: MarketContext['sentiment'];
  volatility: MarketContext['volatility'];
  trend: MarketContext['trend'];
} {
  let sentiment: MarketContext['sentiment'];
  let volatility: MarketContext['volatility'];
  let trend: MarketContext['trend'];

  // Determine sentiment based on 24h market cap change
  if (marketCapChange24h > 5) {
    sentiment = 'extremely_bullish';
  } else if (marketCapChange24h > 2) {
    sentiment = 'bullish';
  } else if (marketCapChange24h > -2) {
    sentiment = 'neutral';
  } else if (marketCapChange24h > -5) {
    sentiment = 'bearish';
  } else {
    sentiment = 'extremely_bearish';
  }

  // Determine volatility based on absolute change
  const absChange = Math.abs(marketCapChange24h);
  if (absChange > 8) {
    volatility = 'extreme';
  } else if (absChange > 4) {
    volatility = 'high';
  } else if (absChange > 1) {
    volatility = 'medium';
  } else {
    volatility = 'low';
  }

  // Determine trend based on market cap change
  if (marketCapChange24h > 3) {
    trend = 'strong_up';
  } else if (marketCapChange24h > 0.5) {
    trend = 'up';
  } else if (marketCapChange24h > -0.5) {
    trend = 'sideways';
  } else if (marketCapChange24h > -3) {
    trend = 'down';
  } else {
    trend = 'strong_down';
  }

  return { sentiment, volatility, trend };
}

// Get market data with caching
async function getMarketData(): Promise<MarketContext> {
  // Check cache first
  const now = Date.now();
  if (marketDataCache.data && (now - marketDataCache.timestamp) < marketDataCache.expiresIn) {
    return marketDataCache.data;
  }

  // Fetch fresh data from CoinGecko
  const coinGeckoData = await fetchCoinGeckoData();

  if (coinGeckoData?.data) {
    const { market_cap_percentage, market_cap_change_percentage_24h_usd, total_market_cap } = coinGeckoData.data;

    const btcDominance = market_cap_percentage.btc || 0;
    const ethDominance = market_cap_percentage.eth || 0;
    const marketCapChange24h = market_cap_change_percentage_24h_usd || 0;
    const totalMarketCap = total_market_cap.usd || 0;

    const { sentiment, volatility, trend } = analyzeMarketSentiment(marketCapChange24h, btcDominance);

    // Generate description based on real data
    let description = '';
    switch (sentiment) {
      case 'extremely_bullish':
        description = `Crypto markets are surging with ${marketCapChange24h.toFixed(2)}% growth in 24h`;
        break;
      case 'bullish':
        description = `Positive momentum building with ${marketCapChange24h.toFixed(2)}% market cap increase`;
        break;
      case 'neutral':
        description = `Markets consolidating with ${marketCapChange24h.toFixed(2)}% change, mixed signals`;
        break;
      case 'bearish':
        description = `Selling pressure evident with ${marketCapChange24h.toFixed(2)}% market decline`;
        break;
      case 'extremely_bearish':
        description = `Heavy selling across markets with ${marketCapChange24h.toFixed(2)}% drop in 24h`;
        break;
    }

    description += `. BTC dominance at ${btcDominance.toFixed(1)}%, ETH at ${ethDominance.toFixed(1)}%. Total market cap: $${(totalMarketCap / 1e12).toFixed(2)}T. Volatility is ${volatility} with ${trend.replace('_', ' ')} trend.`;

    const marketContext: MarketContext = {
      sentiment,
      volatility,
      trend,
      description,
      marketData: {
        btcDominance,
        ethDominance,
        marketCapChange24h,
        totalMarketCap
      }
    };

    // Update cache
    marketDataCache = {
      data: marketContext,
      timestamp: now,
      expiresIn: marketDataCache.expiresIn,
    };

    return marketContext;
  } else {
    // Fallback to simulated data if CoinGecko API fails
    console.warn('CoinGecko API unavailable, using fallback data');
    return getFallbackMarketData();
  }
}

// Fallback market data when CoinGecko API is unavailable
function getFallbackMarketData(): MarketContext {
  const sentiments = ['extremely_bullish', 'bullish', 'neutral', 'bearish', 'extremely_bearish'] as const;
  const volatilities = ['low', 'medium', 'high', 'extreme'] as const;
  const trends = ['strong_up', 'up', 'sideways', 'down', 'strong_down'] as const;

  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  const volatility = volatilities[Math.floor(Math.random() * volatilities.length)];
  const trend = trends[Math.floor(Math.random() * trends.length)];

  let description = '';

  switch (sentiment) {
    case 'extremely_bullish':
      description = 'Markets showing strong bullish signals (simulated data)';
      break;
    case 'bullish':
      description = 'Positive momentum building across crypto markets (simulated data)';
      break;
    case 'neutral':
      description = 'Markets consolidating with mixed signals (simulated data)';
      break;
    case 'bearish':
      description = 'Selling pressure mounting in crypto markets (simulated data)';
      break;
    case 'extremely_bearish':
      description = 'Heavy selling pressure across markets (simulated data)';
      break;
  }

  description += `. Volatility is ${volatility} with ${trend.replace('_', ' ')} trend.`;

  return {
    sentiment,
    volatility,
    trend,
    description
  };
}

export async function GET() {
  try {
    const marketContext = await getMarketData();
    return NextResponse.json(marketContext);
  } catch (error) {
    console.error('Market context error:', error);

    // Return fallback data instead of error
    const fallbackContext = getFallbackMarketData();
    return NextResponse.json(fallbackContext);
  }
}

// Future integration points for real market data:
/*
Example integrations to add:

1. CoinGecko API:
   - Global market cap changes
   - Bitcoin dominance
   - Top gainers/losers

2. Fear & Greed Index:
   - Current fear/greed level
   - Historical comparison

3. Altcoin Season Index:
   - Whether alts are outperforming BTC

4. Social Sentiment:
   - Twitter/X sentiment analysis
   - Reddit crypto discussions
   - Google Trends for crypto terms

5. Technical Indicators:
   - RSI levels for major coins
   - Moving average positions
   - Support/resistance levels

6. On-chain Metrics:
   - Exchange inflows/outflows
   - Whale movements
   - Network activity

Sample API calls:
- https://api.coingecko.com/api/v3/global
- https://api.alternative.me/fng/
- https://api.blockchaincenter.net/altcoin-season-index/
*/
