import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { Card } from '@/design-system';
import { formatInspectionId, type Inspection } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { InspectionStatusBadge, PriorityBadge, ProgressBar, SyncBadge } from './Badges';

export function InspectionCard({ inspection }: { inspection: Inspection }) {
  const router = useRouter();
  const c = useThemeColors();
  return (
    <Pressable onPress={() => router.push(`/(protected)/inspections/${inspection.id}`)} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.row}><PriorityBadge priority={inspection.priority} /><InspectionStatusBadge status={inspection.status} /></View>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{inspection.title}</Text>
          <Text style={[styles.id, { color: c.textSecondary }]}>{formatInspectionId(inspection.id)}</Text>
        </View>
        <Text style={[styles.line, { color: c.textSecondary }]}>Cliente: {inspection.clientName}</Text>
        <Text style={[styles.line, { color: c.textSecondary }]}>Local: {inspection.siteName}</Text>
        <Text style={[styles.line, { color: c.textSecondary }]}>Equipamento: {inspection.equipmentName}</Text>
        <Text style={[styles.line, { color: inspection.overdue ? c.danger : c.textSecondary }, inspection.overdue && styles.overdue]}>Prevista: {inspection.dueDate} às {inspection.dueTime}</Text>
        <View style={styles.progressRow}><ProgressBar value={inspection.progress} /><Text style={[styles.progressText, { color: c.textSecondary }]}>{inspection.progress}%</Text></View>
        <View style={styles.row}><SyncBadge status={inspection.syncStatus} />{inspection.pendingSyncCount > 0 ? <Text style={[styles.syncText, { color: c.textSecondary }]}>{inspection.pendingSyncCount} pendentes</Text> : null}</View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.86 },
  card: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  title: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold, lineHeight: 22 },
  id: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, lineHeight: 22 },
  line: { fontSize: FontSize.sm, lineHeight: 20 },
  overdue: { fontWeight: FontWeight.semibold },
  progressRow: { gap: Spacing.xs },
  progressText: { fontSize: FontSize.xs, alignSelf: 'flex-end' },
  syncText: { fontSize: FontSize.xs },
});
