---
inclusion: manual
---

# FieldOps — Modelo de Dados

## Entidades Principais

| Entidade | Responsabilidade |
|---|---|
| User | Usuários, perfis e responsáveis pelas ações |
| Client | Organização atendida |
| InspectionSite | Local onde a inspeção ocorre |
| Equipment | Ativo físico inspecionado |
| InspectionTemplate | Identidade lógica do checklist (reutilizável) |
| InspectionTemplateVersion | Publicação imutável do modelo |
| TemplateSection | Grupos de itens na versão |
| TemplateItem | Perguntas, verificações e regras |
| Inspection | Execução agendada do checklist |
| InspectionItemSnapshot | Cópia dos itens usados na execução |
| InspectionResponse | Resposta do técnico a um item |
| Evidence | Metadados de fotografias/arquivos |
| NonConformity | Problemas encontrados |
| InspectionReview | Ciclos de revisão e decisões |
| AuditEvent | Ações e mudanças relevantes |
| SyncOperation | Operações pendentes na outbox (local) |
| SyncMetadata | Estado geral da sincronização (local) |

## Diagrama Conceitual

```
USER
 ├── cria/agenda ── N INSPECTION
 ├── executa ───── N INSPECTION
 ├── revisa ────── N INSPECTION_REVIEW
 └── realiza ───── N AUDIT_EVENT

CLIENT 1 ── N INSPECTION_SITE
INSPECTION_SITE 1 ── 0..N EQUIPMENT

INSPECTION_TEMPLATE 1 ── N INSPECTION_TEMPLATE_VERSION
INSPECTION_TEMPLATE_VERSION 1 ── N TEMPLATE_SECTION
TEMPLATE_SECTION 1 ── N TEMPLATE_ITEM

INSPECTION_TEMPLATE_VERSION 1 ── N INSPECTION
CLIENT 1 ── N INSPECTION
INSPECTION_SITE 1 ── N INSPECTION
EQUIPMENT 1 ── 0..N INSPECTION
USER 1 ── N INSPECTION

INSPECTION 1 ── N INSPECTION_ITEM_SNAPSHOT
INSPECTION_ITEM_SNAPSHOT 1 ── 0..1 INSPECTION_RESPONSE
INSPECTION_RESPONSE 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N NON_CONFORMITY
NON_CONFORMITY 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N INSPECTION_REVIEW
INSPECTION 1 ── N AUDIT_EVENT
```

## User

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| name | string | Obrigatório |
| email | string | Obrigatório, único |
| password_hash | string | Nunca exposto pela API |
| role | enum | ADMIN, SUPERVISOR, TECHNICIAN, CLIENT_VIEWER |
| status | enum | ACTIVE, INACTIVE, BLOCKED |
| phone | string | Opcional |
| created_at | datetime | Servidor |
| updated_at | datetime | Servidor |
| version | integer | Controle otimista |

## Client

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| name | string | Obrigatório |
| legal_name | string | Opcional |
| document | string | Opcional, validado |
| email | string | Opcional |
| phone | string | Opcional |
| status | enum | ACTIVE, INACTIVE |
| created_at | datetime | Servidor |
| updated_at | datetime | Servidor |
| version | integer | Controle otimista |

## InspectionSite

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| client_id | UUID | FK obrigatório |
| name | string | Obrigatório |
| description | string | Opcional |
| address_line | string | Endereço |
| city | string | Cidade |
| state | string | Estado |
| postal_code | string | CEP |
| latitude | decimal | Opcional |
| longitude | decimal | Opcional |
| contact_name | string | Opcional |
| contact_phone | string | Opcional |
| status | enum | ACTIVE, INACTIVE |
| created_at/updated_at | datetime | Auditoria |
| version | integer | Controle otimista |

## Equipment

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| site_id | UUID | FK obrigatório |
| name | string | Obrigatório |
| asset_number | string | Opcional |
| serial_number | string | Opcional |
| manufacturer | string | Opcional |
| model | string | Opcional |
| description | string | Opcional |
| qr_code | string | Único |
| status | enum | ACTIVE, INACTIVE, DECOMMISSIONED |
| installed_at | date | Opcional |
| created_at/updated_at | datetime | Auditoria |
| version | integer | Controle otimista |

## InspectionTemplate

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| title | string | Obrigatório |
| description | string | Opcional |
| category | string | Obrigatório |
| status | enum | DRAFT, ACTIVE, INACTIVE |
| current_version | integer | Última versão publicada |
| created_by | UUID | Usuário criador |
| created_at/updated_at | datetime | Auditoria |
| version | integer | Controle otimista |

## InspectionTemplateVersion

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| template_id | UUID | FK |
| version_number | integer | Sequencial por modelo |
| title_snapshot | string | Preservado |
| description_snapshot | string | Preservado |
| published_by | UUID | Responsável |
| published_at | datetime | Data publicação |
| active_for_new_inspections | boolean | Permite novos agendamentos |
| created_at | datetime | Auditoria |

## TemplateSection

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| template_version_id | UUID | FK |
| title | string | Obrigatório |
| description | string | Opcional |
| display_order | integer | Ordem explícita |
| created_at | datetime | Auditoria |

## TemplateItem

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| section_id | UUID | FK |
| code | string | Código legível opcional |
| title | string | Pergunta/instrução |
| description | string | Texto ajuda |
| response_type | enum | TEXT_SHORT, TEXT_LONG, NUMBER, BOOLEAN, CONFORMITY, SINGLE_CHOICE, DATE |
| required | boolean | Obrigatoriedade |
| observation_required_on_failure | boolean | Exige observação |
| evidence_required_on_failure | boolean | Exige evidência |
| options_json | JSON | Alternativas/configurações |
| display_order | integer | Ordem |
| created_at | datetime | Auditoria |

