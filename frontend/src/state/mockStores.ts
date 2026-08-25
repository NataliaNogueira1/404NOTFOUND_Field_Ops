import { inspections as adminSeed } from '@/mocks/domain'
import { technicianInspections as technicianSeed } from '@/mocks/technician'
import type { Inspection, InspectionTemplate } from '@/types/domain'
import { InspectionStatus } from '@/types/domain'

type Listener = () => void

let adminInspections: Inspection[] = [...adminSeed]
let technicianInspections: Inspection[] = [...technicianSeed]
const inspectionListeners = new Set<Listener>()
const templateDrafts = new Map<string, InspectionTemplate>()

function emitInspections() {
  inspectionListeners.forEach(listener => listener())
}

export const inspectionStore = {
  subscribe(listener: Listener) {
    inspectionListeners.add(listener)
    return () => { inspectionListeners.delete(listener) }
  },
  adminSnapshot() {
    return adminInspections
  },
  technicianSnapshot() {
    return technicianInspections
  },
  addAdmin(inspection: Inspection) {
    adminInspections = [inspection, ...adminInspections]
    emitInspections()
  },
  cancel(id: string) {
    const cancelOne = (inspection: Inspection) => inspection.id === id ? { ...inspection, status: InspectionStatus.CANCELED, progress: 0 } : inspection
    adminInspections = adminInspections.map(cancelOne)
    technicianInspections = technicianInspections.map(cancelOne)
    emitInspections()
  },
}

export const templateDraftStore = {
  set(template: InspectionTemplate) {
    templateDrafts.set(template.id, template)
  },
  get(id: string) {
    return templateDrafts.get(id)
  },
}
