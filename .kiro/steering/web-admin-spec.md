---
inclusion: manual
---

# FieldOps — Especificação Completa da Interface Administrativa Web

## Stack Tecnológico

- **Framework:** React 19 + Vite (function components + hooks)
- **Linguagem:** TypeScript (strict)
- **UI:** Tailwind CSS + componentes locais em `src/components`; ícones com Lucide React; gráficos com Recharts
- **Formulários:** React Hook Form + Zod
- **HTTP:** cliente HTTP compartilhado em `src/api/client.ts` + módulos de domínio em `src/api/`
- **Rotas:** React Router (rotas em `src/routes/AppRoutes.tsx`) + guards de rota
- **Testes:** Vitest + Testing Library
- **Build:** `tsc -b && vite build` (output estático hospedável)

## Mapa de Rotas

```
/login                                    # Login
/app                                      # Layout autenticado (sidebar + header)
├── /dashboard                            # Painel inicial
├── /users                                # Lista de usuários
│   ├── /new                              # Criar usuário
│   └── /:userId/edit                     # Editar usuário
├── /clients                              # Lista de clientes
│   ├── /new                              # Criar cliente
│   ├── /:clientId/edit                   # Editar cliente
│   └── /:clientId/sites                  # Locais do cliente
├── /sites                                # Lista de locais
│   ├── /new                              # Criar local
│   ├── /:siteId/edit                     # Editar local
│   └── /:siteId/equipment               # Equipamentos do local
├── /equipment                            # Lista de equipamentos
│   ├── /new                              # Criar equipamento
│   └── /:equipmentId/edit               # Editar equipamento
├── /inspection-templates                 # Lista de modelos
│   ├── /new                              # Criar modelo
│   ├── /:templateId/edit                 # Editar modelo (construtor)
│   ├── /:templateId/preview              # Prévia do checklist
│   └── /:templateId/versions             # Histórico de versões
├── /inspections                          # Lista de inspeções
│   ├── /new                              # Agendar inspeção
│   ├── /:inspectionId                    # Detalhes
│   └── /:inspectionId/review             # Tela de revisão
├── /non-conformities                     # Lista de NCs
└── /audit                                # Log de auditoria
```

## Layout Principal

