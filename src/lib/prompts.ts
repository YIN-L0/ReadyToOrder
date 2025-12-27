import { Preferences } from './validators';

/**
 * System prompt for OpenAI Vision to analyze menus
 */
export function getMenuAnalysisSystemPrompt(): string {
  return `You are Menu Sensei, an expert culinary AI assistant specialized in analyzing foreign language menus and providing personalized dish recommendations.

CRITICAL RULES:
1. NEVER invent or hallucinate dishes that are not clearly visible in the menu image.
2. If text is unclear or partially visible, mark it with LOW confidence and include a warning.
3. Always provide "evidenceSnippets" - exact text fragments you can see in the image.
4. If the image is too blurry, dark, or unreadable, set readability.needsRetake=true.
5. Your response MUST be valid JSON matching the exact schema provided.
6. Do NOT include any markdown formatting, code blocks, or extra text - only raw JSON.

ANALYSIS PROCESS:
1. First, assess image quality and readability.
2. Identify the menu language from visible text.
3. Extract and translate menu items to the target language.
4. Based on user preferences, select the TOP 3 dishes to recommend.
5. For each recommendation, explain WHY it matches their preferences.
6. Include any relevant warnings (allergens, spiciness, etc.).
7. Generate a detailed imagePrompt for each dish (for later image generation).

IMAGE PROMPT GUIDELINES:
- Create a prompt for a realistic, editorial-style food photograph
- Describe the dish's appearance, colors, textures, and presentation
- Specify "professional food photography, soft natural lighting, shallow depth of field"
- Do NOT include text, watermarks, or people in the prompt
- Focus on appetizing presentation on a simple, elegant plate`;
}

/**
 * User prompt for menu analysis with preferences
 */
export function getMenuAnalysisUserPrompt(preferences: Preferences): string {
  const { spicyLevel, dietaryRestrictions, dislikedIngredients, budget, adventurousness, targetLanguage } = preferences;

  const dietaryText = dietaryRestrictions.length > 0
    ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}.`
    : 'No specific dietary restrictions.';

  const dislikedText = dislikedIngredients.trim()
    ? `Dislikes/allergies: ${dislikedIngredients}.`
    : 'No specific dislikes.';

  const budgetMap = {
    low: 'budget-conscious (prefer affordable options)',
    medium: 'moderate (good value for money)',
    high: 'willing to splurge (prioritize quality over price)',
  };

  const adventureMap = {
    low: 'prefers familiar, safe choices',
    medium: 'open to trying some new things',
    high: 'loves adventurous, unique dishes',
  };

  return `Analyze this menu image and provide personalized dish recommendations.

USER PREFERENCES:
- Spicy tolerance: ${spicyLevel}/5 (0=no spice, 5=very spicy is fine)
- ${dietaryText}
- ${dislikedText}
- Budget preference: ${budgetMap[budget]}
- Adventurousness: ${adventureMap[adventurousness]}
- Target translation language: ${targetLanguage}

Respond with ONLY valid JSON in this exact format:
{
  "menuLanguage": "detected language name",
  "translatedMenuPreview": "brief translated summary of visible menu sections and items",
  "readability": {
    "overall": "good" | "medium" | "poor",
    "issues": ["list of any readability issues"],
    "needsRetake": false
  },
  "evidenceSnippets": ["exact text fragments you can see in the image"],
  "recommendations": [
    {
      "id": "unique-id-1",
      "dishOriginal": "original name in source language",
      "dishTranslated": "translated name",
      "confidence": 85,
      "tasteProfile": ["savory", "umami", "mild"],
      "why": ["reason 1 matching preferences", "reason 2", "reason 3"],
      "warnings": ["contains shellfish", "moderately spicy"],
      "imagePrompt": "Detailed prompt for generating an image of this dish..."
    }
  ]
}

Provide exactly 3 recommendations (or fewer if the menu has less). Order by best match to preferences.`;
}

/**
 * Prompt for Gemini image generation
 */
export function getDishImagePrompt(basePrompt: string): string {
  return `Generate a photorealistic, appetizing food photograph of: ${basePrompt}

Style requirements:
- Professional food photography with soft, natural lighting
- Shallow depth of field, main dish in sharp focus
- Clean, elegant plating on a simple white or neutral plate
- Subtle garnishes that complement the dish
- High-end restaurant presentation
- NO text, watermarks, logos, or branding
- NO people, hands, or utensils in frame
- Warm, inviting color palette
- Top-down or 45-degree angle shot`;
}

/**
 * Mock response for development without API keys
 */
export function getMockAnalyzeResponse(): object {
  return {
    menuLanguage: "Japanese",
    translatedMenuPreview: "This menu features traditional Japanese dishes including ramen, sushi, and tempura sections. Prices range from ¥800-2500.",
    readability: {
      overall: "good",
      issues: [],
      needsRetake: false
    },
    evidenceSnippets: [
      "ラーメン (Ramen)",
      "天ぷら定食 (Tempura Set)",
      "寿司盛り合わせ (Sushi Platter)"
    ],
    recommendations: [
      {
        id: "rec-1",
        dishOriginal: "とんこつラーメン",
        dishTranslated: "Tonkotsu Ramen (Pork Bone Broth Ramen)",
        confidence: 92,
        tasteProfile: ["rich", "savory", "umami", "creamy"],
        why: [
          "Classic comfort food with rich pork bone broth",
          "Matches your preference for umami-rich dishes",
          "Moderately priced and very filling"
        ],
        warnings: ["Contains pork", "High sodium content"],
        imagePrompt: "A steaming bowl of tonkotsu ramen with creamy white pork bone broth, thin noodles, chashu pork slices, soft-boiled egg with runny yolk, green onions, and nori seaweed. Professional food photography, soft natural lighting, shallow depth of field, top-down angle."
      },
      {
        id: "rec-2",
        dishOriginal: "天ぷら定食",
        dishTranslated: "Tempura Set Meal",
        confidence: 88,
        tasteProfile: ["crispy", "light", "delicate", "savory"],
        why: [
          "Light and crispy battered vegetables and shrimp",
          "Comes with rice and miso soup for a complete meal",
          "Good value set meal option"
        ],
        warnings: ["Contains shrimp", "Fried in oil"],
        imagePrompt: "An elegant tempura set meal with perfectly golden-fried shrimp and assorted vegetables arranged on a bamboo mat, accompanied by a bowl of white rice, miso soup, and tentsuyu dipping sauce. Professional food photography, soft natural lighting, 45-degree angle shot."
      },
      {
        id: "rec-3",
        dishOriginal: "サーモンいくら丼",
        dishTranslated: "Salmon and Salmon Roe Rice Bowl",
        confidence: 85,
        tasteProfile: ["fresh", "oceanic", "buttery", "slightly sweet"],
        why: [
          "Fresh salmon with premium salmon roe",
          "Beautiful presentation makes it Instagram-worthy",
          "Perfect balance of flavors and textures"
        ],
        warnings: ["Raw fish - not suitable if avoiding raw food", "Contains fish roe"],
        imagePrompt: "A vibrant salmon ikura don bowl with fresh orange salmon sashimi slices and glistening salmon roe arranged over steamed rice, garnished with shiso leaf and wasabi. Professional food photography, overhead shot, soft natural lighting."
      }
    ]
  };
}
