import { Platform } from 'react-native';

/**
 * Copies a captured image into the app's **persistent** document directory
 * (`documentDirectory/evidences/`) and returns the stable `file://` URI.
 *
 * Why this matters (RN-047 / PBI-044): camera/library results land in a
 * temporary cache directory that the OS may purge at any time. An evidence that
 * still needs to be uploaded must survive offline, so it must live in persistent
 * storage — never in cache. The file is only ever removed *after* the server
 * confirms the upload (APPLIED), never silently.
 *
 * On web, expo-file-system is not available, so the original (blob/temp) URI is
 * returned unchanged.
 */
export async function persistEvidenceFile(tempUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return tempUri;
  }

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
    // If persistence fails we keep the original URI rather than losing the photo.
    return tempUri;
  }
}

/**
 * Whether a persisted evidence file still exists on disk. Used by
 * "Tentar novamente" to confirm the file is present before re-enqueuing the
 * upload (PBI-044: retry reuses the existing file). On web this always returns
 * true (no filesystem check available).
 */
export async function evidenceFileExists(uri?: string): Promise<boolean> {
  if (!uri) return false;
  if (Platform.OS === 'web') return true;

  try {
    const { File } = await import('expo-file-system');
    return new File(uri).exists;
  } catch {
    // If we cannot verify, assume it exists so we never block a legitimate retry.
    return true;
  }
}
