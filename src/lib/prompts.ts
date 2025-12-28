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

DISH NAME EXTRACTION RULES (VERY IMPORTANT):
- Extract COMPLETE DISH NAMES that include cooking method + main ingredient, NOT just ingredient names.
- A proper dish name describes HOW the food is prepared, not just WHAT it is.
- ✅ CORRECT examples: "糖醋鱼" (Sweet and Sour Fish), "蒜蓉大虾" (Garlic Prawns), "红烧章鱼" (Braised Octopus), "清蒸鲈鱼" (Steamed Sea Bass), "麻婆豆腐" (Mapo Tofu), "Camarón a la diabla" (Spicy Devil Shrimp), "Pulpo al mojo de ajo" (Garlic Octopus)
- ❌ WRONG examples: "鱼" (Fish), "虾" (Shrimp), "章鱼" (Octopus), "豆腐" (Tofu), "Pulpo" (Octopus), "Camarón" (Shrimp) - these are just ingredients, NOT dish names!
- CRITICAL: Many menus list an ingredient (e.g., "Pulpo", "Camarón") with cooking style options below it (e.g., "a la diabla", "al mojo de ajo", "a la plancha"). You MUST split these into SEPARATE complete dish entries:
  - ✅ CORRECT: List as separate dishes: "Pulpo a la diabla", "Pulpo al guajillo", "Pulpo al mojo de ajo", "Pulpo a la mexicana" (4 separate entries)
  - ❌ WRONG: Combine into one: "Pulpo (a la diabla, al guajillo, al mojo de ajo, a la mexicana)"
- Each cooking style option = one separate dish entry in allDishes
- Category headers like "海鲜类" (Seafood), "肉类" (Meat) are NOT dish names - skip them.
- Each menu item with a price is typically a complete dish - extract the full name as shown.

ANALYSIS PROCESS:
1. First, assess image quality and readability.
2. Look for restaurant name/logo on the menu.
3. Identify the menu language from visible text.
4. Extract and translate menu items to the target language.
5. Based on user preferences, select the TOP 3 dishes to recommend.
6. For each recommendation, provide RICH, DETAILED reasons (2-3 paragraphs each) covering:

   **localSpecialty** (2-3 paragraphs):
   - Is this a signature dish of the region/city? Which area is it most famous in?
   - How popular is it among locals vs tourists? Is it a must-try?
   - Any famous restaurants or versions of this dish? Awards or recognition?
   - Seasonal availability or special occasions when it's traditionally eaten?

   **tasteDescription** (2-3 paragraphs):
   - Primary flavors: sweet, salty, sour, bitter, umami, spicy?
   - Texture contrasts: crispy, soft, chewy, creamy, crunchy?
   - Temperature: served hot, cold, room temperature?
   - Aroma profile: what does it smell like?
   - How do the flavors develop as you eat it? First bite vs finish?
   - What makes this dish's taste unique or memorable?

   **history** (2-3 paragraphs) - MUST BE UNIQUE AND SPECIFIC FOR EACH DISH:
   - ORIGIN STORY: Exact year/era and city/region where this dish was created. Name the specific person, chef, or family who invented it if known.
   - LEGENDARY TALES: Include any famous legends, myths, or amusing stories about the dish's creation (e.g., was it an accident? A royal request? A solution to scarcity?)
   - HISTORICAL FIGURES: Did any emperor, president, celebrity, or famous person popularize this dish? Any documented historical events involving it?
   - EVOLUTION: How has the recipe changed over centuries? What was the original version vs modern version?
   - CULTURAL MILESTONES: Is it part of UNESCO heritage? Featured in famous films/books? Associated with specific historical events?
   - REGIONAL WARS: Do different cities/regions claim to be the "true" birthplace? Any friendly rivalries?
   - EACH DISH'S HISTORY MUST BE DISTINCTLY DIFFERENT - avoid generic phrases like "has a long history" or "dates back centuries"

   **publicReviews** (2-3 paragraphs) - MUST INCLUDE SPECIFIC DETAILS:
   - FAMOUS CRITICS: Quote or reference specific food critics, Michelin guides, or famous food writers if applicable
   - VIRAL MOMENTS: Has this dish gone viral on TikTok/Instagram? Any specific viral videos or trends?
   - CELEBRITY ENDORSEMENTS: Have any celebrities publicly praised this dish or this restaurant's version?
   - COMMON EXPERIENCES: What do first-time eaters typically say? Any "initiation" moments or funny reactions?
   - CONTROVERSY: Any debates about "authentic" vs "modified" versions? Purist opinions?
   - COMPARISON RATINGS: How does this restaurant's version compare to others? Any local awards?
   - AVOID generic reviews like "people love it" - include SPECIFIC praise points and critiques

   **userPreferenceMatch** (1-2 paragraphs):
   - How specifically does this match the user's stated spice tolerance?
   - How does it fit their budget preference?
   - How does it align with their adventurousness level?
   - Any dietary considerations relevant to their restrictions?

   **ingredients** (1-2 paragraphs):
   - Main protein, vegetables, carbs?
   - Key sauces, seasonings, or marinades?
   - Any special or hard-to-find ingredients?
   - Potential allergens to be aware of?

