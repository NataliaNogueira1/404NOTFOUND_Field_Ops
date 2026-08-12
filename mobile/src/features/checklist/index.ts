// Checklist feature — placeholder for future implementation
export type ChecklistItemStatus = 'unchecked' | 'ok' | 'nok' | 'na';

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistItemStatus;
  notes?: string;
  evidenceIds?: string[];
}

export interface Checklist {
  id: string;
  inspectionId: string;
  items: ChecklistItem[];
}
