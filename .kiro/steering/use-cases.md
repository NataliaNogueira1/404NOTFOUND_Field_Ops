---
inclusion: manual
---

# FieldOps — Casos de Uso Detalhados

## Catálogo Resumido

| ID | Caso de uso | Ator | Canal | Prioridade |
|---|---|---|---|---|
| UC-01 | Autenticar usuário | Todos | Mobile/Web | P0 |
| UC-02 | Gerenciar usuários | Administrador | Web | P0 |
| UC-03 | Gerenciar clientes, locais e equipamentos | Admin/Supervisor | Web | P0 |
| UC-04 | Criar modelo de inspeção | Supervisor | Web | P0 |
| UC-05 | Publicar versão do modelo | Supervisor | Web | P0 |
| UC-06 | Agendar e atribuir inspeção | Supervisor | Web | P0 |
| UC-07 | Baixar inspeções atribuídas | Técnico | Mobile | P0 |
| UC-08 | Identificar equipamento por QR Code | Técnico | Mobile | P0 |
| UC-09 | Iniciar inspeção | Técnico | Mobile | P0 |
| UC-10 | Responder checklist | Técnico | Mobile | P0 |
| UC-11 | Registrar evidência | Técnico | Mobile | P0 |
| UC-12 | Registrar não conformidade | Técnico | Mobile | P0 |
| UC-13 | Concluir inspeção offline | Técnico | Mobile | P0 |
| UC-14 | Sincronizar alterações | Técnico/Sistema | Mobile/API | P0 |
| UC-15 | Acompanhar inspeções | Supervisor | Web | P0 |
| UC-16 | Revisar inspeção | Supervisor | Web | P0 |
| UC-17 | Aprovar ou reprovar inspeção | Supervisor | Web | P0 |
| UC-18 | Consultar histórico | Admin/Supervisor | Web | P1 |
| UC-19 | Consultar indicadores | Supervisor | Web | P1 |
| UC-20 | Consultar resultado como cliente | Cliente | Web | P2 |

---

## UC-01 — Autenticar Usuário

**Ator:** qualquer usuário ativo
**Pré-condições:** usuário cadastrado e ativo
**Gatilho:** usuário informa credenciais

### Fluxo principal
1. Usuário informa e-mail e senha
2. Aplicação valida formato dos campos (client-side)
3. Aplicação envia POST /api/v1/auth/login
4. API valida usuário e senha (bcrypt)
5. API retorna accessToken, refreshToken, expiresIn e dados do perfil
6. Aplicação armazena sessão (Secure Store no mobile, memória no web)
7. Usuário é direcionado à área autorizada

### Fluxos alternativos
- **Credenciais inválidas:** mensagem genérica "E-mail ou senha incorretos", sem revelar qual campo está errado
- **Usuário inativo:** "Sua conta está inativa. Entre em contato com a administração."
- **Falha de rede (mobile):** permitir acesso offline se existir sessão válida local e dados já baixados
- **Token expirado:** POST /api/v1/auth/refresh com refreshToken; se falhar, redirecionar para login

### Pós-condições
- Sessão válida criada; ou
- Acesso negado sem alteração de dados

---

## UC-04 — Criar Modelo de Inspeção

**Ator:** supervisor
**Pré-condições:** autenticado com role SUPERVISOR ou ADMIN
**Gatilho:** precisa padronizar um tipo de inspeção

### Fluxo principal
1. Supervisor clica em "Novo Modelo"
2. Informa título (obrigatório), descrição e categoria (obrigatório)
3. Modelo é criado em estado DRAFT via POST /api/v1/inspection-templates
4. Supervisor cria seções (POST .../sections) com título e ordem
5. Dentro de cada seção, cria itens (POST .../items) com:
   - título (pergunta)
   - tipo de resposta (TEXT_SHORT, TEXT_LONG, NUMBER, BOOLEAN, CONFORMITY, SINGLE_CHOICE, DATE)
   - obrigatório (sim/não)
   - observação obrigatória na falha (sim/não)
   - evidência obrigatória na falha (sim/não)
   - opções (para SINGLE_CHOICE)
   - ordem
6. Supervisor reordena seções e itens conforme necessidade
7. Supervisor visualiza prévia do checklist
8. Supervisor valida que não existem pendências
9. Supervisor publica via POST .../publish → cria InspectionTemplateVersion imutável

### Fluxos alternativos
- **Modelo sem itens:** publicação bloqueada com mensagem "Adicione ao menos um item"
- **Item sem tipo de resposta:** publicação bloqueada com mensagem indicando o item
- **Modelo já utilizado em inspeções:** alterações geram nova versão, inspeções existentes preservam snapshot da versão anterior

