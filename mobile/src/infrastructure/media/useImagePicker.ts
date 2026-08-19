import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** Result returned after a successful pick or capture. */
export interface CapturedImage {
  /** Local URI of the image (persisted on native, temporary on web). */
  uri: string;
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
  /** File size in bytes (may be undefined on some platforms). */
  fileSize?: number;
}

/**
 * Persist image to a stable location in the app's document directory.
 * On web, expo-file-system is not supported, so we just return the temp URI.
 * On native, we copy to documentDirectory/evidences/.
 */
async function persistImage(tempUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // Web: no filesystem persistence needed, the blob URL works for the session
    return tempUri;
  }

  // Native: use expo-file-system classes
  try {
    const { Paths, Directory, File } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'evidences');
    if (!dir.exists) {
      dir.create();
    }
    const filename = `evidence_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const source = new File(tempUri);
    const destination = new File(dir, filename);
    source.copy(destination);
    return destination.uri;
  } catch {
    // Fallback: if file system fails, use temp URI
    return tempUri;
  }
}

/** Prompt the user to open settings when permission is denied. */
function showPermissionDeniedAlert(type: 'câmera' | 'galeria'): void {
  Alert.alert(
    'Permissão necessária',
    `O acesso à ${type} foi negado. Abra as configurações do dispositivo para conceder permissão.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
    ],
  );
}

/** Shared picker options for consistent image quality/compression. */
const SHARED_OPTIONS: Partial<ImagePicker.ImagePickerOptions> = {
  mediaTypes: ['images'],
  quality: 0.8,
  allowsEditing: false,
  exif: true,
};

/**
 * Hook that exposes camera capture and gallery picking capabilities
 * with automatic permission handling and file persistence.
 */
export function useImagePicker() {
  /**
   * Launch the device camera to take a photo.
   * Returns the persisted image or null if cancelled/denied.
   */
  async function takePhoto(): Promise<CapturedImage | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showPermissionDeniedAlert('câmera');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync(SHARED_OPTIONS);
    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    const persistedUri = await persistImage(asset.uri);

    return {
      uri: persistedUri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize ?? undefined,
    };
  }

  /**
   * Open the device gallery to pick an existing photo.
   * Returns the persisted image or null if cancelled/denied.
   */
  async function pickFromGallery(): Promise<CapturedImage | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showPermissionDeniedAlert('galeria');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync(SHARED_OPTIONS);
    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    const persistedUri = await persistImage(asset.uri);

    return {
      uri: persistedUri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize ?? undefined,
    };
  }

  return { takePhoto, pickFromGallery };
}
