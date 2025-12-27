import { NextRequest, NextResponse } from 'next/server';
import { analyzeMenu } from '@/lib/openai';
import { PreferencesSchema, extractBase64, getMimeType } from '@/lib/validators';
import { safeLog } from '@/lib/safeLog';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for vision API

/**
 * POST /api/analyze
 * Accepts a menu image and user preferences, returns dish recommendations
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data or JSON
    const contentType = request.headers.get('content-type') || '';

    let imageData: string;
    let preferencesData: unknown;

    if (contentType.includes('multipart/form-data')) {
      // Handle form data upload
      const formData = await request.formData();
      const imageFile = formData.get('image');
      const preferencesJson = formData.get('preferences');

      if (!imageFile) {
        return NextResponse.json(
          { error: 'No image provided' },
          { status: 400 }
        );
      }

      // Convert File/Blob to base64
      if (typeof imageFile === 'object' && imageFile !== null && 'arrayBuffer' in imageFile) {
        const fileObj = imageFile as File;
        const arrayBuffer = await fileObj.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileMimeType = fileObj.type || 'image/jpeg';
        imageData = `data:${fileMimeType};base64,${buffer.toString('base64')}`;
      } else if (typeof imageFile === 'string') {
        imageData = imageFile;
      } else {
        return NextResponse.json(
          { error: 'Invalid image format' },
          { status: 400 }
        );
      }

      // Parse preferences JSON
      if (preferencesJson && typeof preferencesJson === 'string') {
        try {
          preferencesData = JSON.parse(preferencesJson);
        } catch {
          preferencesData = {};
        }
      } else {
        preferencesData = {};
      }
    } else {
      // Handle JSON body
      const body = await request.json();
      imageData = body.image;
      preferencesData = body.preferences;

      if (!imageData) {
        return NextResponse.json(
          { error: 'No image provided' },
          { status: 400 }
        );
      }
    }

    // Extract base64 and MIME type
    const base64 = extractBase64(imageData);
    const mimeType = getMimeType(imageData);

    // Validate image size (max 20MB base64 = ~15MB file)
    if (base64.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please use an image under 15MB.' },
        { status: 400 }
      );
    }

    // Validate and parse preferences
    const preferencesResult = PreferencesSchema.safeParse(preferencesData || {});
    const preferences = preferencesResult.success
      ? preferencesResult.data
      : PreferencesSchema.parse({});

    safeLog.info('Analyzing menu', {
      mimeType,
      imageSizeKB: Math.round(base64.length / 1024),
      preferences: {
        spicyLevel: preferences.spicyLevel,
        dietaryRestrictions: preferences.dietaryRestrictions,
        budget: preferences.budget,
        adventurousness: preferences.adventurousness,
        targetLanguage: preferences.targetLanguage,
      },
    });

    // Call OpenAI Vision API
    const result = await analyzeMenu(base64, mimeType, preferences);

    return NextResponse.json(result);
  } catch (error) {
    safeLog.error('Menu analysis failed', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
