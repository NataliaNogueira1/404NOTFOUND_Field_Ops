---
inclusion: manual
---

# FieldOps — Especificação Completa do Aplicativo Mobile

## Stack Tecnológico

- **Framework:** Expo SDK (latest) + React Native
- **Linguagem:** TypeScript (strict)
- **Navegação:** Expo Router (file-based routing)
- **Estado remoto:** TanStack Query (React Query)
- **Estado local UI:** Zustand (pequeno) ou Context
- **Formulários:** React Hook Form + Zod
- **Banco local:** expo-sqlite
- **Armazenamento seguro:** expo-secure-store (tokens)
- **Câmera:** expo-camera ou expo-image-picker
- **QR Code:** expo-camera (barcode scanner)
- **Localização:** expo-location
- **Conectividade:** @react-native-community/netinfo
- **Build:** EAS Build (Android APK para demo)

## Estrutura de Rotas (Expo Router)

```
app/
├── _layout.tsx                        # Root layout (providers, auth check)
├── (public)/
│   ├── _layout.tsx
│   └── login.tsx                      # Tela de login
└── (protected)/
    ├── _layout.tsx                    # Auth guard + bottom tabs
    ├── (tabs)/
    │   ├── _layout.tsx                # Tab navigator
    │   ├── index.tsx                  # Home (resumo do dia)
    │   ├── inspections.tsx            # Lista de inspeções
    │   ├── sync.tsx                   # Tela de sincronização
    │   └── profile.tsx                # Perfil e configurações
    ├── inspections/
    │   ├── [id]/
    │   │   ├── index.tsx              # Detalhes da inspeção
    │   │   ├── start.tsx              # Confirmação de início
    │   │   ├── checklist.tsx          # Checklist dinâmico
    │   │   ├── summary.tsx            # Resumo para conclusão
    │   │   └── non-conformities.tsx   # Lista de NCs
    ├── scanner.tsx                     # Leitor QR Code
    └── evidence/
        ├── capture.tsx                # Captura de foto
        └── preview.tsx                # Prévia da foto
```

## Telas Detalhadas

### 1. Login (`/login`)

**Campos:**
- E-mail (TextInput, keyboard email, validação formato)
- Senha (TextInput, secureTextEntry, mínimo 6 chars)
- Botão "Entrar" (desabilitado durante loading)

**Estados:**
- Idle: formulário vazio
- Loading: spinner no botão, inputs desabilitados
- Erro de credenciais: mensagem vermelha abaixo do form
- Erro de rede: banner "Sem conexão. Verifique sua internet."
- Offline com sessão válida: link "Entrar offline" se existir dados locais

**Comportamento:**
- POST /api/v1/auth/login
- Sucesso: salvar tokens no SecureStore, navegar para /(protected)
- Falha: mostrar mensagem sem revelar se email existe

---

### 2. Home (`/(tabs)/index`)

**Seções:**
- Saudação: "Olá, {nome}" + data atual
- Card "Inspeções do dia": count com link
- Card "Atrasadas": count em vermelho com link
- Card "Em andamento": count com link
- Banner de sincronização: "X operações pendentes" + botão sync
- Botão flutuante: "Escanear QR Code"

**Dados:** consulta SQLite local (não depende de rede)

---

### 3. Lista de Inspeções (`/(tabs)/inspections`)

**Header:** Campo de busca (pesquisa local por título/cliente/equipamento)

**Filtros (chips ou bottom sheet):**
- Estado: Atribuída, Em andamento, Aguardando sync, Enviada, Reprovada
- Prioridade: Baixa, Média, Alta, Crítica
- Período: Hoje, Esta semana, Este mês, Todas

**Card de inspeção:**
```
┌──────────────────────────────────────┐
│ [Prioridade badge]  [Estado badge]   │
│ Título da inspeção                   │
│ 🏢 Cliente - Local                   │
│ 🔧 Equipamento                       │
│ 📅 Data prevista                     │
│ [Progresso: ██████░░░░ 60%]         │
│ [⚡ Pendente sync] ou [✓ Sincronizado]│
└──────────────────────────────────────┘
```

