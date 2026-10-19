/**
 * SummaryScreen — PBI-086: Assinatura desenhada no dispositivo
 *
 * Tela de resumo e conclusão da inspeção. Inclui:
 *   - Canvas de assinatura manuscrita (SignaturePad)
 *   - Prévia da assinatura capturada antes da confirmação
 *   - Bloqueio de conclusão quando assinatura é obrigatória e está vazia
 *   - Persistência local (SQLite) via saveSignature do FieldOpsContext
 *   - Enfileiramento na outbox para envio ao servidor na sincronização
 */

import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, SignaturePad } from '@/design-system';
import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';
import { useLocation } from '@/infrastructure/location';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { answers, evidences, nonConformities, inspections, concludeInspection, saveSignature } =
    useFieldOps();
  const location = useLocation();
  const { template } = useInspectionTemplate(id);

  const [confirm, setConfirm] = useState(false);
  const [showPending, setShowPending] = useState(false);

  // ─── Signature state ─────────────────────────────────────────────────────

  /** SVG data URI produced by SignaturePad, or null when the canvas is empty. */
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  // Whether this inspection requires a signature before conclusion.
  // Defaults to false; the server can send signatureRequired=true via the template.
  const inspection = useMemo(
    () => inspections.find((i) => i.id === id),
    [inspections, id],
  );
  const signatureRequired = inspection?.signatureRequired ?? false;

  // Persist the signature to SQLite whenever it changes (auto-save pattern —
  // same as answerItem). The canvas calls this on every finger-up event.
  function handleSignatureChange(uri: string | null) {
    setSignatureUri(uri);
    if (uri) {
      saveSignature(id, uri);
    }
  }

  // ─── Checklist validation ─────────────────────────────────────────────────

  const items = useMemo(
    () => template?.sections.flatMap((section) => section.items) ?? [],
    [template],
  );
  const total = items.length;
  const answered = items.filter((item) => answers[item.id] !== undefined).length;

  // Validação de conclusão (RN-037/RN-038/RN-039). Cada pendência descreve
  // exatamente o que falta para o técnico corrigir antes de concluir:
  //  - item obrigatório sem resposta (RN-037);
  //  - item NÃO CONFORME sem a observação exigida pelo modelo (RN-038);
  //  - item NÃO CONFORME sem a evidência exigida pelo modelo (RN-039).
  const pendings = useMemo(() => {
    const problems: string[] = [];
    for (const item of items) {
      const answer = answers[item.id];
      const isAnswered = answer !== undefined && answer.value !== '' && answer.value !== null;

      if (item.required && !isAnswered) {
        problems.push(`${item.question} — resposta obrigatória`);
        continue;
      }

      const isFailure = answer?.value === 'NAO_CONFORME';
      if (!isFailure) continue;

      if (item.requireObservationOnFailure && !answer?.observation?.trim()) {
        problems.push(`${item.question} — observação obrigatória na não conformidade`);
      }
      if (item.requireEvidenceOnFailure && !evidences.some((e) => e.itemId === item.id)) {
        problems.push(`${item.question} — evidência obrigatória na não conformidade`);
      }
    }

    // PBI-086: assinatura obrigatória e canvas vazio
    if (signatureRequired && !signatureUri) {
      problems.push('Assinatura do técnico — obrigatória para concluir');
    }

    return problems;
  }, [answers, evidences, items, signatureRequired, signatureUri]);

  const conformes = Object.values(answers).filter(
    (a) => a.value === 'CONFORME' || a.value === true,
  ).length;
  const naoConformes = Object.values(answers).filter((a) => a.value === 'NAO_CONFORME').length;
  const nas = Object.values(answers).filter((a) => a.value === 'NA').length;

  // ─── Actions ─────────────────────────────────────────────────────────────

  function tryConclude() {
    if (pendings.length) {
      setShowPending(true);
      return;
    }
    setConfirm(true);
  }

  async function conclude() {
    const captured = await location.capture();
    concludeInspection(id, { completedAtDevice: new Date().toISOString(), location: captured });
    setConfirm(false);
    router.replace('/(protected)/(tabs)/sync');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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

        {/* ── Assinatura do técnico (PBI-086) ──────────────────────────── */}
        <Card style={styles.signatureCard}>
          <View style={styles.signatureHeader}>
              {signatureRequired && (
              <Text style={[styles.signatureTitle, { color: c.text }]}>
                Assinatura do técnico
                <Text style={{ color: c.danger }}> *</Text>
              </Text>
            )}
            {!signatureRequired && (
              <Text style={[styles.signatureTitle, { color: c.text }]}>
                Assinatura do técnico
              </Text>
            )}
            {signatureRequired && !signatureUri && (
              <Text style={[styles.signatureHint, { color: c.textSecondary }]}>
                Obrigatória para concluir
              </Text>
            )}
          </View>

          {/* Canvas de assinatura */}
          <SignaturePad
            onSignatureChange={handleSignatureChange}
            height={180}
          />

          {/* Prévia da assinatura capturada */}
          {signatureUri && (
            <View style={styles.previewContainer}>
              <Text style={[styles.previewLabel, { color: c.textSecondary }]}>
                Prévia da assinatura:
              </Text>
              <View
                style={[styles.previewBox, { borderColor: c.border, backgroundColor: c.surface }]}
              >
                <Image
                  source={{ uri: signatureUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                  accessibilityLabel="Prévia da assinatura capturada"
                />
              </View>
              <Text style={[styles.previewConfirm, { color: c.success }]}>
                ✓ Assinatura capturada
              </Text>
            </View>
          )}
        </Card>

        <Button label="Concluir inspeção" onPress={tryConclude} fullWidth size="lg" />
        <Button
          label="Ir para pendências"
          onPress={() => setShowPending(true)}
          variant="secondary"
          fullWidth
        />
      </ScrollView>

      {/* ── Modal de confirmação de conclusão ──────────────────────────────── */}
      <Modal visible={confirm} transparent animationType="fade">
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Concluir inspeção?</Text>
            <Text style={{ color: c.textSecondary }}>
              A inspeção será marcada como enviada e ficará pendente de sincronização.
            </Text>

            {/* Prévia compacta da assinatura no modal de confirmação */}
            {signatureUri && (
              <View style={styles.modalPreview}>
                <Text style={[styles.previewLabel, { color: c.textSecondary }]}>
                  Assinatura confirmada:
                </Text>
                <Image
                  source={{ uri: signatureUri }}
                  style={styles.modalPreviewImage}
                  resizeMode="contain"
                  accessibilityLabel="Assinatura do técnico"
                />
              </View>
            )}

            <Button label="Concluir inspeção" onPress={conclude} fullWidth />
            <Button
              label="Cancelar"
              onPress={() => setConfirm(false)}
              variant="ghost"
              fullWidth
            />
          </Card>
        </View>
      </Modal>

      {/* ── Modal de pendências ─────────────────────────────────────────────── */}
      <Modal visible={showPending} transparent animationType="fade">
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              {pendings.length ? 'Não é possível concluir' : 'Sem pendências'}
            </Text>
            {pendings.length ? (
              pendings.map((item, index) => (
                <Text key={`${item}-${index}`} style={{ color: c.textSecondary }}>
                  {index + 1}. {item}
                </Text>
              ))
            ) : (
              <Text style={{ color: c.textSecondary }}>
                Nenhuma pendência obrigatória no momento.
              </Text>
            )}
            <Button
              label="Ir para pendências"
              onPress={() => {
                setShowPending(false);
                router.push(`/(protected)/inspections/${id}/checklist`);
              }}
              fullWidth
            />
            <Button
              label="Fechar"
              onPress={() => setShowPending(false)}
              variant="ghost"
              fullWidth
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: { gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { width: '47%', padding: Spacing.sm, borderRadius: 10 },
  metricValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.30)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modal: { gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  // Signature card
  signatureCard: { gap: Spacing.sm },
  signatureHeader: { gap: 2 },
  signatureTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  signatureHint: { fontSize: FontSize.sm },

  // Preview
  previewContainer: { gap: Spacing.xs },
  previewLabel: { fontSize: FontSize.sm },
  previewBox: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    height: 80,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewConfirm: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  // Modal preview
  modalPreview: {
    gap: Spacing.xs,
  },
  modalPreviewImage: {
    width: '100%',
    height: 60,
    borderRadius: 6,
  },
});
