import { z } from 'zod';

// ============================================
// Request Schemas
// ============================================

/**
 * User preferences for dish recommendations
 */
export const PreferencesSchema = z.object({
  spicyLevel: z.number().min(0).max(5).default(2),
  dietaryRestrictions: z.array(z.string()).default([]),
  dislikedIngredients: z.string().default(''),
  budget: z.enum(['low', 'medium', 'high']).default('medium'),
  adventurousness: z.enum(['low', 'medium', 'high']).default('medium'),
  targetLanguage: z.string().default('zh-CN'),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

/**
 * Quick chip options that map to preferences
 */
export const QuickChipSchema = z.enum([
  'no-spicy',
  'vegetarian',
  'no-seafood',
  'low-carb',
  'adventurous',
]);

export type QuickChip = z.infer<typeof QuickChipSchema>;

/**
 * Request body for /api/analyze
 */
export const AnalyzeRequestSchema = z.object({
  image: z.string(), // Base64 encoded image
  preferences: PreferencesSchema.optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * Request body for /api/generate-image
 */
export const GenerateImageRequestSchema = z.object({
  imagePrompt: z.string().min(1).max(2000),
});

export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;

// ============================================
// Response Schemas
// ============================================

/**
 * Readability assessment of the menu image
 */
export const ReadabilitySchema = z.object({
  overall: z.enum(['good', 'medium', 'poor']),
  issues: z.array(z.string()),
  needsRetake: z.boolean(),
});

export type Readability = z.infer<typeof ReadabilitySchema>;

/**
 * Single dish recommendation
 */
export const RecommendationSchema = z.object({
  id: z.string(),
  dishOriginal: z.string(),
  dishTranslated: z.string(),
  confidence: z.number().min(0).max(100),
  tasteProfile: z.array(z.string()),
  why: z.array(z.string()),
  warnings: z.array(z.string()),
  imagePrompt: z.string(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Response from /api/analyze
 */
export const AnalyzeResponseSchema = z.object({
  menuLanguage: z.string(),
  translatedMenuPreview: z.string(),
  readability: ReadabilitySchema,
  evidenceSnippets: z.array(z.string()),
  recommendations: z.array(RecommendationSchema),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

/**
 * Response from /api/generate-image
 */
export const GenerateImageResponseSchema = z.object({
  success: z.boolean(),
  imageUrl: z.string().optional(),
  error: z.string().optional(),
  cached: z.boolean().optional(),
});

export type GenerateImageResponse = z.infer<typeof GenerateImageResponseSchema>;

/**
 * Generic error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate and parse JSON against a schema
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');

  return { success: false, error: errorMessages };
}

/**
 * Check if a string is valid base64 image data
 */
export function isValidBase64Image(data: string): boolean {
  // Check for data URL format
  if (data.startsWith('data:image/')) {
    const base64Part = data.split(',')[1];
    if (!base64Part) return false;
    return isValidBase64(base64Part);
  }

  // Check for raw base64
  return isValidBase64(data);
}

/**
 * Check if a string is valid base64
 */
function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Extract base64 data from a data URL or return as-is
 */
export function extractBase64(data: string): string {
  if (data.startsWith('data:image/')) {
    return data.split(',')[1] || data;
  }
  return data;
}

/**
 * Get MIME type from data URL
 */
export function getMimeType(data: string): string {
  if (data.startsWith('data:image/')) {
    const match = data.match(/data:(image\/[^;]+);/);
    return match ? match[1] : 'image/jpeg';
  }
  return 'image/jpeg';
}