**Pull-to-refresh:** dispara sync se online
**Empty state:** ilustração + "Nenhuma inspeção encontrada"
**Error state:** mensagem + botão "Tentar novamente"

---

### 4. Detalhes da Inspeção (`/inspections/[id]`)

**Informações exibidas:**
- Título
- Estado (badge colorido)
- Cliente + Local + Equipamento
- Prioridade
- Data prevista
- Instruções do supervisor
- Progresso (barra + X/Y itens)
- Localização no mapa (se disponível)
- Não conformidades registradas (count)

**Ações por estado:**
- ASSIGNED → botão "Iniciar Inspeção"
- IN_PROGRESS → botão "Continuar"
- REJECTED → botão "Corrigir" + motivo da reprovação exibido

---

### 5. Checklist Dinâmico (`/inspections/[id]/checklist`)

**Layout:**
- Header: título da inspeção + progresso (X/Y)
- Navegação por seções (tabs horizontais ou accordion)
- Lista de itens dentro da seção ativa

**Cada item renderiza:**
```
┌──────────────────────────────────────┐
│ [*] Item obrigatório                 │
│ Pergunta do item                     │
│ (Descrição/ajuda em texto menor)     │
│                                      │
│ [COMPONENTE CONFORME TIPO]           │
│                                      │
│ 📝 Observação (campo expansível)     │
│ 📷 Evidências (thumbnails + add)     │
│ ⚠️ Não conformidade (se aplicável)   │
│                                      │
│ [✓ Salvo] ou [⏳ Pendente]           │
└──────────────────────────────────────┘
```

**Componentes por tipo:**
| response_type | Componente React Native |
|---|---|
| TEXT_SHORT | `<TextInput maxLength={255} />` |
| TEXT_LONG | `<TextInput multiline maxLength={2000} style={{minHeight:100}} />` |
| NUMBER | `<TextInput keyboardType="numeric" />` com validação numérica |
| BOOLEAN | `<SegmentedControl items={["Sim","Não"]} />` |
| CONFORMITY | `<SegmentedControl items={["Conforme","Não Conforme","N/A"]} />` |
| SINGLE_CHOICE | `<RadioGroup options={item.options_json} />` |
| DATE | `<DatePicker mode="date" />` |

**Salvamento:** debounce 500ms após última digitação → salvar no SQLite → atualizar outbox
**Progresso:** recalculado a cada save → barra no header
**Navegação:** manter posição ao voltar de câmera/scanner

---

### 6. Captura de Evidência (`/evidence/capture`)

**Fluxo:**
1. Verificar permissão câmera
2. Se negada: tela com explicação + botão "Abrir Configurações"
3. Se concedida: abrir câmera (full screen)
4. Opções: Capturar | Galeria (se permitido)
5. Após captura: tela de prévia
6. Botões: "Usar foto" | "Refazer"
7. Campo opcional: descrição da evidência
8. Confirmar: salvar no filesystem + registrar no SQLite + outbox

**Qualidade:** comprimir para max 2MB, manter aspecto original
**Metadados salvos:** id(UUID), local_uri, mime_type, size_bytes, captured_at_device, latitude, longitude

---

### 7. Scanner QR Code (`/scanner`)

**Fluxo:**
1. Verificar permissão câmera
2. Abrir scanner com overlay de enquadramento
3. Ao ler código: vibração + feedback visual
4. Buscar equipamento no SQLite local (por qr_code)
5. Se encontrado: exibir card do equipamento com dados
6. Se não encontrado: "Equipamento não localizado" + botão "Buscar online" (se online)
7. Se diverge do equipamento da inspeção: alerta "Equipamento diferente do esperado. Deseja continuar?"
8. Técnico confirma → equipamento vinculado

---

### 8. Tela de Sincronização (`/(tabs)/sync`)

**Informações:**
- Última sincronização bem-sucedida: "há X minutos"
- Status atual: Sincronizado | Pendente | Sincronizando | Erro
- Contador: "X operações pendentes"
- Lista de operações com estado individual:
  ```
  ✓ Resposta item 3 - Enviada
  ✓ Foto item 3 - Upload completo
  ⏳ Resposta item 5 - Pendente
  ❌ Foto item 7 - Falha (tentar novamente)
  ⚠️ Conclusão - Conflito (ver detalhes)
  ```
