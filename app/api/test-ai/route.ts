import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { AI_CONFIG, isAIConfigured } from '@/lib/ai-config';

// Configure OpenAI client for OpenRouter
const client = openai({
  baseURL: AI_CONFIG.OPENROUTER.BASE_URL,
  apiKey: AI_CONFIG.OPENROUTER.API_KEY,
});

export async function GET() {
  try {
    // Check if AI is properly configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI not configured',
          details: 'Missing required environment variables',
          config: {
            baseURL: AI_CONFIG.OPENROUTER.BASE_URL,
            model: AI_CONFIG.OPENROUTER.MODEL,
            hasApiKey: !!AI_CONFIG.OPENROUTER.API_KEY,
          }
        },
        { status: 500 }
      );
    }

    // Test if the AI integration is working
    const result = await generateText({
      model: client(AI_CONFIG.OPENROUTER.MODEL),
      prompt: 'Generate a short crypto trading tip in 10 words or less.',
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      message: 'AI integration working',
      generatedText: result.text,
      config: {
        baseURL: AI_CONFIG.OPENROUTER.BASE_URL,
        model: AI_CONFIG.OPENROUTER.MODEL,
        hasApiKey: !!AI_CONFIG.OPENROUTER.API_KEY,
      }
    });
  } catch (error) {
    console.error('AI test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI integration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        config: {
          baseURL: AI_CONFIG.OPENROUTER.BASE_URL,
          model: AI_CONFIG.OPENROUTER.MODEL,
          hasApiKey: !!AI_CONFIG.OPENROUTER.API_KEY,
        }
      },
      { status: 500 }
    );
  }
}
