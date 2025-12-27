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
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      parsedResponse = JSON.parse(jsonString.trim());
    } catch (parseError) {
      safeLog.error('Failed to parse OpenAI response as JSON', {
        content: content.substring(0, 500),
      });
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate against schema
    const validation = validateResponse(AnalyzeResponseSchema, parsedResponse);

    if (!validation.success) {
      safeLog.error('Response validation failed', { error: validation.error });
      throw new Error(`Response validation failed: ${validation.error}`);
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
