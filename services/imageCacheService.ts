import { Image } from 'expo-image';
import { getImageUrl } from './storageService';
import { CACHE_DURATION_MS } from '@/constants';

interface CacheEntry {
  url: string;
  expiry: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

const urlCache = new Map<string, CacheEntry>();
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Get a cached image URL, fetching from S3 if not cached or expired
 */
export const getCachedImageUrl = async (s3Key: string | null): Promise<string | null> => {
  if (!s3Key) return null;

  const cached = urlCache.get(s3Key);
  const now = Date.now();

  if (cached && cached.expiry > now) {
    cacheHits++;
    return cached.url;
  }

  cacheMisses++;

  try {
    const url = await getImageUrl(s3Key);
    urlCache.set(s3Key, { url, expiry: now + CACHE_DURATION_MS });
    return url;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const errorName = error?.name || 'UnknownError';

    if (__DEV__) {
      console.warn(`Failed to get image URL for s3Key "${s3Key}": ${errorName} - ${errorMsg}`);
    }

    // Return null so images gracefully fail to load instead of crashing
    return null;
  }
};

/**
 * Prefetch multiple images to warm up the cache
 */
export const prefetchImages = async (s3Keys: (string | null)[]): Promise<void> => {
  const validKeys = s3Keys.filter((key): key is string => key !== null);

  // Get URLs in parallel
  const urls = await Promise.all(validKeys.map((key) => getCachedImageUrl(key)));

  // Prefetch images using expo-image
  const validUrls = urls.filter((url): url is string => url !== null);
  if (validUrls.length > 0) {
    await Image.prefetch(validUrls);
  }
};

/**
 * Clear all cached URLs
 */
export const clearImageCache = (): void => {
  urlCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
};

/**
 * Remove a specific key from the cache
 */
export const removeFromCache = (s3Key: string): boolean => {
  return urlCache.delete(s3Key);
};

/**
 * Get cache statistics for debugging
 */
export const getCacheStats = (): CacheStats => ({
  hits: cacheHits,
  misses: cacheMisses,
  size: urlCache.size,
});

/**
 * Clear expired entries from the cache
 */
export const cleanExpiredCache = (): number => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of urlCache.entries()) {
    if (entry.expiry <= now) {
      urlCache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
};