### Pós-condições
- Versão imutável disponível para novos agendamentos
- Versões anteriores preservadas

---

## UC-06 — Agendar e Atribuir Inspeção

**Ator:** supervisor
**Pré-condições:** modelo publicado, cliente/local/equipamento/técnico cadastrados e ativos
**Gatilho:** necessidade de executar inspeção

### Fluxo principal
1. Supervisor seleciona modelo publicado (dropdown com versão)
2. Seleciona cliente (dropdown)
3. Seleciona local **filtrado pelo cliente** (dropdown encadeado)
4. Seleciona equipamento **filtrado pelo local** (dropdown encadeado, pode ser opcional)
5. Seleciona técnico ativo (dropdown)
6. Define prioridade: LOW, MEDIUM, HIGH, CRITICAL
7. Define data prevista
8. Informa orientações adicionais (texto livre)
9. Confirma via POST /api/v1/inspections
10. API valida todos os vínculos
11. API cria a inspeção em estado ASSIGNED
12. API cria InspectionItemSnapshot (cópia de todos os itens da versão)
13. Inspeção fica disponível para sincronização pelo técnico

### Fluxos alternativos
- **Técnico inativo:** operação bloqueada "Selecione um técnico ativo"
- **Modelo sem versão publicada:** operação bloqueada
- **Equipamento de outro local:** operação bloqueada

### Pós-condições
- Inspeção criada em ASSIGNED com snapshot completo

---

## UC-09 — Iniciar Inspeção

**Ator:** técnico
**Pré-condições:** inspeção atribuída ao técnico, disponível no SQLite local
**Gatilho:** técnico seleciona "Iniciar"

### Fluxo principal
1. App apresenta dados da inspeção (cliente, local, equipamento, prioridade, instruções)
2. Técnico confirma início
3. App registra data/hora do dispositivo (started_at_device)
4. App solicita localização (se autorizada)
5. Estado local muda para IN_PROGRESS
6. Operação é adicionada à outbox (SyncOperation: type=TRANSITION, payload={status: IN_PROGRESS, started_at_device, location})
7. App apresenta o checklist

### Fluxos alternativos
- **Inspeção cancelada no servidor (descoberta na sync):** início bloqueado
- **Localização negada:** continuar apenas se política permitir; registrar ausência

---

## UC-10 — Responder Checklist

**Ator:** técnico
**Pré-condições:** inspeção em IN_PROGRESS no dispositivo
**Gatilho:** técnico abre seção/item

### Fluxo principal
1. App apresenta seções na ordem do snapshot (section_order)
2. Dentro de cada seção, itens na ordem (item_order)
3. App renderiza o componente correto conforme response_type:
   - TEXT_SHORT → TextInput (max 255 chars)
   - TEXT_LONG → TextArea (max 2000 chars)
   - NUMBER → NumericInput
   - BOOLEAN → Switch ou botões Sim/Não
   - CONFORMITY → Segmented: Conforme / Não Conforme / Não Aplicável
   - SINGLE_CHOICE → RadioGroup com options_json
   - DATE → DatePicker
4. Técnico informa a resposta
5. App valida o valor (tipo, obrigatoriedade)
6. Resposta é salva IMEDIATAMENTE no SQLite (InspectionResponse)
7. Operação criada/atualizada na outbox
8. Progresso é recalculado (respondidos / total aplicáveis)
9. Indicador de progresso atualizado na UI

### Fluxos alternativos
- **Resposta não conforme + observation_required_on_failure=true:** campo de observação se torna obrigatório
- **Resposta não conforme + evidence_required_on_failure=true:** botão "Adicionar evidência" se torna obrigatório
- **Valor inválido:** impedir avanço com mensagem específica
- **Tipo desconhecido:** mostrar "Item incompatível com esta versão do app" (não crashar)

---

## UC-11 — Registrar Evidência (Foto)

**Ator:** técnico
**Pré-condições:** permissão de câmera + inspeção editável
**Gatilho:** botão "Adicionar foto" no item

### Fluxo principal
1. App verifica/solicita permissão da câmera
2. Técnico escolhe: Capturar foto OU Selecionar da galeria
3. App obtém a imagem
4. App exibe prévia (crop não obrigatório)
5. Técnico confirma ou refaz
6. App gera UUID para a evidência
7. App salva metadados no SQLite (Evidence: id, inspection_id, response_id, type=PHOTO, local_uri, captured_at_device)
8. App mantém o arquivo no filesystem local
9. App cria operação UPLOAD na outbox (dependência: resposta relacionada já criada)
10. UI mostra thumbnail com badge "pendente upload"

