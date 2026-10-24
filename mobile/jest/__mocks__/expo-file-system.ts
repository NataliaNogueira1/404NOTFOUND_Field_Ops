/**
 * Minimal mock of expo-file-system for the "node" Jest project.
 *
 * The node project runs without an Expo runtime, so the native filesystem
 * module cannot be loaded. These stubs only need to satisfy the imports used by
 * the sync/media code under test (File, Directory, Paths, UploadType). The sync
 * tests that exercise uploads mock EvidenceUploadClient directly, so these
 * stubs are never actually called — they just let the modules load.
 */
export enum UploadType {
  BINARY_CONTENT = 0,
  MULTIPART = 1,
}

export class File {
  uri: string;
  exists = false;

  constructor(...segments: unknown[]) {
    this.uri = segments.map(String).join('/');
  }

  async upload(): Promise<{ status: number; body: string; headers: Record<string, string> }> {
    return { status: 200, body: '{}', headers: {} };
  }

  copy(): void {}
}

export class Directory {
  uri: string;
  exists = false;

  constructor(...segments: unknown[]) {
    this.uri = segments.map(String).join('/');
  }

  create(): void {}
}

export const Paths = {
  document: 'file:///documents',
  cache: 'file:///cache',
};
