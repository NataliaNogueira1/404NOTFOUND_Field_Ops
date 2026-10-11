import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useAuth } from '@/features/auth';
import { useThemeColors } from '@/features/theme';
import { useConnectivity } from '@/infrastructure/connectivity';
import { fetchEquipmentByQrCode, type ApiEquipment } from '@/infrastructure/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScanResult =
  | { kind: 'match';    qrCode: string }                       // QR matches the expected equipment
  | { kind: 'mismatch'; qrCode: string }                       // QR found but wrong equipment (RN-064)
  | { kind: 'apiMatch'; qrCode: string; equipment: ApiEquipment } // QR resolved online via API fallback
  | { kind: 'unknown';  qrCode: string; offline?: boolean }    // QR not found locally (nor online)
  | null;

// A single pickable equipment for the manual-identification select. Built from the
// technician's locally synced inspections (the only equipment list a TECHNICIAN
// can see offline — the catalogue endpoint is ADMIN/SUPERVISOR only).
interface ManualOption {
  qrCode: string;
  equipmentName: string;
  siteName: string;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

/**
 * QR Code scanner for equipment confirmation (PBI-041 / RN-064).
 *
 * Acceptance criteria:
 *  1. Requests camera permission
 *  2. Reads QR Code with haptic feedback (expo-haptics)
 *  3. Looks up equipment in SQLite by qr_code (searches local inspections),
 *     with an ONLINE fallback to GET /api/v1/equipment/by-qr/{qrCode}
 *  4. If found: shows card with equipment data
 *  5. If mismatched: alerts the technician (RN-064)
 *  6. If not found: clear "not found" message
 *  7. Permission denied: explanation + manual identification (equipment select)
 *  8. Code read only once per cycle (scanningRef lock)
 */
export default function ScannerScreen() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId?: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { inspections } = useFieldOps();
  const { token } = useAuth();
  const { isOnline } = useConnectivity();

  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult>(null);
  const [resolving, setResolving] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  // ─── Criterion 8: read only once per cycle ───────────────────────────────
  const scanningRef = useRef(true);

  const inspection = inspectionId
    ? inspections.find((i) => i.id === inspectionId)
    : null;

  const expectedQrCode = inspection?.equipmentQrCode ?? null;

  // Equipment options for manual identification — one per distinct QR code found
  // in the local inspections. This is the offline-first source available to the
  // technician (RN-064), used as the manual fallback instead of free text.
  const manualOptions = useMemo<ManualOption[]>(() => {
    const seen = new Set<string>();
    const options: ManualOption[] = [];
    for (const insp of inspections) {
      if (!insp.equipmentQrCode || seen.has(insp.equipmentQrCode)) continue;
      seen.add(insp.equipmentQrCode);
      options.push({
        qrCode: insp.equipmentQrCode,
        equipmentName: insp.equipmentName,
        siteName: insp.siteName,
      });
    }
    return options;
  }, [inspections]);

  // ─── Criterion 3 (local): look up in SQLite by qr_code ───────────────────
  // Whichever locally synced inspection carries the scanned QR is the equipment
  // being looked at. Returns null when nothing local matches (caller then tries
  // the online fallback).
  const resolveLocal = useCallback(
    (scanned: string): ScanResult => {
      if (expectedQrCode) {
        if (scanned === expectedQrCode) return { kind: 'match', qrCode: scanned };
        const ownerInspection = inspections.find((i) => i.equipmentQrCode === scanned);
        if (ownerInspection) return { kind: 'mismatch', qrCode: scanned };
        return null;
      }
      const ownerInspection = inspections.find((i) => i.equipmentQrCode === scanned);
      if (ownerInspection) return { kind: 'match', qrCode: scanned };
      return null;
    },
    [expectedQrCode, inspections],
  );

