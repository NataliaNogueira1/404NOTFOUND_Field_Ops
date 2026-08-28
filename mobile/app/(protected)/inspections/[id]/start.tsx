import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';

export default function StartInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { inspections, startInspection } = useFieldOps();
  const { template, isLoading } = useInspectionTemplate(id);

  const inspection = inspections.find((item) => item.id === id) ?? inspections[0];

  if (!inspection) return null;

  const totalItems = template?.sections.flatMap((s) => s.items).length ?? 0;

  function confirm() {
    startInspection(inspection.id);
    router.replace(`/(protected)/inspections/${inspection.id}/checklist`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Pronto para iniciar?</Text>
        <Card style={styles.card}>
          <Text style={styles.inspection}>{inspection.title}</Text>
          <Text style={styles.muted}>{inspection.equipmentName}</Text>
          <Text style={styles.muted}>{inspection.clientName} / {inspection.siteName}</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Row label="Itens" value={String(totalItems)} />
          )}
          <Row label="Tempo estimado" value="45 min" />
        </Card>
        <Card style={styles.card}>
          <Text style={styles.section}>Permissões</Text>
          <Row label="Localização" value="Permissão concedida" />
          <Row label="Câmera" value="Permissão concedida" />
        </Card>
        <Button label="Confirmar início" onPress={confirm} fullWidth size="lg" />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
      </ScrollView>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  card: { gap: Spacing.sm },
  inspection: { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.semibold },
  section: { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.semibold },
  muted: { color: Colors.textSecondary },
  value: { color: Colors.successDark, fontWeight: FontWeight.semibold },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
});