7. For each dish, provide a "localizedEquivalent" - a cultural comparison to a similar dish from the user's target language culture:
   - For Chinese (zh-CN/zh-TW): Compare to Chinese dishes (e.g., "类似煎饼果子，但更薄更脆", "有点像红烧肉的做法，但用的是羊肉")
   - For French (fr): Compare to French dishes (e.g., "similaire à une crêpe bretonne, mais plus épaisse")
   - For Spanish (es): Compare to Spanish/Latin dishes (e.g., "parecido a una tortilla española, pero frita")
   - For Japanese (ja): Compare to Japanese dishes (e.g., "お好み焼きに似ているが、もっと薄い")
   - For Korean (ko): Compare to Korean dishes (e.g., "파전과 비슷하지만 더 바삭함")
   - For English or other languages: Provide a familiar Western equivalent if applicable
   - If no good cultural equivalent exists, set to null
8. Include any relevant warnings (allergens, spiciness, etc.).
9. Generate a detailed imagePrompt for each dish (for later image generation).

IMAGE PROMPT GUIDELINES:
- Create a prompt for a realistic, editorial-style food photograph
- Describe the dish's appearance, colors, textures, and presentation
- Specify "professional food photography, soft natural lighting, shallow depth of field"
- Do NOT include text, watermarks, or people in the prompt
- Focus on appetizing presentation on a simple, elegant plate

LANGUAGE OUTPUT RULES (CRITICAL):
- ALL text content in the response MUST be written in the user's target language
- This includes: translatedName, translatedMenuPreview, localizedEquivalent, ALL fields in "reasons" (localSpecialty, tasteDescription, history, publicReviews, userPreferenceMatch, ingredients), warnings, and category
- ONLY keep originalName, dishOriginal, evidenceSnippets, and imagePrompt in their original language
- Example: If target language is French (fr), write all descriptions in French
- Example: If target language is German (de), write all descriptions in German
- Example: If target language is Chinese (zh-CN), write all descriptions in Chinese`;
}

/**
 * User prompt for menu analysis with preferences
 */
export function getMenuAnalysisUserPrompt(preferences: Preferences): string {
  const { spicyLevel, dietaryRestrictions, dislikedIngredients, budget, adventurousness, targetLanguage, currentLocation } = preferences;

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

  // Map location code to source currency (where user is currently located)
  const locationCurrencyMap: Record<string, { currency: string; symbol: string }> = {
    'MX': { currency: 'MXN', symbol: '$' },
    'US': { currency: 'USD', symbol: '$' },
    'CN': { currency: 'CNY', symbol: '¥' },
    'JP': { currency: 'JPY', symbol: '¥' },
    'KR': { currency: 'KRW', symbol: '₩' },
    'TW': { currency: 'TWD', symbol: 'NT$' },
    'TH': { currency: 'THB', symbol: '฿' },
    'VN': { currency: 'VND', symbol: '₫' },
    'FR': { currency: 'EUR', symbol: '€' },
    'DE': { currency: 'EUR', symbol: '€' },
    'IT': { currency: 'EUR', symbol: '€' },
    'ES': { currency: 'EUR', symbol: '€' },
    'GB': { currency: 'GBP', symbol: '£' },
    'BR': { currency: 'BRL', symbol: 'R$' },
    'AU': { currency: 'AUD', symbol: 'A$' },
    'CA': { currency: 'CAD', symbol: 'C$' },
    'IN': { currency: 'INR', symbol: '₹' },
    'RU': { currency: 'RUB', symbol: '₽' },
  };
  const sourceCurrency = locationCurrencyMap[currentLocation] || locationCurrencyMap['MX'];

  // Map target language to user's home currency (for conversion)
  const targetCurrencyMap: Record<string, { currency: string; symbol: string }> = {
    'zh-CN': { currency: 'CNY', symbol: '¥' },
    'zh-TW': { currency: 'TWD', symbol: 'NT$' },
    'en': { currency: 'USD', symbol: '$' },
    'ja': { currency: 'JPY', symbol: '¥' },
    'ko': { currency: 'KRW', symbol: '₩' },
    'fr': { currency: 'EUR', symbol: '€' },
    'de': { currency: 'EUR', symbol: '€' },
    'es': { currency: 'EUR', symbol: '€' },
    'it': { currency: 'EUR', symbol: '€' },
    'pt': { currency: 'BRL', symbol: 'R$' },
    'ru': { currency: 'RUB', symbol: '₽' },
    'th': { currency: 'THB', symbol: '฿' },
    'vi': { currency: 'VND', symbol: '₫' },
  };
  const targetCurrency = targetCurrencyMap[targetLanguage] || targetCurrencyMap['en'];

  return `Analyze this menu image and provide personalized dish recommendations.

