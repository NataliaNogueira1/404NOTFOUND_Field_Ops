import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { SeverityBadge } from '@/components/fieldops';
import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Severity, useFieldOps } from '@/features/fieldops';
import { useThemeColors } from '@/features/theme';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';

export default function NonConformitiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const { nonConformities, addNonConformity } = useFieldOps();
  const { template } = useInspectionTemplate(id);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>(Severity.MEDIUM);
  const [itemId, setItemId] = useState('');

  const items = template?.sections.flatMap((section) => section.items) ?? [];
  const list = nonConformities.filter((nc) => nc.inspectionId === id);

  function save() {
    if (!itemId || !title) return;
    addNonConformity({ inspectionId: id, itemId, title, description, severity, evidenceCount: 0 });
    setOpen(false);
    setTitle('');
    setDescription('');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]}>Não conformidades</Text>
        {list.map((nc) => {
          const item = items.find((candidate) => candidate.id === nc.itemId);
          return (
            <Card key={nc.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={[styles.ncTitle, { color: c.text }]}>{nc.title}</Text>
                <SeverityBadge severity={nc.severity} />
              </View>
              <Text style={[styles.muted, { color: c.textSecondary }]}>Item: {item?.question ?? nc.itemId}</Text>
              <Text style={[styles.muted, { color: c.textSecondary }]}>Evidências: {nc.evidenceCount}</Text>
            </Card>
          );
        })}
        <Button label="Nova não conformidade" onPress={() => setOpen(true)} fullWidth size="lg" />
      </ScrollView>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.backdrop}>
          <Card style={styles.modal}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Nova não conformidade</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Título"
              placeholderTextColor={c.textSecondary}
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição"
              placeholderTextColor={c.textSecondary}
              style={[styles.input, styles.textArea, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
              multiline
            />
            <Text style={[styles.label, { color: c.textSecondary }]}>Criticidade</Text>
            <View style={styles.chips}>
              {Object.values(Severity).map((value) => {
                const active = severity === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSeverity(value)}
                    style={[styles.chip, { borderColor: active ? Colors.primary : c.border, backgroundColor: active ? Colors.primary : c.surface }]}
                  >
                    <Text style={[styles.chipText, { color: active ? Colors.white : c.textSecondary }]}>
                      {value === Severity.LOW ? 'Leve' : value === Severity.MEDIUM ? 'Moderada' : value === Severity.HIGH ? 'Alta' : 'Crítica'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.label, { color: c.textSecondary }]}>Item relacionado</Text>
            <ScrollView style={styles.itemPicker}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setItemId(item.id)}
                  style={[styles.itemOption, itemId === item.id && { backgroundColor: c.primaryLight }]}
                >
                  <Text style={{ color: c.textSecondary }}>{item.question}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button label="Salvar" onPress={save} fullWidth />
            <Button label="Cancelar" onPress={() => setOpen(false)} variant="ghost" fullWidth />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: { gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  ncTitle: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  muted: { fontSize: FontSize.sm },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.30)' },
  modal: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, gap: Spacing.md, maxHeight: '88%' },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, padding: Spacing.md },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  label: { fontWeight: FontWeight.semibold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { minHeight: 40, borderRadius: 999, borderWidth: 1, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  chipText: { fontWeight: FontWeight.semibold },
  itemPicker: { maxHeight: 160 },
  itemOption: { padding: Spacing.sm, borderRadius: 8 },
});
