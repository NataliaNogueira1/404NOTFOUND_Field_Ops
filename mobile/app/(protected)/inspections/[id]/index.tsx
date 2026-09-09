import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  InspectionStatusBadge,
  PriorityBadge,
  ProgressBar,
  RejectionBanner,
} from '@/components/fieldops';
import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { InspectionStatus, useFieldOps } from '@/features/fieldops';
import { useDatabase } from '@/infrastructure/database/DatabaseProvider';
import { InspectionRepository } from '@/infrastructure/database/repositories';

export default function InspectionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();
  const { inspections, answers, evidences, nonConformities } = useFieldOps();

  // Detail screen must resolve the exact inspection from the route param.
  const inspection = inspections.find((item) => item.id === id);

  // Total checklist items (for the X/Y progress) — read locally from SQLite (offline).
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [itemIds, setItemIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!db || !inspection) return;
    const repo = new InspectionRepository(db);
    repo
      .getAllItems(inspection.id)
      .then((items) => {
        if (cancelled) return;
        setTotalItems(items.length);
        setItemIds(items.map((it) => it.id));
      })
      .catch(() => {
        if (!cancelled) setTotalItems(null);
      });
    return () => {
      cancelled = true;
    };
  }, [db, inspection]);

  const answeredCount = useMemo(
    () => itemIds.filter((itemId) => answers[itemId] !== undefined).length,
    [itemIds, answers],
  );

  if (!inspection) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.empty}>Inspeção não encontrada.</Text>
          <Button label="Voltar" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  // Denormalised names stored directly on the inspection snapshot.
  const equipmentName = inspection.equipmentName ?? inspection.equipmentId;
  const clientName = inspection.clientName ?? inspection.clientId;
  const siteName = inspection.siteName ?? inspection.siteId;
  const supervisorName = inspection.supervisorName ?? inspection.supervisorId;

  const inspectionEvidences = evidences.filter((e) => e.inspectionId === inspection.id);
  const inspectionNCs = nonConformities.filter((nc) => nc.inspectionId === inspection.id);

  const isStarted = Boolean(inspection.startedAt) || inspection.status === InspectionStatus.IN_PROGRESS;
  const hasLocation =
    inspection.startLatitude !== undefined && inspection.startLongitude !== undefined;

  const progressLabel =
    totalItems && totalItems > 0
      ? `${answeredCount}/${totalItems} itens respondidos`
      : `${inspection.progress}% concluído`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{inspection.title}</Text>
        <View style={styles.badges}>
          <PriorityBadge priority={inspection.priority} />
          <InspectionStatusBadge status={inspection.status} />
        </View>

        {inspection.status === InspectionStatus.REJECTED ? (
          <RejectionBanner
            reason={inspection.rejectionReason}
            rejectedBy={inspection.rejectedBy}
            rejectedAt={inspection.rejectedAt}
            items={inspectionNCs.map((nc) => nc.title)}
          />
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.section}>📋 Informações</Text>
          <Row label="Cliente" value={clientName} />
          <Row label="Local" value={siteName} />
          <Row label="Equipamento" value={equipmentName} />
          <Row label="Supervisora" value={supervisorName} />
          <Row label="Prioridade" value={priorityText(inspection.priority)} />
          <Row
            label="Data prevista"
            value={`${inspection.dueDate}${inspection.dueTime ? ` ${inspection.dueTime}` : ''}`}
          />
          <Row label="Criada em" value={inspection.createdAt} />
        </Card>

        {inspection.supervisorInstructions ? (
          <Card style={styles.card}>
            <Text style={styles.section}>📝 Instruções do supervisor</Text>
            <Text style={styles.body}>{inspection.supervisorInstructions}</Text>
          </Card>
        ) : null}

        {isStarted ? (
          <Card style={styles.card}>
            <Text style={styles.section}>📊 Progresso</Text>
            <ProgressBar
              value={
                totalItems && totalItems > 0
                  ? Math.round((answeredCount / totalItems) * 100)
                  : inspection.progress
              }
            />
            <Text style={styles.body}>{progressLabel}</Text>
            <Row label="⚠️ Não conformidades" value={String(inspectionNCs.length)} />
            <Row label="📷 Evidências" value={String(inspectionEvidences.length)} />
          </Card>
        ) : null}

        {hasLocation ? (
          <Card style={styles.card}>
            <Text style={styles.section}>📍 Localização de início</Text>
            <Text style={styles.body}>
              {inspection.startLatitude?.toFixed(4)}, {inspection.startLongitude?.toFixed(4)}
              {inspection.startAccuracy !== undefined
                ? ` (±${inspection.startAccuracy.toFixed(1)}m)`
                : ''}
            </Text>
            {inspection.startedAt ? (
              <Text style={styles.bodyMuted}>{inspection.startedAt}</Text>
            ) : null}
          </Card>
        ) : null}

        <ActionButtons inspection={inspection} router={router} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButtons({
  inspection,
  router,
}: {
  inspection: ReturnType<typeof useFieldOps>['inspections'][number];
  router: ReturnType<typeof useRouter>;
}) {
  const base = `/(protected)/inspections/${inspection.id}`;

  switch (inspection.status) {
    case InspectionStatus.ASSIGNED:
      return (
        <Button
          label="▶️ Iniciar Inspeção"
          onPress={() => router.push(`${base}/start`)}
          fullWidth
          size="lg"
        />
      );
    case InspectionStatus.IN_PROGRESS:
      return (
        <Button
          label="▶️ Continuar"
          onPress={() => router.push(`${base}/checklist`)}
          fullWidth
          size="lg"
        />
      );
    case InspectionStatus.REJECTED:
      return (
        <Button
          label="🔧 Corrigir"
          onPress={() => router.push(`${base}/checklist`)}
          variant="danger"
          fullWidth
          size="lg"
        />
      );
    case InspectionStatus.APPROVED:
      return (
        <Button
          label="✓ Aprovada"
          onPress={() => {}}
          variant="secondary"
          disabled
          fullWidth
          size="lg"
        />
      );
    default:
      // SUBMITTED / UNDER_REVIEW / DRAFT / CANCELED — read-only, no primary action.
      return null;
  }
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

function priorityText(priority: string): string {
  return priorityLabels[priority] ?? priority;
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  empty: { color: Colors.textSecondary, fontSize: FontSize.md },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  badges: { flexDirection: 'row', gap: Spacing.sm },
  card: { gap: Spacing.sm },
  section: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  body: { color: Colors.textSecondary, lineHeight: 21 },
  bodyMuted: { color: Colors.gray400, fontSize: FontSize.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { color: Colors.textSecondary, flex: 1 },
  value: { color: Colors.text, fontWeight: FontWeight.semibold, flex: 1, textAlign: 'right' },
});
