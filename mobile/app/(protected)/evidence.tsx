import { useCallback, useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useFieldOps } from '@/features/fieldops';
import { useInspectionTemplate } from '@/hooks/useInspectionTemplate';
import { useImagePicker, type CapturedImage } from '@/infrastructure/media';

type ScreenMode = 'idle' | 'camera' | 'preview';

export default function EvidenceScreen() {
  const { inspectionId = 'ins-compressor', itemId = 'item-4' } = useLocalSearchParams<{
    inspectionId?: string;
    itemId?: string;
  }>();
  const router = useRouter();
  const { addEvidence } = useFieldOps();
  const { pickFromGallery } = useImagePicker();
  const { template } = useInspectionTemplate(inspectionId);

  const [mode, setMode] = useState<ScreenMode>('idle');
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [description, setDescription] = useState('');

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const item = template?.sections
    .flatMap((section) => section.items)
    .find((candidate) => candidate.id === itemId);

  const handleOpenCamera = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setMode('camera');
  }, [permission, requestPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) {
      setCaptured({
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
      });
      setMode('preview');
    }
  }, []);

  const handleGallery = useCallback(async () => {
    const result = await pickFromGallery();
    if (result) {
      setCaptured(result);
      setMode('preview');
    }
  }, [pickFromGallery]);

  function usePhoto() {
    if (!captured) return;
    addEvidence(inspectionId, itemId, description, captured.uri);
    router.back();
  }

  // ─── Camera mode: inline camera viewfinder ────────────────────────────────

  if (mode === 'camera') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="picture"
          />
          <View style={styles.cameraControls}>
            <Button label="Cancelar" onPress={() => setMode('idle')} variant="ghost" />
            <View style={styles.shutterButton}>
              <Button label="📷" onPress={handleTakePhoto} />
            </View>
            <Button label="Galeria" onPress={handleGallery} variant="ghost" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Preview mode: show captured photo ────────────────────────────────────

  if (mode === 'preview' && captured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Prévia da foto</Text>

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
          <Button label="Refazer (câmera)" onPress={() => setMode('camera')} variant="secondary" fullWidth />
          <Button label="Escolher da galeria" onPress={handleGallery} variant="secondary" fullWidth />
          <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Idle mode: choose camera or gallery ──────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Capturar evidência</Text>

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

        <Button label="Abrir câmera" onPress={handleOpenCamera} fullWidth size="lg" />
        <Button label="Escolher da galeria" onPress={handleGallery} variant="secondary" fullWidth />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" fullWidth />
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
  // Camera inline styles
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.text,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
});
