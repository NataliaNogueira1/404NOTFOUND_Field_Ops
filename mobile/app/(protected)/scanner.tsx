import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScanResult =
  | { kind: 'match';    qrCode: string }  // QR matches the expected equipment
  | { kind: 'mismatch'; qrCode: string }  // QR found but wrong equipment (RN-064)
  | { kind: 'unknown';  qrCode: string }  // QR not found in any local inspection
  | null;

// ─── Screen ──────────────────────────────────────────────────────────────────

/**
 * QR Code scanner for equipment confirmation (PBI-041 / RN-064).
 *
 * Acceptance criteria:
 *  1. Requests camera permission
 *  2. Reads QR Code with haptic feedback (expo-haptics)
 *  3. Looks up equipment in SQLite by qr_code (searches local inspections)
 *  4. If found: shows card with equipment data
 *  5. If mismatched: alerts the technician (RN-064)
 *  6. If not found: clear "not found" message
 *  7. Permission denied: explanation + manual entry fallback
 *  8. Code read only once per cycle (scanningRef lock)
 */
export default function ScannerScreen() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId?: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { inspections } = useFieldOps();

  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult>(null);
  const [manualCode, setManualCode] = useState('');

  // ─── Criterion 8: read only once per cycle ───────────────────────────────
  const scanningRef = useRef(true);

  const inspection = inspectionId
    ? inspections.find((i) => i.id === inspectionId)
    : null;

  const expectedQrCode = inspection?.equipmentQrCode ?? null;

  // ─── Criterion 3: look up in SQLite by qr_code ───────────────────────────
  // We search across all locally synced inspections — whichever one carries
  // the scanned QR code is the equipment being looked at.
  function resolveQrCode(scanned: string): ScanResult {
    // Does it match the inspection we came from?
    if (expectedQrCode) {
      if (scanned === expectedQrCode) return { kind: 'match', qrCode: scanned };
      // It might still belong to *another* local inspection — that's a mismatch.
      const ownerInspection = inspections.find((i) => i.equipmentQrCode === scanned);
      if (ownerInspection) return { kind: 'mismatch', qrCode: scanned };
      // Not found anywhere locally.
      return { kind: 'unknown', qrCode: scanned };
    }

    // No expected QR (standalone mode) — any match in the local list counts.
    const ownerInspection = inspections.find((i) => i.equipmentQrCode === scanned);
    if (ownerInspection) return { kind: 'match', qrCode: scanned };
    return { kind: 'unknown', qrCode: scanned };
  }

  // ─── Criterion 2: haptic feedback ────────────────────────────────────────
  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (!scanningRef.current) return;
      scanningRef.current = false;

      const resolved = resolveQrCode(data);
      setResult(resolved);

      if (resolved?.kind === 'match') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expectedQrCode, inspections],
  );

  // ─── Manual entry (criterion 7 fallback) ─────────────────────────────────
  function submitManual() {
    const code = manualCode.trim();
    if (!code) return;
    const resolved = resolveQrCode(code);
    setResult(resolved);
    if (resolved?.kind === 'match') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  function rescan() {
    setResult(null);
    scanningRef.current = true;
    setManualCode('');
  }

  function confirm() {
    router.back();
  }

  // Find the inspection that owns the scanned QR (for the result card details).
  const matchedInspection = result
    ? inspections.find((i) => i.equipmentQrCode === result.qrCode)
    : null;

  // ─── Criterion 1: permission gate ────────────────────────────────────────

  if (!permission) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.muted, { color: c.textSecondary }]}>
            Verificando permissão de câmera...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Criterion 7: permission denied → explanation + manual fallback ───────

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.permTitle, { color: c.text }]}>Câmera necessária</Text>
          <Text style={[styles.muted, { color: c.textSecondary }]}>
            Para escanear o QR Code é preciso conceder acesso à câmera. Se preferir, digite
            o código manualmente abaixo.
          </Text>
          <Button label="Conceder permissão" onPress={requestPermission} fullWidth />

          {/* Manual entry alternative */}
          <View style={styles.manualBox}>
            <Text style={[styles.manualLabel, { color: c.textSecondary }]}>
              Ou insira o código manualmente:
            </Text>
            <TextInput
              style={[styles.manualInput, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
              placeholder="Ex.: COMP-004"
              placeholderTextColor={Colors.gray400}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={submitManual}
            />
            <Button label="Confirmar" onPress={submitManual} fullWidth />
          </View>

          <Button label="Voltar" onPress={() => router.back()} variant="ghost" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Criteria 4 / 5 / 6: result card ─────────────────────────────────────

  if (result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.resultContainer}>

          {result.kind === 'match' && (
            // Criterion 4: found — show equipment data card
            <Card style={styles.card}>
              <Text style={styles.resultIcon}>✅</Text>
              <Text style={[styles.resultTitle, { color: c.text }]}>
                Equipamento confirmado
              </Text>
              {matchedInspection ? (
                <>
                  <Text style={[styles.resultSub, { color: c.text }]}>
                    {matchedInspection.equipmentName}
                  </Text>
                  <View style={[styles.dataRow, { borderTopColor: c.border }]}>
                    <Text style={[styles.dataLabel, { color: c.textSecondary }]}>Local</Text>
                    <Text style={[styles.dataValue, { color: c.text }]}>{matchedInspection.siteName}</Text>
                  </View>
                  <View style={[styles.dataRow, { borderTopColor: c.border }]}>
                    <Text style={[styles.dataLabel, { color: c.textSecondary }]}>Cliente</Text>
                    <Text style={[styles.dataValue, { color: c.text }]}>{matchedInspection.clientName}</Text>
                  </View>
                </>
              ) : null}
              <Text style={[styles.qrCode, { color: c.textSecondary }]}>QR: {result.qrCode}</Text>
            </Card>
          )}

          {result.kind === 'mismatch' && (
            // Criterion 5: found but wrong equipment — alert the technician
            <Card style={styles.card}>
              <Text style={styles.resultIcon}>⚠️</Text>
              <Text style={[styles.resultTitle, { color: c.text }]}>
                Equipamento diferente do previsto
              </Text>
              {matchedInspection ? (
                <Text style={[styles.resultSub, { color: c.textSecondary }]}>
                  QR pertence a: {matchedInspection.equipmentName}
                </Text>
              ) : null}
              {inspection ? (
                <Text style={[styles.resultSub, { color: c.textSecondary }]}>
                  Esperado: {inspection.equipmentName}
                </Text>
              ) : null}
              <Text style={[styles.warning, { color: c.warningDark ?? Colors.warningDark }]}>
                Verifique se está inspecionando o equipamento correto antes de prosseguir.
              </Text>
              <Text style={[styles.qrCode, { color: c.textSecondary }]}>QR: {result.qrCode}</Text>
            </Card>
          )}

          {result.kind === 'unknown' && (
            // Criterion 6: not found in any local inspection
            <Card style={styles.card}>
              <Text style={styles.resultIcon}>❓</Text>
              <Text style={[styles.resultTitle, { color: c.text }]}>
                Equipamento não encontrado
              </Text>
              <Text style={[styles.resultSub, { color: c.textSecondary }]}>
                O código lido não corresponde a nenhum equipamento das suas inspeções
                sincronizadas.
              </Text>
              <Text style={[styles.qrCode, { color: c.textSecondary }]}>QR: {result.qrCode}</Text>
            </Card>
          )}

          {result.kind === 'match' && (
            <Button label="Continuar" onPress={confirm} fullWidth size="lg" />
          )}
          {(result.kind === 'mismatch' || result.kind === 'unknown') && (
            <>
              <Button label="Escanear novamente" onPress={rescan} fullWidth size="lg" />
              <Button label="Prosseguir mesmo assim" onPress={confirm} variant="secondary" fullWidth />
            </>
          )}
          <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />

        </View>
      </SafeAreaView>
    );
  }

  // ─── Camera viewfinder ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Camera fills the entire screen */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Confirmar equipamento</Text>
        <Text style={styles.subtitle}>
          {inspection?.equipmentName
            ? `Aponte para o QR Code de ${inspection.equipmentName}`
            : 'Aponte para o QR Code do equipamento'}
        </Text>
      </View>

      {/* Centred frame */}
      <View style={styles.frameArea}>
        <View style={styles.corner} />
        <Text style={styles.scanHint}>Posicione o QR Code dentro da moldura</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Generic centred layout (permission screens)
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  permTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  muted: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },

  // Manual entry (permission denied fallback)
  manualBox: { width: '100%', gap: Spacing.sm },
  manualLabel: { fontSize: FontSize.sm },
  manualInput: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },

  // Camera viewfinder
  title:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  subtitle: { fontSize: FontSize.sm, color: Colors.white, opacity: 0.9 },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: Spacing.xs,
  },
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  corner: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    borderRadius: 20,
  },
  scanHint: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
    backgroundColor: 'rgba(0,0,0,0.50)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Result card
  resultContainer: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  card: { gap: Spacing.sm, alignItems: 'center' },
  resultIcon:  { fontSize: 48 },
  resultTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  resultSub:   { fontSize: FontSize.md, textAlign: 'center' },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
  },
  dataLabel: { fontSize: FontSize.sm },
  dataValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  qrCode:  { fontSize: FontSize.xs, textAlign: 'center' },
  warning: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});
