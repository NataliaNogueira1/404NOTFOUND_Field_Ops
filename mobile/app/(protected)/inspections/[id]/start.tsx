import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import type { ThemeColors } from '@/config/themes';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';
import { useLocation } from '@/infrastructure/location';

type PermissionState = 'granted' | 'denied' | 'undetermined';

export default function StartInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { inspections, startInspection } = useFieldOps();
  const { template, isLoading } = useInspectionTemplate(id);
  const location = useLocation();
  const [cameraPermission] = useCameraPermissions();
  const [confirming, setConfirming] = useState(false);
  // Per-inspection opt-out: the technician may start without recording the
  // start location even when the device permission is granted (RN-059).
  const [registerLocation, setRegisterLocation] = useState(true);

  const inspection = inspections.find((item) => item.id === id);

  const cameraState: PermissionState = cameraPermission?.granted
    ? 'granted'
    : cameraPermission && !cameraPermission.canAskAgain
      ? 'denied'
      : 'undetermined';

  if (!inspection) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={{ color: c.textSecondary }}>Inspeção não encontrada.</Text>
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
      const startedAtDevice = new Date().toISOString();
      const captured = registerLocation ? await location.capture() : null;
      startInspection(inspection.id, { startedAtDevice, location: captured });
      router.replace(`/(protected)/inspections/${inspection.id}/checklist`);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]}>Você está prestes a iniciar</Text>

        <Card style={styles.card}>
          <Text style={[styles.inspection, { color: c.text }]}>{inspection.title}</Text>
          <Text style={{ color: c.textSecondary }}>{inspection.equipmentName}</Text>
          <Text style={{ color: c.textSecondary }}>
            {inspection.clientName} — {inspection.siteName}
          </Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.items, { color: c.text }]}>📊 {totalItems} itens para verificar</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.section, { color: c.text }]}>Permissões</Text>
          <PermissionRow icon="📍" label="Localização" state={location.permission} />
          <PermissionRow icon="📷" label="Câmera" state={cameraState} />
          {location.permission === 'denied' ? (
            <Text style={[styles.warning, { color: c.warningDark }]}>
              ⚠️ Sem permissão de localização a inspeção inicia normalmente, mas o local de
              início não será registrado.
            </Text>
          ) : (
            <View style={[styles.row, { borderTopColor: c.border }]}>
              <Text style={{ color: c.textSecondary }}>📍 Registrar localização de início</Text>
              <Switch
                value={registerLocation}
                onValueChange={setRegisterLocation}
                disabled={confirming}
                trackColor={{ true: Colors.primary, false: c.gray400 }}
              />
            </View>
          )}
          {location.permission !== 'denied' && !registerLocation ? (
            <Text style={[styles.warning, { color: c.warningDark }]}>
              ⚠️ Esta inspeção será iniciada sem registrar o local de início.
            </Text>
          ) : null}
        </Card>

        <Button label="✅ Confirmar início" onPress={confirm} loading={confirming} fullWidth size="lg" />

        {/* QR Code button — blue circle with Ionicons qr-code icon */}
        <Pressable
          style={({ pressed }) => [styles.qrButton, pressed && styles.qrButtonPressed]}
          onPress={() => router.push(`/(protected)/scanner?inspectionId=${inspection.id}`)}
          disabled={confirming}
          accessibilityRole="button"
          accessibilityLabel="Confirmar QR Code do equipamento"
        >
          <View style={styles.qrCircle}>
            <Ionicons name="qr-code" size={28} color={Colors.white} />
          </View>
          <Text style={[styles.qrLabel, { color: c.text }]}>Confirmar QR do equipamento</Text>
        </Pressable>

        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" disabled={confirming} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

function PermissionRow({ icon, label, state }: { icon: string; label: string; state: PermissionState }) {
  const c = useThemeColors();
  const { text, color } = describePermission(state, c);
  return (
    <View style={[styles.row, { borderTopColor: c.border }]}>
      <Text style={{ color: c.textSecondary }}>
        {icon} {label}
      </Text>
      <Text style={{ color, fontWeight: FontWeight.semibold }}>{text}</Text>
    </View>
  );
}

function describePermission(state: PermissionState, c: ThemeColors): { text: string; color: string } {
  switch (state) {
    case 'granted':
      return { text: '✅ Permissão concedida', color: c.successDark };
    case 'denied':
      return { text: '⚠️ Permissão negada', color: c.warningDark };
    default:
      return { text: 'Solicitada ao iniciar', color: c.textSecondary };
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: { gap: Spacing.sm },
  inspection: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  section: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  items: { fontWeight: FontWeight.semibold, marginTop: Spacing.xs },
  warning: { fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  // QR Code button
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  qrButtonPressed: { opacity: 0.7 },
  qrCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
