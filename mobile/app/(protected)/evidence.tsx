import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { compressorTemplate, useFieldOps } from '@/features/fieldops';
import { useImagePicker, type CapturedImage } from '@/infrastructure/media';

export default function EvidenceScreen() {
  const { inspectionId = 'ins-compressor', itemId = 'item-4' } = useLocalSearchParams<{
    inspectionId?: string;
    itemId?: string;
  }>();
  const router = useRouter();
  const { addEvidence } = useFieldOps();
  const { takePhoto, pickFromGallery } = useImagePicker();

  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [description, setDescription] = useState('');

  const item = compressorTemplate.sections
    .flatMap((section) => section.items)
    .find((candidate) => candidate.id === itemId);

  async function handleCamera() {
    const result = await takePhoto();
    if (result) setCaptured(result);
  }

  async function handleGallery() {
    const result = await pickFromGallery();
    if (result) setCaptured(result);
  }

  function usePhoto() {
    if (!captured) return;
    addEvidence(inspectionId, itemId, description, captured.uri);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Capturar evidência</Text>

        {captured ? (
          <>
            <Card style={styles.viewer}>
              <Image source={{ uri: captured.uri }} style={styles.preview} resizeMode="cover" />
              <Text style={styles.item}>
                Item: {item?.question ?? 'Não identificado'}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descrição (opcional)"
                placeholderTextColor={Colors.gray400}
                style={styles.input}
                multiline
              />
            </Card>

            <Button label="Usar esta foto" onPress={usePhoto} fullWidth size="lg" />
            <Button label="Refazer (câmera)" onPress={handleCamera} variant="secondary" fullWidth />
            <Button label="Escolher da galeria" onPress={handleGallery} variant="secondary" fullWidth />
            <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
          </>
        ) : (
          <>
            <Card style={styles.viewer}>
              <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>
                  Tire uma foto ou escolha da galeria
                </Text>
              </View>
              <Text style={styles.item}>
                Item: {item?.question ?? 'Não identificado'}
              </Text>
            </Card>

            <Button label="Abrir câmera" onPress={handleCamera} fullWidth size="lg" />
            <Button label="Escolher da galeria" onPress={handleGallery} variant="secondary" fullWidth />
            <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  viewer: { gap: Spacing.md },
  preview: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    backgroundColor: Colors.text,
  },
  placeholder: {
    height: 320,
    borderRadius: 12,
    backgroundColor: Colors.mutedSurface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  placeholderIcon: { fontSize: 48 },
  placeholderText: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  item: { color: Colors.textSecondary },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.md,
    color: Colors.text,
    textAlignVertical: 'top',
    backgroundColor: Colors.surface,
  },
});
