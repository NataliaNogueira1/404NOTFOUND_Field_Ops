import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Badge } from '@/design-system';
import { InspectionStatus, Priority, Severity, type SyncStatus } from '@/features/fieldops';

const statusLabel: Record<InspectionStatus, string> = { DRAFT: 'Rascunho', ASSIGNED: 'Atribuída', IN_PROGRESS: 'Em andamento', SUBMITTED: 'Enviada', UNDER_REVIEW: 'Em revisão', APPROVED: 'Aprovada', REJECTED: 'Reprovada', CANCELED: 'Cancelada' };
const statusVariant: Record<InspectionStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = { DRAFT: 'default', ASSIGNED: 'primary', IN_PROGRESS: 'warning', SUBMITTED: 'primary', UNDER_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELED: 'default' };
const priorityLabel: Record<Priority, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica' };
const priorityVariant: Record<Priority, 'success' | 'primary' | 'warning' | 'danger'> = { LOW: 'success', MEDIUM: 'primary', HIGH: 'warning', CRITICAL: 'danger' };
const severityLabel: Record<Severity, string> = { LOW: 'Leve', MEDIUM: 'Moderada', HIGH: 'Alta', CRITICAL: 'Crítica' };
const syncLabel: Record<SyncStatus, string> = { synced: 'Sincronizado', pending: 'Pendente upload', error: 'Erro sync' };
const syncVariant: Record<SyncStatus, 'success' | 'warning' | 'danger'> = { synced: 'success', pending: 'warning', error: 'danger' };

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) { return <Badge label={statusLabel[status]} variant={statusVariant[status]} />; }
export function PriorityBadge({ priority }: { priority: Priority }) { return <Badge label={priorityLabel[priority]} variant={priorityVariant[priority]} />; }
export function SeverityBadge({ severity }: { severity: Severity }) { return <Badge label={severityLabel[severity]} variant={priorityVariant[severity]} />; }
export function SyncBadge({ status }: { status: SyncStatus }) { return <Badge label={syncLabel[status]} variant={syncVariant[status]} />; }

export function ProgressBar({ value }: { value: number }) {
  return <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%` }]} /></View>;
}

export function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}</View>;
}

export function RejectionBanner({
  reason,
  rejectedBy,
  rejectedAt,
  items = [],
}: {
  reason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  items?: string[];
}) {
  return (
    <View style={styles.rejection} accessibilityRole="alert">
      <Text style={styles.rejectionTitle}>⚠️ Inspeção reprovada</Text>
      {reason ? (
        <Text style={styles.rejectionBody}>
          <Text style={styles.rejectionLabel}>Motivo: </Text>
          {reason}
        </Text>
      ) : null}
      {items.length > 0 ? (
        <View style={styles.rejectionItems}>
          <Text style={styles.rejectionLabel}>Itens para correção:</Text>
          {items.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.rejectionBody}>{`\u2022 ${item}`}</Text>
          ))}
        </View>
      ) : null}
      {rejectedBy ? (
        <Text style={styles.rejectionMeta}>Reprovada por: {rejectedBy}</Text>
      ) : null}
      {rejectedAt ? <Text style={styles.rejectionMeta}>Data: {rejectedAt}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 999, backgroundColor: Colors.gray100, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999, backgroundColor: Colors.primary },
  sectionHeader: { marginTop: Spacing.lg, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  sectionMeta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  rejection: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: Colors.danger, borderRadius: 10, padding: Spacing.md, gap: Spacing.xs },
  rejectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.dangerDark },
  rejectionBody: { fontSize: FontSize.sm, color: Colors.dangerDark, lineHeight: 20 },
  rejectionLabel: { fontWeight: FontWeight.semibold, color: Colors.dangerDark },
  rejectionItems: { marginTop: Spacing.xs, gap: 2 },
  rejectionMeta: { fontSize: FontSize.xs, color: Colors.dangerDark, marginTop: 2 },
});