MENU EXTRACTION INSTRUCTIONS:
1. First, identify ALL individual dishes on the menu (each item with a price is a dish).
2. Extract the COMPLETE dish name for each item - this must include the cooking method/style, not just the ingredient.
   - Example: "清蒸石斑鱼" (Steamed Grouper) is correct, "石斑鱼" (Grouper) alone is wrong.
   - Example: "蒜蓉粉丝蒸扇贝" (Steamed Scallops with Garlic and Vermicelli) is correct, "扇贝" (Scallops) alone is wrong.
3. Ignore category headers (like "海鲜", "热菜", "凉菜") - these are not dishes.
4. From the complete list of dishes, select the TOP 3 that best match user preferences.

PRICE CONVERSION:
- For each dish, provide BOTH the original price AND the converted price in the user's home currency.
- Menu prices are in: ${sourceCurrency.currency} (${sourceCurrency.symbol}) - this is where the user is currently located
- Convert to user's home currency: ${targetCurrency.currency} (${targetCurrency.symbol})
- Use current exchange rates to convert from ${sourceCurrency.currency} to ${targetCurrency.currency}
- Format: "priceOriginal" = exact price from menu in ${sourceCurrency.currency}, "priceConverted" = "${targetCurrency.symbol}XX.XX" (approximate conversion to ${targetCurrency.currency})

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
  "allDishes": [
    {
      "originalName": "complete dish name in original language (e.g., Pulpo a la diabla)",
      "translatedName": "translated dish name (e.g., Spicy Devil Octopus)",
      "priceOriginal": "exact price from menu in ${sourceCurrency.currency} (e.g., ${sourceCurrency.symbol}280.00)",
      "priceConverted": "converted price in ${targetCurrency.currency} (e.g., ${targetCurrency.symbol}XX.XX)",
      "category": "menu category if applicable (e.g., Seafood, Appetizers)"
    }
  ],
  "recommendations": [
    {
      "id": "unique-id-1",
      "dishOriginal": "original name in source language",
      "dishTranslated": "translated name in target language",
      "priceOriginal": "exact price from menu in ${sourceCurrency.currency} (e.g., ${sourceCurrency.symbol}280.00)",
      "priceConverted": "converted price in ${targetCurrency.currency} (e.g., ${targetCurrency.symbol}XX.XX)",
      "localizedEquivalent": "cultural equivalent from user's cuisine, or null (in target language)",
      "tasteProfile": ["savory", "umami", "mild"],
      "reasons": {
        "localSpecialty": "2-3 paragraphs about regional fame, popularity among locals/tourists, famous versions, seasonal availability...",
        "tasteDescription": "2-3 paragraphs about flavors, textures, temperature, aroma, how taste develops, what makes it unique...",
        "history": "2-3 paragraphs with SPECIFIC details: exact origin year/place, inventor's name, legends/myths, famous historical figures who ate it, how it evolved, UNESCO status, film appearances. MUST BE UNIQUE for each dish - NO generic 'long history' phrases!",
        "publicReviews": "2-3 paragraphs with SPECIFIC details: named critics/guides, viral TikTok/Instagram moments, celebrity endorsements, first-timer reactions, authenticity debates, local awards. AVOID generic 'people love it' - give SPECIFIC praise and critiques!",
        "userPreferenceMatch": "1-2 paragraphs about how it matches user's spice tolerance, budget, adventurousness, dietary needs...",
        "ingredients": "1-2 paragraphs about main components, sauces, special ingredients, allergens..."
      },
      "warnings": ["contains shellfish", "moderately spicy"],
      "imagePrompt": "Detailed prompt for generating an image of this dish..."
    }
  ]
}

