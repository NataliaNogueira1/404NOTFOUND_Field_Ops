import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';
import { useLocation } from '@/infrastructure/location';

type PermissionState = 'granted' | 'denied' | 'undetermined';

export default function StartInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { inspections, startInspection } = useFieldOps();
  const { template, isLoading } = useInspectionTemplate(id);
  const location = useLocation();
  const [cameraPermission] = useCameraPermissions();
  const [confirming, setConfirming] = useState(false);

  const inspection = inspections.find((item) => item.id === id);

  const cameraState: PermissionState = cameraPermission?.granted
    ? 'granted'
    : cameraPermission && !cameraPermission.canAskAgain
      ? 'denied'
      : 'undetermined';

  if (!inspection) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.muted}>Inspeção não encontrada.</Text>
          <Button label="Voltar" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const totalItems = template?.sections.flatMap((s) => s.items).length ?? 0;

  async function confirm() {
    if (!inspection || confirming) return;
    setConfirming(true);
    try {
      // Device timestamp — records when the activity effectively began.
      const startedAtDevice = new Date().toISOString();

      // One-shot location capture. If denied/unavailable, continue anyway (RN-059).
      const captured = await location.capture();

      startInspection(inspection.id, {
        startedAtDevice,
        location: captured,
      });

      router.replace(`/(protected)/inspections/${inspection.id}/checklist`);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Você está prestes a iniciar</Text>

        <Card style={styles.card}>
          <Text style={styles.inspection}>{inspection.title}</Text>
          <Text style={styles.muted}>{inspection.equipmentName}</Text>
          <Text style={styles.muted}>
            {inspection.clientName} — {inspection.siteName}
          </Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.items}>📊 {totalItems} itens para verificar</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Permissões</Text>
          <PermissionRow
            icon="📍"
            label="Localização"
            state={location.permission}
          />
          <PermissionRow icon="📷" label="Câmera" state={cameraState} />
          {location.permission === 'denied' ? (
            <Text style={styles.warning}>
              ⚠️ Sem permissão de localização a inspeção inicia normalmente, mas o local de
              início não será registrado.
            </Text>
          ) : null}
        </Card>

        <Button
          label="✅ Confirmar início"
          onPress={confirm}
          loading={confirming}
          fullWidth
          size="lg"
        />
        <Button
          label="Cancelar"
          onPress={() => router.back()}
          variant="ghost"
          disabled={confirming}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PermissionRow({
  icon,
  label,
  state,
}: {
  icon: string;
  label: string;
  state: PermissionState;
}) {
  const { text, style } = describePermission(state);
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>
        {icon} {label}
      </Text>
      <Text style={style}>{text}</Text>
    </View>
  );
}

function describePermission(state: PermissionState): { text: string; style: object } {
  switch (state) {
    case 'granted':
      return { text: '✅ Permissão concedida', style: styles.valueOk };
    case 'denied':
      return { text: '⚠️ Permissão negada', style: styles.valueWarn };
    default:
      return { text: 'Solicitada ao iniciar', style: styles.valueMuted };
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  card: { gap: Spacing.sm },
  inspection: { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.semibold },
  section: { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.semibold },
  items: { color: Colors.text, fontWeight: FontWeight.semibold, marginTop: Spacing.xs },
  muted: { color: Colors.textSecondary },
  warning: { color: Colors.warningDark, fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  valueOk: { color: Colors.successDark, fontWeight: FontWeight.semibold },
  valueWarn: { color: Colors.warningDark, fontWeight: FontWeight.semibold },
  valueMuted: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
});
