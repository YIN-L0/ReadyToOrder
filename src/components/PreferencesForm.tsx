'use client';

import { useState } from 'react';
import { Chip, Collapse } from './ui';
import type { Preferences, QuickChip } from '@/lib/validators';

export interface PreferencesFormProps {
  preferences: Preferences;
  onPreferencesChange: (preferences: Preferences) => void;
  disabled?: boolean;
}

// Quick chip definitions with their effects on preferences
const quickChips: Array<{
  id: QuickChip;
  label: string;
  effect: Partial<Preferences>;
}> = [
  {
    id: 'no-spicy',
    label: 'No Spicy',
    effect: { spicyLevel: 0 },
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    effect: { dietaryRestrictions: ['vegetarian'] },
  },
  {
    id: 'no-seafood',
    label: 'No Seafood',
    effect: { dietaryRestrictions: ['no-seafood'] },
  },
  {
    id: 'low-carb',
    label: 'Low Carb',
    effect: { dietaryRestrictions: ['low-carb'] },
  },
  {
    id: 'adventurous',
    label: 'Adventurous',
    effect: { adventurousness: 'high' },
  },
];

// Language options
const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文 (Simplified Chinese)' },
  { code: 'zh-TW', label: '繁體中文 (Traditional Chinese)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'it', label: 'Italiano (Italian)' },
  { code: 'pt', label: 'Português (Portuguese)' },
  { code: 'ru', label: 'Русский (Russian)' },
  { code: 'th', label: 'ไทย (Thai)' },
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)' },
];

// Location options (current country you're visiting)
const locations = [
  { code: 'MX', label: '🇲🇽 Mexico (MXN)', currency: 'MXN' },
  { code: 'US', label: '🇺🇸 United States (USD)', currency: 'USD' },
  { code: 'CN', label: '🇨🇳 China (CNY)', currency: 'CNY' },
  { code: 'JP', label: '🇯🇵 Japan (JPY)', currency: 'JPY' },
  { code: 'KR', label: '🇰🇷 South Korea (KRW)', currency: 'KRW' },
  { code: 'TW', label: '🇹🇼 Taiwan (TWD)', currency: 'TWD' },
  { code: 'TH', label: '🇹🇭 Thailand (THB)', currency: 'THB' },
  { code: 'VN', label: '🇻🇳 Vietnam (VND)', currency: 'VND' },
  { code: 'FR', label: '🇫🇷 France (EUR)', currency: 'EUR' },
  { code: 'DE', label: '🇩🇪 Germany (EUR)', currency: 'EUR' },
  { code: 'IT', label: '🇮🇹 Italy (EUR)', currency: 'EUR' },
  { code: 'ES', label: '🇪🇸 Spain (EUR)', currency: 'EUR' },
  { code: 'GB', label: '🇬🇧 United Kingdom (GBP)', currency: 'GBP' },
  { code: 'BR', label: '🇧🇷 Brazil (BRL)', currency: 'BRL' },
  { code: 'AU', label: '🇦🇺 Australia (AUD)', currency: 'AUD' },
  { code: 'CA', label: '🇨🇦 Canada (CAD)', currency: 'CAD' },
  { code: 'IN', label: '🇮🇳 India (INR)', currency: 'INR' },
  { code: 'RU', label: '🇷🇺 Russia (RUB)', currency: 'RUB' },
];

// Dietary restriction options
const dietaryOptions = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'no-seafood',
  'no-pork',
  'halal',
  'kosher',
  'low-carb',
  'keto',
];

/**
 * Preferences form with quick chips and detailed options
 */
