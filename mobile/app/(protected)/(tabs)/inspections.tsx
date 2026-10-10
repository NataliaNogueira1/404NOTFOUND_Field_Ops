import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InspectionCard } from '@/components/fieldops';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { InspectionStatus, Priority, useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export default function InspectionsScreen() {
  const c = useThemeColors();
  const { inspections, isLoading, syncNow } = useFieldOps();
  const { refreshing, onRefresh, notice, clearNotice } = usePullToRefresh(syncNow);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'Todas' | InspectionStatus>('Todas');
  const [priority, setPriority] = useState<'Todas' | Priority>('Todas');
  const [period, setPeriod] = useState<'Todas' | 'Hoje' | 'Semana'>('Todas');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const weekEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 6); return d.toISOString().slice(0, 10);
  }, []);

  const filtered = useMemo(() => inspections.filter((inspection) => {
    const haystack = `${inspection.title} ${inspection.clientName} ${inspection.equipmentName} ${inspection.siteName}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = status === 'Todas' || inspection.status === status;
    const matchesPriority = priority === 'Todas' || inspection.priority === priority;
    const matchesPeriod =
      period === 'Todas' ||
      (period === 'Hoje' && inspection.dueDate === today) ||
      (period === 'Semana' && inspection.dueDate >= today && inspection.dueDate <= weekEnd);
    return matchesQuery && matchesStatus && matchesPriority && matchesPeriod;
  }), [inspections, period, priority, query, status, today, weekEnd]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Carregando inspeções...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        <Text style={[styles.title, { color: c.text }]}>Minhas inspeções</Text>
        {notice ? (
          <Pressable onPress={clearNotice} style={[styles.notice, { backgroundColor: c.warningLight }]}>
            <Text style={[styles.noticeText, { color: c.warningDark }]}>{notice}</Text>
          </Pressable>
        ) : null}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por título, cliente ou equipamento"
          placeholderTextColor={c.textSecondary}
          style={[styles.search, { borderColor: c.border, backgroundColor: c.surface, color: c.text }]}
        />
        <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Estado</Text>
        <ChipRow
          values={['Todas', InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS, InspectionStatus.REJECTED, InspectionStatus.SUBMITTED]}
          selected={status}
          onSelect={(value) => setStatus(value as typeof status)}
          labels={{ ASSIGNED: 'Atribuída', IN_PROGRESS: 'Em andamento', REJECTED: 'Reprovada', SUBMITTED: 'Enviada' }}
        />
        <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Prioridade</Text>
        <ChipRow
          values={['Todas', Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL]}
          selected={priority}
          onSelect={(value) => setPriority(value as typeof priority)}
          labels={{ LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica' }}
        />
        <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Período</Text>
        <ChipRow
          values={['Todas', 'Hoje', 'Semana']}
          selected={period}
          onSelect={(value) => setPeriod(value as typeof period)}
          labels={{ Semana: 'Esta semana' }}
        />
        <Text style={[styles.resultCount, { color: c.textSecondary }]}>
          {filtered.length} {filtered.length === 1 ? 'inspeção encontrada' : 'inspeções encontradas'}
        </Text>
        <View style={styles.list}>
          {filtered.map((inspection) => (
            <InspectionCard key={inspection.id} inspection={inspection} />
          ))}
        </View>
        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: c.textSecondary }]}>Nenhuma inspeção encontrada.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChipRow<T extends string>({
  values, selected, onSelect, labels = {},
}: {
  values: T[]; selected: T; onSelect: (value: T) => void; labels?: Partial<Record<T, string>>;
}) {
  const c = useThemeColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {values.map((value) => (
        <Pressable
          key={value}
          onPress={() => onSelect(value)}
          style={[
            styles.chip,
            { borderColor: c.border, backgroundColor: c.surface },
            selected === value && styles.chipActive,
          ]}
        >
          <Text style={[
            styles.chipText, { color: c.textSecondary },
            selected === value && styles.chipTextActive,
          ]}>
            {labels[value] ?? value}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.md },
  container: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  search: { minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: FontSize.md },
  filterLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: Spacing.sm },
  chips: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: { minHeight: 40, paddingHorizontal: Spacing.md, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontWeight: FontWeight.semibold },
  chipTextActive: { color: Colors.white },
  list: { gap: Spacing.sm, marginTop: Spacing.sm },
  resultCount: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  empty: { textAlign: 'center', padding: Spacing.lg },
  notice: { borderRadius: 10, padding: Spacing.sm, marginTop: Spacing.xs },
  noticeText: { fontSize: FontSize.sm, textAlign: 'center' },
});
