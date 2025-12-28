# Menu Sensei - Algorithm Rules Documentation

This document explains the algorithms and rules used for dietary restriction detection and adventurousness level matching.

## 1. Dietary Restrictions Detection

The system uses GPT-4 Vision to analyze menu items and detect potential dietary conflicts. Here's how each restriction is evaluated:

### Available Dietary Restrictions

| Restriction | Detection Method |
|------------|------------------|
| `vegetarian` | Excludes dishes containing meat (beef, pork, chicken, lamb, fish, seafood). Allows eggs and dairy. |
| `vegan` | Excludes all animal products including meat, fish, dairy, eggs, honey, and animal-derived ingredients. |
| `gluten-free` | Excludes wheat, barley, rye, and common gluten sources (bread, pasta, soy sauce, beer batter). |
| `dairy-free` | Excludes milk, cheese, butter, cream, yogurt, and dairy derivatives. |
| `nut-free` | Excludes all tree nuts (almonds, walnuts, cashews, etc.) and peanuts. |
| `no-seafood` | Excludes fish, shellfish, crustaceans, and seafood-derived ingredients (fish sauce, oyster sauce). |
| `no-pork` | Excludes pork, bacon, ham, lard, and pork-derived ingredients. |
| `halal` | Excludes pork, alcohol, and non-halal slaughtered meat. Flags dishes that may contain these. |
| `kosher` | Excludes pork, shellfish, and meat-dairy combinations. Flags non-kosher preparation methods. |
| `low-carb` | Prioritizes dishes with minimal carbohydrates. Avoids rice, bread, pasta, potatoes, sugary sauces. |
| `keto` | Strict low-carb (<20g net carbs estimated). Prioritizes high-fat, moderate protein options. |

### Detection Process

1. **Menu Text Extraction**: GPT-4 Vision reads all visible text on the menu.
2. **Ingredient Inference**: For each dish, the AI infers likely ingredients based on:
   - Dish name and description
   - Cuisine type (e.g., Japanese ramen typically contains pork broth)
   - Common preparation methods
3. **Conflict Flagging**: If a dish likely conflicts with user restrictions:
   - The dish is excluded from recommendations
   - If included due to high match otherwise, a **warning** is added
4. **Uncertainty Handling**: When ingredient information is unclear:
   - The system adds a warning: "Ingredients not fully visible - please confirm with staff"

### Example Scenarios

```
User Restriction: vegetarian
Menu Item: "Mushroom Risotto with Parmesan"
Result: SAFE - Vegetarian friendly (contains dairy, but no meat)

User Restriction: vegan
Menu Item: "Mushroom Risotto with Parmesan"
Result: EXCLUDED - Contains dairy (Parmesan cheese)

User Restriction: gluten-free
Menu Item: "Sashimi Platter"
Result: SAFE - But WARNING about soy sauce which may contain wheat
```

---

## 2. Adventurousness Level Matching

The adventurousness setting influences which dishes are recommended based on how "novel" or "unusual" they might be for the user.

### Adventurousness Levels

#### Level: `low` (Safe)
**Definition**: User prefers familiar, widely-known dishes that are commonly found in their home country.

**Selection Criteria**:
- Prioritizes internationally recognized dishes
- Avoids unusual ingredients or preparations
- Selects items with familiar flavor profiles
- Prefers dishes with clear, understandable descriptions

**Examples Selected**:
- Chicken Teriyaki (Japanese)
- Fried Rice (Chinese)
- Pad Thai (Thai)
- Pizza Margherita (Italian)

**Examples Avoided**:
- Natto (fermented soybeans)
- Century eggs
- Organ meats
- Raw preparations (unless sashimi-level mainstream)

#### Level: `medium` (Open)
**Definition**: User is open to trying new things but appreciates a balance of familiar and novel.

**Selection Criteria**:
- Mixes familiar dishes with some local specialties
- May include dishes with one or two unfamiliar elements
- Considers popular local favorites even if not internationally known
- Avoids extremely unusual ingredients

**Examples Selected**:
- Tonkotsu Ramen (rich pork broth - may be new for some)
- Tom Yum Soup (familiar format, intense flavors)
- Dim Sum variety
- Regional pasta dishes

**Examples with Caution**:
- Items with unfamiliar sauces
- Dishes with mixed textures

#### Level: `high` (Adventurous)
**Definition**: User actively seeks unique, authentic, and unusual dishes - the more local and distinctive, the better.

