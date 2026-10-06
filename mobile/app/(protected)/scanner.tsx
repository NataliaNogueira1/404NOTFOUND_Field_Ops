import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';

// ─── Scan result ────────────────────────────────────────────────────────────

type ScanResult =
  | { kind: 'match'; qrCode: string }       // QR matches the expected equipment
  | { kind: 'mismatch'; qrCode: string }    // QR is valid but wrong equipment (RN-064)
  | null;                                   // nothing scanned yet

// ─── Screen ─────────────────────────────────────────────────────────────────

/**
 * QR Code scanner for equipment confirmation (PBI-041 / RN-064).
 *
 * Receives `inspectionId` as a URL param (optional). When provided, the
 * scanned QR code is validated against the `equipmentQrCode` stored on the
 * inspection snapshot. The technician is shown a clear match / mismatch
 * result and can choose to proceed or re-scan, as required by RN-064.
 */
export default function ScannerScreen() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId?: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { inspections } = useFieldOps();

  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult>(null);
  // Guard: ignore further codes while the result card is showing.
  const scanningRef = useRef(true);

  const inspection = inspectionId
    ? inspections.find((i) => i.id === inspectionId)
    : null;

  const expectedQrCode = inspection?.equipmentQrCode ?? null;
  const equipmentName  = inspection?.equipmentName  ?? null;

  // ─── Barcode handler ─────────────────────────────────────────────────────

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (!scanningRef.current) return;
      scanningRef.current = false; // lock: prevent repeated fires

      if (!expectedQrCode) {
        // No expected QR — just show what was read (scanner used standalone).
        setResult({ kind: 'match', qrCode: data });
        return;
      }

      setResult(
        data === expectedQrCode
          ? { kind: 'match',    qrCode: data }
          : { kind: 'mismatch', qrCode: data },
      );
    },
    [expectedQrCode],
  );

  function rescan() {
    setResult(null);
    scanningRef.current = true;
  }

  function confirm() {
    if (inspectionId) {
      // Navigate back to the inspection start screen so the technician can proceed.
      router.back();
    } else {
      router.back();
    }
  }

  // ─── Permission gate ────────────────────────────────────────────────────

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

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.title, { color: c.text }]}>Câmera necessária</Text>
          <Text style={[styles.muted, { color: c.textSecondary }]}>
            Para escanear o QR Code do equipamento é preciso conceder acesso à câmera.
          </Text>
          <Button label="Conceder permissão" onPress={requestPermission} fullWidth />
          <Button label="Voltar" onPress={() => router.back()} variant="ghost" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Result card ────────────────────────────────────────────────────────

  if (result) {
    const isMatch = result.kind === 'match';

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.resultContainer}>
          <Card style={styles.card}>
            {isMatch ? (
              <>
                <Text style={styles.resultIcon}>✅</Text>
                <Text style={[styles.resultTitle, { color: c.text }]}>
                  Equipamento confirmado
                </Text>
                {equipmentName ? (
                  <Text style={[styles.resultSub, { color: c.textSecondary }]}>
                    {equipmentName}
                  </Text>
                ) : null}
                <Text style={[styles.qrCode, { color: c.textSecondary }]}>
                  QR: {result.qrCode}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.resultIcon}>⚠️</Text>
                {/* RN-064: divergência deve ser informada ao técnico */}
                <Text style={[styles.resultTitle, { color: c.text }]}>
                  Equipamento diferente do previsto
                </Text>
                <Text style={[styles.resultSub, { color: c.textSecondary }]}>
                  QR lido: {result.qrCode}
                </Text>
                {equipmentName ? (
                  <Text style={[styles.resultSub, { color: c.textSecondary }]}>
                    Esperado: {equipmentName}
                  </Text>
                ) : null}
                <Text style={[styles.warning, { color: c.warningDark ?? Colors.warningDark }]}>
                  Verifique se está inspecionando o equipamento correto antes de prosseguir.
                </Text>
              </>
            )}
          </Card>

          {isMatch ? (
            <Button label="Continuar" onPress={confirm} fullWidth size="lg" />
          ) : (
            <>
              <Button
                label="Escanear novamente"
                onPress={rescan}
                fullWidth
                size="lg"
              />
              <Button
                label="Prosseguir mesmo assim"
                onPress={confirm}
                variant="secondary"
                fullWidth
              />
            </>
          )}

          <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Camera viewfinder ──────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Camera fills the entire screen */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />

      {/* Semi-transparent top bar with title + subtitle */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Confirmar equipamento</Text>
        {equipmentName ? (
          <Text style={styles.subtitle}>
            Aponte para o QR Code de{' '}
            <Text style={{ fontWeight: FontWeight.semibold }}>{equipmentName}</Text>
          </Text>
        ) : (
          <Text style={styles.subtitle}>Aponte para o QR Code do equipamento</Text>
        )}
      </View>

      {/* Corner frame — centred in the remaining space between top bar and footer */}
      <View style={styles.frameArea}>
        <View style={styles.corner} />
        <Text style={styles.scanHint}>Posicione o QR Code dentro da moldura</Text>
      </View>

      {/* Footer with cancel button */}
      <View style={styles.footer}>
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white },
  subtitle: { fontSize: FontSize.md, color: Colors.white, opacity: 0.9 },
  muted: { fontSize: FontSize.md, textAlign: 'center' },
  // ─── Camera viewfinder ─────────────────────────────────────────────────
  // Top bar: semi-transparent strip that sits above the frame area
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: Spacing.xs,
  },
  // frameArea: flex:1 so it takes all space between topBar and footer,
  // then centres the corner frame both horizontally and vertically
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
  // Footer: semi-transparent strip with cancel button
  footer: {
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },  // Result card
  resultContainer: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  card: { gap: Spacing.sm, alignItems: 'center' },
  resultIcon: { fontSize: 48 },
  resultTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  resultSub: { fontSize: FontSize.md, textAlign: 'center' },
  qrCode: { fontSize: FontSize.xs, textAlign: 'center' },
  warning: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
});
