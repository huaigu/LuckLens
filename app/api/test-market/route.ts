import { NextResponse } from 'next/server';

// Test endpoint to verify CoinGecko API integration
export async function GET() {
  try {
    console.log('Testing CoinGecko API integration...');
    
    // Test direct CoinGecko API call
    const response = await fetch('https://api.coingecko.com/api/v3/global', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LuckLens-App/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract key data points
    const marketData = {
      btcDominance: data.data.market_cap_percentage?.btc || 0,
      ethDominance: data.data.market_cap_percentage?.eth || 0,
      marketCapChange24h: data.data.market_cap_change_percentage_24h_usd || 0,
      totalMarketCap: data.data.total_market_cap?.usd || 0,
      totalMarketCapFormatted: `$${((data.data.total_market_cap?.usd || 0) / 1e12).toFixed(2)}T`
    };

    // Test our market context API
    let marketContextResult = null;
    try {
      const contextResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/market-context`);
      if (contextResponse.ok) {
        marketContextResult = await contextResponse.json();
      }
    } catch (error) {
      console.error('Market context API test failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'CoinGecko API integration working',
      timestamp: new Date().toISOString(),
      rawData: {
        btcDominance: marketData.btcDominance,
        ethDominance: marketData.ethDominance,
        marketCapChange24h: marketData.marketCapChange24h,
        totalMarketCap: marketData.totalMarketCapFormatted
      },
      marketContext: marketContextResult,
      analysis: {
        sentiment: marketData.marketCapChange24h > 2 ? 'bullish' : 
                  marketData.marketCapChange24h < -2 ? 'bearish' : 'neutral',
        volatility: Math.abs(marketData.marketCapChange24h) > 4 ? 'high' : 'medium',
        btcDominanceLevel: marketData.btcDominance > 45 ? 'high' : 
                          marketData.btcDominance < 40 ? 'low' : 'medium'
      }
    });

  } catch (error) {
    console.error('CoinGecko API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'CoinGecko API integration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
