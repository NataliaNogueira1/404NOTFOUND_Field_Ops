import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';
import { SignatureCanvas } from '@/components/SignatureCanvas';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const {
    answers,
    evidences,
    nonConformities,
    concludeInspection,
    inspections,
    saveSignature,
    loadSignature,
  } = useFieldOps();
  const { template } = useInspectionTemplate(id);
  const [confirm, setConfirm] = useState(false);
  const [showPending, setShowPending] = useState(false);

  // ─── PBI-086: Signature state ────────────────────────────────────────────
  // signatureData: encoded stroke data; null = canvas is empty / cleared
  const [signatureData, setSignatureData] = useState<string | null>(null);
  // showSignaturePreview: true after the technician confirms the signature
  const [showSignaturePreview, setShowSignaturePreview] = useState(false);
  // signatureConfirmed: true once the technician pressed "Confirmar assinatura"
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);

  // Resolve whether the current inspection requires a signature
  const inspection = useMemo(
    () => inspections.find((i) => i.id === id),
    [inspections, id],
  );
  const signatureRequired = inspection?.signatureRequired ?? false;

  // Restore any previously saved signature from SQLite on mount
  useEffect(() => {
    loadSignature(id).then((stored) => {
      if (stored) {
        setSignatureData(stored);
        setSignatureConfirmed(true);
        setShowSignaturePreview(true);
      }
    });
  }, [id, loadSignature]);

  // ─── Checklist validation ────────────────────────────────────────────────

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

    // PBI-086: signature is required and not yet confirmed
    if (signatureRequired && !signatureConfirmed) {
      problems.push('Assinatura obrigatória — confirme sua assinatura antes de concluir');
    }

    return problems;
  }, [answers, evidences, items, signatureRequired, signatureConfirmed]);

  const conformes = Object.values(answers).filter((a) => a.value === 'CONFORME' || a.value === true).length;
  const naoConformes = Object.values(answers).filter((a) => a.value === 'NAO_CONFORME').length;
  const nas = Object.values(answers).filter((a) => a.value === 'NA').length;

  // ─── Actions ─────────────────────────────────────────────────────────────

  function tryConclude() {
    if (pendings.length) { setShowPending(true); return; }
    setConfirm(true);
  }

  function conclude() {
    concludeInspection(id);
    setConfirm(false);
    router.replace('/(protected)/(tabs)/sync');
  }

  // PBI-086: confirm the drawn signature — saves locally and marks as confirmed
  const handleConfirmSignature = useCallback(() => {
    if (!signatureData) return;
    saveSignature(id, signatureData);
    setSignatureConfirmed(true);
    setShowSignaturePreview(true);
  }, [signatureData, saveSignature, id]);

  // PBI-086: clear the signature so the technician can redraw
  const handleClearSignature = useCallback(() => {
    setSignatureData(null);
    setSignatureConfirmed(false);
    setShowSignaturePreview(false);
    saveSignature(id, null);
  }, [saveSignature, id]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]}>Resumo</Text>

        {/* Checklist counters */}
        <Card style={styles.card}>
          <Row label="Total de itens" value={String(total)} />
          <Row label="Respondidos" value={String(answered)} />
          <Row label="Obrigatórios pendentes" value={String(pendings.length)} />
        </Card>

        {/* Status metrics */}
        <Card style={styles.grid}>
          <Metric label="Conformes" value={conformes} />
          <Metric label="Não conformes" value={naoConformes} />
          <Metric label="Não aplicáveis" value={nas} />
          <Metric label="Evidências" value={evidences.length} />
          <Metric label="Não conformidades" value={nonConformities.length} />
        </Card>

        {/* ─── PBI-086: Signature section ──────────────────────────────── */}
        <SignatureSection
          signatureData={signatureData}
          signatureConfirmed={signatureConfirmed}
          signatureRequired={signatureRequired}
          showPreview={showSignaturePreview}
          onSignatureChange={setSignatureData}
          onConfirm={handleConfirmSignature}
          onClear={handleClearSignature}
        />

        <Button label="Concluir inspeção" onPress={tryConclude} fullWidth size="lg" />
        <Button label="Ir para pendências" onPress={() => setShowPending(true)} variant="secondary" fullWidth />
      </ScrollView>

      {/* ─── Confirm conclusion modal ───────────────────────────────────── */}
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

      {/* ─── Pending items modal ───────────────────────────────────────── */}
      <Modal visible={showPending} transparent animationType="fade">
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              {pendings.length ? 'Não é possível concluir' : 'Sem pendências'}
            </Text>
            {pendings.length
              ? pendings.map((item, index) => (
                  <Text key={`${item}-${index}`} style={{ color: c.textSecondary }}>{index + 1}. {item}</Text>
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

// ─── SignatureSection ─────────────────────────────────────────────────────────

interface SignatureSectionProps {
  signatureData: string | null;
  signatureConfirmed: boolean;
  signatureRequired: boolean;
  showPreview: boolean;
  onSignatureChange: (data: string | null) => void;
  onConfirm: () => void;
  onClear: () => void;
}

/**
 * PBI-086 — Signature capture section rendered inside the summary screen.
 *
 * States:
 *  1. Not yet signed  → shows the SignatureCanvas with Confirmar / Limpar
 *  2. Confirmed       → shows a preview of the stored stroke data + Refazer button
 *
 * When signatureRequired is false the section is shown but not blocking.
 */
function SignatureSection({
  signatureData,
  signatureConfirmed,
  signatureRequired,
  showPreview,
  onSignatureChange,
  onConfirm,
  onClear,
}: SignatureSectionProps) {
  const c = useThemeColors();

  return (
    <Card style={styles.signatureCard}>
      {/* Section header */}
      <View style={styles.signatureHeader}>
        <Text style={[styles.signatureTitle, { color: c.text }]}>
          Assinatura do técnico
          {signatureRequired && (
            <Text style={{ color: c.text }}> *</Text>
          )}
        </Text>
        {signatureRequired && (
          <Text style={[styles.signatureHint, { color: c.textSecondary }]}>
            Obrigatória para concluir
          </Text>
        )}
      </View>

      {showPreview && signatureConfirmed ? (
        // ── Confirmed state: show preview ───────────────────────────────
        <View style={styles.signaturePreviewWrapper} accessibilityLabel="Prévia da assinatura confirmada">
          <SignaturePreview strokes={signatureData} />
          <View style={styles.signaturePreviewActions}>
            <Text style={[styles.signatureConfirmedBadge, { color: c.text }]}>
              ✓ Assinatura confirmada
            </Text>
            <Button
              label="Refazer"
              onPress={onClear}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
      ) : (
        // ── Drawing state: show canvas ───────────────────────────────────
        <>
          <SignatureCanvas
            onSignatureChange={onSignatureChange}
            height={180}
            disabled={false}
          />
          <View style={styles.signatureActions}>
            <Button
              label="Confirmar assinatura"
              onPress={onConfirm}
              disabled={!signatureData}
              size="md"
              fullWidth
            />
          </View>
        </>
      )}
    </Card>
  );
}

// ─── SignaturePreview ─────────────────────────────────────────────────────────

/**
 * Re-renders the strokes stored as JSON so the technician can see what was
 * captured before confirming conclusion.
 */
function SignaturePreview({ strokes }: { strokes: string | null }) {
  const c = useThemeColors();

  if (!strokes) {
    return (
      <View style={[styles.previewBox, { borderColor: c.border, backgroundColor: c.mutedSurface }]}>
        <Text style={{ color: c.textSecondary }}>Sem assinatura</Text>
      </View>
    );
  }

  let parsed: Array<Array<{ x: number; y: number }>> = [];
  try {
    parsed = JSON.parse(strokes);
  } catch {
    parsed = [];
  }

  return (
    <View
      style={[styles.previewBox, { borderColor: c.border, backgroundColor: c.surface }]}
      accessibilityLabel="Prévia da assinatura desenhada"
    >
      {parsed.map((stroke, si) =>
        stroke.slice(1).map((pt, pi) => {
          const prev = stroke[pi];
          const dx = pt.x - prev.x;
          const dy = pt.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (length < 0.5) return null;
          return (
            <View
              key={`${si}-${pi}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: prev.x,
                top: prev.y - 1,
                width: length,
                height: 2,
                backgroundColor: '#0F172A',
                borderRadius: 1,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: '0 50%',
              }}
            />
          );
        }),
      )}
    </View>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: Spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.30)', justifyContent: 'center', padding: Spacing.lg },
  modal: { gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  // ── Signature ──
  signatureCard: { gap: Spacing.sm },
  signatureHeader: { gap: 2 },
  signatureTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  signatureHint: { fontSize: FontSize.xs },
  signatureActions: { gap: Spacing.xs },
  signaturePreviewWrapper: { gap: Spacing.sm },
  signaturePreviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signatureConfirmedBadge: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  previewBox: {
    height: 160,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
