import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button, Card } from '@/design-system';
import {
  formatLastSync,
  useSyncStatus,
  type SyncOperationDisplayStatus,
  type SyncOperationView,
} from '@/features/synchronization';

// Maps each real outbox display status to the acceptance-criteria icon + copy.
const STATUS_META: Record<
  SyncOperationDisplayStatus,
  { icon: string; label: string; color: string }
> = {
  synced: { icon: '✓', label: 'Sincronizada', color: Colors.success },
  pending: { icon: '⏳', label: 'Pendente', color: Colors.warningDark },
  error: { icon: '❌', label: 'Falha', color: Colors.danger },
  waiting: { icon: '⚠️', label: 'Aguardando', color: Colors.warningDark },
  conflict: { icon: '⚠️', label: 'Conflito de versão', color: Colors.danger },
};

export default function SyncScreen() {
  const {
    isOnline,
    isSyncing,
    lastSuccessfulSyncAt,
    pendingCount,
    operations,
    lastSyncError,
    triggerSync,
  } = useSyncStatus();

  const statusText = isSyncing
    ? 'Sincronizando…'
    : pendingCount > 0
      ? 'Pendências locais'
      : 'Sincronizado';

  const pendingLabel =
    pendingCount === 1 ? '1 operação pendente' : `${pendingCount} operações pendentes`;

  const syncButtonLabel = isSyncing
    ? 'Sincronizando…'
    : isOnline
      ? 'Sincronizar agora'
      : 'Sincronizar agora (offline)';

  // Photos that failed to upload (PBI-044), derived from the REAL outbox: an
  // evidence operation sitting in the "error" bucket is a failed photo upload.
  const failedPhotos = operations.filter(
    (operation) => operation.entityType === 'evidence' && operation.displayStatus === 'error',
  ).length;

  const hasFailedOperations = operations.some(
    (operation) => operation.displayStatus === 'error',
  );
  const conflictCount = operations.filter((operation) => operation.displayStatus === 'conflict').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Reactive offline banner — driven by the global connectivity provider. */}
      {!isOnline ? (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>
            ⚠️ Você está offline. As alterações serão sincronizadas quando a conexão voltar.
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sincronização</Text>

        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <View
              style={[styles.dot, { backgroundColor: isOnline ? Colors.success : Colors.gray400 }]}
            />
            <Text style={styles.connText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>

          <Text style={styles.label}>Última sincronização</Text>
          <Text style={styles.date}>{formatLastSync(lastSuccessfulSyncAt)}</Text>

          <Text style={styles.value}>{statusText}</Text>
          <Text style={styles.muted}>{pendingLabel}</Text>

          <Button
            label={syncButtonLabel}
            onPress={triggerSync}
            loading={isSyncing}
            disabled={!isOnline || isSyncing}
            fullWidth
          />

          {lastSyncError ? (
            <Text style={styles.errorText} numberOfLines={3}>{`❌ ${lastSyncError}`}</Text>
          ) : null}
        </Card>

        <Text style={styles.section}>Operações</Text>

        {conflictCount > 0 ? (
          <View style={styles.conflictBanner} accessibilityRole="alert">
            <Text style={styles.conflictText}>
              ⚠️ {conflictCount === 1 ? '1 conflito de versão preservado no dispositivo.' : `${conflictCount} conflitos de versão preservados no dispositivo.`}
            </Text>
          </View>
        ) : null}

        {operations.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.muted}>Nenhuma operação na fila de sincronização.</Text>
          </Card>
        ) : (
          operations.map((operation) => (
            <OperationRow key={operation.id} operation={operation} />
          ))
        )}

        {/* Retry action for failed operations (PBI-044): reuses the existing
            sync mechanism, disabled while offline or already syncing. */}
        {hasFailedOperations ? (
          <Button
            label="Tentar novamente"
            onPress={triggerSync}
            variant="secondary"
            disabled={!isOnline || isSyncing}
            fullWidth
          />
        ) : null}

        {/* Device card (PBI-044): failed photo uploads count, from real data. */}
        <Card style={styles.card}>
          <Text style={styles.section}>Dispositivo</Text>
          <Row label="Fotos com falha" value={String(failedPhotos)} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function OperationRow({ operation }: { operation: SyncOperationView }) {
  const meta = STATUS_META[operation.displayStatus];
  return (
    <Card style={styles.operation}>
      <Text style={[styles.icon, { color: meta.color }]}>{meta.icon}</Text>
      <View style={styles.operationInfo}>
        <Text style={styles.operationTitle}>{operation.title}</Text>
        <Text style={[styles.operationStatus, { color: meta.color }]}>{meta.label}</Text>
        {operation.displayStatus === 'waiting' && operation.waitingReason ? (
          <Text style={styles.muted} numberOfLines={2}>{operation.waitingReason}</Text>
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
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  offlineBanner: {
    backgroundColor: Colors.gray800,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  offlineText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },
  container: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  card: { gap: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 999 },
  connText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  label: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  value: { fontSize: FontSize.xl, color: Colors.text, fontWeight: FontWeight.bold },
  muted: { color: Colors.textSecondary, fontSize: FontSize.sm },
  date: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  section: { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.semibold },
  operation: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  icon: { fontSize: FontSize.lg, lineHeight: 24 },
  operationInfo: { flex: 1, gap: 2 },
  operationTitle: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },
  operationStatus: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  errorText: { fontSize: FontSize.sm, color: Colors.danger },
  conflictBanner: { backgroundColor: Colors.dangerLight, borderRadius: 8, padding: Spacing.sm },
  conflictText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  rowValue: { color: Colors.text, fontWeight: FontWeight.semibold },
});
