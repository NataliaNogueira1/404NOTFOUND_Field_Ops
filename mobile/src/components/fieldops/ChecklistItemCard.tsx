import { useCallback, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button, Card } from '@/design-system';
import { ResponseType, type ChecklistAnswer, type ChecklistValue, type Evidence, type TemplateItem } from '@/features/fieldops';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { SyncBadge } from './Badges';
import { SaveStatusIndicator } from './SaveStatusIndicator';

interface ChecklistItemProps {
  item: TemplateItem;
  index: number;
  answer?: ChecklistAnswer;
  evidences: Evidence[];
  onAnswer: (value: ChecklistValue, observation?: string) => void;
}

export function ChecklistItemCard({ item, index, answer, evidences, onAnswer }: ChecklistItemProps) {
  const router = useRouter();
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

  // Selection controls: immediate save
  const handleSelect = useCallback((value: ChecklistValue) => {
    save(value);
  }, [save]);

  // Observation field for non-conformities
  const handleObservationChange = useCallback((value: string) => {
    setObservation(value);
    save('NAO_CONFORME', value);
  }, [save]);

  const handleObservationBlur = useCallback(() => {
    flush('NAO_CONFORME', observation);
  }, [flush, observation]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.question}>{index}. {item.question}{item.required ? ' *' : ''}</Text>
        <Text style={[styles.state, isFailure && styles.failure]}>{statusLabel}</Text>
      </View>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      <AnswerControl
        item={item}
        value={answer?.value}
        text={text}
        onText={handleTextChange}
        onTextBlur={handleTextBlur}
        onAnswer={handleSelect}
      />
      {isFailure ? (
        <View style={styles.failureBox}>
          <Text style={styles.failureTitle}>Não conformidade criada</Text>
          <Text style={styles.label}>Observação obrigatória</Text>
          <TextInput
            value={observation}
            onChangeText={handleObservationChange}
            onBlur={handleObservationBlur}
            placeholder="Descreva a falha encontrada"
            placeholderTextColor={Colors.gray400}
            style={[styles.input, styles.textArea]}
            multiline
          />
          <Text style={styles.label}>Evidência obrigatória</Text>
          <Button label="Adicionar foto" onPress={() => router.push(`/(protected)/evidence?inspectionId=ins-compressor&itemId=${item.id}`)} variant="secondary" />
        </View>
      ) : null}
      {evidences.length > 0 ? (
        <View style={styles.evidenceRow}>
          {evidences.map((evidence) => (
            <View key={evidence.id} style={styles.thumb}>
              {evidence.uri ? <Image source={{ uri: evidence.uri }} style={styles.thumbImage} /> : <Text style={styles.thumbIcon}>▧</Text>}
              <SyncBadge status={evidence.syncStatus} />
            </View>
          ))}
        </View>
      ) : null}
      <SaveStatusIndicator status={saveStatus} />
    </Card>
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
  if (item.responseType === ResponseType.CONFORMITY) return <Segmented options={[['CONFORME', 'Conforme'], ['NAO_CONFORME', 'Não conforme'], ['NA', 'N/A']]} value={value} onSelect={onAnswer} />;
  if (item.responseType === ResponseType.BOOLEAN) return <Segmented options={[[true, 'Sim'], [false, 'Não']]} value={value} onSelect={onAnswer} />;
  if (item.responseType === ResponseType.SINGLE_CHOICE) return <Segmented options={(item.options ?? []).map((option) => [option, option])} value={value} onSelect={onAnswer} />;
  if (item.responseType === ResponseType.DATE) return <DateInput value={value as string | undefined} onSelect={onAnswer} />;
  return (
    <TextInput
      value={text}
      onChangeText={onText}
      onBlur={onTextBlur}
      keyboardType={item.responseType === ResponseType.NUMBER ? 'numeric' : 'default'}
      placeholder={item.responseType === ResponseType.NUMBER ? 'Informe o valor' : 'Digite a resposta'}
      placeholderTextColor={Colors.gray400}
      style={[styles.input, item.responseType === ResponseType.TEXT_LONG && styles.textArea]}
      multiline={item.responseType === ResponseType.TEXT_LONG}
    />
  );
}

function Segmented({ options, value, onSelect }: { options: Array<[ChecklistValue, string]>; value?: ChecklistValue; onSelect: (value: ChecklistValue) => void }) {
  return <View style={styles.segmented}>{options.map(([optionValue, label]) => <Pressable key={`${optionValue}`} onPress={() => onSelect(optionValue)} style={[styles.option, value === optionValue && styles.optionActive]}><Text style={[styles.optionText, value === optionValue && styles.optionTextActive]}>{label}</Text></Pressable>)}</View>;
}

function DateInput({ value, onSelect }: { value?: string; onSelect: (value: ChecklistValue) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const currentDate = value ? new Date(value + 'T00:00:00') : new Date();

  const formattedDate = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')
    : null;

  return (
    <View>
      <Pressable onPress={() => setShowPicker(true)} style={styles.dateButton}>
        <Text style={[styles.dateButtonText, !formattedDate && styles.datePlaceholder]}>
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
  question: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 22 },
  state: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  failure: { color: Colors.danger },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: { minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  optionActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  optionText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  optionTextActive: { color: Colors.primaryDark },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, color: Colors.text, fontSize: FontSize.md },
  textArea: { minHeight: 92, paddingTop: Spacing.sm, textAlignVertical: 'top' },
  failureBox: { gap: Spacing.sm, borderRadius: 10, borderWidth: 1, borderColor: Colors.dangerLight, backgroundColor: '#FFF7F7', padding: Spacing.md },
  failureTitle: { color: Colors.dangerDark, fontWeight: FontWeight.semibold },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  evidenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  thumb: { width: 98, minHeight: 76, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.mutedSurface, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, overflow: 'hidden' },
  thumbImage: { width: 98, height: 64, borderRadius: 8 },
  thumbIcon: { fontSize: 26, color: Colors.primary },
  dateButton: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  dateButtonText: { fontSize: FontSize.md, color: Colors.text },
  datePlaceholder: { color: Colors.gray400 },
});
