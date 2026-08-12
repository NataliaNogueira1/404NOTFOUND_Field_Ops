import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, StatusBadge } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import type { SyncState } from '@/features/synchronization';

export default function SyncScreen() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    pendingCount: 4,
    lastSyncedAt: '2026-08-12T08:30:00Z',
  });

  async function handleSync() {
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    // TODO: integrate with real sync logic
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSyncState({
      status: 'success',
      pendingCount: 0,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  const lastSync = syncState.lastSyncedAt
    ? new Date(syncState.lastSyncedAt).toLocaleString('pt-BR')
    : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.label}>Itens pendentes</Text>
          <Text style={styles.count}>{syncState.pendingCount}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Última sincronização</Text>
          <Text style={styles.dateText}>{lastSync}</Text>
          {syncState.status === 'success' && (
            <StatusBadge status="synced" style={styles.badge} />
          )}
          {syncState.pendingCount > 0 && syncState.status === 'idle' && (
            <StatusBadge status="unsynced" style={styles.badge} />
          )}
        </Card>

        <Button
          label={syncState.status === 'syncing' ? 'Sincronizando...' : 'Sincronizar agora'}
          onPress={handleSync}
          loading={syncState.status === 'syncing'}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md, gap: Spacing.md },
  card: { alignItems: 'center', gap: Spacing.xs },
  label: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  count: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  dateText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.gray800,
  },
  badge: { marginTop: Spacing.xs },
});
