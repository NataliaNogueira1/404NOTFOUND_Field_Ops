import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button, Card } from '@/design-system';
import { InspectionCard } from '@/components/fieldops';
import { InspectionStatus, useFieldOps } from '@/features/fieldops';

export default function HomeScreen() {
  const router = useRouter();
  const { inspections, syncNow } = useFieldOps();
  const today = inspections.filter((item) => item.dueDate === '2026-08-13').length;
  const overdue = inspections.filter((item) => item.overdue).length;
  const progress = inspections.filter((item) => item.status === InspectionStatus.IN_PROGRESS).length;
  const pendingSync = inspections.reduce((sum, item) => sum + item.pendingSyncCount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.greeting}>Olá, Carlos!</Text><Text style={styles.date}>Quinta, 13 de agosto de 2026</Text></View>
        <View style={styles.stats}><Stat value={today} label="Hoje" tone="primary" /><Stat value={overdue} label="Atrasada" tone="danger" /><Stat value={progress} label="Em andamento" tone="warning" /><Stat value={pendingSync} label="Pendente sync" tone="success" /></View>
        <Card style={styles.syncBanner}>
          <Text style={styles.bannerTitle}>{pendingSync} operações pendentes</Text>
          <Text style={styles.bannerText}>Última sincronização: há 15 min</Text>
          <Button label="Sincronizar agora" onPress={syncNow} variant="secondary" fullWidth />
        </Card>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Próximas inspeções</Text><Pressable onPress={() => router.push('/(protected)/(tabs)/inspections')}><Text style={styles.link}>Ver todas</Text></Pressable></View>
        <View style={styles.list}>{inspections.slice(0, 3).map((inspection) => <InspectionCard key={inspection.id} inspection={inspection} />)}</View>
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => router.push('/(protected)/scanner')}><Text style={styles.fabText}>Escanear QR Code</Text></Pressable>
    </SafeAreaView>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: 'primary' | 'danger' | 'warning' | 'success' }) {
  const bg = { primary: Colors.primaryLight, danger: '#FEE2E2', warning: Colors.warningLight, success: '#DCFCE7' }[tone];
  const color = { primary: Colors.primaryDark, danger: Colors.dangerDark, warning: Colors.warningDark, success: Colors.successDark }[tone];
  return <Card style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text><View style={[styles.statDot, { backgroundColor: bg }]} /></Card>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, paddingBottom: 120, gap: Spacing.md },
  header: { gap: Spacing.xs, marginBottom: Spacing.xs },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  date: { fontSize: FontSize.sm, color: Colors.textSecondary },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stat: { width: '48%', minHeight: 112, gap: Spacing.xs, overflow: 'hidden' },
  statValue: { fontSize: 32, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  statDot: { position: 'absolute', right: -18, top: -18, width: 64, height: 64, borderRadius: 32 },
  syncBanner: { gap: Spacing.sm, borderColor: Colors.primaryLight },
  bannerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  bannerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  link: { color: Colors.primary, fontWeight: FontWeight.semibold },
  list: { gap: Spacing.sm },
  fab: { position: 'absolute', right: Spacing.md, bottom: 86, backgroundColor: Colors.primary, minHeight: 52, paddingHorizontal: Spacing.lg, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: Colors.white, fontWeight: FontWeight.semibold },
});