**Selection Criteria**:
- Prioritizes authentic local specialties
- Includes dishes with unusual ingredients or preparations
- Recommends "hidden gems" that tourists might miss
- Values authenticity over familiarity
- Embraces unusual textures, fermented foods, organ meats

**Examples Selected**:
- Horse sashimi (basashi) in Japan
- Hákarl (fermented shark) in Iceland
- Blood sausage
- Live seafood preparations
- Regional delicacies tourists rarely try

**Matching Algorithm**:
```
adventurousnessScore = calculateDishNovelty(dish)

if (userLevel === 'low'):
    recommend if adventurousnessScore < 30

if (userLevel === 'medium'):
    recommend if adventurousnessScore between 20-70

if (userLevel === 'high'):
    prioritize if adventurousnessScore > 50
    bonus points for local-only dishes
```

---

## 3. Budget Matching (Multi-Select)

Budget is now a multi-select option, allowing users to indicate they're open to multiple price ranges.

### Budget Levels

| Level | Symbol | Description | Price Behavior |
|-------|--------|-------------|----------------|
| `low` | $ | Budget-conscious | Prioritizes affordable options |
| `medium` | $$ | Good value | Balance of price and quality |
| `high` | $$$ | Willing to splurge | Prioritizes quality, ignores price |

### Multi-Select Behavior

When multiple budgets are selected:

```
Selected: ['low', 'medium']
→ System recommends dishes from $ and $$ price ranges
→ Excludes $$$ premium items

Selected: ['medium', 'high']
→ System recommends dishes from $$ and $$$ price ranges
→ May include premium items if they offer exceptional quality

Selected: ['low', 'medium', 'high']
→ No price filtering - recommends best matches regardless of price
```

---

## 4. Spicy Level Matching

The spicy tolerance setting (0-5) determines which dishes are safe to recommend.

### Spicy Scale

| Level | Label | Dishes Included |
|-------|-------|-----------------|
| 0 | No spice | Only completely non-spicy dishes |
| 1 | Minimal | Very mild spice, barely noticeable |
| 2 | Mild | Light spice, suitable for most |
| 3 | Medium | Noticeable heat, may cause mild discomfort |
| 4 | Spicy | Strong heat, requires spice tolerance |
| 5 | Very Spicy | Extremely hot dishes, local-level spice |

### Matching Logic

```
if dishSpiceLevel <= userSpicyLevel:
    include dish (no warning)

if dishSpiceLevel == userSpicyLevel + 1:
    include dish with WARNING about spice level

if dishSpiceLevel > userSpicyLevel + 1:
    exclude dish OR add strong warning
```

---

## 5. Combined Scoring Algorithm

The final recommendation score combines all factors:

```python
def calculate_recommendation_score(dish, user_preferences):
    score = 100  # Base score

    # Dietary check (binary - must pass)
    if not passes_dietary_restrictions(dish, user_preferences.dietaryRestrictions):
        return 0  # Excluded

    # Disliked ingredients check
    if contains_disliked_ingredients(dish, user_preferences.dislikedIngredients):
        score -= 50
        add_warning("Contains ingredients you may not prefer")

    # Spicy level match
    spice_diff = dish.spiceLevel - user_preferences.spicyLevel
    if spice_diff > 0:
        score -= spice_diff * 15
        if spice_diff > 1:
            add_warning("Spicier than your preference")

    # Budget match
    if dish.priceLevel not in user_preferences.budget:
        score -= 20

    # Adventurousness match
    novelty = calculate_novelty(dish)
    if user_preferences.adventurousness == 'low' and novelty > 40:
        score -= 25
    elif user_preferences.adventurousness == 'high' and novelty > 60:
        score += 15  # Bonus for adventurous dishes

    # Local specialty bonus
    if dish.isLocalSpecialty:
        score += 10

    return max(0, score)
```

---

## 6. Warning Generation Rules

Warnings are generated to inform users about potential concerns:

| Condition | Warning Message |
|-----------|-----------------|
| Contains common allergen | "Contains [allergen]" |
| Higher spice than preference | "Spicier than your stated preference" |
| Contains alcohol | "Contains alcohol" |
| Raw ingredients | "Contains raw [ingredient]" |
| Uncertain ingredients | "Please confirm ingredients with staff" |
| Cross-contamination risk | "May contain traces of [allergen]" |

---

## Version History

- **v1.0** (2024-12): Initial algorithm implementation
- **v1.1** (2024-12): Added multi-select budget, detailed reasons structure
