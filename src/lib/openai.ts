import OpenAI from 'openai';
import { Preferences, AnalyzeResponse, AnalyzeResponseSchema, validateResponse } from './validators';
import { getMenuAnalysisSystemPrompt, getMenuAnalysisUserPrompt, getMockAnalyzeResponse } from './prompts';
import { safeLog } from './safeLog';

/**
 * Check if we should use mock mode
 */
function isMockMode(): boolean {
  return !process.env.OPENAI_API_KEY || process.env.MOCK_MODE === 'true';
}

/**
 * Recursively sanitize response to handle special characters in any language
 * This ensures Chinese, Japanese, Korean, Arabic, Hebrew, Thai, etc. all work correctly
 */
function sanitizeResponse(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Normalize unicode and trim whitespace
    return obj.normalize('NFC').trim();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeResponse(item));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeResponse(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Create OpenAI client
 */
function createClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Analyze a menu image using OpenAI Vision
 */
export async function analyzeMenu(
  imageBase64: string,
  mimeType: string,
  preferences: Preferences
): Promise<AnalyzeResponse> {
  // Return mock response if in mock mode
  if (isMockMode()) {
    safeLog.info('Using mock mode for menu analysis');
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
    const mockResponse = getMockAnalyzeResponse();
    const validation = validateResponse(AnalyzeResponseSchema, mockResponse);
    if (!validation.success) {
      throw new Error(`Mock response validation failed: ${validation.error}`);
    }
    return validation.data;
  }

  safeLog.info('Starting menu analysis with OpenAI Vision');

  const client = createClient();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent output
      messages: [
        {
          role: 'system',
          content: getMenuAnalysisSystemPrompt(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high', // Use high detail for better text recognition
              },
            },
            {
              type: 'text',
              text: getMenuAnalysisUserPrompt(preferences),
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    safeLog.debug('Raw OpenAI response received', { length: content.length });

    // Parse JSON response
    let parsedResponse: unknown;
    try {
      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonString = jsonMatch ? jsonMatch[1] : content;

      // Clean up the JSON string - remove any control characters that might cause issues
      jsonString = jsonString.trim()
        .replace(/[\x00-\x1F\x7F]/g, (char) => {
          // Keep newlines and tabs in strings, remove other control chars
          if (char === '\n' || char === '\r' || char === '\t') return char;
          return '';
        });

      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      safeLog.error('Failed to parse OpenAI response as JSON', {
        content: content.substring(0, 500),
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      });
      throw new Error('Invalid JSON response from OpenAI. Please try again.');
    }

    // Sanitize the parsed response to handle special characters
    const sanitizedResponse = sanitizeResponse(parsedResponse);

    // Validate against schema
    const validation = validateResponse(AnalyzeResponseSchema, sanitizedResponse);

    if (!validation.success) {
      safeLog.error('Response validation failed', { error: validation.error });
      // Try to return a partial response if possible
      throw new Error(`Response validation failed: ${validation.error}. Please try again.`);
    }

    safeLog.info('Menu analysis completed successfully', {
      language: validation.data.menuLanguage,
      recommendationCount: validation.data.recommendations.length,
    });

    return validation.data;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      safeLog.error('OpenAI API error', {
        status: error.status,
        message: error.message,
      });

      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (error.status === 400) {
        throw new Error('Invalid request. The image may be too large or in an unsupported format.');
      }

      throw new Error(`OpenAI API error: ${error.message}`);
    }

    throw error;
  }
}
