import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDishImagePrompt } from './prompts';
import { getCachedImage, cacheImage } from './cache';
import { safeLog } from './safeLog';

/**
 * Check if we should use mock mode
 */
function isMockMode(): boolean {
  return !process.env.GEMINI_API_KEY || process.env.MOCK_MODE === 'true';
}

/**
 * Create Gemini client
 */
function createClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Generate a placeholder image for mock mode
 * Returns a simple SVG as a data URL
 */
function getMockImageDataUrl(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#f5f5f5"/>
      <circle cx="256" cy="200" r="80" fill="#e5e5e5"/>
      <ellipse cx="256" cy="320" rx="120" ry="60" fill="#e5e5e5"/>
      <text x="256" y="450" font-family="system-ui" font-size="16" fill="#737373" text-anchor="middle">
        Mock Generated Image
      </text>
    </svg>
  `;
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate a dish image using Gemini Imagen
 */
export async function generateDishImage(
  imagePrompt: string
): Promise<{ imageUrl: string; cached: boolean }> {
  // Check cache first
  const cachedPath = getCachedImage(imagePrompt);
  if (cachedPath) {
    safeLog.info('Returning cached image');
    return { imageUrl: cachedPath, cached: true };
  }

  // Return mock image if in mock mode
  if (isMockMode()) {
    safeLog.info('Using mock mode for image generation');
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
    return { imageUrl: getMockImageDataUrl(), cached: false };
  }

  safeLog.info('Starting image generation with Gemini');

  const client = createClient();

  try {
    // Use Gemini's image generation model
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['image', 'text'] as any,
      } as any,
    });

    const fullPrompt = getDishImagePrompt(imagePrompt);

    const response = await model.generateContent(fullPrompt);
    const result = response.response;

    // Extract image data from response
    const candidates = result.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in Gemini response');
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      throw new Error('No parts in Gemini response');
    }

    // Look for inline image data
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        const imageData = Buffer.from(part.inlineData.data, 'base64');
        const cachedUrl = cacheImage(imagePrompt, imageData);

        safeLog.info('Image generated and cached successfully');
        return { imageUrl: cachedUrl, cached: false };
      }
    }

    // If no inline image, try to use text-based image generation
    // Fall back to using Imagen 3 model if available
    safeLog.warn('No inline image in response, trying Imagen model');

    const imagenModel = client.getGenerativeModel({ model: 'imagen-3.0-generate-002' });

    const imagenResponse = await (imagenModel as any).generateImages({
      prompt: fullPrompt,
      numberOfImages: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_few',
    });

    if (imagenResponse.images && imagenResponse.images.length > 0) {
      const imageBase64 = imagenResponse.images[0].bytesBase64Encoded;
      const imageData = Buffer.from(imageBase64, 'base64');
      const cachedUrl = cacheImage(imagePrompt, imageData);

      safeLog.info('Image generated with Imagen and cached successfully');
      return { imageUrl: cachedUrl, cached: false };
    }

    throw new Error('No image data in Gemini response');
  } catch (error) {
    safeLog.error('Gemini image generation error', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      }
      if (error.message.includes('SAFETY')) {
        throw new Error('Image generation blocked by safety filters. Try a different dish.');
      }
      if (error.message.includes('quota') || error.message.includes('rate')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
    }

    throw new Error('Failed to generate image. Please try again.');
  }
}