- Botão "Sincronizar agora" (desabilitado se offline)
- Banner offline: "Sem conexão. Os dados estão seguros no dispositivo."

---

### 9. Resumo/Conclusão (`/inspections/[id]/summary`)

**Validação prévia:**
- Total de itens: X
- Respondidos: Y (barra verde)
- Obrigatórios pendentes: Z (barra vermelha, com lista dos itens + link para cada um)
- Observações pendentes: W
- Evidências pendentes: V
- Não conformidades: N

**Se inválido:** botão "Concluir" desabilitado + lista de pendências clicáveis
**Se válido:** botão "Concluir Inspeção" habilitado
**Ao confirmar:** modal de confirmação "Esta ação não pode ser desfeita. Deseja concluir?"

---

### 10. Perfil (`/(tabs)/profile`)

- Nome do técnico
- E-mail
- Perfil: Técnico
- Versão do app
- ID do dispositivo (para suporte)
- Botão "Sincronizar"
- Botão "Sair" (com confirmação se existirem dados pendentes)

---

## Banco de Dados Local (SQLite)

### Tabelas necessárias

```sql
-- Dados sincronizados do servidor
CREATE TABLE users (id TEXT PK, name TEXT, email TEXT, role TEXT);
CREATE TABLE clients (id TEXT PK, name TEXT, status TEXT);
CREATE TABLE sites (id TEXT PK, client_id TEXT, name TEXT, address TEXT, city TEXT, state TEXT);
CREATE TABLE equipment (id TEXT PK, site_id TEXT, name TEXT, qr_code TEXT UNIQUE, status TEXT);
CREATE TABLE inspections (
  id TEXT PK, template_version_id TEXT, client_id TEXT, site_id TEXT, 
  equipment_id TEXT, technician_id TEXT, title TEXT, instructions TEXT,
  priority TEXT, status TEXT, scheduled_for TEXT,
  started_at_device TEXT, completed_at_device TEXT,
  local_sync_status TEXT DEFAULT 'SYNCED', -- SYNCED, PENDING, ERROR, CONFLICT
  version INTEGER DEFAULT 0
);
CREATE TABLE inspection_item_snapshots (
  id TEXT PK, inspection_id TEXT, section_title TEXT, section_order INTEGER,
  item_code TEXT, item_title TEXT, item_description TEXT,
  response_type TEXT, required INTEGER, rules_json TEXT, options_json TEXT,
  item_order INTEGER
);
CREATE TABLE inspection_responses (
  id TEXT PK, inspection_id TEXT, inspection_item_id TEXT UNIQUE,
  value_text TEXT, value_number REAL, value_boolean INTEGER, value_date TEXT,
  value_json TEXT, observation TEXT, conformity TEXT,
  answered_at_device TEXT, version INTEGER DEFAULT 0,
  local_sync_status TEXT DEFAULT 'PENDING'
);
CREATE TABLE evidence (
  id TEXT PK, inspection_id TEXT, response_id TEXT, non_conformity_id TEXT,
  type TEXT DEFAULT 'PHOTO', local_uri TEXT, storage_key TEXT,
  mime_type TEXT, size_bytes INTEGER, description TEXT,
  latitude REAL, longitude REAL, captured_at_device TEXT,
  local_sync_status TEXT DEFAULT 'PENDING'
);
CREATE TABLE non_conformities (
  id TEXT PK, inspection_id TEXT, inspection_item_id TEXT, response_id TEXT,
  title TEXT, description TEXT, severity TEXT, status TEXT DEFAULT 'OPEN',
  created_at_device TEXT, version INTEGER DEFAULT 0,
  local_sync_status TEXT DEFAULT 'PENDING'
);
CREATE TABLE inspection_reviews (
  id TEXT PK, inspection_id TEXT, reviewer_id TEXT,
  decision TEXT, reason TEXT, comments TEXT, reviewed_at TEXT, review_cycle INTEGER
);

-- Outbox de sincronização
CREATE TABLE sync_operations (
  operation_id TEXT PK, entity_type TEXT, entity_id TEXT,
  operation_type TEXT, -- CREATE, UPDATE, TRANSITION, UPLOAD
  base_version INTEGER, payload_json TEXT, dependency_ids TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, FAILED, CONFLICT, COMPLETED
  attempt_count INTEGER DEFAULT 0, last_error TEXT,
  created_at TEXT, updated_at TEXT, last_attempt_at TEXT
);

-- Metadados de sync
CREATE TABLE sync_metadata (
  id INTEGER PK DEFAULT 1, user_id TEXT, device_id TEXT,
  last_pull_cursor TEXT, last_sync_started_at TEXT,
  last_successful_sync TEXT, last_sync_result TEXT,
  pending_operations INTEGER DEFAULT 0, schema_version INTEGER DEFAULT 1
);
```

