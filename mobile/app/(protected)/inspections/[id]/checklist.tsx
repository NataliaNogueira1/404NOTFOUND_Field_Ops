import { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChecklistItemCard, ProgressBar, SectionHeader } from '@/components/fieldops';
import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { inspections, answers, evidences, answerItem } = useFieldOps();
  const { template, isLoading: templateLoading } = useInspectionTemplate(id);
  const scrollRef = useRef<ScrollView>(null);

  const inspection = inspections.find((item) => item.id === id) ?? inspections[0];

  const allItems = useMemo(() => (template ? template.sections.flatMap((section) => section.items) : []), [template]);
  const total = allItems.length;
  const answered = allItems.filter((item) => answers[item.id] !== undefined).length;
  const pending = total - answered;

  // Scroll to first unanswered item — must be defined before any early return
  const handleScrollToPending = useCallback(() => {
    if (!template || !scrollRef.current) return;
    const firstPendingItem = allItems.find((item) => answers[item.id] === undefined);
    if (!firstPendingItem) return;

    let itemsBefore = 0;
    for (const section of template.sections) {
      for (const item of section.items) {
        if (item.id === firstPendingItem.id) break;
        itemsBefore++;
      }
      if (section.items.some((i) => i.id === firstPendingItem.id)) break;
    }
    // Approximate scroll: header (~120px) + cards (~180px each)
    scrollRef.current.scrollTo({ y: 120 + itemsBefore * 180, animated: true });
  }, [allItems, answers, template]);

  if (templateLoading || !template) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.muted}>Carregando checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{template.title}</Text>
        <Text style={styles.muted}>
          {template.sections.length} seções / {total} itens
        </Text>

        <Card style={styles.card}>
          <ProgressBar value={inspection.progress} />
          <View style={styles.progressRow}>
            <Text style={styles.muted}>
              {answered} de {total} itens respondidos
            </Text>
            {pending > 0 ? (
              <Text style={styles.pendingLink} onPress={handleScrollToPending}>
                {pending} pendente{pending > 1 ? 's' : ''} ↓
              </Text>
            ) : null}
          </View>
        </Card>

        {template.sections.map((section) => (
          <View key={section.id}>
            <SectionHeader title={section.title} meta={`${section.items.length} itens`} />
            {section.items.map((item) => (
              <ChecklistItemCard
                key={item.id}
                item={item}
                index={allItems.findIndex((candidate) => candidate.id === item.id) + 1}
                answer={answers[item.id]}
                evidences={evidences.filter((evidence) => evidence.itemId === item.id)}
                onAnswer={(value, observation) => answerItem(item.id, value, observation)}
              />
            ))}
          </View>
        ))}

        <Button
          label="Ver resumo"
          onPress={() => router.push(`/(protected)/inspections/${inspection.id}/summary`)}
          fullWidth
          size="lg"
        />
        <Button
          label="Não conformidades"
          onPress={() => router.push(`/(protected)/inspections/${inspection.id}/non-conformities`)}
          variant="secondary"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  muted: { color: Colors.textSecondary },
  card: { gap: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
});