## Inspection

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| template_version_id | UUID | FK |
| client_id | UUID | FK |
| site_id | UUID | FK |
| equipment_id | UUID | Opcional |
| technician_id | UUID | FK |
| supervisor_id | UUID | FK |
| created_by | UUID | Quem agendou |
| title | string | Nome |
| instructions | string | Orientações |
| priority | enum | LOW, MEDIUM, HIGH, CRITICAL |
| status | enum | DRAFT, ASSIGNED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELED |
| scheduled_for | datetime | Data prevista |
| started_at_device | datetime | Horário dispositivo |
| started_at_server | datetime | Horário servidor |
| completed_at_device | datetime | Horário dispositivo |
| submitted_at_server | datetime | Confirmado servidor |
| approved_at | datetime | Data aprovação |
| canceled_at | datetime | Data cancelamento |
| canceled_by | UUID | Quem cancelou |
| canceled_reason | string | Obrigatório |
| created_at/updated_at | datetime | Auditoria |
| version | integer | Controle otimista |

## InspectionItemSnapshot

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| inspection_id | UUID | FK |
| source_template_item_id | UUID | Referência histórica |
| section_title | string | Preservado |
| section_order | integer | Preservado |
| item_code | string | Preservado |
| item_title | string | Preservado |
| item_description | string | Preservado |
| response_type | enum | Preservado |
| required | boolean | Preservado |
| rules_json | JSON | Regras preservadas |
| options_json | JSON | Alternativas preservadas |
| item_order | integer | Preservado |
| created_at | datetime | Criação do snapshot |

## InspectionResponse

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | Gerável no dispositivo |
| inspection_id | UUID | FK |
| inspection_item_id | UUID | FK (UNIQUE) |
| value_text | string | Valor textual |
| value_number | decimal | Valor numérico |
| value_boolean | boolean | Valor lógico |
| value_date | date | Data |
| value_json | JSON | Seleções |
| observation | string | Comentário |
| conformity | enum | NOT_APPLICABLE, CONFORMING, NON_CONFORMING |
| answered_by | UUID | Técnico |
| answered_at_device | datetime | Dispositivo |
| server_received_at | datetime | Servidor |
| created_at/updated_at | datetime | Auditoria |
| version | integer | Controle otimista |

## Evidence

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | Gerável no dispositivo |
| inspection_id | UUID | Obrigatório |
| response_id | UUID | Opcional |
| non_conformity_id | UUID | Opcional |
| type | enum | PHOTO (MVP) |
| storage_key | string | Referência no storage |
| local_uri | string | Somente banco local |
| mime_type | string | Validado |
| size_bytes | long | Tamanho |
| checksum | string | Integridade |
| description | string | Opcional |
| latitude/longitude | decimal | Opcional |
| captured_at_device | datetime | Captura |
| server_received_at | datetime | Recebimento |
| uploaded_at | datetime | Confirmação upload |
| created_by | UUID | Técnico |
| created_at | datetime | Auditoria |

## NonConformity

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | Gerável no dispositivo |
| inspection_id | UUID | Obrigatório |
| inspection_item_id | UUID | Opcional |
| response_id | UUID | Opcional |
| title | string | Obrigatório |
| description | string | Obrigatório |
| severity | enum | LOW, MEDIUM, HIGH, CRITICAL |
| status | enum | OPEN (MVP) |
| created_by | UUID | Técnico |
| created_at_device | datetime | Campo |
| server_received_at | datetime | Recebimento |
| created_at/updated_at | datetime | Auditoria |
| version | integer | Controle otimista |

## InspectionReview

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| inspection_id | UUID | FK |
| reviewer_id | UUID | Supervisor |
| decision | enum | APPROVED, REJECTED |
| reason | string | Obrigatório na reprovação |
| comments | string | Opcional |
| reviewed_at | datetime | Servidor |
| review_cycle | integer | Número da rodada |
| created_at | datetime | Auditoria |

## AuditEvent

| Campo | Tipo | Regra |
|---|---|---|
| id | UUID | PK |
| inspection_id | UUID | Quando aplicável |
| actor_id | UUID | Usuário |
| action | string | Ação realizada |
| entity_type | string | Tipo afetado |
| entity_id | UUID | ID afetado |
| occurred_at | datetime | Servidor |
| device_occurred_at | datetime | Dispositivo |
| previous_value_json | JSON | Estado anterior |
| new_value_json | JSON | Novo estado |
| metadata_json | JSON | Metadados |
| request_id | string | Correlação |

## Índices Recomendados

- User: UNIQUE(email), INDEX(status, role)
- Equipment: UNIQUE(qr_code), INDEX(site_id, status)
- Inspection: INDEX(technician_id, status), INDEX(supervisor_id, status), INDEX(client_id), INDEX(scheduled_for), INDEX(status, scheduled_for)
- InspectionItemSnapshot: INDEX(inspection_id, section_order, item_order)
- InspectionResponse: UNIQUE(inspection_item_id), INDEX(inspection_id)
- Evidence: INDEX(inspection_id), INDEX(response_id)
- NonConformity: INDEX(inspection_id), INDEX(severity)
- AuditEvent: INDEX(entity_type, entity_id), INDEX(inspection_id), INDEX(occurred_at)
