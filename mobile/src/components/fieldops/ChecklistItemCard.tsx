import { useCallback, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button, Card } from '@/design-system';
import { ResponseType, type ChecklistAnswer, type ChecklistValue, type Evidence, type TemplateItem } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { SaveStatusIndicator } from './SaveStatusIndicator';

interface ChecklistItemProps {
  item: TemplateItem;
  index: number;
  /** Real inspection id — used to route the camera to the correct inspection. */
  inspectionId: string;
  answer?: ChecklistAnswer;
  evidences: Evidence[];
  onAnswer: (value: ChecklistValue, observation?: string) => void;
  /** Retry a failed photo upload, reusing the existing file (PBI-044). */
  onRetryEvidence?: (evidenceId: string) => void;
}

export function ChecklistItemCard({ item, index, inspectionId, answer, evidences, onAnswer, onRetryEvidence }: ChecklistItemProps) {
  const router = useRouter();
  const c = useThemeColors();
  const [text, setText] = useState(answer?.value?.toString() ?? '');
  const [observation, setObservation] = useState(answer?.observation ?? '');
  const isFailure = answer?.value === 'NAO_CONFORME';
  const statusLabel = useMemo(() => isFailure ? 'Não conforme' : answer ? 'Respondido' : 'Pendente', [answer, isFailure]);
  // Debounced save hook — handles timing per response type
  const { status: saveStatus, save, flush } = useDebouncedSave({
    responseType: item.responseType,
    onSave: onAnswer,
  });

  // Text fields: debounced save on each keystroke
  const handleTextChange = useCallback((value: string) => {
    setText(value);
    const parsed = item.responseType === ResponseType.NUMBER ? Number(value || 0) : value;
    save(parsed, observation || undefined);
  }, [item.responseType, observation, save]);

  // Text fields: flush on blur (save immediately if user leaves field)
  const handleTextBlur = useCallback(() => {
    const parsed = item.responseType === ResponseType.NUMBER ? Number(text || 0) : text;
    if (text) flush(parsed, observation || undefined);
  }, [item.responseType, text, observation, flush]);

  // Selection controls: immediate save, preserving any existing observation
  const handleSelect = useCallback((value: ChecklistValue) => {
    save(value, observation || undefined);
  }, [observation, save]);

  // Observation field — available for all items, not just non-conformities
  const handleObservationChange = useCallback((value: string) => {
    setObservation(value);
    const currentValue = answer?.value;
    if (currentValue !== undefined) {
      save(currentValue, value || undefined);
    }
  }, [answer?.value, save]);

  const handleObservationBlur = useCallback(() => {
    const currentValue = answer?.value;
    if (currentValue !== undefined) {
      flush(currentValue, observation || undefined);
    }
  }, [answer?.value, flush, observation]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.question, { color: c.text }]}>{index}. {item.question}{item.required ? ' *' : ''}</Text>
        <Text style={[styles.state, { color: isFailure ? c.danger : c.textSecondary }]}>{statusLabel}</Text>
      </View>
      {item.description ? <Text style={[styles.description, { color: c.textSecondary }]}>{item.description}</Text> : null}
      <AnswerControl
        item={item}
        value={answer?.value}
        text={text}
        onText={handleTextChange}
        onTextBlur={handleTextBlur}
        onAnswer={handleSelect}
      />
      {isFailure ? (
        <View style={[styles.failureBox, { borderColor: c.danger, backgroundColor: c.dangerLight }]}>
          <Text style={[styles.failureTitle, { color: c.dangerDark }]}>Não conformidade criada</Text>
          <Text style={[styles.label, { color: c.textSecondary }]}>Observação{item.requireObservationOnFailure ? ' obrigatória' : ''}</Text>
          <TextInput
            value={observation}
            onChangeText={handleObservationChange}
            onBlur={handleObservationBlur}
            placeholder="Descreva a falha encontrada"
            placeholderTextColor={c.textSecondary}
            style={[styles.input, styles.textArea, { borderColor: c.border, backgroundColor: c.surface, color: c.text }]}
            multiline
          />
          <Text style={[styles.label, { color: c.textSecondary }]}>Evidência{item.requireEvidenceOnFailure ? ' obrigatória' : ''}</Text>
          <Button label="Adicionar foto" onPress={() => router.push(`/(protected)/evidence?inspectionId=${inspectionId}&itemId=${item.id}`)} variant="secondary" />
        </View>
      ) : answer !== undefined ? (
        <View style={[styles.observationBox, { borderColor: c.border, backgroundColor: c.surface }]}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Observação (opcional)</Text>
          <TextInput
            value={observation}
            onChangeText={handleObservationChange}
            onBlur={handleObservationBlur}
            placeholder="Adicione uma observação sobre este item"
            placeholderTextColor={c.textSecondary}
            style={[styles.input, styles.textArea, { borderColor: c.border, backgroundColor: c.surface, color: c.text }]}
            multiline
          />
        </View>
      ) : null}
      {evidences.length > 0 ? (
        <View style={styles.evidenceRow}>
          {evidences.map((evidence) => (
            <EvidenceThumb key={evidence.id} evidence={evidence} onRetry={onRetryEvidence} />
          ))}
        </View>
      ) : null}
      <SaveStatusIndicator status={saveStatus} />
    </Card>
  );
}

