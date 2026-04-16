import { useState, useEffect, useCallback } from 'react';
import { Coordinates, getCurrentLocation, getLastKnownLocation } from '../services';

interface UseLocationResult {
  location: Coordinates | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useLocation = (): UseLocationResult => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get last known location first (faster)
      let coords = await getLastKnownLocation();

      // If no last known, get current
      if (!coords) {
        coords = await getCurrentLocation();
      }

      if (coords) {
        setLocation(coords);
      } else {
        setError('Unable to get location. Please enable location services.');
      }
    } catch (e) {
      setError('Failed to get location');
      console.error('Location error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    error,
    refresh: fetchLocation,
  };
};
