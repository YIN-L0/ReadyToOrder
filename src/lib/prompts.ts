import { Preferences } from './validators';

/**
 * System prompt for OpenAI Vision to analyze menus
 */
export function getMenuAnalysisSystemPrompt(): string {
  return `You are Menu Sensei, an expert culinary AI assistant specialized in analyzing foreign language menus and providing personalized dish recommendations.

CRITICAL RULES:
1. NEVER invent or hallucinate dishes that are not clearly visible in the menu image.
2. If text is unclear or partially visible, include a warning.
3. Always provide "evidenceSnippets" - exact text fragments you can see in the image.
4. If the image is too blurry, dark, or unreadable, set readability.needsRetake=true.
5. Your response MUST be valid JSON matching the exact schema provided.
6. Do NOT include any markdown formatting, code blocks, or extra text - only raw JSON.
7. Try to identify the restaurant name from the menu if visible (logos, headers, footers).

ANALYSIS PROCESS:
1. First, assess image quality and readability.
2. Look for restaurant name/logo on the menu.
3. Identify the menu language from visible text.
4. Extract and translate menu items to the target language.
5. Based on user preferences, select the TOP 3 dishes to recommend.
6. For each recommendation, provide DETAILED reasons covering:
   - Local specialty status and popularity
   - Taste and texture description
   - Brief historical/cultural background
   - What online reviews typically say about this dish
   - How it matches user preferences
   - Ingredients (based on menu description)
7. For each dish, provide a "localizedEquivalent" - a cultural comparison to a similar dish from the user's target language culture:
   - For Chinese (zh-CN/zh-TW): Compare to Chinese dishes (e.g., "类似煎饼果子", "有点像红烧肉的做法")
   - For French (fr): Compare to French dishes (e.g., "similaire à une crêpe bretonne")
   - For Spanish (es): Compare to Spanish/Latin dishes (e.g., "parecido a una tortilla española")
   - For Japanese (ja): Compare to Japanese dishes (e.g., "お好み焼きに似ている")
   - For Korean (ko): Compare to Korean dishes (e.g., "파전과 비슷한 요리")
   - For English or other languages: Provide a familiar Western equivalent if applicable
   - If no good cultural equivalent exists, set to null
8. Include any relevant warnings (allergens, spiciness, etc.).
9. Generate a detailed imagePrompt for each dish (for later image generation).

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

  // Budget is now an array (multi-select)
  const budgetLabels = {
    low: 'budget-conscious ($)',
    medium: 'moderate ($$)',
    high: 'premium ($$$)',
  };
  const budgetText = budget.map(b => budgetLabels[b]).join(' or ');

  const adventureMap = {
    low: 'prefers familiar, safe choices - classic dishes that are widely known and accepted',
    medium: 'open to trying some new things - balance of familiar and novel',
    high: 'loves adventurous, unique dishes - local specialties, unusual ingredients, authentic local flavors',
  };

  return `Analyze this menu image and provide personalized dish recommendations.

USER PREFERENCES:
- Spicy tolerance: ${spicyLevel}/5 (0=no spice, 5=very spicy is fine)
- ${dietaryText}
- ${dislikedText}
- Budget preference: ${budgetText}
- Adventurousness: ${adventureMap[adventurousness]}
- Target translation language: ${targetLanguage}

Respond with ONLY valid JSON in this exact format:
{
  "menuLanguage": "detected language name",
  "restaurantName": "restaurant name if found, or null if not detected",
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
      "localizedEquivalent": "cultural equivalent from user's cuisine (e.g., '类似煎饼果子' for Chinese users), or null if no good equivalent",
      "tasteProfile": ["savory", "umami", "mild"],
      "reasons": {
        "localSpecialty": "Description of whether this is a local specialty, how popular it is locally, and if it's a signature dish of the region/restaurant",
        "tasteDescription": "Detailed description of the taste, texture, and flavor profile of this dish",
        "history": "Brief historical or cultural background of this dish",
        "publicReviews": "What online reviews and food critics typically say about this dish",
        "userPreferenceMatch": "How this dish specifically matches the user's stated preferences",
        "ingredients": "Main ingredients and components of the dish (based on menu description)"
      },
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
    restaurantName: "一蘭拉麺 (Ichiran Ramen)",
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
        localizedEquivalent: "类似浓郁版的牛肉面，但用猪骨熬制",
        tasteProfile: ["rich", "savory", "umami", "creamy"],
        reasons: {
          localSpecialty: "Tonkotsu ramen originated in Fukuoka, Japan and is one of the most beloved regional specialties. This restaurant's version is highly popular among locals and tourists alike.",
          tasteDescription: "Rich, creamy pork bone broth that has been simmered for 12+ hours. The broth coats thin, straight noodles perfectly. Topped with tender chashu pork, a soft-boiled egg with runny yolk, and fresh green onions.",
          history: "Tonkotsu ramen was invented in 1937 in Kurume, Fukuoka. It became famous for its cloudy white broth made from boiling pork bones for extended periods, extracting collagen and fat.",
          publicReviews: "Reviewers praise the depth of flavor and silky texture of the broth. Many note it's the perfect comfort food. Some mention the richness might be heavy for first-timers.",
          userPreferenceMatch: "Matches your preference for umami-rich, savory dishes. Falls within your moderate budget range. A classic choice for those open to authentic Japanese cuisine.",
          ingredients: "Pork bone broth, thin ramen noodles, chashu pork belly, soft-boiled egg, green onions, nori seaweed, sesame seeds, garlic oil."
        },
        warnings: ["Contains pork", "High sodium content"],
        imagePrompt: "A steaming bowl of tonkotsu ramen with creamy white pork bone broth, thin noodles, chashu pork slices, soft-boiled egg with runny yolk, green onions, and nori seaweed. Professional food photography, soft natural lighting, shallow depth of field, top-down angle."
      },
      {
        id: "rec-2",
        dishOriginal: "天ぷら定食",
        dishTranslated: "Tempura Set Meal",
        localizedEquivalent: "类似炸虾和炸蔬菜拼盘，但面衣更薄更酥脆",
        tasteProfile: ["crispy", "light", "delicate", "savory"],
        reasons: {
          localSpecialty: "Tempura is a quintessential Japanese dish found throughout the country. While not region-specific, high-quality tempura sets are a staple of Japanese dining culture.",
          tasteDescription: "Incredibly light and crispy batter that shatters with each bite, revealing perfectly cooked shrimp and seasonal vegetables inside. The batter is never greasy, maintaining a delicate crunch.",
          history: "Tempura was introduced to Japan by Portuguese missionaries in the 16th century. The Japanese refined the technique, creating the light, airy batter we know today.",
          publicReviews: "Diners consistently praise the lightness of the batter and freshness of ingredients. The set meal format is noted as excellent value, providing a complete dining experience.",
          userPreferenceMatch: "A balanced, complete meal that offers good value. The light preparation makes it suitable for those who prefer less heavy dishes. Classic choice for moderate adventurousness.",
          ingredients: "Shrimp, seasonal vegetables (sweet potato, eggplant, shiso leaf, pumpkin), light tempura batter, tentsuyu dipping sauce, grated daikon, steamed rice, miso soup, pickles."
        },
        warnings: ["Contains shrimp/shellfish", "Fried in oil"],
        imagePrompt: "An elegant tempura set meal with perfectly golden-fried shrimp and assorted vegetables arranged on a bamboo mat, accompanied by a bowl of white rice, miso soup, and tentsuyu dipping sauce. Professional food photography, soft natural lighting, 45-degree angle shot."
      },
      {
        id: "rec-3",
        dishOriginal: "サーモンいくら丼",
        dishTranslated: "Salmon and Salmon Roe Rice Bowl",
        localizedEquivalent: "类似三文鱼刺身盖饭，配上鱼籽",
        tasteProfile: ["fresh", "oceanic", "buttery", "slightly sweet"],
        reasons: {
          localSpecialty: "This dish is especially popular in Hokkaido, known for its premium salmon and ikura. It showcases the best of Japanese seafood tradition and is a must-try for visitors.",
          tasteDescription: "Buttery, melt-in-your-mouth salmon sashimi paired with bursting salmon roe that pops with each bite. The combination sits atop perfectly seasoned sushi rice, creating harmony of textures.",
          history: "Donburi (rice bowl) dishes date back to the Edo period. The salmon ikura combination became popular in Hokkaido during the Meiji era when salmon fishing became commercialized.",
          publicReviews: "Highly praised for freshness and visual appeal. Reviewers love the 'ocean in every bite' experience. Many consider it Instagram-worthy. Some note the ikura can be an acquired taste.",
          userPreferenceMatch: "Perfect for those seeking authentic Japanese seafood experience. Moderately priced for the quality of ingredients. Beautiful presentation for those who appreciate food aesthetics.",
          ingredients: "Fresh salmon sashimi, salmon roe (ikura), sushi rice seasoned with rice vinegar, shiso leaf, wasabi, soy sauce, nori strips."
        },
        warnings: ["Raw fish - not suitable if avoiding raw food", "Contains fish roe"],
        imagePrompt: "A vibrant salmon ikura don bowl with fresh orange salmon sashimi slices and glistening salmon roe arranged over steamed rice, garnished with shiso leaf and wasabi. Professional food photography, overhead shot, soft natural lighting."
      }
    ]
  };
}