```
┌──────────────────────────────────────────────────┐
│ [Logo] FieldOps        [Env badge]  [User] [Sair]│
├────────────┬─────────────────────────────────────┤
│            │                                     │
│ Dashboard  │   [Breadcrumbs]                     │
│ Usuários   │                                     │
│ Clientes   │   ┌─────────────────────────────┐   │
│ Locais     │   │                             │   │
│ Equipam.   │   │     CONTEÚDO PRINCIPAL      │   │
│ Modelos    │   │                             │   │
│ Inspeções  │   │                             │   │
│ NCs        │   │                             │   │
│ Auditoria  │   └─────────────────────────────┘   │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

- Sidebar colapsável
- Menu filtra opções por perfil (Admin vs Supervisor)
- Header com indicador de ambiente (DEV/PROD)
- Toasts para feedback de ações

---

## Telas Detalhadas

### 1. Login (`/login`)

**Campos:**
- E-mail (validação required + email)
- Senha (validação required + minlength 6)
- Botão "Entrar"

**Comportamento:**
- POST /api/v1/auth/login
- Sucesso: salvar tokens (memória ou sessionStorage), redirecionar para /app/dashboard
- Erro: mensagem "Credenciais inválidas" ou "Serviço indisponível"
- Guard: se já autenticado, redirecionar direto

---

### 2. Dashboard (`/app/dashboard`)

**Cards de resumo:**
| Card | Dado | Ação |
|---|---|---|
| Inspeções hoje | Count | Link para lista filtrada |
| Aguardando revisão | Count (badge) | Link para lista filtrada |
| Atrasadas | Count (vermelho) | Link para lista filtrada |
| NCs abertas | Count por criticidade | Link para NCs |

**Atalhos rápidos:**
- "Nova Inspeção" → /inspections/new
- "Revisar Pendentes" → /inspections?status=SUBMITTED

---

### 3. Gerenciamento de Usuários (`/app/users`)

**Lista:**
- Tabela: Nome | E-mail | Perfil | Status | Ações
- Filtros: nome/email (texto), perfil (select), status (select)
- Paginação: 10/25/50 por página (server-side)
- Botão "Novo Usuário"

**Formulário de criação/edição:**
- Nome (required)
- E-mail (required, unique — validar no blur via API)
- Perfil: ADMIN | SUPERVISOR | TECHNICIAN (select)
- Telefone (opcional)
- Status: Ativo | Inativo | Bloqueado
- Botão "Salvar"

**Ações por linha:**
- Editar
- Ativar/Inativar (com confirmação)
- Redefinir senha (envia reset)

---

### 4. Clientes (`/app/clients`)

**Lista:**
- Tabela: Nome | Documento | Status | Locais | Ações
- Filtros: nome (texto), status (select)
- Paginação server-side

**Formulário:**
- Nome (required)
- Razão social (opcional)
- Documento/CNPJ (opcional, validar formato)
- E-mail (opcional)
- Telefone (opcional)
- Status: Ativo | Inativo

---

### 5. Locais (`/app/sites` ou `/app/clients/:id/sites`)

**Lista:**
- Tabela: Nome | Cliente | Cidade/Estado | Equipamentos | Status
- Filtros: cliente (select), nome (texto), status

**Formulário:**
- Cliente (select — obrigatório)
- Nome (required)
- Descrição (opcional)
- Endereço, Cidade, Estado, CEP
- Latitude/Longitude (opcional)
- Contato local: nome + telefone
- Status: Ativo | Inativo

---

### 6. Equipamentos (`/app/equipment` ou `/app/sites/:id/equipment`)

**Lista:**
- Tabela: Nome | Patrimônio | Local | QR Code | Status
- Filtros: local (select), nome (texto), status

**Formulário:**
- Local (select — obrigatório, filtrado por cliente se contextual)
- Nome (required)
- Número patrimonial (opcional)
- Número de série (opcional)
- Fabricante (opcional)
- Modelo (opcional)
- Descrição (opcional)
- QR Code (required, unique — campo texto + opção gerar automático)
- Status: Ativo | Inativo | Descomissionado
- Data de instalação (opcional)

---

### 7. Construtor de Modelos de Inspeção (`/app/inspection-templates/:id/edit`)

**Esta é a tela mais complexa do admin.**

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Modelo: [Título editável]    Categoria: [Select]        │
│ Descrição: [Textarea]        Status: DRAFT              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ Seção 1: Identificação ────────── [↑][↓][✏️][🗑️] ─┐ │
│ │                                                     │ │
│ │  1. Placa de identificação presente?                │ │
│ │     Tipo: CONFORMITY | Obrig: ✅ | Obs falha: ✅    │ │
│ │     [Editar] [Mover ↑↓] [Excluir]                  │ │
│ │                                                     │ │
│ │  2. Número de patrimônio legível?                   │ │
│ │     Tipo: BOOLEAN | Obrig: ✅ | Evid falha: ✅      │ │
│ │     [Editar] [Mover ↑↓] [Excluir]                  │ │
│ │                                                     │ │
│ │  [+ Adicionar item]                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ Seção 2: Condições Físicas ──────── [↑][↓][✏️][🗑️]─┐│
│ │  ...                                                │ │
│ │  [+ Adicionar item]                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ Adicionar seção]                                     │
│                                                         │
│ [Prévia] [Validar] [Publicar versão]                    │
└─────────────────────────────────────────────────────────┘
```

