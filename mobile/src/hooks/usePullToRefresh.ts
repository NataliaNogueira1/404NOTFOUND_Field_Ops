import { useCallback, useState } from 'react';

import { useConnectivity } from '@/infrastructure/connectivity';

const OFFLINE_MESSAGE = 'Sem conexão. Dados podem estar desatualizados.';

interface PullToRefreshResult {
  /** Pass to a `RefreshControl`'s `refreshing` prop. */
  refreshing: boolean;
  /** Pass to a `RefreshControl`'s `onRefresh` prop. */
  onRefresh: () => void;
  /**
   * Friendly notice set after a pull-to-refresh while offline. `null` when there
   * is nothing to show. Never an error — offline is an expected state.
   */
  notice: string | null;
  /** Dismiss the current {@link notice}. */
  clearNotice: () => void;
}

/**
 * Wires pull-to-refresh to connectivity: when online it runs {@link refresh}
 * (typically a sync), and when offline it skips the network call and surfaces a
 * friendly, non-error notice so screens backed by local SQLite never show a
 * network error.
 *
 * @param refresh async work to run while online (e.g. `syncNow`).
 */
export function usePullToRefresh(refresh: () => void | Promise<void>): PullToRefreshResult {
  const { isOffline } = useConnectivity();
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setNotice(null);
    try {
      if (isOffline) {
        setNotice(OFFLINE_MESSAGE);
        return;
      }
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [isOffline, refresh]);

  const clearNotice = useCallback(() => setNotice(null), []);

  return { refreshing, onRefresh, notice, clearNotice };
}