export function PreferencesForm({
  preferences,
  onPreferencesChange,
  disabled = false,
}: PreferencesFormProps) {
  const [selectedChips, setSelectedChips] = useState<Set<QuickChip>>(new Set());

  const handleChipToggle = (chipId: QuickChip) => {
    const newSelected = new Set(selectedChips);
    const chip = quickChips.find((c) => c.id === chipId);

    if (!chip) return;

    if (newSelected.has(chipId)) {
      newSelected.delete(chipId);
      // Reset the affected preferences
      const updates: Partial<Preferences> = {};
      if ('spicyLevel' in chip.effect) {
        updates.spicyLevel = 2; // Default
      }
      if ('dietaryRestrictions' in chip.effect) {
        updates.dietaryRestrictions = preferences.dietaryRestrictions.filter(
          (r) => !chip.effect.dietaryRestrictions?.includes(r)
        );
      }
      if ('adventurousness' in chip.effect) {
        updates.adventurousness = 'medium'; // Default
      }
      onPreferencesChange({ ...preferences, ...updates });
    } else {
      newSelected.add(chipId);
      // Apply chip effect
      const updates: Partial<Preferences> = { ...chip.effect };
      if ('dietaryRestrictions' in chip.effect) {
        updates.dietaryRestrictions = [
          ...new Set([
            ...preferences.dietaryRestrictions,
            ...(chip.effect.dietaryRestrictions || []),
          ]),
        ];
      }
      onPreferencesChange({ ...preferences, ...updates });
    }

    setSelectedChips(newSelected);
  };

  const handleChange = (field: keyof Preferences, value: unknown) => {
    onPreferencesChange({ ...preferences, [field]: value });
  };

  const handleDietaryToggle = (restriction: string) => {
    const current = preferences.dietaryRestrictions;
    const newRestrictions = current.includes(restriction)
      ? current.filter((r) => r !== restriction)
      : [...current, restriction];
    handleChange('dietaryRestrictions', newRestrictions);
  };

  return (
    <div className="space-y-6">
      {/* Quick Chips */}
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
          Quick Filters
        </p>
        <div className="flex flex-wrap gap-2">
          {quickChips.map((chip) => (
            <Chip
              key={chip.id}
              selected={selectedChips.has(chip.id)}
              onClick={() => handleChipToggle(chip.id)}
              disabled={disabled}
            >
              {chip.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Expanded Options */}
      <Collapse title="Advanced Preferences" defaultOpen={false}>
        <div className="space-y-6">
          {/* Current Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Current Location (for price conversion)
            </label>
            <select
              value={preferences.currentLocation}
              onChange={(e) => handleChange('currentLocation', e.target.value)}
              disabled={disabled}
              className="
                w-full px-4 py-3
                bg-white border border-neutral-200 rounded-xl
                text-neutral-900
                focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                appearance-none
                bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737373%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                bg-[length:20px] bg-[center_right_12px] bg-no-repeat
              "
            >
              {locations.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Language */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Translate to
            </label>
            <select
              value={preferences.targetLanguage}
              onChange={(e) => handleChange('targetLanguage', e.target.value)}
              disabled={disabled}
              className="
                w-full px-4 py-3
                bg-white border border-neutral-200 rounded-xl
                text-neutral-900
                focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                appearance-none
                bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737373%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                bg-[length:20px] bg-[center_right_12px] bg-no-repeat
              "
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Spicy Level */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Spicy Tolerance: {preferences.spicyLevel}/5
            </label>
            <input
              type="range"
              min="0"
              max="5"
              value={preferences.spicyLevel}
              onChange={(e) =>
                handleChange('spicyLevel', parseInt(e.target.value))
              }
              disabled={disabled}
              className="
                w-full h-2 bg-neutral-200 rounded-full appearance-none
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-neutral-900
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
              "
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>No spice</span>
              <span>Very spicy</span>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Dietary Restrictions
            </label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((restriction) => (
                <Chip
                  key={restriction}
                  size="sm"
                  selected={preferences.dietaryRestrictions.includes(restriction)}
                  onClick={() => handleDietaryToggle(restriction)}
                  disabled={disabled}
                >
                  {restriction.replace('-', ' ')}
                </Chip>
              ))}
            </div>
          </div>

          {/* Disliked Ingredients */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Disliked Ingredients / Allergies
            </label>
            <textarea
              value={preferences.dislikedIngredients}
              onChange={(e) => handleChange('dislikedIngredients', e.target.value)}
              disabled={disabled}
              placeholder="e.g., cilantro, mushrooms, raw onions..."
              rows={2}
              className="
                w-full px-4 py-3
                bg-white border border-neutral-200 rounded-xl
                text-neutral-900 placeholder-neutral-400
                focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                resize-none
              "
            />
          </div>

          {/* Budget (Multi-select) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Budget Preference
            </label>
            <p className="text-xs text-neutral-500 mb-3">Select one or more price ranges</p>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => {
                const isSelected = preferences.budget.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      const current = preferences.budget;
                      let newBudget: ('low' | 'medium' | 'high')[];
                      if (isSelected) {
                        // Remove, but keep at least one selected
                        newBudget = current.filter((b) => b !== level);
                        if (newBudget.length === 0) newBudget = [level];
                      } else {
                        // Add
                        newBudget = [...current, level];
                      }
                      handleChange('budget', newBudget);
                    }}
                    disabled={disabled}
                    className={`
                      flex-1 py-3 px-4 rounded-xl
                      text-sm font-medium capitalize
                      transition-all duration-200
                      border
                      ${isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {level === 'low' ? '$' : level === 'medium' ? '$$' : '$$$'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adventurousness */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Adventurousness
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleChange('adventurousness', level)}
                  disabled={disabled}
                  className={`
                    flex-1 py-3 px-4 rounded-xl
                    text-sm font-medium
                    transition-all duration-200
                    border
                    ${preferences.adventurousness === level
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {level === 'low' ? 'Safe' : level === 'medium' ? 'Open' : 'Adventurous'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Collapse>
    </div>
  );
}