/**
 * Photo thumbnail with its sync state (PBI-044):
 *   ⏳ Pendente upload — captured, file on disk, not yet confirmed by the server
 *   ✓ Enviada        — server confirmed APPLIED (synced)
 *   ❌ Erro           — upload failed; file is preserved and "Tentar novamente"
 *                        re-enqueues the same file (no re-capture, no duplicate).
 */
function EvidenceThumb({ evidence, onRetry }: { evidence: Evidence; onRetry?: (evidenceId: string) => void }) {
  const c = useThemeColors();
  const stateLabel =
    evidence.syncStatus === 'synced' ? '✓ Enviada'
    : evidence.syncStatus === 'error' ? '❌ Erro'
    : '⏳ Pendente upload';
  const stateColor =
    evidence.syncStatus === 'synced' ? c.success
    : evidence.syncStatus === 'error' ? c.danger
    : c.warningDark;

  return (
    <View style={[styles.thumb, { borderColor: c.border, backgroundColor: c.mutedSurface }]}>
      {evidence.uri ? <Image source={{ uri: evidence.uri }} style={styles.thumbImage} /> : <Text style={[styles.thumbIcon, { color: c.primary }]}>▧</Text>}
      <Text style={[styles.thumbState, { color: stateColor }]}>{stateLabel}</Text>
      {evidence.syncStatus === 'error' ? (
        <>
          {evidence.lastError ? (
            <Text style={[styles.thumbError, { color: c.danger }]} numberOfLines={2}>{evidence.lastError}</Text>
          ) : null}
          {onRetry ? (
            <Pressable
              onPress={() => onRetry(evidence.id)}
              style={[styles.retryButton, { borderColor: c.danger, backgroundColor: c.dangerLight }]}
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente o envio da foto"
            >
              <Text style={[styles.retryText, { color: c.danger }]}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function AnswerControl({ item, value, text, onText, onTextBlur, onAnswer }: {
  item: TemplateItem;
  value?: ChecklistValue;
  text: string;
  onText: (value: string) => void;
  onTextBlur: () => void;
  onAnswer: (value: ChecklistValue) => void;
}) {
  const c = useThemeColors();
  const inputStyle = { borderColor: c.border, backgroundColor: c.surface, color: c.text };
  if (item.responseType === ResponseType.CONFORMITY) return <Segmented options={[['CONFORME', 'Conforme'], ['NAO_CONFORME', 'Não conforme'], ['NA', 'N/A']]} value={value} onSelect={onAnswer} />;
  if (item.responseType === ResponseType.BOOLEAN) return <Segmented options={[[true, 'Sim'], [false, 'Não']]} value={value} onSelect={onAnswer} />;
  if (item.responseType === ResponseType.SINGLE_CHOICE) return <Segmented options={(item.options ?? []).map((option) => [option, option])} value={value} onSelect={onAnswer} />;
  if (item.responseType === ResponseType.DATE) return <DateInput value={value as string | undefined} onSelect={onAnswer} />;
  if (item.responseType === ResponseType.NUMBER) return (
    <TextInput
      value={text}
      onChangeText={onText}
      onBlur={onTextBlur}
      keyboardType="numeric"
      placeholder="Informe o valor"
      placeholderTextColor={c.textSecondary}
      style={[styles.input, inputStyle]}
    />
  );
  if (item.responseType === ResponseType.TEXT_SHORT) return (
    <TextInput
      value={text}
      onChangeText={onText}
      onBlur={onTextBlur}
      placeholder="Digite a resposta"
      placeholderTextColor={c.textSecondary}
      style={[styles.input, inputStyle]}
      maxLength={255}
    />
  );
  if (item.responseType === ResponseType.TEXT_LONG) return (
    <TextInput
      value={text}
      onChangeText={onText}
      onBlur={onTextBlur}
      placeholder="Digite a resposta"
      placeholderTextColor={c.textSecondary}
      style={[styles.input, styles.textArea, inputStyle]}
      multiline
      maxLength={2000}
    />
  );
  // PBI-035: fallback para tipos desconhecidos — não crasha no TextInput genérico
  return (
    <View style={[styles.incompatibleBox, { borderColor: c.warningLight, backgroundColor: c.warningLight }]}>
      <Text style={[styles.incompatibleText, { color: c.warningDark }]}>Tipo incompatível: {item.responseType}</Text>
    </View>
  );
}

function Segmented({ options, value, onSelect }: { options: Array<[ChecklistValue, string]>; value?: ChecklistValue; onSelect: (value: ChecklistValue) => void }) {
  const c = useThemeColors();
  return <View style={styles.segmented}>{options.map(([optionValue, label]) => {
    const active = value === optionValue;
    return (
      <Pressable
        key={`${optionValue}`}
        onPress={() => onSelect(optionValue)}
        style={[styles.option, { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primaryLight : c.surface }]}
      >
        <Text style={[styles.optionText, { color: active ? c.primaryDark : c.textSecondary }]}>{label}</Text>
      </Pressable>
    );
  })}</View>;
}

function DateInput({ value, onSelect }: { value?: string; onSelect: (value: ChecklistValue) => void }) {
  const c = useThemeColors();
  const [showPicker, setShowPicker] = useState(false);
  const currentDate = value ? new Date(value + 'T00:00:00') : new Date();

  const formattedDate = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')
    : null;

  return (
    <View>
      <Pressable onPress={() => setShowPicker(true)} style={[styles.dateButton, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Text style={[styles.dateButtonText, { color: formattedDate ? c.text : c.textSecondary }]}>
          {formattedDate ?? 'Selecionar data'}
        </Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, selectedDate) => {
            setShowPicker(Platform.OS === 'ios');
            if (selectedDate) {
              const iso = selectedDate.toISOString().slice(0, 10);
              onSelect(iso);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  header: { gap: Spacing.xs },
  question: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, lineHeight: 22 },
  state: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  description: { fontSize: FontSize.sm },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: { minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: FontSize.md },
  textArea: { minHeight: 92, paddingTop: Spacing.sm, textAlignVertical: 'top' },
  failureBox: { gap: Spacing.sm, borderRadius: 10, borderWidth: 1, padding: Spacing.md },
  observationBox: { gap: Spacing.sm, borderRadius: 10, borderWidth: 1, padding: Spacing.md },
  incompatibleBox: { borderRadius: 10, borderWidth: 1, padding: Spacing.md },
  incompatibleText: { fontSize: FontSize.sm },
  failureTitle: { fontWeight: FontWeight.semibold },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  evidenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  thumb: { width: 118, minHeight: 76, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, overflow: 'hidden', padding: Spacing.xs },
  thumbImage: { width: 106, height: 64, borderRadius: 8 },
  thumbIcon: { fontSize: 26 },
  thumbState: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textAlign: 'center' },
  thumbError: { fontSize: FontSize.xs, textAlign: 'center' },
  retryButton: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  retryText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  dateButton: { minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  dateButtonText: { fontSize: FontSize.md },
});
