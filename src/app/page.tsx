'use client';

import { useState, useCallback } from 'react';
import { Settings, Loader2, AlertCircle } from 'lucide-react';
import { UploadCard, PreferencesForm, Results } from '@/components';
import { Button } from '@/components/ui';
import type { Preferences, AnalyzeResponse } from '@/lib/validators';

/**
 * Menu Sensei - Main Application Page
 *
 * Mobile-first design with Nordstrom-like luxury aesthetic:
 * - Lots of whitespace
 * - Minimal borders
 * - Strong typography hierarchy
 * - Subtle shadows
 * - Neutral palette
 */
export default function HomePage() {
  // State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({
    spicyLevel: 2,
    dietaryRestrictions: [],
    dislikedIngredients: '',
    budget: 'medium',
    adventurousness: 'medium',
    targetLanguage: 'en',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Handle image selection
  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setResults(null);
    setError(null);
  }, []);

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedImage(null);
    setResults(null);
    setError(null);
  }, []);

  // Analyze menu
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedImage);
      const imageData = await base64Promise;

      // Send to API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze menu');
      }

      setResults(data as AnalyzeResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-50/80 backdrop-blur-lg border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              Menu Sensei
            </h1>

            {/* Settings toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="
                w-10 h-10 rounded-full
                flex items-center justify-center
                text-neutral-600 hover:text-neutral-900
                hover:bg-neutral-100
                transition-colors duration-200
              "
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Settings Panel (overlay) */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-luxury overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-neutral-500 hover:text-neutral-900"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-neutral-500 mb-6">
                  Settings are configured via environment variables. See README for details.
                </p>
                <div className="text-sm text-neutral-600 space-y-2">
                  <p><strong>OPENAI_API_KEY:</strong> Required for menu analysis</p>
                  <p><strong>GEMINI_API_KEY:</strong> Required for image generation</p>
                  <p><strong>MOCK_MODE:</strong> Enable for development without API keys</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section (when no results) */}
        {!results && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-3 tracking-tight">
              Discover Your Perfect Dish
            </h2>
            <p className="text-lg text-neutral-500 max-w-md mx-auto">
              Snap a photo of any foreign menu and get personalized recommendations
              translated just for you.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!results && (
          <section className="mb-8">
            <UploadCard
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onClear={handleClear}
              disabled={isAnalyzing}
            />
          </section>
        )}

        {/* Preferences Section */}
        {!results && selectedImage && (
          <section className="mb-8 bg-white rounded-2xl p-5 sm:p-6 shadow-subtle">
            <PreferencesForm
              preferences={preferences}
              onPreferencesChange={setPreferences}
              disabled={isAnalyzing}
            />
          </section>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">
                  Analysis Failed
                </h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        {!results && selectedImage && (
          <section className="mb-12">
            <Button
              onClick={handleAnalyze}
              disabled={!selectedImage || isAnalyzing}
              loading={isAnalyzing}
              fullWidth
              size="lg"
            >
              {isAnalyzing ? 'Analyzing Menu...' : 'Analyze Menu'}
            </Button>
            {isAnalyzing && (
              <p className="text-center text-sm text-neutral-500 mt-4">
                This may take up to 30 seconds...
              </p>
            )}
          </section>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-neutral-100 animate-pulse" />
              <Loader2 className="w-8 h-8 text-neutral-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            </div>
            <p className="text-neutral-600 mt-6 text-center">
              Reading your menu and finding the best dishes...
            </p>
          </div>
        )}

        {/* Results Section */}
        {results && !isAnalyzing && (
          <div>
            {/* Back/New Analysis Button */}
            <div className="mb-8">
              <Button
                onClick={handleClear}
                variant="outline"
                size="md"
              >
                ← Analyze Another Menu
              </Button>
            </div>

            <Results data={results} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-100">
          <p className="text-center text-sm text-neutral-400">
            Menu Sensei uses AI to analyze menus. Results may not be 100% accurate.
            Always confirm with restaurant staff for allergies.
          </p>
        </footer>
      </main>
    </div>
  );
}
