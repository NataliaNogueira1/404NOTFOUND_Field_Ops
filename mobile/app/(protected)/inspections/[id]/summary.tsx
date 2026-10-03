import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { answers, evidences, nonConformities, concludeInspection } = useFieldOps();
  const { template } = useInspectionTemplate(id);
  const [confirm, setConfirm] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const items = template?.sections.flatMap((section) => section.items) ?? [];
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Resumo</Text>

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
            <Text style={styles.modalTitle}>Concluir inspeção?</Text>
            <Text style={styles.muted}>A inspeção será marcada como enviada e ficará pendente de sincronização.</Text>
            <Button label="Concluir inspeção" onPress={conclude} fullWidth />
            <Button label="Cancelar" onPress={() => setConfirm(false)} variant="ghost" fullWidth />
          </Card>
        </View>
      </Modal>

      <Modal visible={showPending} transparent animationType="fade">
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <Text style={styles.modalTitle}>
              {pendings.length ? 'Não é possível concluir' : 'Sem pendências'}
            </Text>
            {pendings.length
              ? pendings.map((item, index) => (
                  <Text key={item} style={styles.muted}>Item {index + 1}: {item}</Text>
                ))
              : <Text style={styles.muted}>Nenhuma pendência obrigatória no momento.</Text>}
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
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  card: { gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { width: '47%', padding: Spacing.sm, borderRadius: 10, backgroundColor: Colors.mutedSurface },
  metricValue: { fontSize: FontSize.xxl, color: Colors.primary, fontWeight: FontWeight.bold },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm },
  muted: { color: Colors.textSecondary },
  value: { color: Colors.text, fontWeight: FontWeight.semibold },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.30)', justifyContent: 'center', padding: Spacing.lg },
  modal: { gap: Spacing.md },
  modalTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
