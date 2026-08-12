// Evidence feature — placeholder for future implementation
export type EvidenceType = 'photo' | 'video' | 'audio' | 'document';

export interface Evidence {
  id: string;
  checklistItemId: string;
  type: EvidenceType;
  uri: string;
  capturedAt: string;
  synced: boolean;
}
