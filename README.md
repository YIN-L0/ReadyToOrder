# Menu Sensei 🍜

AI-powered foreign menu translator and dish recommender. Take a photo of any menu, get personalized dish recommendations translated in your language.

![Menu Sensei](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- 📸 **Photo Upload**: Take a photo or upload an image of any foreign menu
- 🌍 **Multi-language Translation**: Translates menus to 13+ languages
- 🎯 **Personalized Recommendations**: Top 3 dishes based on your preferences
- 🖼️ **On-demand Image Generation**: Generate appetizing dish images (only when requested)
- 📱 **Mobile-first PWA**: Installable on mobile devices
- 💎 **Premium UI**: Luxury e-commerce aesthetic with minimal, clean design

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom luxury theme
- **AI Services**:
  - OpenAI GPT-4 Vision for menu analysis
  - Google Gemini/Imagen for dish image generation
- **Validation**: Zod schemas for type-safe API contracts

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
# Required for menu analysis (OpenAI GPT-4 Vision)
OPENAI_API_KEY=sk-...

# Required for dish image generation (Google Gemini)
GEMINI_API_KEY=...

# Optional: Enable mock mode for development without API keys
MOCK_MODE=false
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Mock Mode

If you don't have API keys yet, enable mock mode to test the UI:

```env
MOCK_MODE=true
```

In mock mode:
- `/api/analyze` returns a realistic mock Japanese menu response
- `/api/generate-image` returns a placeholder SVG image

## API Routes

### POST /api/analyze

Analyzes a menu image and returns dish recommendations.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "preferences": {
    "spicyLevel": 2,
    "dietaryRestrictions": ["vegetarian"],
    "dislikedIngredients": "cilantro",
    "budget": "medium",
    "adventurousness": "high",
    "targetLanguage": "en"
  }
}
```

**Response:**
```json
{
  "menuLanguage": "Japanese",
  "translatedMenuPreview": "This menu features...",
  "readability": {
    "overall": "good",
    "issues": [],
    "needsRetake": false
  },
  "evidenceSnippets": ["ラーメン", "天ぷら"],
  "recommendations": [
    {
      "id": "rec-1",
      "dishOriginal": "とんこつラーメン",
      "dishTranslated": "Tonkotsu Ramen",
      "confidence": 92,
      "tasteProfile": ["rich", "savory", "umami"],
      "why": ["Classic comfort food..."],
      "warnings": ["Contains pork"],
      "imagePrompt": "A steaming bowl of tonkotsu ramen..."
    }
  ]
}
```

### POST /api/generate-image

Generates an image for a specific dish (on-demand).

**Request:**
```json
{
  "imagePrompt": "A steaming bowl of tonkotsu ramen with creamy white pork bone broth..."
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "/generated/abc123.png",
  "cached": false
}
```

## Image Generation Caching

To save API costs and improve performance, generated images are cached:

1. **Hash-based caching**: Each prompt is hashed (SHA256) to create a unique identifier
2. **File storage**: Generated images are saved to `/public/generated/`
3. **Index file**: Cache mappings stored in `/.cache/images.json`
4. **Persistence**: Cache survives server restarts

The cache is checked before calling the Gemini API. If a matching prompt exists, the cached image is returned immediately.

To clear the cache:
```bash
rm -rf .cache/ public/generated/
```

## Project Structure

```
menu-sensei/
├── README.md
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── public/
│   ├── manifest.json          # PWA manifest
│   └── generated/             # Generated images (gitignored)
├── .cache/                    # Image cache index (gitignored)
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx           # Main application page
    │   └── api/
    │       ├── analyze/route.ts
    │       └── generate-image/route.ts
    ├── components/
    │   ├── UploadCard.tsx
    │   ├── PreferencesForm.tsx
    │   ├── Results.tsx
    │   ├── RecommendationCard.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Chip.tsx
    │       ├── Collapse.tsx
    │       └── Skeleton.tsx
    ├── lib/
    │   ├── openai.ts          # OpenAI Vision integration
    │   ├── gemini.ts          # Gemini/Imagen integration
    │   ├── prompts.ts         # AI prompts
    │   ├── validators.ts      # Zod schemas
    │   ├── hash.ts            # SHA256 utility
    │   ├── cache.ts           # Image caching
    │   └── safeLog.ts         # Secure logging
    └── styles/
        └── globals.css
```

## Design Philosophy

Menu Sensei follows a **luxury e-commerce aesthetic** inspired by Nordstrom:

- **Whitespace**: Generous spacing for breathing room
- **Typography**: Strong hierarchy with serif accents
- **Colors**: Neutral palette (grays, whites, subtle accents)
- **Shadows**: Soft, subtle elevation
- **Borders**: Minimal, only where necessary
- **Animations**: Smooth, understated transitions

## Security Notes

- Raw images are **never logged** (sanitized by safeLog utility)
- API keys are server-side only
- File uploads are validated for type and size
- Generated content is not persisted beyond cache

## Production Deployment

```bash
npm run build
npm start
```

For Vercel deployment:
1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Note: Ensure your Vercel plan supports functions with 60s timeout for image generation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for personal or commercial projects.

---

Built with ❤️ using Next.js, OpenAI, and Google Gemini
