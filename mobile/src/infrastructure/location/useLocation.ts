import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

/** A single captured GPS reading. */
export interface CapturedLocation {
  latitude: number;
  longitude: number;
  /** Accuracy in metres (may be undefined on some platforms). */
  accuracy?: number;
}

export type LocationPermission = 'granted' | 'denied' | 'undetermined';

/**
 * Hook for one-shot (pontual) location capture with permission handling.
 *
 * It does NOT track the location continuously — it only reads the current
 * position on demand, which is what the "start inspection" flow needs.
 *
 * When permission is denied the flow must NOT be blocked (RN-059): callers
 * should treat a `null` result as "location unavailable" and continue.
 */
export function useLocation() {
  const [permission, setPermission] = useState<LocationPermission>('undetermined');

  // Check the current permission status on mount so the UI can reflect it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (!cancelled) setPermission(mapStatus(status));
      } catch {
        if (!cancelled) setPermission('undetermined');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Request foreground location permission. Returns the resulting status. */
  const requestPermission = useCallback(async (): Promise<LocationPermission> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const mapped = mapStatus(status);
      setPermission(mapped);
      return mapped;
    } catch {
      setPermission('denied');
      return 'denied';
    }
  }, []);

  /**
   * Capture the current position once. Requests permission first if needed.
   * Returns `null` when permission is denied or the reading fails, so the
   * caller can continue without a location (RN-059).
   */
  const capture = useCallback(async (): Promise<CapturedLocation | null> => {
    try {
      let status = permission;
      if (status !== 'granted') {
        status = await requestPermission();
      }
      if (status !== 'granted') return null;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
      };
    } catch {
      return null;
    }
  }, [permission, requestPermission]);

  return { permission, requestPermission, capture, isWeb: Platform.OS === 'web' };
}

function mapStatus(status: Location.PermissionStatus): LocationPermission {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}