**Formulário de item (modal ou inline):**
- Título/Pergunta (required)
- Descrição/Ajuda (opcional)
- Tipo de resposta (select: TEXT_SHORT, TEXT_LONG, NUMBER, BOOLEAN, CONFORMITY, SINGLE_CHOICE, DATE)
- Se SINGLE_CHOICE: campo para adicionar opções (lista dinâmica)
- Obrigatório (checkbox)
- Observação obrigatória na falha (checkbox)
- Evidência obrigatória na falha (checkbox)

**Ordenação:** botões ↑↓ (MVP). Drag & drop é bônus.

**Validação para publicação:**
- [ ] Título do modelo preenchido
- [ ] Categoria selecionada
- [ ] Ao menos 1 seção
- [ ] Cada seção com ao menos 1 item
- [ ] Cada item com tipo de resposta definido
- [ ] Se SINGLE_CHOICE: ao menos 2 opções

**Botão "Publicar":** confirmação "Ao publicar, a versão não poderá ser alterada. Deseja continuar?" → POST .../publish

---

### 8. Agendamento de Inspeção (`/app/inspections/new`)

**Formulário com selects encadeados:**

```
1. Modelo de inspeção: [Select] → carrega versões
2. Versão: [Select — default: última publicada]
3. Cliente: [Select] → filtra locais
4. Local: [Select — filtrado por cliente] → filtra equipamentos
5. Equipamento: [Select — filtrado por local] (pode ser opcional)
6. Técnico: [Select — somente ativos com role TECHNICIAN]
7. Supervisor: [Select — auto-preenchido com usuário logado]
8. Prioridade: [Select: Baixa | Média | Alta | Crítica]
9. Data prevista: [DatePicker]
10. Instruções: [Textarea]
```

**Botão "Agendar":** validar campos → POST /api/v1/inspections → redirecionar para detalhes

---

### 9. Lista de Inspeções (`/app/inspections`)

**Tabela:**
| Título | Cliente | Local | Técnico | Prioridade | Data | Estado | Ações |
|---|---|---|---|---|---|---|---|

**Filtros:**
- Estado (multi-select)
- Técnico (select)
- Cliente (select)
- Prioridade (select)
- Período (date range)
- Atrasadas (toggle)
- Aguardando revisão (toggle)

**Badges de estado:**
- DRAFT: cinza
- ASSIGNED: azul
- IN_PROGRESS: amarelo
- SUBMITTED: laranja
- UNDER_REVIEW: roxo
- APPROVED: verde
- REJECTED: vermelho
- CANCELED: cinza escuro

**Indicador de atraso:** ícone 🕐 vermelho se scheduled_for < hoje e status ∉ {APPROVED, CANCELED}

---

### 10. Tela de Revisão (`/app/inspections/:id/review`)

**Header:**
```
Inspeção: {título}
Técnico: {nome} | Início: {data} | Conclusão: {data}
Localização: {lat, lon} [Ver no mapa]
Estado: SUBMITTED → [Iniciar Revisão]
```

