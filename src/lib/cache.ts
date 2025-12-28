import { shortHash } from './hash';
import { safeLog } from './safeLog';

/**
 * In-memory cache for serverless environments (Vercel)
 * Images are stored as base64 data URLs
 */

interface CacheEntry {
  promptHash: string;
  imageDataUrl: string;
  createdAt: number;
}

// In-memory cache (will reset on cold start, but that's acceptable)
const memoryCache = new Map<string, CacheEntry>();

// Cache TTL: 1 hour (in milliseconds)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Clean up expired cache entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [hash, entry] of memoryCache.entries()) {
    if (now - entry.createdAt > CACHE_TTL) {
      memoryCache.delete(hash);
      safeLog.debug('Expired cache entry removed', { hash });
    }
  }
}

/**
 * Get cached image for a prompt
 * Returns null if not cached or expired
 */
export function getCachedImage(prompt: string): string | null {
  cleanupExpiredEntries();

  const hash = shortHash(prompt);
  const entry = memoryCache.get(hash);

  if (!entry) {
    return null;
  }

  // Check if entry has expired
  if (Date.now() - entry.createdAt > CACHE_TTL) {
    memoryCache.delete(hash);
    return null;
  }

  safeLog.info('Cache hit for image prompt', { hash });
  return entry.imageDataUrl;
}

/**
 * Save an image to cache
 * Returns the data URL
 */
export function cacheImage(prompt: string, imageData: Buffer): string {
  cleanupExpiredEntries();

  const hash = shortHash(prompt);

  // Convert buffer to base64 data URL
  const base64 = imageData.toString('base64');
  const imageDataUrl = `data:image/png;base64,${base64}`;

  // Store in memory cache
  memoryCache.set(hash, {
    promptHash: hash,
    imageDataUrl,
    createdAt: Date.now(),
  });

  safeLog.info('Image cached in memory', { hash });
  return imageDataUrl;
}

/**
 * Clear all cached images
 */
export function clearCache(): void {
  memoryCache.clear();
  safeLog.info('Cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: memoryCache.size,
    entries: Array.from(memoryCache.keys()),
  };
}
