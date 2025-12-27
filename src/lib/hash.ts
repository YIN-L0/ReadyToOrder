import { createHash } from 'crypto';

/**
 * Generate a SHA256 hash of the input string
 * Used for caching image prompts
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a short hash (first 16 characters) for filenames
 */
export function shortHash(input: string): string {
  return sha256(input).substring(0, 16);
}
