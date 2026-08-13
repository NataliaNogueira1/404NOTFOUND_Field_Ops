import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Card } from '@/design-system';
import { byId, clients, equipment, sites, type Inspection } from '@/features/fieldops';
import { InspectionStatusBadge, PriorityBadge, ProgressBar, SyncBadge } from './Badges';

export function InspectionCard({ inspection }: { inspection: Inspection }) {
  const router = useRouter();
  const client = byId(clients, inspection.clientId);
  const site = byId(sites, inspection.siteId);
  const asset = byId(equipment, inspection.equipmentId);
  return (
    <Pressable onPress={() => router.push(`/(protected)/inspections/${inspection.id}`)} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.row}><PriorityBadge priority={inspection.priority} /><InspectionStatusBadge status={inspection.status} /></View>
        <Text style={styles.title}>{inspection.title}</Text>
        <Text style={styles.line}>Cliente: {client?.name}</Text>
        <Text style={styles.line}>Local: {site?.name}</Text>
        <Text style={styles.line}>Equipamento: {asset?.name}</Text>
        <Text style={[styles.line, inspection.overdue && styles.overdue]}>Prevista: {inspection.dueDate} às {inspection.dueTime}</Text>
        <View style={styles.progressRow}><ProgressBar value={inspection.progress} /><Text style={styles.progressText}>{inspection.progress}%</Text></View>
        <View style={styles.row}><SyncBadge status={inspection.syncStatus} />{inspection.pendingSyncCount > 0 ? <Text style={styles.syncText}>{inspection.pendingSyncCount} pendentes</Text> : null}</View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.86 },
  card: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 22 },
  line: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  overdue: { color: Colors.danger, fontWeight: FontWeight.semibold },
  progressRow: { gap: Spacing.xs },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, alignSelf: 'flex-end' },
  syncText: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
