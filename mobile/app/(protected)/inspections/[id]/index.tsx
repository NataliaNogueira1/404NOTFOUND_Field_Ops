import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { InspectionStatusBadge, PriorityBadge, ProgressBar } from '@/components/fieldops';
import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { InspectionStatus, useFieldOps } from '@/features/fieldops';

export default function InspectionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { inspections, evidences, nonConformities } = useFieldOps();

  // Find by route param; fall back to first inspection
  const inspection = inspections.find((item) => item.id === id) ?? inspections[0];

  if (!inspection) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.empty}>Inspeção não encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Names are stored directly on the inspection object (denormalised from the API snapshot)
  const equipmentName = inspection.equipmentName ?? inspection.equipmentId;
  const clientName = inspection.clientName ?? inspection.clientId;
  const siteName = inspection.siteName ?? inspection.siteId;
  const supervisorName = inspection.supervisorName ?? inspection.supervisorId;

  const action =
    inspection.status === InspectionStatus.IN_PROGRESS
      ? 'Continuar inspeção'
      : inspection.status === InspectionStatus.REJECTED
        ? 'Corrigir inspeção'
        : 'Iniciar inspeção';

  const inspectionEvidences = evidences.filter((e) => e.inspectionId === inspection.id);
  const inspectionNCs = nonConformities.filter((nc) => nc.inspectionId === inspection.id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{inspection.title}</Text>
        <View style={styles.badges}>
          <PriorityBadge priority={inspection.priority} />
          <InspectionStatusBadge status={inspection.status} />
        </View>

        <Card style={styles.card}>
          <Row label="Equipamento" value={equipmentName} />
          <Row label="Cliente" value={clientName} />
          <Row label="Local" value={siteName} />
          <Row label="Supervisora" value={supervisorName} />
          <Row label="Data prevista" value={`${inspection.dueDate}${inspection.dueTime ? ` ${inspection.dueTime}` : ''}`} />
          <Row label="Criação" value={inspection.createdAt} />
        </Card>

        {inspection.supervisorInstructions ? (
          <Card style={styles.card}>
            <Text style={styles.section}>Instruções do supervisor</Text>
            <Text style={styles.body}>{inspection.supervisorInstructions}</Text>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.section}>Progresso</Text>
          <ProgressBar value={inspection.progress} />
          <Text style={styles.body}>{inspection.progress}% concluído</Text>
          <Row label="Não conformidades" value={String(inspectionNCs.length)} />
          <Row label="Evidências" value={String(inspectionEvidences.length)} />
        </Card>

        <Button
          label={action}
          onPress={() => router.push(`/(protected)/inspections/${inspection.id}/start`)}
          fullWidth
          size="lg"
        />
        <Button
          label="Escanear QR Code"
          onPress={() => router.push('/(protected)/scanner')}
          variant="secondary"
          fullWidth
        />
        <Button
          label="Não conformidades"
          onPress={() => router.push(`/(protected)/inspections/${inspection.id}/non-conformities`)}
          variant="ghost"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: Colors.textSecondary, fontSize: FontSize.md },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  badges: { flexDirection: 'row', gap: Spacing.sm },
  card: { gap: Spacing.sm },
  section: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  body: { color: Colors.textSecondary, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { color: Colors.textSecondary, flex: 1 },
  value: { color: Colors.text, fontWeight: FontWeight.semibold, flex: 1, textAlign: 'right' },
});
