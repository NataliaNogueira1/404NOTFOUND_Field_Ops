import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InspectionCard } from '@/components/fieldops';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { byId, clients, equipment, InspectionStatus, Priority, useFieldOps } from '@/features/fieldops';

export default function InspectionsScreen() {
  const { inspections } = useFieldOps();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'Todas' | InspectionStatus>('Todas');
  const [priority, setPriority] = useState<'Todas' | Priority>('Todas');
  const [period, setPeriod] = useState<'Todas' | 'Hoje' | 'Semana'>('Todas');

  const filtered = useMemo(() => inspections.filter((inspection) => {
    const client = byId(clients, inspection.clientId)?.name ?? '';
    const asset = byId(equipment, inspection.equipmentId)?.name ?? '';
    const haystack = `${inspection.title} ${client} ${asset}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === 'Todas' || inspection.status === status) && (priority === 'Todas' || inspection.priority === priority) && (period === 'Todas' || (period === 'Hoje' ? inspection.dueDate === '2026-08-13' : inspection.dueDate <= '2026-08-18'));
  }), [inspections, period, priority, query, status]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Minhas inspeções</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Buscar por título, cliente ou equipamento" placeholderTextColor={Colors.gray400} style={styles.search} />
        <Text style={styles.filterLabel}>Estado</Text>
        <ChipRow values={['Todas', InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS, InspectionStatus.REJECTED, InspectionStatus.SUBMITTED]} selected={status} onSelect={(value) => setStatus(value as typeof status)} labels={{ ASSIGNED: 'Atribuída', IN_PROGRESS: 'Em andamento', REJECTED: 'Reprovada', SUBMITTED: 'Enviada' }} />
        <Text style={styles.filterLabel}>Prioridade</Text>
        <ChipRow values={['Todas', Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL]} selected={priority} onSelect={(value) => setPriority(value as typeof priority)} labels={{ LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica' }} />
        <Text style={styles.filterLabel}>Período</Text>
        <ChipRow values={['Todas', 'Hoje', 'Semana']} selected={period} onSelect={(value) => setPeriod(value as typeof period)} labels={{ Semana: 'Esta semana' }} />
        <View style={styles.list}>{filtered.map((inspection) => <InspectionCard key={inspection.id} inspection={inspection} />)}</View>
        {filtered.length === 0 ? <Text style={styles.empty}>Nenhuma inspeção encontrada.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChipRow<T extends string>({ values, selected, onSelect, labels = {} }: { values: T[]; selected: T; onSelect: (value: T) => void; labels?: Partial<Record<T, string>> }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={[styles.chip, selected === value && styles.chipActive]}><Text style={[styles.chipText, selected === value && styles.chipTextActive]}>{labels[value] ?? value}</Text></Pressable>)}</ScrollView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  search: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  filterLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold, marginTop: Spacing.sm },
  chips: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: { minHeight: 40, paddingHorizontal: Spacing.md, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  chipTextActive: { color: Colors.white },
  list: { gap: Spacing.sm, marginTop: Spacing.sm },
  empty: { color: Colors.textSecondary, textAlign: 'center', padding: Spacing.lg },
});
