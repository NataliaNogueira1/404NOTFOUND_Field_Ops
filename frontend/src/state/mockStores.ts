import { inspections as adminSeed } from '@/mocks/domain'
import { technicianInspections as technicianSeed } from '@/mocks/technician'
import type { Inspection, InspectionTemplate } from '@/types/domain'
import { InspectionStatus } from '@/types/domain'

type Listener = () => void

let adminInspections: Inspection[] = [...adminSeed]
let technicianInspections: Inspection[] = [...technicianSeed]
const inspectionListeners = new Set<Listener>()
const templateListeners = new Set<Listener>()
const templateDrafts = new Map<string, InspectionTemplate>()
let templateRows: InspectionTemplate[] = []

function emitInspections() {
  inspectionListeners.forEach(listener => listener())
}

function emitTemplates() {
  templateListeners.forEach(listener => listener())
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
  subscribe(listener: Listener) {
    templateListeners.add(listener)
    return () => { templateListeners.delete(listener) }
  },
  snapshot() {
    return templateRows
  },
  set(template: InspectionTemplate) {
    templateDrafts.set(template.id, template)
    templateRows = [template, ...templateRows.filter(item => item.id !== template.id)]
    emitTemplates()
  },
  get(id: string) {
    return templateDrafts.get(id)
  },
  createBlank() {
    const id = `tpl-draft-${Date.now()}`
    const template: InspectionTemplate = {
      id,
      title: '',
      category: '',
      description: '',
      version: 1,
      status: 'Rascunho',
      sections: [],
    }
    this.set(template)
    return template
  },
}