  const buzz = useCallback((success: boolean) => {
    void Haptics.notificationAsync(
      success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
  }, []);

  // ─── Criterion 3 (online fallback): resolve a code end-to-end ────────────
  // Tries the local inspections first; if nothing matches and the device is
  // online, asks the server (GET /api/v1/equipment/by-qr/{qrCode}). Offline or
  // 404 ends up as "unknown"; a reachable server that knows the QR becomes an
  // `apiMatch` so the technician still sees the equipment data.
  const resolveCode = useCallback(
    async (scanned: string): Promise<ScanResult> => {
      const local = resolveLocal(scanned);
      if (local) return local;

      if (!isOnline || !token) {
        return { kind: 'unknown', qrCode: scanned, offline: !isOnline };
      }

      try {
        const equipment = await fetchEquipmentByQrCode(scanned, token);
        if (equipment) return { kind: 'apiMatch', qrCode: scanned, equipment };
        return { kind: 'unknown', qrCode: scanned };
      } catch {
        // Network/server error while online — fall back to "unknown" and flag it
        // so the message can hint that the server could not be reached.
        return { kind: 'unknown', qrCode: scanned, offline: true };
      }
    },
    [resolveLocal, isOnline, token],
  );

  // Shared handler for both camera reads and manual selection.
  const processCode = useCallback(
    async (scanned: string) => {
      setResolving(true);
      try {
        const resolved = await resolveCode(scanned);
        setResult(resolved);
        buzz(resolved?.kind === 'match' || resolved?.kind === 'apiMatch');
      } finally {
        setResolving(false);
      }
    },
    [resolveCode, buzz],
  );

  // ─── Criterion 2: haptic feedback on read ────────────────────────────────
  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (!scanningRef.current) return;
      scanningRef.current = false;
      void processCode(data);
    },
    [processCode],
  );

  // ─── Criterion 7: manual identification (equipment select) ───────────────
  function pickManual(option: ManualOption) {
    setManualOpen(false);
    scanningRef.current = false;
    void processCode(option.qrCode);
  }

  function rescan() {
    setResult(null);
    scanningRef.current = true;
  }

  function confirm() {
    router.back();
  }

  // Local inspection that owns the scanned QR (for the result card details).
  const matchedInspection = result
    ? inspections.find((i) => i.equipmentQrCode === result.qrCode)
    : null;

  // ─── Manual identification modal (shared across screens) ──────────────────
  const manualModal = (
    <Modal visible={manualOpen} animationType="slide" transparent onRequestClose={() => setManualOpen(false)}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: c.surface }]}>
          <Text style={[styles.modalTitle, { color: c.text }]}>Identificar equipamento</Text>
          <Text style={[styles.muted, { color: c.textSecondary }]}>
            Selecione o equipamento das suas inspeções sincronizadas.
          </Text>

          {manualOptions.length === 0 ? (
            <Text style={[styles.muted, { color: c.textSecondary, paddingVertical: Spacing.lg }]}>
              Nenhum equipamento disponível nas inspeções baixadas.
            </Text>
          ) : (
            <FlatList
              data={manualOptions}
              keyExtractor={(item) => item.qrCode}
              style={styles.optionList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    { borderBottomColor: c.border },
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => pickManual(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${item.equipmentName}`}
                >
                  <Text style={[styles.optionName, { color: c.text }]}>{item.equipmentName}</Text>
                  <Text style={[styles.optionMeta, { color: c.textSecondary }]}>
                    {item.siteName} · {item.qrCode}
                  </Text>
                </Pressable>
              )}
            />
          )}

          <Button label="Fechar" onPress={() => setManualOpen(false)} variant="ghost" fullWidth />
        </View>
      </View>
    </Modal>
  );

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

  // ─── Criterion 7: permission denied → explanation + manual identification ──

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.permTitle, { color: c.text }]}>Câmera necessária</Text>
          <Text style={[styles.muted, { color: c.textSecondary }]}>
            Para escanear o QR Code é preciso conceder acesso à câmera. Se preferir, identifique
            o equipamento manualmente.
          </Text>
          <Button label="Conceder permissão" onPress={requestPermission} fullWidth />
          <Button
            label="Identificar manualmente"
            onPress={() => setManualOpen(true)}
            variant="secondary"
            fullWidth
          />
          <Button label="Voltar" onPress={() => router.back()} variant="ghost" fullWidth />
        </View>
        {manualModal}
      </SafeAreaView>
    );
  }

  // ─── Criteria 4 / 5 / 6: result card ─────────────────────────────────────

  if (result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.resultContainer}>

          {result.kind === 'match' && (
            // Criterion 4: found locally — show equipment data card
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

          {result.kind === 'apiMatch' && (
            // Criterion 4 (online fallback): resolved via API, show server data
            <Card style={styles.card}>
              <Text style={styles.resultIcon}>✅</Text>
              <Text style={[styles.resultTitle, { color: c.text }]}>
                Equipamento encontrado
              </Text>
              <Text style={[styles.resultSub, { color: c.text }]}>{result.equipment.name}</Text>
              <View style={[styles.dataRow, { borderTopColor: c.border }]}>
                <Text style={[styles.dataLabel, { color: c.textSecondary }]}>Patrimônio</Text>
                <Text style={[styles.dataValue, { color: c.text }]}>{result.equipment.assetNumber}</Text>
              </View>
              <View style={[styles.dataRow, { borderTopColor: c.border }]}>
                <Text style={[styles.dataLabel, { color: c.textSecondary }]}>Local</Text>
                <Text style={[styles.dataValue, { color: c.text }]}>{result.equipment.siteName}</Text>
              </View>
              <View style={[styles.dataRow, { borderTopColor: c.border }]}>
                <Text style={[styles.dataLabel, { color: c.textSecondary }]}>Status</Text>
                <Text style={[styles.dataValue, { color: c.text }]}>{result.equipment.status}</Text>
              </View>
              {inspection && inspection.equipmentQrCode && inspection.equipmentQrCode !== result.qrCode ? (
                <Text style={[styles.warning, { color: c.warningDark ?? Colors.warningDark }]}>
                  Atenção: diferente do equipamento previsto para esta inspeção
                  ({inspection.equipmentName}).
                </Text>
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
            // Criterion 6: not found locally nor online
            <Card style={styles.card}>
              <Text style={styles.resultIcon}>❓</Text>
              <Text style={[styles.resultTitle, { color: c.text }]}>
                Equipamento não encontrado
              </Text>
              <Text style={[styles.resultSub, { color: c.textSecondary }]}>
                {result.offline
                  ? 'Não foi possível consultar o servidor. O código não corresponde a nenhuma inspeção sincronizada.'
                  : 'O código lido não corresponde a nenhum equipamento conhecido.'}
              </Text>
              <Text style={[styles.qrCode, { color: c.textSecondary }]}>QR: {result.qrCode}</Text>
            </Card>
          )}

          {(result.kind === 'match' || result.kind === 'apiMatch') && (
            <Button label="Continuar" onPress={confirm} fullWidth size="lg" />
          )}
          {(result.kind === 'mismatch' || result.kind === 'unknown') && (
            <>
              <Button label="Escanear novamente" onPress={rescan} fullWidth size="lg" />
              <Button label="Identificar manualmente" onPress={() => setManualOpen(true)} variant="secondary" fullWidth />
              <Button label="Prosseguir mesmo assim" onPress={confirm} variant="secondary" fullWidth />
            </>
          )}
          <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />

        </View>
        {manualModal}
      </SafeAreaView>
    );
  }

  // ─── Resolving overlay (API fallback round-trip) ──────────────────────────

  if (resolving) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.muted, { color: c.textSecondary }]}>Consultando equipamento...</Text>
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
        <Button label="Identificar manualmente" onPress={() => setManualOpen(true)} variant="secondary" fullWidth />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
      </View>

      {manualModal}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Generic centred layout (permission / loading screens)
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  permTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  muted: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },

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
    gap: Spacing.sm,
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

  // Manual identification modal (equipment select)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    gap: Spacing.sm,
    maxHeight: '75%',
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  optionList: { marginVertical: Spacing.sm },
  option: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  optionPressed: { opacity: 0.6 },
  optionName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  optionMeta: { fontSize: FontSize.sm },
});
