import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectivityState {
  /**
   * Whether the device currently has a network connection reachable to the
   * internet. `true` while the state is unknown so the UI does not flash an
   * offline banner before the first NetInfo event arrives.
   */
  isOnline: boolean;
  /** Convenience negation of {@link isOnline}. */
  isOffline: boolean;
}

const ConnectivityContext = createContext<ConnectivityState | undefined>(undefined);

/**
 * Resolves whether a NetInfo state should be treated as "online".
 *
 * `isInternetReachable` is the stronger signal (a device can be connected to a
 * Wi-Fi with no internet), but it can be `null` while probing. In that case we
 * fall back to `isConnected` and, when both are unknown, assume online to avoid
 * a false "offline" flash on startup.
 */
function resolveOnline(state: NetInfoState): boolean {
  if (state.isInternetReachable === false) return false;
  if (state.isConnected === false) return false;
  return true;
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  // Optimistic default: assume online until NetInfo reports otherwise.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Prime with the current state, then subscribe to changes. The banner
    // appears/disappears automatically as connectivity toggles.
    NetInfo.fetch().then((state) => setIsOnline(resolveOnline(state)));
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(resolveOnline(state));
    });
    return unsubscribe;
  }, []);

  const value = useMemo<ConnectivityState>(
    () => ({ isOnline, isOffline: !isOnline }),
    [isOnline],
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

/**
 * Reads the current connectivity state. Must be used within a
 * {@link ConnectivityProvider}.
 */
export function useConnectivity(): ConnectivityState {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error('useConnectivity must be used within ConnectivityProvider');
  return ctx;
}
