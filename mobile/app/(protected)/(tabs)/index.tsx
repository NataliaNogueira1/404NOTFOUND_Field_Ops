import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button, Card } from '@/design-system';
import { InspectionCard } from '@/components/fieldops';
import { InspectionStatus, useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export default function HomeScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const { inspections, syncNow, isSyncing } = useFieldOps();
  const { refreshing, onRefresh, notice, clearNotice } = usePullToRefresh(syncNow);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = inspections.filter((item) => item.dueDate === todayStr).length;
  const overdue = inspections.filter((item) => item.overdue).length;
  const progress = inspections.filter((item) => item.status === InspectionStatus.IN_PROGRESS).length;
  const pendingSync = inspections.reduce((sum, item) => sum + item.pendingSyncCount, 0);

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: c.text }]}>Minhas inspeções</Text>
          <Text style={[styles.date, { color: c.textSecondary }]}>{dateLabel}</Text>
        </View>
        {notice ? (
          <Pressable onPress={clearNotice} style={[styles.notice, { backgroundColor: c.warningLight }]}>
            <Text style={[styles.noticeText, { color: c.warningDark }]}>{notice}</Text>
          </Pressable>
        ) : null}

        <View style={styles.stats}>
          <Stat value={todayCount} label="Hoje" tone="primary" />
          <Stat value={overdue} label="Atrasada" tone="danger" />
          <Stat value={progress} label="Em andamento" tone="warning" />
          <Stat value={pendingSync} label="Pendente sync" tone="success" />
        </View>

        <Card style={styles.syncBanner}>
          <Text style={[styles.bannerTitle, { color: c.text }]}>{pendingSync} operações pendentes</Text>
          <Button
            label={isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
            onPress={syncNow}
            variant="secondary"
            fullWidth
          />
        </Card>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Próximas inspeções</Text>
          <Pressable onPress={() => router.push('/(protected)/(tabs)/inspections')}>
            <Text style={[styles.link, { color: c.primary }]}>Ver todas</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {inspections.slice(0, 3).map((inspection) => (
            <InspectionCard key={inspection.id} inspection={inspection} />
          ))}
          {inspections.length === 0 && (
            <Text style={[styles.empty, { color: c.textSecondary }]}>Nenhuma inspeção atribuída. Sincronize para verificar.</Text>
          )}
        </View>
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => router.push('/(protected)/scanner')}>
        <Text style={styles.fabText}>Escanear QR Code</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: 'primary' | 'danger' | 'warning' | 'success' }) {
  const c = useThemeColors();
  const bg = { primary: c.primaryLight, danger: c.dangerLight, warning: c.warningLight, success: c.successLight }[tone];
  const color = { primary: c.primaryDark, danger: c.dangerDark, warning: c.warningDark, success: c.successDark }[tone];
  return (
    <Card style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]}>{label}</Text>
      <View style={[styles.statDot, { backgroundColor: bg }]} />
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing.md, paddingBottom: 120, gap: Spacing.md },
  header: { gap: Spacing.xs, marginBottom: Spacing.xs },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  date: { fontSize: FontSize.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stat: { width: '48%', minHeight: 112, gap: Spacing.xs, overflow: 'hidden' },
  statValue: { fontSize: 32, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  statDot: { position: 'absolute', right: -18, top: -18, width: 64, height: 64, borderRadius: 32 },
  syncBanner: { gap: Spacing.sm },
  bannerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  link: { fontWeight: FontWeight.semibold },
  list: { gap: Spacing.sm },
  empty: { textAlign: 'center', padding: Spacing.lg },
  notice: { borderRadius: 10, padding: Spacing.sm },
  noticeText: { fontSize: FontSize.sm, textAlign: 'center' },
  fab: { position: 'absolute', right: Spacing.md, bottom: 86, backgroundColor: Colors.primary, minHeight: 52, paddingHorizontal: Spacing.lg, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: Colors.white, fontWeight: FontWeight.semibold },
});