### Fluxos alternativos
- **Permissão negada:** mostrar explicação + botão para configurações do sistema
- **Arquivo > limite (ex: 10MB):** comprimir automaticamente ou avisar
- **Falha de upload na sync:** manter arquivo local + badge de erro
- **Exclusão antes da sync:** remover local + cancelar operação na outbox

---

## UC-13 — Concluir Inspeção Offline

**Ator:** técnico
**Pré-condições:** inspeção IN_PROGRESS, possivelmente sem internet
**Gatilho:** botão "Concluir inspeção"

### Fluxo principal
1. App valida:
   - Todos itens com required=true possuem resposta
   - Itens com observation_required_on_failure=true + resposta não conforme possuem observação
   - Itens com evidence_required_on_failure=true + resposta não conforme possuem evidência
2. Se inválido: bloqueia conclusão, lista pendências com link para cada item
3. Se válido: apresenta tela de resumo:
   - Total de itens: X
   - Respondidos: Y
   - Não conformidades: Z
   - Evidências: W
4. Técnico confirma
5. App registra completed_at_device
6. Solicita localização de conclusão (se autorizada)
7. Estado local muda para SUBMITTED (aguardando sync)
8. Respostas são bloqueadas para edição
9. Operação de conclusão entra na outbox
10. UI exibe "Aguardando sincronização" com ícone de pendente

---

## UC-14 — Sincronizar Alterações

**Ator:** sistema (automático ou manual pelo técnico)
**Pré-condições:** sessão válida + conectividade
**Gatilho:** botão "Sincronizar", abertura do app, ou evento de conectividade

### Fluxo principal (PUSH)
1. App identifica operações na outbox com status PENDING
2. Ordena por dependências (ex: criar resposta ANTES de upload da foto vinculada)
3. Monta payload com operações + operationId (UUID idempotente)
4. POST /api/v1/mobile/sync/push
5. API valida autorização
6. API processa cada operação individualmente
7. Para cada operação, retorna: APPLIED, ALREADY_APPLIED, REJECTED, CONFLICT ou DEPENDENCY_FAILED
8. App atualiza outbox:
   - APPLIED/ALREADY_APPLIED → marca COMPLETED
   - REJECTED → marca FAILED + registra erro
   - CONFLICT → marca CONFLICT + preserva dados
   - DEPENDENCY_FAILED → mantém PENDING para próxima tentativa

### Fluxo principal (PULL)
9. GET /api/v1/mobile/sync/pull?cursor={lastPullCursor}
10. API retorna alterações desde o cursor (inspeções atualizadas, canceladas, reprovadas)
11. App grava alterações no SQLite em transação
12. Se bem-sucedido: atualiza cursor local
13. Se falhar: mantém cursor antigo (garante consistência)

### Fluxos alternativos
- **Token expirado:** renovar automaticamente e repetir
- **Conflito de versão:** preservar dados locais, exibir badge CONFLICT, não descartar
- **Falha parcial de upload:** sincronizar dados textuais, manter fotos pendentes
- **Reenvio da mesma operação:** API retorna ALREADY_APPLIED sem duplicar

---

## UC-16 — Revisar Inspeção

**Ator:** supervisor
**Pré-condições:** inspeção em estado SUBMITTED
**Gatilho:** supervisor abre a inspeção na web admin

### Fluxo principal
1. Supervisor acessa lista de inspeções com filtro "Aguardando revisão"
2. Abre a inspeção
3. Visualiza:
   - Cabeçalho (cliente, local, equipamento, técnico, datas)
   - Localização registrada (mapa ou coordenadas)
   - Progresso geral
4. Navega pelas seções do checklist
5. Para cada item vê: pergunta, resposta, observação, fotos vinculadas
6. Consulta não conformidades (título, criticidade, descrição, evidências)
7. Clica "Iniciar Revisão" → POST .../begin-review → estado muda para UNDER_REVIEW
8. Decide: Aprovar ou Reprovar

---

## UC-17 — Aprovar ou Reprovar

**Ator:** supervisor
**Pré-condições:** inspeção em UNDER_REVIEW

### Fluxo de aprovação
1. Supervisor clica "Aprovar"
2. Pode adicionar comentário (opcional)
3. Confirma em modal de confirmação
4. POST .../approve
5. API registra: reviewer_id, reviewed_at, decision=APPROVED
6. Estado → APPROVED
7. Conteúdo protegido contra edição

### Fluxo de reprovação
1. Supervisor clica "Reprovar"
2. Informa motivo (OBRIGATÓRIO, mínimo 10 caracteres)
3. Pode indicar itens que precisam correção
4. Confirma
5. POST .../reject
6. API registra: reviewer_id, reviewed_at, decision=REJECTED, reason
7. Estado → REJECTED
8. Na próxima sync do técnico, inspeção aparece como "Requer correção" com o motivo
