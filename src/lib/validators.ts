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
  budget: z.array(z.enum(['low', 'medium', 'high'])).default(['medium']), // Multi-select budget
  adventurousness: z.enum(['low', 'medium', 'high']).default('medium'),
  targetLanguage: z.string().default('zh-CN'),
  currentLocation: z.string().default('MX'), // 当前所在国家/地区代码
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
 * Normalize readability value
 */
function normalizeReadability(val: string): 'good' | 'medium' | 'poor' {
  const normalized = val.toLowerCase().trim();
  if (normalized === 'good' || normalized === 'excellent' || normalized === 'great') return 'good';
  if (normalized === 'medium' || normalized === 'moderate' || normalized === 'fair' || normalized === 'average') return 'medium';
  if (normalized === 'poor' || normalized === 'bad' || normalized === 'low') return 'poor';
  return 'medium';
}

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
 * Detailed recommendation reasons
 */
export const RecommendationReasonsSchema = z.object({
  localSpecialty: z.string(), // 当地特色和受欢迎程度
  tasteDescription: z.string(), // 口感和口味描述
  history: z.string(), // 简要历史介绍
  publicReviews: z.string(), // 网上大家的评论
  userPreferenceMatch: z.string(), // 与用户选择的匹配
  ingredients: z.string(), // 菜的组成部分（基于菜单）
});

export type RecommendationReasons = z.infer<typeof RecommendationReasonsSchema>;

/**
 * Single dish recommendation
 */
export const RecommendationSchema = z.object({
  id: z.string(),
  dishOriginal: z.string(),
  dishTranslated: z.string(),
  priceOriginal: z.string().nullable(), // 原始价格（菜单上显示的）
  priceConverted: z.string().nullable(), // 转换后的价格（用户货币）
  localizedEquivalent: z.string().nullable(), // 本土化类比描述，例如"类似煎饼果子"
  tasteProfile: z.array(z.string()),
  reasons: RecommendationReasonsSchema, // Detailed reasons
  warnings: z.array(z.string()),
  imagePrompt: z.string(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Single dish item from the menu (for allDishes list)
 */
export const DishItemSchema = z.object({
  originalName: z.string(), // 完整菜名（原语言）
  translatedName: z.string(), // 翻译后的菜名
  originalDescription: z.string().nullable(), // 原始描述/食材（原语言）
  translatedDescription: z.string().nullable(), // 翻译后的描述/食材
  priceOriginal: z.string().nullable(), // 原始价格（菜单上显示的）
  priceConverted: z.string().nullable(), // 转换后的价格（用户货币）
  category: z.string().nullable(), // 菜单分类（如海鲜、热菜等）
});

export type DishItem = z.infer<typeof DishItemSchema>;

/**
 * Response from /api/analyze
 */
export const AnalyzeResponseSchema = z.object({
  menuLanguage: z.string(),
  restaurantName: z.string().nullable(), // 餐厅名字，null表示未识别
  translatedMenuPreview: z.string(),
  readability: ReadabilitySchema,
  evidenceSnippets: z.array(z.string()),
  allDishes: z.array(DishItemSchema).optional(), // 菜单中识别到的所有菜品
  recommendations: z.array(RecommendationSchema),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

/**
 * Pre-process OpenAI response to fill in defaults and normalize values
 * This makes the schema validation more lenient
 */
export function preprocessAnalyzeResponse(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const obj = data as Record<string, unknown>;

  // Normalize readability
  if (obj.readability && typeof obj.readability === 'object') {
    const readability = obj.readability as Record<string, unknown>;
    if (typeof readability.overall === 'string') {
      readability.overall = normalizeReadability(readability.overall);
    }
    if (!Array.isArray(readability.issues)) {
      readability.issues = [];
    }
    if (typeof readability.needsRetake !== 'boolean') {
      readability.needsRetake = false;
    }
  }

  // Default top-level fields
  if (typeof obj.menuLanguage !== 'string') {
    obj.menuLanguage = 'Unknown';
  }
  if (obj.restaurantName === undefined) {
    obj.restaurantName = null;
  }
  if (typeof obj.translatedMenuPreview !== 'string') {
    obj.translatedMenuPreview = '';
  }
  if (!Array.isArray(obj.evidenceSnippets)) {
    obj.evidenceSnippets = [];
  }

  // Normalize allDishes
  if (Array.isArray(obj.allDishes)) {
    obj.allDishes = obj.allDishes.map((dish: unknown) => {
      if (typeof dish !== 'object' || dish === null) {
        return dish;
      }
      const d = dish as Record<string, unknown>;

      // Default fields
      if (typeof d.originalName !== 'string') {
        d.originalName = '';
      }
      if (typeof d.translatedName !== 'string') {
        d.translatedName = '';
      }
      // Description fields
      if (d.originalDescription === undefined) {
        d.originalDescription = d.description !== undefined ? d.description : null;
      }
      if (d.translatedDescription === undefined) {
        d.translatedDescription = null;
      }
      // Support both old 'price' field and new 'priceOriginal' field
      if (d.priceOriginal === undefined) {
        d.priceOriginal = d.price !== undefined ? d.price : null;
      }
      if (d.priceConverted === undefined) {
        d.priceConverted = null;
      }
      if (d.category === undefined) {
        d.category = null;
      }
      // Remove old fields if they exist
      delete d.price;
      delete d.description;

      return d;
    });
  }

  // Normalize recommendations
  if (Array.isArray(obj.recommendations)) {
    obj.recommendations = obj.recommendations.map((rec: unknown, index: number) => {
      if (typeof rec !== 'object' || rec === null) {
        return rec;
      }
      const r = rec as Record<string, unknown>;

      // Default id if missing
      if (typeof r.id !== 'string') {
        r.id = `rec-${index + 1}`;
      }

      // Default price fields
      if (r.priceOriginal === undefined) {
        r.priceOriginal = null;
      }
      if (r.priceConverted === undefined) {
        r.priceConverted = null;
      }

      // Default localizedEquivalent
      if (r.localizedEquivalent === undefined) {
        r.localizedEquivalent = null;
      }

      // Default arrays
      if (!Array.isArray(r.tasteProfile)) {
        r.tasteProfile = [];
      }
      if (!Array.isArray(r.warnings)) {
        r.warnings = [];
      }

      // Default imagePrompt
      if (typeof r.imagePrompt !== 'string') {
        r.imagePrompt = '';
      }

      // Normalize reasons
      if (r.reasons && typeof r.reasons === 'object') {
        const reasons = r.reasons as Record<string, unknown>;
        const reasonFields = ['localSpecialty', 'tasteDescription', 'history', 'publicReviews', 'userPreferenceMatch', 'ingredients'];
        for (const field of reasonFields) {
          if (typeof reasons[field] !== 'string') {
            reasons[field] = '';
          }
        }
      } else {
        r.reasons = {
          localSpecialty: '',
          tasteDescription: '',
          history: '',
          publicReviews: '',
          userPreferenceMatch: '',
          ingredients: '',
        };
      }

      return r;
    });
  } else {
    obj.recommendations = [];
  }

  return obj;
}

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
