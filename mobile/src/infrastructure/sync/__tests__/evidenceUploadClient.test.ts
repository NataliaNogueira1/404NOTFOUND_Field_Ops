/**
 * Issue #229 — EvidenceUploadClient must follow the REAL backend contract:
 * POST /api/v1/inspections/{id}/evidence (multipart, EvidenceUploadController).
 */

const mockUploadAsync = jest.fn();
const mockCreateUploadTask = jest.fn();

jest.mock('expo-file-system', () => ({
  UploadType: { MULTIPART: 'MULTIPART', BINARY_CONTENT: 'BINARY_CONTENT' },
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    createUploadTask(url: string, options: unknown) {
      mockCreateUploadTask(this.uri, url, options);
      return { uploadAsync: mockUploadAsync };
    }
  },
}));

import { EvidenceUploadClient, extractTemplateItemId } from '../EvidenceUploadClient';
import { deterministicUuid } from '../uuid';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const baseInput = {
  operationId: deterministicUuid('evidence-ev-1'),
  inspectionId: '15',
  itemId: '15::42',
  localUri: 'file:///documents/evidences/photo.jpg',
  capturedAt: '2026-09-22T10:00:00Z',
};

describe('EvidenceUploadClient (issue #229)', () => {
  const client = new EvidenceUploadClient();

  beforeEach(() => {
    mockUploadAsync.mockReset();
    mockCreateUploadTask.mockReset();
    mockUploadAsync.mockResolvedValue({
      status: 201,
      body: JSON.stringify({ id: 1001, checksum: 'abc' }),
      headers: {},
    });
  });

  it('posts multipart to /api/v1/inspections/{id}/evidence with the backend field names', async () => {
    await client.upload('tok', { ...baseInput, description: 'Foto', latitude: -23.5, longitude: -46.6 });

    const [uri, url, options] = mockCreateUploadTask.mock.calls[0];
    expect(uri).toBe(baseInput.localUri);
    expect(url).toMatch(/\/api\/v1\/inspections\/15\/evidence$/);
    expect(options.uploadType).toBe('MULTIPART');
    expect(options.fieldName).toBe('file');
    expect(options.headers.Authorization).toBe('Bearer tok');
    expect(options.parameters).toEqual({
      itemId: '42',
      mimeType: 'image/jpeg',
      description: 'Foto',
      latitude: '-23.5',
      longitude: '-46.6',
      capturedAtDevice: baseInput.capturedAt,
      operationId: baseInput.operationId,
    });
  });

  it('omits latitude/longitude unless both are present (backend both-or-neither rule)', async () => {
    await client.upload('tok', { ...baseInput, latitude: -23.5 });
    const { parameters } = mockCreateUploadTask.mock.calls[0][2];
    expect(parameters).not.toHaveProperty('latitude');
    expect(parameters).not.toHaveProperty('longitude');
  });

  it('derives the mime type from the file extension', async () => {
    await client.upload('tok', { ...baseInput, localUri: 'file:///x/photo.PNG' });
    expect(mockCreateUploadTask.mock.calls[0][2].mimeType).toBe('image/png');
    expect(mockCreateUploadTask.mock.calls[0][2].parameters.mimeType).toBe('image/png');
  });

  it('returns the server evidence id and checksum on 201', async () => {
    const result = await client.upload('tok', baseInput);
    expect(result).toEqual({ status: 'APPLIED', evidenceId: 1001, checksum: 'abc' });
  });

  it('throws on a non-2xx response so the outbox keeps the photo for retry', async () => {
    mockUploadAsync.mockResolvedValue({ status: 422, body: 'not owner', headers: {} });
    await expect(client.upload('tok', baseInput)).rejects.toThrow(/422/);
  });

  it('throws when the upload task yields no response (network failure)', async () => {
    mockUploadAsync.mockResolvedValue(undefined);
    await expect(client.upload('tok', baseInput)).rejects.toThrow(/network/i);
  });

  it('rejects an operationId that is not a UUID before hitting the network', async () => {
    await expect(client.upload('tok', { ...baseInput, operationId: 'evidence-ev-1' })).rejects.toThrow(/UUID/);
    expect(mockCreateUploadTask).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric inspection id before hitting the network', async () => {
    await expect(client.upload('tok', { ...baseInput, inspectionId: 'insp-1' })).rejects.toThrow(/inspection/i);
    expect(mockCreateUploadTask).not.toHaveBeenCalled();
  });
});

describe('extractTemplateItemId', () => {
  it('strips the scope prefix', () => {
    expect(extractTemplateItemId('15::42')).toBe(42);
    expect(extractTemplateItemId('42')).toBe(42);
  });
});

describe('deterministicUuid', () => {
  it('is a v4-shaped UUID, stable per seed and different across seeds', () => {
    expect(deterministicUuid('evidence-a')).toMatch(UUID_RE);
    expect(deterministicUuid('evidence-a')).toBe(deterministicUuid('evidence-a'));
    expect(deterministicUuid('evidence-a')).not.toBe(deterministicUuid('evidence-b'));
  });
});
