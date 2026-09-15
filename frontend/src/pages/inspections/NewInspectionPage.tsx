import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminCatalogApi, type InspectionTemplateVersion, type TemplateSummary } from '@/api/adminCatalog'
import { ClientStatus, clientsApi } from '@/api/clients'
import { EquipmentStatus, equipmentApi } from '@/api/equipment'
import { InspectionSiteStatus, sitesApi } from '@/api/sites'
import { usersApi } from '@/api/users'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { clients, equipment, sites, users } from '@/mocks/domain'
import { Priority, UserRole, UserStatus } from '@/types/domain'

function formatVersionLabel(v: InspectionTemplateVersion): string {
  const date = new Date(v.publishedAt).toLocaleDateString('pt-BR')
  return `Versão ${v.versionNumber} (publicada em ${date})`
}

export function NewInspectionPage() {
  const navigate = useNavigate()

  // ── Template & version ─────────────────────────────────────────────────────
  const [availableTemplates, setAvailableTemplates] = useState<TemplateSummary[]>([])
  const [templateId, setTemplateId] = useState('')
  const [availableVersions, setAvailableVersions] = useState<InspectionTemplateVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<InspectionTemplateVersion | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [versionsLoading, setVersionsLoading] = useState(false)

  // ── Location ───────────────────────────────────────────────────────────────
  const [selectableClients, setSelectableClients] = useState(
    clients.filter((c) => c.active).map((c) => ({ id: c.id, name: c.name })),
  )
  const [clientId, setClientId] = useState('')
  const [availableSites, setAvailableSites] = useState<{ id: string; clientId: string; name: string }[]>([])
  const [siteId, setSiteId] = useState('')
  const [availableEquipment, setAvailableEquipment] = useState<{ id: string; siteId: string; name: string }[]>([])
  const [equipmentId, setEquipmentId] = useState('')
  const [equipmentName, setEquipmentName] = useState('')
  const [clientsLoading, setClientsLoading] = useState(true)
  const [sitesLoading, setSitesLoading] = useState(false)
  const [equipmentLoading, setEquipmentLoading] = useState(false)

  // ── Assignment ─────────────────────────────────────────────────────────────
  const [technicians, setTechnicians] = useState(
    users.filter((u) => u.role === UserRole.TECHNICIAN && u.active).map((u) => ({ id: String(u.id), name: u.name })),
  )
  const [techniciansLoading, setTechniciansLoading] = useState(true)
  const [technicianId, setTechnicianId] = useState('')
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [dueDate, setDueDate] = useState('')

  // ── Instructions & UI state ────────────────────────────────────────────────
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(false)

  // ── Load active templates on mount ─────────────────────────────────────────
  useEffect(() => {
    adminCatalogApi
      .listTemplates({ name: '', status: 'ACTIVE', page: 0, size: 100, sort: 'title,asc' })
      .then((result) => {
        setAvailableTemplates(result.content)
        if (result.content.length > 0) {
          setTemplateId(result.content[0].id)
        }
      })
      .catch(() => {
        /* Templates failed to load — user will see empty select */
      })
      .finally(() => setTemplatesLoading(false))
  }, [])

  // ── Load versions when template changes ────────────────────────────────────
  useEffect(() => {
    // Reset synchronously outside the effect body (via the loader) to avoid cascading
    // renders flagged by react-hooks/set-state-in-effect.
    async function loadVersions() {
      if (!templateId) {
        setAvailableVersions([])
        setSelectedVersion(null)
        return
      }
      setVersionsLoading(true)
      try {
        const versions = await adminCatalogApi.listTemplateVersions(templateId)
        setAvailableVersions(versions)
        // Default to the latest (only) published version
        setSelectedVersion(versions.length > 0 ? versions[versions.length - 1] : null)
      } catch {
        setAvailableVersions([])
        setSelectedVersion(null)
      } finally {
        setVersionsLoading(false)
      }
    }
    void loadVersions()
  }, [templateId])

  // ── Load active clients on mount ───────────────────────────────────────────
  useEffect(() => {
    clientsApi
      .list({ name: '', status: ClientStatus.ACTIVE, page: 0, size: 100 })
      .then((result) => setSelectableClients(result.content.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {
        /* Keep mock fallback */
      })
      .finally(() => setClientsLoading(false))
  }, [])

  // ── Load sites when client changes ─────────────────────────────────────────
  useEffect(() => {
    if (!clientId) {
      return
    }
    sitesApi
      .list({ name: '', clientId, status: InspectionSiteStatus.ACTIVE, page: 0, size: 100 })
      .then((result) =>
        setAvailableSites(result.content.map((s) => ({ id: s.id, clientId: s.clientId, name: s.name }))),
      )
      .catch(() =>
        setAvailableSites(
          sites
            .filter((s) => s.active && s.clientId === clientId)
            .map((s) => ({ id: s.id, clientId: s.clientId, name: s.name })),
        ),
      )
      .finally(() => setSitesLoading(false))
  }, [clientId])

  // ── Load equipment when site changes ───────────────────────────────────────
  useEffect(() => {
    if (!siteId) {
      return
    }
    equipmentApi
      .list({ siteId, status: EquipmentStatus.ACTIVE, page: 0, size: 100 })
      .then((result) =>
        setAvailableEquipment(result.content.map((e) => ({ id: e.id, siteId: e.siteId, name: e.name }))),
      )
      .catch(() =>
        setAvailableEquipment(
          equipment
            .filter((e) => e.active && e.siteId === siteId)
            .map((e) => ({ id: e.id, siteId: e.siteId, name: e.name })),
        ),
      )
      .finally(() => setEquipmentLoading(false))
  }, [siteId])

  // ── Load active technicians on mount ──────────────────────────────────────
  useEffect(() => {
    usersApi
      .list({ name: '', role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE, page: 0, size: 100, sort: 'name,asc' })
      .then((result) => setTechnicians(result.content.map((u) => ({ id: String(u.id), name: u.name }))))
      .catch(() => {
        /* Keep mock fallback */
      })
      .finally(() => setTechniciansLoading(false))
  }, [])

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function submit() {
    if (!templateId || !selectedVersion || !clientId || !siteId || !technicianId || !dueDate) {
      setError('Preencha modelo, versão, cliente, local, técnico e data prevista.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const templateTitle = availableTemplates.find((t) => t.id === templateId)?.title ?? 'Inspeção'
      const siteName = availableSites.find((site) => site.id === siteId)?.name ?? 'local selecionado'
      const titleSuffix = equipmentName || siteName
      const title = `${templateTitle} — ${titleSuffix}`.slice(0, 300)
      const request = {
        title,
        templateVersionId: Number(selectedVersion.id),
        clientId: Number(clientId),
        siteId: Number(siteId),
        technicianId: Number(technicianId),
        priority,
        dueDate,
        supervisorInstructions: instructions || undefined,
        ...(equipmentId ? { equipmentId: Number(equipmentId) } : {}),
      }
      await adminCatalogApi.createInspection(request)
      setToast(true)
      setTimeout(() => navigate('/app/inspections'), 700)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao agendar inspeção. Tente novamente.'
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nova inspeção" description="Agende uma atividade para execução em campo." />

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        {/* ── Modelo ──────────────────────────────────────────────────────── */}
        <Card className="grid gap-4 p-5 md:grid-cols-2">
          <h2 className="md:col-span-2 text-base font-semibold">Modelo</h2>

          <Select
            label="Modelo de inspeção"
            id="new-template"
            value={templateId}
            disabled={templatesLoading}
            onChange={(e) => {
              setTemplateId(e.target.value)
              setError('')
            }}
          >
            {templatesLoading ? (
              <option>Carregando...</option>
            ) : availableTemplates.length === 0 ? (
              <option value="">Nenhum resultado</option>
            ) : (
              availableTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))
            )}
          </Select>

          <Select
            label="Versão"
            id="new-version"
            value={selectedVersion?.id ?? ''}
            disabled={versionsLoading || availableVersions.length === 0}
            onChange={(e) => {
              const id = e.target.value
              setSelectedVersion(availableVersions.find((v) => v.id === id) ?? null)
            }}
          >
            {versionsLoading ? (
              <option>Carregando...</option>
            ) : availableVersions.length === 0 ? (
              <option value="">Nenhum resultado</option>
            ) : (
              availableVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVersionLabel(v)}
                </option>
              ))
            )}
          </Select>
        </Card>

        {/* ── Local ───────────────────────────────────────────────────────── */}
        <Card className="grid gap-4 p-5 md:grid-cols-3">
          <h2 className="md:col-span-3 text-base font-semibold">Local</h2>

          <Select
            label="Cliente"
            id="new-client"
            value={clientId}
            disabled={clientsLoading}
            onChange={(e) => {
              const id = e.target.value
              setClientId(id)
              setAvailableSites([])
              setAvailableEquipment([])
              setSitesLoading(Boolean(id))
              setEquipmentLoading(false)
              setSiteId('')
              setEquipmentId('')
              setEquipmentName('')
              setError('')
            }}
          >
            <option value="">{clientsLoading ? 'Carregando clientes...' : 'Selecione'}</option>
            {!clientsLoading && selectableClients.length === 0 && (
              <option value="" disabled>
                Nenhum resultado
              </option>
            )}
            {!clientsLoading &&
              selectableClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>

          <Select
            label="Local"
            id="new-site"
            value={siteId}
            disabled={!clientId || sitesLoading}
            onChange={(e) => {
              const id = e.target.value
              setSiteId(id)
              setAvailableEquipment([])
              setEquipmentLoading(Boolean(id))
              setEquipmentId('')
              setEquipmentName('')
              setError('')
            }}
          >
            <option value="">{sitesLoading ? 'Carregando locais...' : 'Selecione'}</option>
            {clientId && !sitesLoading && availableSites.length === 0 && (
              <option value="" disabled>
                Nenhum resultado
              </option>
            )}
            {!sitesLoading &&
              availableSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </Select>

          <Select
            label="Equipamento"
            id="new-equipment"
            value={equipmentId}
            disabled={!siteId || equipmentLoading}
            onChange={(e) => {
              const id = e.target.value
              const name = availableEquipment.find((eq) => eq.id === id)?.name ?? ''
              setEquipmentId(id)
              setEquipmentName(name)
              setError('')
            }}
          >
            <option value="">{equipmentLoading ? 'Carregando equipamentos...' : 'Sem equipamento'}</option>
            {siteId && !equipmentLoading && availableEquipment.length === 0 && (
              <option value="" disabled>
                Nenhum resultado
              </option>
            )}
            {!equipmentLoading &&
              availableEquipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
          </Select>
        </Card>

        {/* ── Atribuição ──────────────────────────────────────────────────── */}
        <Card className="grid gap-4 p-5 md:grid-cols-3">
          <h2 className="md:col-span-3 text-base font-semibold">Atribuição</h2>

          <Select
            label="Técnico"
            id="new-tech"
            value={technicianId}
            disabled={techniciansLoading}
            onChange={(e) => {
              setTechnicianId(e.target.value)
              setError('')
            }}
          >
            <option value="">{techniciansLoading ? 'Carregando técnicos...' : 'Selecione'}</option>
            {!techniciansLoading && technicians.length === 0 && (
              <option value="" disabled>
                Nenhum resultado
              </option>
            )}
            {!techniciansLoading &&
              technicians.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </Select>

          <Select
            label="Prioridade"
            id="new-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {Object.values(Priority).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>

          <Input
            label="Data prevista"
            id="new-date"
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value)
              setError('')
            }}
          />
        </Card>

        {/* ── Instruções ──────────────────────────────────────────────────── */}
        <Card className="p-5">
          <Textarea
            label="Instruções do supervisor"
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Orientações para o técnico"
          />
        </Card>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/app/inspections')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Agendando...' : 'Agendar inspeção'}
          </Button>
        </div>
      </form>

      <Toast show={toast} message="Inspeção agendada com sucesso" />
    </div>
  )
}