---

## Fluxo Offline Completo

### Download (PULL)
```
App abre / botão sync → verifica conectividade →
GET /api/v1/mobile/sync/pull?cursor={last_pull_cursor} →
API retorna inspeções atribuídas + dados relacionados →
App grava em transação SQLite →
Se OK: atualiza cursor → mostra "Sincronizado às HH:MM"
Se FALHA: mantém cursor antigo → mostra "Falha ao atualizar"
```

### Salvamento de Resposta
```
Técnico responde item → validação local →
INSERT/UPDATE inspection_responses no SQLite →
INSERT/UPDATE sync_operations (operation_id=UUID, type=UPSERT, entity=INSPECTION_RESPONSE) →
UI: "Salvo no dispositivo ✓"
```

### Envio (PUSH)
```
Conectividade detectada / botão sync →
SELECT FROM sync_operations WHERE status='PENDING' ORDER BY created_at →
Resolver dependências (resposta antes de foto vinculada) →
Montar lote de operações →
POST /api/v1/mobile/sync/push →
Para cada resultado:
  APPLIED → UPDATE sync_operations SET status='COMPLETED'
  ALREADY_APPLIED → UPDATE sync_operations SET status='COMPLETED'
  REJECTED → UPDATE sync_operations SET status='FAILED', last_error=msg
  CONFLICT → UPDATE sync_operations SET status='CONFLICT'
→ Atualizar contadores na UI
```

### Upload de Evidência
```
Após resposta confirmada no servidor →
Enviar arquivo: POST /api/v1/inspections/{id}/evidence (multipart) →
Se sucesso: marcar evidence.local_sync_status='SYNCED', pode liberar arquivo local
Se falha: manter local, retry na próxima sync
```

---

## Tratamento de Permissões

| Recurso | Quando solicitar | Se negada |
|---|---|---|
| Câmera | Ao abrir captura de foto ou scanner | Mostrar explicação + botão "Configurações" + alternativa manual (para QR) |
| Localização | Ao iniciar inspeção ou concluir | Mostrar aviso + continuar se política permitir |
| Galeria | Ao selecionar foto existente | Mostrar explicação + botão "Configurações" |

---

## Escopo Mínimo do Mobile (Checklist de entrega)

- [ ] Login com e-mail e senha
- [ ] Sessão persistente (Secure Store)
- [ ] Logout
- [ ] Sincronização de inspeções atribuídas
- [ ] Lista com filtros
- [ ] Detalhes da inspeção offline
- [ ] Identificação de equipamento por QR Code
- [ ] Início da inspeção com registro de horário
- [ ] Checklist dinâmico (7 tipos de resposta)
- [ ] Salvamento automático em SQLite
- [ ] Indicador de progresso
- [ ] Captura de fotografia
- [ ] Associação foto → item
- [ ] Registro de localização (início e conclusão)
- [ ] Registro de não conformidade
- [ ] Validação de obrigatórios na conclusão
- [ ] Conclusão offline
- [ ] Outbox de operações
- [ ] Sincronização push (envio em lote, idempotente)
- [ ] Sincronização pull (cursor)
- [ ] Tela de status de sincronização
- [ ] Receber inspeção reprovada com motivo
- [ ] Estados: carregamento, vazio, erro, offline
