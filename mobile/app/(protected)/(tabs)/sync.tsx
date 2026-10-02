import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button, Card } from '@/design-system';
import { useThemeColors } from '@/features/theme';
import {
  formatLastSync,
  useSyncStatus,
  type SyncOperationDisplayStatus,
  type SyncOperationView,
} from '@/features/synchronization';

// Maps each real outbox display status to the acceptance-criteria icon + copy.
// colorKey points to a theme token so the status color follows light/dark.
const STATUS_META: Record<
  SyncOperationDisplayStatus,
  { icon: string; label: string; colorKey: 'success' | 'warningDark' | 'danger' }
> = {
  synced: { icon: '✓', label: 'Sincronizada', colorKey: 'success' },
  pending: { icon: '⏳', label: 'Pendente', colorKey: 'warningDark' },
  error: { icon: '❌', label: 'Falha', colorKey: 'danger' },
  waiting: { icon: '⚠️', label: 'Aguardando', colorKey: 'warningDark' },
  conflict: { icon: '⚠️', label: 'Conflito de versão', colorKey: 'danger' },
};

export default function SyncScreen() {
  const c = useThemeColors();
  const {
    isOnline, isSyncing, lastSuccessfulSyncAt, pendingCount,
    operations, lastSyncError, triggerSync,
  } = useSyncStatus();

  const statusText = isSyncing ? 'Sincronizando…' : pendingCount > 0 ? 'Pendências locais' : 'Sincronizado';
  const pendingLabel = pendingCount === 1 ? '1 operação pendente' : `${pendingCount} operações pendentes`;
  const syncButtonLabel = isSyncing ? 'Sincronizando…' : isOnline ? 'Sincronizar agora' : 'Sincronizar agora (offline)';
  const failedPhotos = operations.filter((op) => op.entityType === 'evidence' && op.displayStatus === 'error').length;
  const hasFailedOperations = operations.some((op) => op.displayStatus === 'error');
  const conflictCount = operations.filter((op) => op.displayStatus === 'conflict').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      {!isOnline ? (
        <View style={[styles.offlineBanner, { backgroundColor: c.gray800 }]} accessibilityRole="alert">
          <Text style={styles.offlineText}>
            ⚠️ Você está offline. As alterações serão sincronizadas quando a conexão voltar.
          </Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]}>Sincronização</Text>
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: isOnline ? c.success : c.gray400 }]} />
            <Text style={[styles.connText, { color: c.text }]}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <Text style={[styles.label, { color: c.textSecondary }]}>Última sincronização</Text>
          <Text style={[styles.date, { color: c.text }]}>{formatLastSync(lastSuccessfulSyncAt)}</Text>
          <Text style={[styles.value, { color: c.text }]}>{statusText}</Text>
          <Text style={[styles.muted, { color: c.textSecondary }]}>{pendingLabel}</Text>
          <Button label={syncButtonLabel} onPress={triggerSync} loading={isSyncing} disabled={!isOnline || isSyncing} fullWidth />
          {lastSyncError ? (
            <Text style={styles.errorText} numberOfLines={3}>{`❌ ${lastSyncError}`}</Text>
          ) : null}
        </Card>
        <Text style={[styles.section, { color: c.text }]}>Operações</Text>

        {conflictCount > 0 ? (
          <View style={[styles.conflictBanner, { backgroundColor: c.dangerLight }]} accessibilityRole="alert">
            <Text style={[styles.conflictText, { color: c.danger }]}>
              ⚠️ {conflictCount === 1 ? '1 conflito de versão preservado no dispositivo.' : `${conflictCount} conflitos de versão preservados no dispositivo.`}
            </Text>
          </View>
        ) : null}

        {operations.length === 0 ? (
          <Card style={styles.card}>
            <Text style={[styles.muted, { color: c.textSecondary }]}>Nenhuma operação na fila de sincronização.</Text>
          </Card>
        ) : (
          operations.map((operation) => (
            <OperationRow key={operation.id} operation={operation} />
          ))
        )}
        {hasFailedOperations ? (
          <Button label="Tentar novamente" onPress={triggerSync} variant="secondary" disabled={!isOnline || isSyncing} fullWidth />
        ) : null}
        <Card style={styles.card}>
          <Text style={[styles.section, { color: c.text }]}>Dispositivo</Text>
          <Row label="Fotos com falha" value={String(failedPhotos)} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function OperationRow({ operation }: { operation: SyncOperationView }) {
  const c = useThemeColors();
  const meta = STATUS_META[operation.displayStatus];
  const color = c[meta.colorKey];
  return (
    <Card style={styles.operation}>
      <Text style={[styles.icon, { color }]}>{meta.icon}</Text>
      <View style={styles.operationInfo}>
        <Text style={[styles.operationTitle, { color: c.text }]}>{operation.title}</Text>
        <Text style={[styles.operationStatus, { color }]}>{meta.label}</Text>
        {operation.displayStatus === 'waiting' && operation.waitingReason ? (
          <Text style={[styles.muted, { color: c.textSecondary }]} numberOfLines={2}>{operation.waitingReason}</Text>
        ) : null}
        {operation.displayStatus === 'error' && operation.error ? (
          <Text style={styles.errorText} numberOfLines={2}>{`Erro: ${operation.error}`}</Text>
        ) : null}
        {operation.displayStatus === 'conflict' && operation.error ? (
          <Text style={styles.errorText} numberOfLines={3}>{`Conflito: ${operation.error}`}</Text>
        ) : null}
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.row, { borderTopColor: c.border }]}>
      <Text style={[styles.muted, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  offlineBanner: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  offlineText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },
  container: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: { gap: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 999 },
  connText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  label: { fontWeight: FontWeight.semibold },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  muted: { fontSize: FontSize.sm },
  date: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  section: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  operation: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  icon: { fontSize: FontSize.lg, lineHeight: 24 },
  operationInfo: { flex: 1, gap: 2 },
  operationTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  operationStatus: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  errorText: { fontSize: FontSize.sm, color: Colors.danger },
  conflictBanner: { borderRadius: 8, padding: Spacing.sm },
  conflictText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: Spacing.sm },
  rowValue: { fontWeight: FontWeight.semibold },
});