**Corpo (após iniciar revisão):**
```
┌─ Seção: Identificação ───────────────────────────────┐
│                                                       │
│  Item 1: Placa de identificação presente?             │
│  Resposta: ✅ Conforme                                │
│  Observação: "Placa legível e fixada"                 │
│  Evidências: [📷 thumb1] [📷 thumb2]                  │
│                                                       │
│  Item 2: Cabo elétrico íntegro?                       │
│  Resposta: ❌ Não Conforme                            │
│  Observação: "Desgaste na cobertura"                  │
│  Evidências: [📷 thumb3]                              │
│  ⚠️ Não conformidade: "Cabo danificado" (CRITICAL)   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Galeria de fotos:** ao clicar no thumbnail, abre lightbox com zoom

**Painel de não conformidades:**
- Tabela: Título | Item | Criticidade | Evidências
- Cada NC expansível com descrição completa

**Ações finais:**
- Botão "Aprovar" (verde) → confirmação modal → POST .../approve
- Botão "Reprovar" (vermelho) → abre formulário:
  - Motivo (textarea, required, min 10 chars)
  - Itens para correção (checkboxes dos itens)
  - Botão "Confirmar reprovação" → POST .../reject

---

### 11. Não Conformidades (`/app/non-conformities`)

**Tabela:**
| Título | Inspeção | Item | Criticidade | Status | Data |

**Filtros:** criticidade, status, período, cliente
**Detalhe:** expandir inline ou navegar para inspeção

---

### 12. Auditoria (`/app/audit`)

**Tabela (somente leitura):**
| Data | Usuário | Ação | Entidade | ID |

**Filtros:** ação, entidade, usuário, período
**P1:** Detalhe com valores anterior e novo

---

## Componentes Reutilizáveis (`src/components`)

| Componente | Uso |
|---|---|
| `DataTable` | Tabela com paginação, sort, seleção |
| `Filters` | Barra de filtros com chips |
| `StatusBadge` | Badge colorido por estado |
| `PriorityBadge` | Badge por prioridade |
| `ConfirmDialog` | Modal de confirmação (`role="dialog"`, título e ação de fechar) |
| `LoadingState` | Spinner centralizado |
| `EmptyState` | Ilustração + mensagem quando lista vazia |
| `ErrorState` | Mensagem de erro + retry |
| `FormField` | Wrapper com label + erro + hint |
| `PageHeader` | Título + breadcrumbs + ações |

---

## Cliente HTTP e tratamento de erros (`src/api/client.ts`)

Todas as chamadas passam pelo cliente HTTP compartilhado (nada de `fetch` direto em
páginas/componentes) e por módulos de domínio em `src/api/`.

### Autenticação
- Adiciona `Authorization: Bearer {token}` em toda request.
- Se 401: tenta refresh token → se falhar, redireciona para /login.

### Tratamento de erros (por status)
- 400: mostrar fieldErrors no formulário
- 403: toast "Sem permissão para esta ação"
- 404: toast "Recurso não encontrado"
- 409: toast "Conflito: o registro foi alterado por outro usuário"
- 422: mostrar mensagem de regra de negócio
- 500: toast "Erro interno. Tente novamente."

> Nunca exponha stack traces, segredos, tokens ou detalhes internos do servidor;
> mensagens ao usuário em português e acionáveis.

---

## Guards de rota (React Router)

Guards protegem autenticação e acesso por perfil — esconder um botão não é autorização;
o backend continua sendo a fonte de verdade das permissões.

| Guard | Rota | Lógica |
|---|---|---|
| Guard de autenticação | /app/** | Verificar token válido, redirecionar para /login se inválido |
| Guard de perfil (`ADMIN`) | /app/users | Apenas ADMIN |
| Guard de perfil (`ADMIN`, `SUPERVISOR`) | /app/inspections | ADMIN ou SUPERVISOR |

---

## Escopo Mínimo do Web Admin (Checklist)

- [ ] Login/logout com sessão
- [ ] Layout com sidebar e rotas protegidas
- [ ] CRUD de usuários (Admin)
- [ ] CRUD de clientes
- [ ] CRUD de locais (vinculado a cliente)
- [ ] CRUD de equipamentos (vinculado a local, com QR Code)
- [ ] Construtor de modelos (seções + itens + tipos)
- [ ] Prévia do checklist
- [ ] Publicação de versão
- [ ] Agendamento de inspeção (selects encadeados)
- [ ] Lista de inspeções com filtros
- [ ] Detalhes da inspeção sincronizada
- [ ] Visualização de respostas por item
- [ ] Visualização de fotos vinculadas
- [ ] Visualização de não conformidades
- [ ] Iniciar revisão
- [ ] Aprovar inspeção
- [ ] Reprovar com motivo obrigatório
- [ ] Paginação server-side em todas as listas
- [ ] Estados: carregamento, vazio, erro
- [ ] Responsivo para notebook (min 1280px)
