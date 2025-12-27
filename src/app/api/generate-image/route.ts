import { NextRequest, NextResponse } from 'next/server';
import { generateDishImage } from '@/lib/gemini';
import { GenerateImageRequestSchema } from '@/lib/validators';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for image generation

/**
 * POST /api/generate-image
 * Accepts an image prompt, returns a generated dish image
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = GenerateImageRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');

      return NextResponse.json(
        { success: false, error: `Invalid request: ${errors}` },
        { status: 400 }
      );
    }

    const { imagePrompt } = validation.data;

    safeLog.info('Generating dish image', {
      promptPreview: imagePrompt.substring(0, 100) + '...',
    });

    // Generate or retrieve cached image
    const result = await generateDishImage(imagePrompt);

    safeLog.info('Image generation completed', {
      cached: result.cached,
      urlPreview: result.imageUrl.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      cached: result.cached,
    });
  } catch (error) {
    safeLog.error('Image generation failed', error);

    const message =
      error instanceof Error ? error.message : 'Failed to generate image';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
