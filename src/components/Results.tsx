'use client';

import { Collapse } from './ui';
import { RecommendationCard } from './RecommendationCard';
import type { AnalyzeResponse } from '@/lib/validators';
import { AlertTriangle, Eye, Store, HelpCircle, UtensilsCrossed } from 'lucide-react';

export interface ResultsProps {
  data: AnalyzeResponse;
}

/**
 * Results section displaying menu analysis and recommendations
 */
export function Results({ data }: ResultsProps) {
  const { menuLanguage, restaurantName, translatedMenuPreview, readability, allDishes, recommendations } = data;

  return (
    <div className="space-y-8">
      {/* Restaurant Name */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-subtle">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-neutral-400" />
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Restaurant
            </p>
            {restaurantName ? (
              <p className="text-lg font-semibold text-neutral-900">{restaurantName}</p>
            ) : (
              <p className="text-sm text-neutral-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Unable to detect restaurant name from menu
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Readability Warning */}
      {readability.needsRetake && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">
                Image Quality Issue
              </h4>
              <p className="text-sm text-amber-700 mb-2">
                The menu image was difficult to read. Results may be less accurate.
                Consider retaking the photo with better lighting.
              </p>
              {readability.issues.length > 0 && (
                <ul className="text-sm text-amber-600 space-y-1">
                  {readability.issues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu Info */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            Menu Analysis
          </h3>
          <span className="
            px-3 py-1
            text-xs font-medium
            bg-neutral-100 text-neutral-600
            rounded-full
          ">
            {menuLanguage}
          </span>
        </div>

        {/* Readability indicator */}
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-600">
            Readability:{' '}
            <span className={`font-medium ${
              readability.overall === 'good'
                ? 'text-green-600'
                : readability.overall === 'medium'
                ? 'text-amber-600'
                : 'text-red-500'
            }`}>
              {readability.overall}
            </span>
          </span>
        </div>

        {/* Translated Menu Preview (collapsible) */}
        <Collapse title="Translated Menu Preview" defaultOpen={false}>
          <div className="prose prose-sm max-w-none">
            <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {translatedMenuPreview}
            </p>
          </div>
        </Collapse>

        {/* All Dishes from Menu (collapsible) */}
        {allDishes && allDishes.length > 0 && (
          <Collapse title={`All Menu Items (${allDishes.length})`} defaultOpen={true}>
            <div className="space-y-2">
              {allDishes.map((dish, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 py-2 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {dish.translatedName}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-500 ml-5.5 truncate">
                      {dish.originalName}
                    </p>
                    {dish.category && (
                      <span className="text-xs text-neutral-400 ml-5.5">
                        {dish.category}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {dish.priceConverted && (
                      <p className="text-sm font-medium text-neutral-900">
                        {dish.priceConverted}
                      </p>
                    )}
                    {dish.priceOriginal && (
                      <p className="text-xs text-neutral-500">
                        {dish.priceOriginal}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Collapse>
        )}
      </div>

      {/* Recommendations Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-2">
          Top Recommendations
        </h2>
        <p className="text-neutral-500">
          Based on your preferences
        </p>
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-6">
        {recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            index={index}
          />
        ))}
      </div>

      {/* No recommendations message */}
      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500">
            No recommendations could be generated from this menu.
            Try taking a clearer photo.
          </p>
        </div>
      )}
    </div>
  );
}
