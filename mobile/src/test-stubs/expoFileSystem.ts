/**
 * Node-project stand-in for `expo-file-system` (see jest.config.js).
 *
 * The real package ships ESM that the plain ts-jest "node" project does not
 * transform, so any sync suite importing InspectionSyncService (which imports
 * EvidenceUploadClient) failed to load. Tests that exercise uploads mock this
 * module explicitly; reaching this stub at runtime means a test hit the real
 * upload path by accident, so it fails loudly instead of silently passing.
 */
export const UploadType = { BINARY_CONTENT: 0, MULTIPART: 1 } as const;

export class File {
  constructor(public readonly uri: string) {}

  createUploadTask(): never {
    throw new Error('expo-file-system is stubbed in the Jest node project; mock it in the test.');
  }
}