IMPORTANT CONTENT REQUIREMENTS:
1. Each "reasons" field must contain RICH, DETAILED content (2-3 paragraphs each for localSpecialty, tasteDescription, history, publicReviews; 1-2 paragraphs for userPreferenceMatch and ingredients).
2. CRITICAL: The "history" field for EACH dish must be COMPLETELY DIFFERENT and UNIQUE - include specific years, inventor names, legends, and historical figures. Do NOT use generic phrases like "has a rich history" or "dates back to ancient times".
3. CRITICAL: The "publicReviews" field must include SPECIFIC details - name food critics, mention viral social media moments, celebrity endorsements, and specific praise/complaints. Do NOT use generic phrases like "highly praised" or "popular among diners".
4. Each dish's story should feel like reading a mini Wikipedia article - full of interesting facts and trivia that make each dish memorable and distinct from the others.

CRITICAL - OUTPUT LANGUAGE: Write ALL content in ${targetLanguage}:
- translatedName, translatedMenuPreview, localizedEquivalent: in ${targetLanguage}
- ALL "reasons" fields (localSpecialty, tasteDescription, history, publicReviews, userPreferenceMatch, ingredients): in ${targetLanguage}
- warnings and category: in ${targetLanguage}
- ONLY originalName, dishOriginal, evidenceSnippets, imagePrompt stay in original menu language

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
      "とんこつラーメン ¥980",
      "天ぷら定食 ¥1500",
      "サーモンいくら丼 ¥1800"
    ],
    allDishes: [
      {
        originalName: "とんこつラーメン",
        translatedName: "豚骨拉面",
        priceOriginal: "¥980",
        priceConverted: "¥47.00",
        category: "拉面"
      },
      {
        originalName: "味噌ラーメン",
        translatedName: "味噌拉面",
        priceOriginal: "¥950",
        priceConverted: "¥45.60",
        category: "拉面"
      },
      {
        originalName: "天ぷら定食",
        translatedName: "天妇罗定食",
        priceOriginal: "¥1500",
        priceConverted: "¥72.00",
        category: "套餐"
      },
      {
        originalName: "サーモンいくら丼",
        translatedName: "三文鱼鱼籽盖饭",
        priceOriginal: "¥1800",
        priceConverted: "¥86.40",
        category: "盖饭"
      },
      {
        originalName: "寿司盛り合わせ",
        translatedName: "什锦寿司拼盘",
        priceOriginal: "¥2500",
        priceConverted: "¥120.00",
        category: "寿司"
      },
      {
        originalName: "焼き鳥盛り合わせ",
        translatedName: "什锦烤鸡肉串",
        priceOriginal: "¥1200",
        priceConverted: "¥57.60",
        category: "烤物"
      }
    ],
    recommendations: [
      {
        id: "rec-1",
        dishOriginal: "とんこつラーメン",
        dishTranslated: "Tonkotsu Ramen (Pork Bone Broth Ramen)",
        priceOriginal: "¥980",
        priceConverted: "¥47.00",
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
        priceOriginal: "¥1500",
        priceConverted: "¥72.00",
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
        priceOriginal: "¥1800",
        priceConverted: "¥86.40",
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
