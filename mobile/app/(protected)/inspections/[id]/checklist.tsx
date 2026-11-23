import { type ComponentRef, useCallback, useMemo, useRef } from 'react';
<<<<<<< HEAD
import { ActivityIndicator, InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
=======
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
>>>>>>> e17f84321ff3f5709abde1fbdc714ca490b75526
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChecklistItemCard, ProgressBar, ReadOnlyBanner, SectionHeader } from '@/components/fieldops';
import { NUMERIC_ACCESSORY_ID } from '@/components/fieldops/ChecklistItemCard';
import { Button, Card, SignaturePreview, type SignatureStroke } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { InspectionStatus, useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';

// _layout.tsx owns the top safe-area inset (paddingTop via useSafeAreaInsets).
// There is no header in the protected Stack (headerShown: false).
// A small offset is needed so KeyboardAvoidingView over-compensates slightly,
// ensuring the input clears the keyboard fully on Android (#333).
const KEYBOARD_VERTICAL_OFFSET = Platform.OS === 'ios' ? 0 : 64;

// Inspection states whose checklist is viewable but never editable (#273/#277).
const READ_ONLY_STATUSES: InspectionStatus[] = [
  InspectionStatus.SUBMITTED,
  InspectionStatus.UNDER_REVIEW,
  InspectionStatus.APPROVED,
];

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const { inspections, answers, evidences, reviewComments, answerItem, retryEvidenceUpload } = useFieldOps();
  const { template, isLoading: templateLoading } = useInspectionTemplate(id);
  // RN 0.88 types ScrollView as a function component; derive the imperative
  // instance type (with scrollTo / measureLayout) from the component ref.
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Accumulates the measured Y-offset of each section relative to the ScrollView
  // so the scroll-to-pending handler can target the correct item position even
  // when the checklist has multiple sections (issue #333 — scroll correction).
  const sectionOffsetsRef = useRef<Record<string, number>>({});

  const inspection = inspections.find((item) => item.id === id) ?? inspections[0];
  // Lock the whole checklist when the inspection is in a reviewed state. Derived from the
  // inspection's own status (not a route flag) so a submitted/approved inspection can never be
  // edited, even if the screen is reached directly. Works offline from the local snapshot.
  const readOnly = inspection ? READ_ONLY_STATUSES.includes(inspection.status) : false;

  const allItems = useMemo(() => (template ? template.sections.flatMap((section) => section.items) : []), [template]);
  const hasChecklist = Boolean(template && allItems.length > 0);
  const total = allItems.length;
  const answered = allItems.filter((item) => answers[item.id] !== undefined).length;
  const pending = total - answered;

  // Parse stored strokes for read-only signature preview (issue #334).
  // Must be declared before any early return to satisfy the Rules of Hooks.
  const signatureStrokes = useMemo((): SignatureStroke[] | null => {
    if (!readOnly || !inspection?.signatureStrokes) return null;
    try {
      return JSON.parse(inspection.signatureStrokes) as SignatureStroke[];
    } catch {
      return null;
    }
  }, [readOnly, inspection?.signatureStrokes]);

  // Scroll to first unanswered item — must be defined before any early return.
  //
  // Uses the sectionOffsetsRef collected via onLayout on each section <View> to
  // compute the correct Y position inside the ScrollView. This avoids the
  // previous approximation (120 + items * 180) which was wrong for checklists
  // with multiple sections of varying height (issue #333).
  const handleScrollToPending = useCallback(() => {
    if (!template || !scrollRef.current) return;

    // Find the first unanswered item and which section it belongs to.
    for (const section of template.sections) {
      for (let i = 0; i < section.items.length; i++) {
        const item = section.items[i];
        if (answers[item.id] === undefined) {
          // sectionOffset is the Y of the section header relative to the ScrollView.
          // We add a per-item estimate (88px per card) only within the section so
          // the error is bounded to one section's height instead of the whole list.
          const sectionOffset = sectionOffsetsRef.current[section.id] ?? 0;
          const itemOffset = i * 88; // approximate card height within the section
          scrollRef.current.scrollTo({ y: sectionOffset + itemOffset, animated: true });
          return;
        }
      }
    }
  }, [allItems, answers, template]);

  // Scroll the focused card's Y position into view above the keyboard (issue #333).
  // behavior="padding" on KeyboardAvoidingView already pushes the ScrollView content
  // up by the keyboard height. The manual scroll here handles items in the middle of
  // multi-section checklists that are not yet visible when focus fires.
  const handleItemFocus = useCallback((cardY: number) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, cardY - 16), animated: true });
  }, []);

  if (templateLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: c.textSecondary }}>Carregando checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading is done but there is no snapshot in SQLite (e.g. the inspection was
  // never synced from the server). Show an actionable empty state instead of
  // freezing forever on the spinner.
  if (!template || !hasChecklist) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={[styles.title, { color: c.text }]}>Checklist indisponível</Text>
          <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
            Esta inspeção ainda não tem o checklist baixado. Sincronize na aba Sync e tente
            novamente.
          </Text>
          <Button label="Voltar" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom', 'left', 'right']}>
      {/*
       * KeyboardAvoidingView pushes the ScrollView up when the software keyboard
<<<<<<< HEAD
       * opens so the focused input (number, text) stays visible above the keyboard
       * on both iOS and Android (issue #333).
       *
       * iOS:     behavior="padding" adds bottom padding equal to the keyboard height.
       * Android: behavior={undefined} — Expo sets windowSoftInputMode=adjustResize by
       *          default, which already shrinks the layout. Using behavior="height" on
       *          top of adjustResize would adjust twice and push content too far up.
       *
       * keyboardVerticalOffset=0 because _layout.tsx already owns the top safe-area
       * inset (paddingTop via useSafeAreaInsets) and the Stack has headerShown: false,
       * so there is no header to compensate for (#332).
       *
       * ScrollView also scrolls to the focused card via onInputFocus + measureLayout,
       * ensuring the field stays above the keyboard even at the middle or end of a
       * long multi-section checklist (#333).
=======
       * opens so text/number fields stay visible (issue #333).
       *
       * iOS:    behavior="padding" adds bottom padding equal to the keyboard height.
       * Android: behavior is omitted — the OS handles it via windowSoftInputMode
       *          (adjustResize); adding behavior="height" here would double-offset.
       *
       * keyboardVerticalOffset=0: the Stack uses headerShown:false and the
       * SafeAreaView with edges=['bottom','left','right'] sits outside the KAV,
       * so there is no header or top inset to compensate for.
>>>>>>> e17f84321ff3f5709abde1fbdc714ca490b75526
       */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior="padding"
        keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}
      >
        {/*
         * InputAccessoryView (iOS only): a single "OK" toolbar above the numeric keyboard.
         * Rendered once at screen level to avoid duplicate nativeIDs across multiple
         * NUMBER cards (which would cause undefined behaviour). Each NUMBER TextInput
         * in ChecklistItemCard links to it via inputAccessoryViewID.
         */}
        {Platform.OS === 'ios' ? (
          <InputAccessoryView nativeID={NUMERIC_ACCESSORY_ID}>
            <View style={[styles.accessoryBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
              <TouchableOpacity onPress={() => Keyboard.dismiss()} accessibilityRole="button" accessibilityLabel="Fechar teclado">
                <Text style={[styles.accessoryDone, { color: c.primary }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        ) : null}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={[styles.title, { color: c.text }]}>{template.title}</Text>
          <Text style={{ color: c.textSecondary }}>
            {template.sections.length} seções / {total} itens
          </Text>

          {readOnly && inspection ? <ReadOnlyBanner status={inspection.status} /> : null}

          <Card style={styles.card}>
            <ProgressBar value={inspection?.progress ?? 0} />
            <View style={styles.progressRow}>
              <Text style={{ color: c.textSecondary }}>
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
            <View
              key={section.id}
              onLayout={(e) => {
                // Record each section's Y-offset relative to the ScrollView content
                // so handleScrollToPending can compute the correct scroll target
                // even in checklists with multiple sections (issue #333).
                sectionOffsetsRef.current[section.id] = e.nativeEvent.layout.y;
              }}
            >
              <SectionHeader title={section.title} meta={`${section.items.length} itens`} />
              {section.items.map((item) => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  index={allItems.findIndex((candidate) => candidate.id === item.id) + 1}
                  inspectionId={inspection?.id ?? id}
                  answer={answers[item.id]}
                  evidences={evidences.filter((evidence) => evidence.itemId === item.id)}
                  onAnswer={(value, observation) => answerItem(item.id, value, observation, inspection?.id ?? id)}
                  onRetryEvidence={retryEvidenceUpload}
                  reviewComments={reviewComments.filter((comment) => comment.itemId === item.id)}
                  readOnly={readOnly}
                  onInputFocus={handleItemFocus}
                  scrollRef={scrollRef}
                />
              ))}
            </View>
          ))}

          {/* ── Assinatura do técnico (issue #334) ───────────────────────
              Exibe a assinatura salva quando o checklist está em modo
              read-only (SUBMITTED / UNDER_REVIEW / APPROVED). Os strokes
              persistidos são redesenhados com SignaturePreview, evitando
              a limitação do <Image> com SVG data URI no React Native.
          ────────────────────────────────────────────────────────────── */}
          {readOnly && signatureStrokes ? (
            <Card style={styles.signatureCard}>
              <Text style={[styles.signatureTitle, { color: c.text }]}>
                Assinatura do técnico
              </Text>
              <SignaturePreview
                strokes={signatureStrokes}
                sourceWidth={inspection?.signatureWidth ?? 300}
                sourceHeight={inspection?.signatureHeight ?? 180}
                height={100}
                accessibilityLabel="Assinatura do técnico"
              />
            </Card>
          ) : null}

          <Button
            label="Ver resumo"
            onPress={() => router.push(`/(protected)/inspections/${inspection?.id ?? id}/summary`)}
            fullWidth
            size="lg"
          />
          {readOnly ? (
            <Button
              label="Voltar aos detalhes"
              onPress={() => router.back()}
              variant="secondary"
              fullWidth
            />
          ) : (
            <Button
              label="Não conformidades"
              onPress={() => router.push(`/(protected)/inspections/${inspection?.id ?? id}/non-conformities`)}
              variant="secondary"
              fullWidth
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardAvoiding: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl * 2 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: { gap: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  signatureCard: { gap: Spacing.sm },
  signatureTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  accessoryBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1 },
  accessoryDone: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
