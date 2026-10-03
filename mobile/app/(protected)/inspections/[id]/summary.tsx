import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { answers, evidences, nonConformities, concludeInspection } = useFieldOps();
  const { template } = useInspectionTemplate(id);
  const [confirm, setConfirm] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const items = useMemo(
    () => template?.sections.flatMap((section) => section.items) ?? [],
    [template],
  );
  const total = items.length;
  const answered = Object.keys(answers).length;

  const pendings = useMemo(
    () => items.filter((item) => item.required && !answers[item.id]).map((item) => item.question),
    [answers, items],
  );

  const conformes = Object.values(answers).filter((a) => a.value === 'CONFORME' || a.value === true).length;
  const naoConformes = Object.values(answers).filter((a) => a.value === 'NAO_CONFORME').length;
  const nas = Object.values(answers).filter((a) => a.value === 'NA').length;

  function tryConclude() {
    if (pendings.length) { setShowPending(true); return; }
    setConfirm(true);
  }

  function conclude() {
    concludeInspection(id);
    setConfirm(false);
    router.replace('/(protected)/(tabs)/sync');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]}>Resumo</Text>

        <Card style={styles.card}>
          <Row label="Total de itens" value={String(total)} />
          <Row label="Respondidos" value={String(answered)} />
          <Row label="Obrigatórios pendentes" value={String(pendings.length)} />
        </Card>

        <Card style={styles.grid}>
          <Metric label="Conformes" value={conformes} />
          <Metric label="Não conformes" value={naoConformes} />
          <Metric label="Não aplicáveis" value={nas} />
          <Metric label="Evidências" value={evidences.length} />
          <Metric label="Não conformidades" value={nonConformities.length} />
        </Card>

        <Button label="Concluir inspeção" onPress={tryConclude} fullWidth size="lg" />
        <Button label="Ir para pendências" onPress={() => setShowPending(true)} variant="secondary" fullWidth />
      </ScrollView>

      <Modal visible={confirm} transparent animationType="fade">
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Concluir inspeção?</Text>
            <Text style={{ color: c.textSecondary }}>A inspeção será marcada como enviada e ficará pendente de sincronização.</Text>
            <Button label="Concluir inspeção" onPress={conclude} fullWidth />
            <Button label="Cancelar" onPress={() => setConfirm(false)} variant="ghost" fullWidth />
          </Card>
        </View>
      </Modal>

      <Modal visible={showPending} transparent animationType="fade">
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              {pendings.length ? 'Não é possível concluir' : 'Sem pendências'}
            </Text>
            {pendings.length
              ? pendings.map((item, index) => (
                  <Text key={item} style={{ color: c.textSecondary }}>Item {index + 1}: {item}</Text>
                ))
              : <Text style={{ color: c.textSecondary }}>Nenhuma pendência obrigatória no momento.</Text>}
            <Button
              label="Ir para pendências"
              onPress={() => { setShowPending(false); router.push(`/(protected)/inspections/${id}/checklist`); }}
              fullWidth
            />
            <Button label="Fechar" onPress={() => setShowPending(false)} variant="ghost" fullWidth />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.row, { borderBottomColor: c.border }]}>
      <Text style={{ color: c.textSecondary }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: FontWeight.semibold }}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const c = useThemeColors();
  return (
    <View style={[styles.metric, { backgroundColor: c.mutedSurface }]}>
      <Text style={[styles.metricValue, { color: c.primary }]}>{value}</Text>
      <Text style={{ color: c.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: { gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { width: '47%', padding: Spacing.sm, borderRadius: 10 },
  metricValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: Spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.30)', justifyContent: 'center', padding: Spacing.lg },
  modal: { gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
