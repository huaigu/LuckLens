import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AI_CONFIG, getFortunePrompt, getFallbackPrompt, isAIConfigured } from '@/lib/ai-config';

// Define the schema for fortune generation
const FortuneSchema = z.object({
  fortunes: z.array(z.object({
    text: z.string().describe("Fortune category name with emoji (e.g., 'Moonshot 🚀')"),
    color: z.enum([
      "text-green-400", 
      "text-yellow-300", 
      "text-blue-300", 
      "text-orange-400", 
      "text-red-400", 
      "text-cyan-300",
      "text-purple-400",
      "text-pink-400"
    ]).describe("Tailwind CSS text color class"),
    yi: z.array(z.string()).min(2).max(4).describe("2-4 short actions to DO (each 2-4 words)"),
    ji: z.array(z.string()).min(2).max(4).describe("2-4 short actions to AVOID (each 2-4 words)"),
    score: z.number().min(1).max(100).describe("Luck score from 1-100")
  })).length(6).describe("Exactly 6 different fortune categories"),
  proverbs: z.array(z.string()).length(10).describe("10 crypto wisdom proverbs (each 8-15 words)")
});

// Configure OpenAI client for OpenRouter
const client = createOpenAI({
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
    const { marketContext } = body;

    // Create dynamic prompt based on market context
    const prompt = getFortunePrompt(marketContext);

    const result = await generateObject({
      model: client(AI_CONFIG.OPENROUTER.MODEL),
      schema: FortuneSchema,
      prompt,
      temperature: AI_CONFIG.GENERATION.TEMPERATURE,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('Fortune generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate fortune content' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Fallback endpoint for testing without market context
  try {
    // Check if AI is properly configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const prompt = getFallbackPrompt();

    const result = await generateObject({
      model: client(AI_CONFIG.OPENROUTER.MODEL),
      schema: FortuneSchema,
      prompt,
      temperature: AI_CONFIG.GENERATION.TEMPERATURE,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error('Fortune generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate fortune content' },
      { status: 500 }
    );
  }
}
