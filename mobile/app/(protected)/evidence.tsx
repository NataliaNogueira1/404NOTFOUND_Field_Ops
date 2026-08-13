import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { compressorTemplate, useFieldOps } from '@/features/fieldops';

export default function EvidenceScreen() {
  const { inspectionId = 'ins-compressor', itemId = 'item-4' } = useLocalSearchParams<{ inspectionId?: string; itemId?: string }>(); const router = useRouter(); const { addEvidence } = useFieldOps(); const [captured, setCaptured] = useState(false); const [description, setDescription] = useState('Proteção lateral com folga no parafuso.');
  const item = compressorTemplate.sections.flatMap((section) => section.items).find((candidate) => candidate.id === itemId);
  function usePhoto() { addEvidence(inspectionId, itemId, description); router.back(); }
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.container}><Text style={styles.title}>Capturar evidência</Text><Card style={styles.viewer}><View style={styles.frame}><Text style={styles.frameText}>{captured ? 'Preview da foto' : 'Viewfinder mockado'}</Text></View><Text style={styles.item}>Item relacionado: {item?.question}</Text>{captured ? <TextInput value={description} onChangeText={setDescription} placeholder="Descrição opcional" placeholderTextColor={Colors.gray400} style={styles.input} multiline /> : null}</Card>{captured ? <><Button label="Usar foto" onPress={usePhoto} fullWidth size="lg" /><Button label="Refazer" onPress={() => setCaptured(false)} variant="secondary" fullWidth /><Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth /></> : <Button label="Capturar" onPress={() => setCaptured(true)} fullWidth size="lg" />}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.background }, container: { padding: Spacing.md, gap: Spacing.md }, title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text }, viewer: { gap: Spacing.md }, frame: { height: 320, borderRadius: 12, backgroundColor: Colors.text, borderWidth: 3, borderColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }, frameText: { color: Colors.white, fontWeight: FontWeight.semibold }, item: { color: Colors.textSecondary }, input: { minHeight: 88, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: Spacing.md, color: Colors.text, textAlignVertical: 'top' } });
