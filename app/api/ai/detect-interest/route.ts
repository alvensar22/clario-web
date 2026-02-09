import { createClientFromRequest } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * POST /api/ai/detect-interest
 * Detects the most relevant interest for a post based on content.
 * Body: { content: string }
 * Returns: { interest_id: string | null, interest_name: string | null, confidence: number }
 */
export async function POST(request: Request) {
  const supabase = await createClientFromRequest(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length < 10) {
    return NextResponse.json({ 
      interest_id: null, 
      interest_name: null, 
      confidence: 0 
    });
  }

  // Get all available interests
  const { data: interests } = (await supabase
    .from('interests')
    .select('id, name')
    .order('name')) as {
    data: { id: string; name: string }[] | null;
  };

  if (!interests || interests.length === 0) {
    return NextResponse.json({ 
      interest_id: null, 
      interest_name: null, 
      confidence: 0 
    });
  }

  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured, skipping AI detection');
    return NextResponse.json({ 
      interest_id: null, 
      interest_name: null, 
      confidence: 0 
    });
  }

  try {
    const openai = new OpenAI({ apiKey });

    const interestsList = interests
      .map((i) => `- ${i.name}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at categorizing social media posts. Given a post and a list of interests, identify the MOST relevant interest category.

Available interests:
${interestsList}

Respond ONLY with valid JSON in this exact format:
{
  "interest": "exact interest name from the list",
  "confidence": 0.85
}

Rules:
- "interest" must EXACTLY match one of the available interest names
- "confidence" is 0-1 (0.7+ = high confidence, 0.5-0.7 = medium, <0.5 = low)
- If no interest is clearly relevant, set confidence below 0.5
- Consider the post's topic, keywords, and context`,
        },
        {
          role: 'user',
          content: `Post: "${content}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const result = completion.choices[0]?.message?.content?.trim();
    if (!result) {
      return NextResponse.json({ 
        interest_id: null, 
        interest_name: null, 
        confidence: 0 
      });
    }

    const parsed = JSON.parse(result);
    const detectedInterestName = parsed.interest;
    const confidence = parsed.confidence ?? 0;

    // Find matching interest
    const matchedInterest = interests.find(
      (i) => i.name.toLowerCase() === detectedInterestName.toLowerCase()
    );

    if (matchedInterest && confidence >= 0.5) {
      return NextResponse.json({
        interest_id: matchedInterest.id,
        interest_name: matchedInterest.name,
        confidence,
      });
    }

    return NextResponse.json({ 
      interest_id: null, 
      interest_name: null, 
      confidence: 0 
    });
  } catch (error) {
    console.error('AI interest detection error:', error);
    return NextResponse.json({ 
      interest_id: null, 
      interest_name: null, 
      confidence: 0 
    });
  }
}
