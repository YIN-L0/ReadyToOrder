'use client';

import { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Share2,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';
import { Button, ImageSkeleton } from './ui';
import type { Recommendation, GenerateImageResponse } from '@/lib/validators';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

/**
 * Card component for displaying a dish recommendation
 * Clean, editorial style with on-demand image generation
 */
export function RecommendationCard({
  recommendation,
  index,
}: RecommendationCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateImage = async () => {
    setImageLoading(true);
    setImageError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt: recommendation.imagePrompt }),
      });

      const data: GenerateImageResponse = await response.json();

      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setImageUrl(data.imageUrl);
      setHasGeneratedOnce(true);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : 'Failed to generate image'
      );
    } finally {
      setImageLoading(false);
    }
  };

  const handleShare = async () => {
    const text = `🍽️ ${recommendation.dishTranslated}
(${recommendation.dishOriginal})

✨ Why I'd recommend it:
${recommendation.why.map((w) => `• ${w}`).join('\n')}

${recommendation.warnings.length > 0 ? `⚠️ Note: ${recommendation.warnings.join(', ')}` : ''}

— Discovered with Menu Sensei`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <article className="bg-white rounded-2xl shadow-soft overflow-hidden">
      {/* Image Section */}
      <div className="relative aspect-[16/10] bg-neutral-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={recommendation.dishTranslated}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageSkeleton className="w-full h-full" aspectRatio="16/10" />
        )}

        {/* Rank badge */}
        <div className="absolute top-4 left-4">
          <span className="
            inline-flex items-center justify-center
            w-8 h-8 rounded-full
            bg-black/60 backdrop-blur-sm
            text-white text-sm font-semibold
          ">
            {index + 1}
          </span>
        </div>

        {/* Generate image button overlay */}
        {!imageUrl && !imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={handleGenerateImage}
              variant="primary"
              size="sm"
              className="shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Image
            </Button>
          </div>
        )}

        {/* Loading overlay */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100/80">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-neutral-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-neutral-600">Generating image...</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {imageError && !imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100/90">
            <div className="text-center px-4">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-neutral-600 mb-3">{imageError}</p>
              <Button onClick={handleGenerateImage} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
            {recommendation.dishTranslated}
          </h3>
          <p className="text-sm text-neutral-500">{recommendation.dishOriginal}</p>
        </div>

        {/* Taste Profile Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {recommendation.tasteProfile.map((taste, i) => (
            <span
              key={i}
              className="
                px-3 py-1
                text-xs font-medium
                bg-neutral-100 text-neutral-600
                rounded-full
              "
            >
              {taste}
            </span>
          ))}
        </div>

        {/* Reasons */}
        <div className="mb-4">
          <ul className="space-y-2">
            {recommendation.why.map((reason, i) => (
              <li
                key={i}
                className="flex items-start text-sm text-neutral-700"
              >
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 mr-3 bg-neutral-400 rounded-full" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Warnings */}
        {recommendation.warnings.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                {recommendation.warnings.map((warning, i) => (
                  <span key={i}>
                    {warning}
                    {i < recommendation.warnings.length - 1 && ' • '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          {/* Confidence */}
          <div className="text-sm">
            <span className="text-neutral-500">Confidence: </span>
            <span className={`font-semibold ${getConfidenceColor(recommendation.confidence)}`}>
              {recommendation.confidence}%
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Regenerate button (only if generated before) */}
            {hasGeneratedOnce && !imageLoading && (
              <Button
                onClick={handleGenerateImage}
                variant="ghost"
                size="sm"
                title="Regenerate image"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            {/* Share button */}
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
