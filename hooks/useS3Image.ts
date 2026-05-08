import { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { getCachedImageUrl } from '../services';

interface UseS3ImageResult {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to get an image URL from S3 or local storage
 * @param s3Key - The S3 key or local key (starting with 'local/')
 * @param localUri - Optional local URI for local images (the photoUrl from the drink)
 */
export const useS3Image = (s3Key: string | null, localUri?: string | null): UseS3ImageResult => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchUrl = async () => {
      if (!s3Key) {
        setImageUrl(null);
        setLoading(false);
        setError(null);
        return;
      }

      // For local images, use the localUri directly if provided
      if (s3Key.startsWith('local/') && localUri) {
        if (mounted) {
          setImageUrl(localUri);
          setLoading(false);
          setError(null);
        }
        return;
      }

      // For local images without localUri, the s3Key might be the URI itself
      if (s3Key.startsWith('file://') || s3Key.startsWith('content://')) {
        if (mounted) {
          setImageUrl(s3Key);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      // Check if expo-image has already saved this file using the s3Key as the cacheKey
      try {
        const localPath = await Image.getCachePathAsync(s3Key);
        if (localPath) {
          if (mounted) {
            setImageUrl(localPath.startsWith('file://') ? localPath : `file://${localPath}`);
            setLoading(false);
            setError(null);
          }
          return;
        }
      } catch (err) {
        console.log('Cache path error:', err);
      }

      try {
        const url = await getCachedImageUrl(s3Key);

        if (mounted) {
          if (url) {
            setImageUrl(url);
            setError(null);
          } else {
            setImageUrl(null);
            setError('Failed to load image URL - authentication may have expired');
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.warn('Error fetching image URL:', err);
          setImageUrl(null);
          setError('Failed to load image');
          setLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      mounted = false;
    };
  }, [s3Key, localUri, refreshKey]);

  return { imageUrl, loading, error, refetch };
};
