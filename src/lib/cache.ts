import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { shortHash } from './hash';
import { safeLog } from './safeLog';

const CACHE_DIR = join(process.cwd(), '.cache');
const CACHE_FILE = join(CACHE_DIR, 'images.json');
const GENERATED_DIR = join(process.cwd(), 'public', 'generated');

interface CacheEntry {
  promptHash: string;
  imagePath: string;
  createdAt: string;
}

interface CacheData {
  entries: Record<string, CacheEntry>;
}

/**
 * Ensure cache directories exist
 */
function ensureDirectories(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!existsSync(GENERATED_DIR)) {
    mkdirSync(GENERATED_DIR, { recursive: true });
  }
}

/**
 * Load cache data from disk
 */
function loadCache(): CacheData {
  ensureDirectories();

  if (!existsSync(CACHE_FILE)) {
    return { entries: {} };
  }

  try {
    const data = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data) as CacheData;
  } catch (error) {
    safeLog.warn('Failed to load cache, starting fresh');
    return { entries: {} };
  }
}

/**
 * Save cache data to disk
 */
function saveCache(cache: CacheData): void {
  ensureDirectories();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Get cached image path for a prompt
 * Returns null if not cached
 */
export function getCachedImage(prompt: string): string | null {
  const hash = shortHash(prompt);
  const cache = loadCache();
  const entry = cache.entries[hash];

  if (!entry) {
    return null;
  }

  // Verify the file still exists
  const fullPath = join(process.cwd(), 'public', entry.imagePath);
  if (!existsSync(fullPath)) {
    safeLog.warn('Cached image file not found, removing entry');
    delete cache.entries[hash];
    saveCache(cache);
    return null;
  }

  safeLog.info('Cache hit for image prompt', { hash });
  return entry.imagePath;
}

/**
 * Save an image to cache
 * Returns the public URL path
 */
export function cacheImage(prompt: string, imageData: Buffer): string {
  ensureDirectories();

  const hash = shortHash(prompt);
  const filename = `${hash}.png`;
  const relativePath = `/generated/${filename}`;
  const fullPath = join(GENERATED_DIR, filename);

  // Write the image file
  writeFileSync(fullPath, imageData);

  // Update cache index
  const cache = loadCache();
  cache.entries[hash] = {
    promptHash: hash,
    imagePath: relativePath,
    createdAt: new Date().toISOString(),
  };
  saveCache(cache);

  safeLog.info('Image cached', { hash, path: relativePath });
  return relativePath;
}

/**
 * Clear all cached images
 */
export function clearCache(): void {
  const cache = loadCache();
  cache.entries = {};
  saveCache(cache);
  safeLog.info('Cache cleared');
}
