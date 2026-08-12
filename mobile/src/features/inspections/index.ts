// Inspections feature — placeholder for future implementation
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Inspection {
  id: string;
  title: string;
  location: string;
  status: InspectionStatus;
  assignedTo: string;
  scheduledAt: string;
  completedAt?: string;
}
