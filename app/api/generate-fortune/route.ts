import { NextRequest, NextResponse } from 'next/server';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { AI_CONFIG, getFortunePrompt, getFallbackPrompt, isAIConfigured, parseAIResponse, cleanAIResponse } from '@/lib/ai-config';

// Type definitions for response validation
interface FortuneItem {
  text: string;
  color: string;
  yi: string[];
  ji: string[];
  score: number;
}

interface SingleFortuneResponse {
  fortune: FortuneItem;
  proverb: string;
}

// Configure OpenAI Compatible client for OpenRouter
const client = createOpenAICompatible({
  name: 'openrouter',
  baseURL: AI_CONFIG.OPENROUTER.BASE_URL,
  apiKey: AI_CONFIG.OPENROUTER.API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Check if AI is properly configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    let { marketContext } = body;

    // If no market context provided, fetch real-time market data
    if (!marketContext) {
      try {
        const marketResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/market-context`);
        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          marketContext = marketData.description;
        }
      } catch (error) {
        console.warn('Failed to fetch market context:', error);
        marketContext = 'General market conditions (market data unavailable)';
      }
    }

    // Create dynamic prompt based on market context
    const prompt = getFortunePrompt(marketContext);

    const result = await generateText({
      model: client(AI_CONFIG.OPENROUTER.MODEL),
      prompt,
      temperature: AI_CONFIG.GENERATION.TEMPERATURE,
    });

    // Clean and parse the AI response
    const cleanedResponse = cleanAIResponse(result.text);
    let parsedResponse: SingleFortuneResponse;

    try {
      parsedResponse = parseAIResponse(cleanedResponse) as SingleFortuneResponse;

      // Basic validation
      if (!parsedResponse.fortune || !parsedResponse.proverb) {
        throw new Error('Missing required fields in AI response');
      }

      if (typeof parsedResponse.proverb !== 'string' || !parsedResponse.fortune.text) {
        throw new Error('Invalid data structure in AI response');
      }

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI response:', result.text);

      // Retry with a simpler prompt
      const retryPrompt = `Generate crypto fortune data as valid JSON only. No extra text. Format:
{"fortune":{"text":"Moonshot 🚀","color":"text-green-400","yi":["Buy dip","Hold strong"],"ji":["Panic sell","FOMO buy"],"score":85},"proverb":"HODL till dawn, survive the night."}`;

      try {
        const retryResult = await generateText({
          model: client(AI_CONFIG.OPENROUTER.MODEL),
          prompt: retryPrompt,
          temperature: 0.3, // Lower temperature for more consistent output
        });

        const retryCleanedResponse = cleanAIResponse(retryResult.text);
        parsedResponse = parseAIResponse(retryCleanedResponse) as SingleFortuneResponse;

      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        return NextResponse.json(
          { error: 'Failed to generate valid fortune content' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Fortune generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate fortune content' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Fallback endpoint for testing, but still try to get market context
  try {
    // Check if AI is properly configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Try to fetch real-time market data for GET requests too
    let marketContext = '';
    try {
      const marketResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/market-context`);
      if (marketResponse.ok) {
        const marketData = await marketResponse.json();
        marketContext = marketData.description;
      }
    } catch (error) {
      console.warn('Failed to fetch market context for GET request:', error);
    }

    // Use market-aware prompt if we have market data, otherwise use fallback
    const prompt = marketContext ? getFortunePrompt(marketContext) : getFallbackPrompt();

    const result = await generateText({
      model: client(AI_CONFIG.OPENROUTER.MODEL),
      prompt,
      temperature: AI_CONFIG.GENERATION.TEMPERATURE,
    });

    // Clean and parse the AI response
    const cleanedResponse = cleanAIResponse(result.text);
    let parsedResponse: SingleFortuneResponse;

    try {
      parsedResponse = parseAIResponse(cleanedResponse) as SingleFortuneResponse;

      // Basic validation
      if (!parsedResponse.fortune || !parsedResponse.proverb) {
        throw new Error('Missing required fields in AI response');
      }

    } catch (parseError) {
      console.error('Failed to parse fallback AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to generate valid fortune content' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Fortune generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate fortune content' },
      { status: 500 }
    );
  }
}
