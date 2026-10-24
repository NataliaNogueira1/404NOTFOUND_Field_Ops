# FieldOps — Planejamento Completo do Frontend (Protótipo)

## Visão Geral

O frontend do FieldOps é composto por **2 aplicações independentes**:

| App | Tecnologia | Usuários | Plataforma |
|---|---|---|---|
| **App Mobile** | Expo + React Native + TypeScript | Técnico de campo | Android (prioritário) |
| **Web Admin** | Angular 17 + TypeScript | Supervisor + Administrador | Browser (desktop/notebook) |

Ambas consomem a mesma API REST (Spring Boot).

---

## Prioridade para o Protótipo de Sexta-feira

Para a apresentação, foque em:
1. **Navegação funcional** (todas as telas clicáveis, mesmo com dados mockados)
2. **Visual consistente** (design system aplicado)
3. **Fluxo principal demonstrável** (criar inspeção → executar → revisar)
4. Dados podem ser estáticos/hardcoded — integração vem depois

---

---

# PARTE 1: APP MOBILE (Expo + React Native)

## Design System Base

| Token | Valor |
|---|---|
| Primary | #2563EB (azul) |
| Success | #16A34A (verde) |
| Warning | #F59E0B (amarelo) |
| Danger | #DC2626 (vermelho) |
| Background | #F8FAFC |
| Surface | #FFFFFF |
| Text Primary | #1E293B |
| Text Secondary | #64748B |
| Border Radius | 12px (cards), 8px (inputs), 24px (buttons) |
| Font | System default (San Francisco / Roboto) |
| Spacing base | 4px (4, 8, 12, 16, 20, 24, 32) |

## Componentes Reutilizáveis do Mobile

| Componente | Props | Uso |
|---|---|---|
| `<Button>` | variant: primary/secondary/danger/ghost, loading, disabled | Ações |
| `<TextInput>` | label, error, helper, leftIcon | Formulários |
| `<Card>` | onPress, elevation | Containers clicáveis |
| `<Badge>` | variant: info/success/warning/danger, text | Status |
| `<ProgressBar>` | value (0-100), color | Progresso checklist |
| `<EmptyState>` | icon, title, description, action | Listas vazias |
| `<ErrorState>` | message, onRetry | Erros |
| `<LoadingState>` | message | Carregamento |
| `<SyncBadge>` | status: synced/pending/error | Sincronização |
| `<PriorityBadge>` | priority: LOW/MEDIUM/HIGH/CRITICAL | Prioridade |
| `<StatusBadge>` | status: ASSIGNED/IN_PROGRESS/... | Estado inspeção |
| `<SectionHeader>` | title, count, expanded | Seções checklist |
| `<ChecklistItem>` | item, response, onAnswer | Item do checklist |

---

## TELA 1: Login (Mobile)

**Rota:** `/(public)/login`
**Quando aparece:** Sempre que não existe sessão válida

### Elementos na tela:
```
┌──────────────────────────────────┐
│                                  │
│         [Logo FieldOps]          │
│     "Plataforma de Inspeção"     │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 📧  E-mail                 │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🔒  Senha            [👁️] │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │         ENTRAR             │  │
│  └────────────────────────────┘  │
│                                  │
│  "Esqueceu a senha?" (link)      │
│                                  │
│  ─── Versão 1.0.0 ───           │
└──────────────────────────────────┘
```

### Detalhamento:
| Elemento | Tipo | Validação | Comportamento |
|---|---|---|---|
| E-mail | TextInput (email keyboard) | required, formato email | - |
| Senha | TextInput (secureEntry) | required, min 6 chars | Toggle visibilidade com ícone olho |
| Botão Entrar | Button primary full-width | Desabilitado se campos vazios | Loading spinner enquanto autentica |
| Mensagem erro | Text danger | - | Aparece abaixo do botão se credenciais inválidas |
| Link "Esqueceu" | Text link | - | No protótipo: apenas exibir (funcionalidade futura) |

### Estados:
- **Idle:** formulário vazio, botão disabled
- **Preenchido:** botão enabled
- **Loading:** botão com spinner, inputs disabled
- **Erro credenciais:** mensagem "E-mail ou senha incorretos" em vermelho
- **Erro rede:** banner topo "Sem conexão com o servidor"

---

## TELA 2: Home / Início (Mobile)

**Rota:** `/(protected)/(tabs)/index`
**Tab:** 🏠 Início
**Quando aparece:** Tela principal após login

### Elementos na tela:
```
┌──────────────────────────────────┐
│ Olá, Carlos! 👋                  │
│ Terça, 3 de agosto de 2026       │
├──────────────────────────────────┤
│                                  │
│ ┌──────────┐  ┌──────────┐      │
│ │    3     │  │    1     │      │
│ │  Hoje    │  │ Atrasada │      │
│ │  (azul)  │  │(vermelho)│      │
│ └──────────┘  └──────────┘      │
│                                  │
│ ┌──────────┐  ┌──────────┐      │
│ │    2     │  │    5     │      │
│ │Andamento │  │ Pendente │      │
│ │(amarelo) │  │  sync    │      │
│ └──────────┘  └──────────┘      │
│                                  │
├──────────────────────────────────┤
│ ⚡ 5 operações pendentes         │
│ Última sync: há 15 min           │
│ [     Sincronizar agora     ]    │
├──────────────────────────────────┤
│                                  │
│ 📋 Próximas inspeções            │
│ ┌────────────────────────────┐   │
│ │ 🔴 ALTA  Compressor XPTO  │   │
│ │ Indústria Modelo - Sorocaba│   │
│ │ Hoje, 09:00                │   │
│ └────────────────────────────┘   │
│ ┌────────────────────────────┐   │
│ │ 🟡 MÉD  Gerador Diesel    │   │
│ │ Logística ABC - Campinas   │   │
│ │ Amanhã, 14:00              │   │
│ └────────────────────────────┘   │
│                                  │
│  [Fab: 📷 Escanear QR Code]     │
│                                  │
├──────────────────────────────────┤
│ 🏠    📋    🔄    👤            │
│Início Lista  Sync  Perfil        │
└──────────────────────────────────┘
```

### Detalhamento:
| Elemento | Dados | Ação ao clicar |
|---|---|---|
| Card "Hoje" | COUNT inspeções com scheduled_for = hoje | Navegar para lista filtrada |
| Card "Atrasada" | COUNT scheduled_for < hoje AND status não terminal | Navegar para lista filtrada |
| Card "Andamento" | COUNT status = IN_PROGRESS | Navegar para lista filtrada |
| Card "Pendente sync" | COUNT sync_operations pendentes | Navegar para tab Sync |
| Banner sync | última sync + pendentes | - |
| Botão "Sincronizar" | - | Disparar sync (se online) |
| Lista "Próximas" | Max 3 inspeções mais próximas | Navegar para detalhes |
| FAB QR Code | - | Abrir scanner |
| Bottom tabs | 4 tabs fixas | Navegar entre tabs |

---

## TELA 3: Lista de Inspeções (Mobile)

**Rota:** `/(protected)/(tabs)/inspections`
**Tab:** 📋 Lista

### Elementos na tela:
```
┌──────────────────────────────────┐
│ Minhas Inspeções                 │
│ ┌────────────────────────────┐   │
│ │ 🔍 Buscar por título...    │   │
│ └────────────────────────────┘   │
│                                  │
│ [Todas▾] [Estado▾] [Prioridade▾] │
│                                  │
├──────────────────────────────────┤
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🔴 ALTA    🟡 Em andamento│   │
│ │                            │   │
│ │ Inspeção Compressor XPTO   │   │
│ │ 🏢 Indústria Modelo        │   │
│ │ 📍 Unidade Sorocaba        │   │
│ │ 🔧 Compressor de Ar 500    │   │
│ │ 📅 03/08/2026              │   │
│ │                            │   │
│ │ ██████████░░░░ 60%         │   │
│ │ ⏳ 3 pendentes de sync     │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🟡 MÉDIA   🔵 Atribuída   │   │
│ │                            │   │
│ │ Inspeção Gerador Diesel    │   │
│ │ 🏢 Logística ABC           │   │
│ │ 📍 CD Campinas             │   │
│ │ 🔧 Gerador GD-002         │   │
│ │ 📅 04/08/2026              │   │
│ │                            │   │
│ │ ░░░░░░░░░░░░░░ 0%         │   │
│ │ ✓ Sincronizado             │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🟢 BAIXA  🔴 Reprovada    │   │
│ │                            │   │
│ │ Inspeção Extintor P12      │   │
│ │ ⚠️ Requer correção         │   │
│ │ ...                        │   │
│ └────────────────────────────┘   │
│                                  │
├──────────────────────────────────┤
│ 🏠    📋    🔄    👤            │
└──────────────────────────────────┘
```

### Filtros disponíveis:
| Filtro | Opções |
|---|---|
| Estado | Atribuída, Em andamento, Aguardando sync, Enviada, Reprovada, Todas |
| Prioridade | Baixa, Média, Alta, Crítica |
| Período | Hoje, Esta semana, Este mês, Todas |

### Informações por card:
| Info | Fonte | Visual |
|---|---|---|
| Prioridade | inspection.priority | Badge colorido (🟢🟡🔴⚫) |
| Estado | inspection.status | Badge com texto |
| Título | inspection.title | Texto bold |
| Cliente | client.name | Com ícone 🏢 |
| Local | site.name | Com ícone 📍 |
| Equipamento | equipment.name | Com ícone 🔧 |
| Data prevista | inspection.scheduled_for | Com ícone 📅 + vermelho se atrasada |
| Progresso | respondidos/total | ProgressBar |
| Sync status | local_sync_status | Badge: ✓/⏳/❌ |
| Correção | Se REJECTED | Banner amarelo "Requer correção" |

### Comportamento:
- Pull-to-refresh: sincroniza se online
- Scroll infinito ou paginação
- Busca filtra localmente (título, cliente, equipamento)
- Card clicável → navega para detalhes
- Empty state se nenhuma inspeção
- Offline: dados vêm do SQLite

---

## TELA 4: Detalhes da Inspeção (Mobile)

**Rota:** `/(protected)/inspections/[id]/index`
**Quando:** Técnico clica em um card da lista

### Elementos na tela:
```
┌──────────────────────────────────┐
│ ← Voltar     Detalhes            │
├──────────────────────────────────┤
│                                  │
│ [🔴 ALTA]  [🟡 Em andamento]    │
│                                  │
│ Inspeção Preventiva              │
│ Compressor de Ar XPTO 500       │
│                                  │
├──────────────────────────────────┤
│ 📋 Informações                   │
│                                  │
│ Cliente:     Indústria Modelo    │
│ Local:       Unidade Sorocaba    │
│ Equipamento: Compressor XPTO 500│
│ Técnico:     Carlos Henrique     │
│ Prioridade:  Alta                │
│ Data prevista: 03/08/2026        │
│ Criada em:   01/08/2026          │
│                                  │
├──────────────────────────────────┤
│ 📝 Instruções do supervisor      │
│ "Verificar condição da bateria   │
│  com atenção especial. Último    │
│  relatório indicou corrosão."    │
│                                  │
├──────────────────────────────────┤
│ 📊 Progresso                     │
│ ████████░░░░░░░░ 7/12 itens     │
│ ⚠️ 2 não conformidades           │
│ 📷 4 evidências                  │
│                                  │
├──────────────────────────────────┤
│ 📍 Localização de início         │
│ -23.5015, -47.4526 (8.5m)       │
│ 03/08/2026 09:15                 │
│                                  │
├──────────────────────────────────┤
│                                  │
│ [   ▶️ CONTINUAR INSPEÇÃO    ]   │
│                                  │
│ [   📷 Escanear QR Code     ]   │
│                                  │
└──────────────────────────────────┘
```

### Botão principal por estado:
| Estado | Botão | Ação |
|---|---|---|
| ASSIGNED | "▶️ Iniciar Inspeção" (primary) | Ir para tela de início |
| IN_PROGRESS | "▶️ Continuar" (primary) | Ir para checklist |
| REJECTED | "🔧 Corrigir" (warning) | Ir para checklist (itens marcados) |
| SUBMITTED | Nenhum botão de ação | Apenas visualização |
| APPROVED | "✓ Aprovada" (disabled green) | Nenhuma |

### Se REJECTED, mostrar adicional:
```
┌────────────────────────────────┐
│ ⚠️ INSPEÇÃO REPROVADA          │
│                                │
│ Motivo: "A foto do item 4 não │
│ mostra claramente a proteção   │
│ lateral. Refazer."             │
│                                │
│ Itens para correção:           │
│ • Item 4 - Proteções mecânicas│
│                                │
│ Reprovada por: Marina          │
│ Data: 05/08/2026               │
└────────────────────────────────┘
```

---

## TELA 5: Início da Inspeção (Mobile)

**Rota:** `/(protected)/inspections/[id]/start`
**Quando:** Técnico clica "Iniciar Inspeção" nos detalhes

### Elementos na tela:
```
┌──────────────────────────────────┐
│ ← Voltar     Iniciar Inspeção    │
├──────────────────────────────────┤
│                                  │
│        ┌──────────────┐          │
│        │   📋         │          │
│        │   Pronto?    │          │
│        └──────────────┘          │
│                                  │
│ Você está prestes a iniciar:     │
│                                  │
│ Inspeção Preventiva              │
│ Compressor XPTO 500             │
│ Indústria Modelo - Sorocaba      │
│                                  │
│ 📊 12 itens para verificar       │
│ ⏱️ Tempo estimado: ~45 min       │
│                                  │
├──────────────────────────────────┤
│                                  │
│ 📍 Localização                   │
│ ✅ Permissão concedida           │
│ Será registrada ao iniciar       │
│                                  │
│ 📷 Câmera                        │
│ ✅ Permissão concedida           │
│                                  │
├──────────────────────────────────┤
│ ℹ️ Após iniciar, o horário será  │
│ registrado e a inspeção ficará   │
│ em andamento.                    │
│                                  │
│ [    ✅ CONFIRMAR INÍCIO     ]   │
│                                  │
│ [       Cancelar (ghost)     ]   │
└──────────────────────────────────┘
```

### Comportamento:
- Ao confirmar: registra startedAtDevice + localização + muda estado local
- Se localização negada: mostrar aviso mas permitir continuar
- Se câmera negada: mostrar aviso (precisará para evidências)
- Após confirmar: navega automaticamente para o checklist

---

## TELA 6: Checklist Dinâmico (Mobile) ⭐ TELA PRINCIPAL

**Rota:** `/(protected)/inspections/[id]/checklist`
**Quando:** Inspeção está IN_PROGRESS

### Elementos na tela:
```
┌──────────────────────────────────┐
│ ← Voltar   Checklist   [Resumo] │
│ ████████████░░░░ 8/12 (66%)     │
├──────────────────────────────────┤
│                                  │
│ [Seção 1] [Seção 2▾] [Seção 3]  │
│                                  │
├──────────────────────────────────┤
│                                  │
│ ── Seção 2: Segurança ──        │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 4. Proteções das partes    │   │
│ │    móveis instaladas? *    │   │
│ │                            │   │
│ │ [Conforme] [Não Conf] [NA] │   │
│ │           ← selecionado    │   │
│ │                            │   │
│ │ 📝 Observação: (obrigatória│   │
│ │    pois marcou Não Conf)   │   │
│ │ ┌──────────────────────┐   │   │
│ │ │ Proteção lateral com │   │   │
│ │ │ folga no parafuso... │   │   │
│ │ └──────────────────────┘   │   │
│ │                            │   │
│ │ 📷 Evidências (obrigatória)│   │
│ │ [thumb1] [+ Adicionar]     │   │
│ │                            │   │
│ │ ⚠️ Não conformidade criada │   │
│ │                            │   │
│ │ ✓ Salvo no dispositivo     │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 5. Etiquetas de            │   │
│ │    advertência visíveis? * │   │
│ │                            │   │
│ │ [Conforme▾][Não Conf][NA]  │   │
│ │                            │   │
│ │ (Sem observação necessária)│   │
│ │ ✓ Salvo                    │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 6. Botão de emergência     │   │
│ │    funcionando? *          │   │
│ │                            │   │
│ │    ( ) Sim    (●) Não      │   │
│ │                            │   │
│ │ ✓ Salvo                    │   │
│ └────────────────────────────┘   │
│                                  │
├──────────────────────────────────┤
│ [   📋 Ver Resumo / Concluir  ] │
└──────────────────────────────────┘
```

### Componentes por tipo de resposta:

| response_type | Componente visual | Exemplo |
|---|---|---|
| TEXT_SHORT | Input de texto (1 linha, max 255) | "Número de série: ____" |
| TEXT_LONG | Textarea (3+ linhas, max 2000) | "Descreva a irregularidade: ____" |
| NUMBER | Input numérico com teclado numérico | "Pressão (bar): [7.8]" |
| BOOLEAN | Dois botões segmentados: Sim / Não | "Funciona? [Sim] [Não]" |
| CONFORMITY | Três botões: Conforme / Não Conforme / N/A | "[✓] [✗] [—]" |
| SINGLE_CHOICE | Lista de radio buttons | "○ Opção A ● Opção B ○ Opção C" |
| DATE | Date picker nativo | "Data: [03/08/2026]" |

### Regras visuais:
| Situação | Visual |
|---|---|
| Item obrigatório | Asterisco (*) no título |
| Item respondido | Check verde ✓ + "Salvo" |
| Item pendente | Sem indicador |
| Resposta NÃO CONFORME | Borda laranja/vermelha |
| Observação obrigatória | Campo aparece com label "Obrigatória" |
| Evidência obrigatória | Botão "Adicionar foto" com badge "Obrigatória" |
| NC criada | Badge "⚠️ Não conformidade" |
| Tipo desconhecido | Card cinza "Incompatível com esta versão" |

### Salvamento:
- Cada resposta salva no SQLite após 500ms de inatividade (debounce)
- Feedback visual: "Salvando..." → "✓ Salvo no dispositivo"
- Nunca depende de internet para salvar

---

## TELA 7: Captura de Evidência / Foto (Mobile)

**Rota:** `/(protected)/evidence/capture`
**Quando:** Técnico clica "Adicionar foto" em um item

### Fluxo:
```
[Item do checklist] → clica "📷 Adicionar"
        ↓
┌──────────────────────────────────┐
│                                  │
│   ┌────────────────────────┐     │
│   │                        │     │
│   │    VIEWFINDER CÂMERA   │     │
│   │                        │     │
│   │                        │     │
│   │                        │     │
│   └────────────────────────┘     │
│                                  │
│   [🖼️ Galeria]    [📷 Capturar]  │
│                                  │
└──────────────────────────────────┘
        ↓ (após capturar)
┌──────────────────────────────────┐
│ ← Voltar       Prévia            │
│                                  │
│   ┌────────────────────────┐     │
│   │                        │     │
│   │    PRÉVIA DA FOTO      │     │
│   │                        │     │
│   │                        │     │
│   └────────────────────────┘     │
│                                  │
│ Vinculada ao item:               │
│ "4. Proteções mecânicas"         │
│                                  │
│ Descrição (opcional):            │
│ ┌────────────────────────────┐   │
│ │ Proteção lateral com folga │   │
│ └────────────────────────────┘   │
│                                  │
│ [  ✅ Usar esta foto  ]          │
│ [  🔄 Refazer         ]          │
│ [  ❌ Cancelar        ]          │
└──────────────────────────────────┘
```

### Após confirmar:
- Thumbnail aparece no item do checklist
- Badge "⏳ Pendente upload" até sincronizar
- Arquivo fica no filesystem do dispositivo

---

## TELA 8: Scanner QR Code (Mobile)

**Rota:** `/(protected)/scanner`
**Quando:** Técnico clica no FAB ou botão "Escanear QR"

### Elementos na tela:
```
┌──────────────────────────────────┐
│ ← Voltar     Scanner QR Code     │
├──────────────────────────────────┤
│                                  │
│   ┌────────────────────────┐     │
│   │                        │     │
│   │   ┌──────────────┐    │     │
│   │   │              │    │     │
│   │   │   AREA DE    │    │     │
│   │   │   LEITURA    │    │     │
│   │   │              │    │     │
│   │   └──────────────┘    │     │
│   │                        │     │
│   └────────────────────────┘     │
│                                  │
│  Aponte para o QR Code do        │
│  equipamento                     │
│                                  │
├──────────── APÓS LEITURA ────────┤
│                                  │
│  ✅ Equipamento encontrado!      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🔧 Compressor XPTO 500    │  │
│  │ Patrimônio: COMP-004      │  │
│  │ Local: Unidade Sorocaba   │  │
│  │ Status: Ativo              │  │
│  └────────────────────────────┘  │
│                                  │
│  [  ✅ Confirmar equipamento  ]  │
│  [  🔄 Escanear novamente    ]  │
│                                  │
├──────── OU SE DIVERGÊNCIA ───────┤
│                                  │
│  ⚠️ Equipamento diferente!       │
│                                  │
│  Esperado: Gerador GD-002       │
│  Encontrado: Compressor XPTO    │
│                                  │
│  [  Usar este mesmo    ]         │
│  [  Escanear novamente ]         │
│  [  Identificar manual ]         │
│                                  │
└──────────────────────────────────┘
```

---

## TELA 9: Resumo e Conclusão (Mobile)

**Rota:** `/(protected)/inspections/[id]/summary`
**Quando:** Técnico clica "Ver Resumo / Concluir" no checklist

### Elementos na tela:
```
┌──────────────────────────────────┐
│ ← Voltar       Resumo            │
├──────────────────────────────────┤
│                                  │
│ 📊 Resultado da inspeção         │
│                                  │
│ Total de itens:        12        │
│ Respondidos:           12 ✅     │
│ Obrigatórios pendentes: 0 ✅    │
│                                  │
│ Conformes:              8        │
│ Não conformes:          4        │
│ Não aplicáveis:         0        │
│                                  │
│ Evidências:             6 📷     │
│ Não conformidades:      4 ⚠️     │
│                                  │
├──────────────────────────────────┤
│ 📍 Localização                   │
│ Início: -23.5015, -47.4526      │
│ Conclusão: será registrada       │
│                                  │
├──────────────────────────────────┤
│ ⏱️ Duração                       │
│ Início: 09:15                    │
│ Agora:  10:05 (50 min)          │
│                                  │
├──── SE TUDO OK ──────────────────┤
│                                  │
│ [    ✅ CONCLUIR INSPEÇÃO    ]   │
│                                  │
│ ℹ️ Após concluir, as respostas   │
│ serão bloqueadas até revisão.    │
│ O envio ocorrerá quando houver   │
│ conexão.                         │
│                                  │
├──── SE HÁ PENDÊNCIAS ────────────┤
│                                  │
│ ❌ Não é possível concluir       │
│                                  │
│ Pendências:                      │
│ • Item 9: resposta obrigatória   │
│ • Item 7: evidência obrigatória  │
│                                  │
│ [   Ir para pendências   ]       │
│                                  │
└──────────────────────────────────┘
```

### Modal de confirmação (ao clicar Concluir):
```
┌────────────────────────────────┐
│ Concluir inspeção?             │
│                                │
│ Esta ação não pode ser desfeita│
│ As respostas serão bloqueadas. │
│ O envio será feito quando      │
│ houver conexão.                │
│                                │
│ [Cancelar]  [✅ Confirmar]     │
└────────────────────────────────┘
```

---

## TELA 10: Sincronização (Mobile)

**Rota:** `/(protected)/(tabs)/sync`
**Tab:** 🔄 Sync

### Elementos na tela:
```
┌──────────────────────────────────┐
│         Sincronização            │
├──────────────────────────────────┤
│                                  │
│ Status: ✅ Sincronizado          │
│ Última sync: 03/08/2026 11:20   │
│                                  │
│ [     🔄 Sincronizar agora   ]  │
│                                  │
├──────────────────────────────────┤
│ 📤 Envio (0 pendentes)          │
│                                  │
│ (Lista vazia - tudo enviado)     │
│                                  │
├─── OU SE HÁ PENDENTES ──────────┤
│ 📤 Envio (5 pendentes)          │
│                                  │
│ ✅ Resposta item 1    Enviada    │
│ ✅ Resposta item 2    Enviada    │
│ ✅ Foto item 2        Upload OK  │
│ ⏳ Resposta item 5    Pendente   │
│ ⏳ Foto item 5        Aguardando │
│ ❌ Foto item 7        Erro       │
│    "Arquivo muito grande"        │
│    [Tentar novamente]            │
│ ⚠️ Conclusão          Conflito   │
│    "Versão divergente"           │
│    [Ver detalhes]                │
│                                  │
├──────────────────────────────────┤
│ 📥 Download                      │
│ Inspeções atualizadas: 3        │
│ Última verificação: há 5 min    │
│                                  │
├──────────────────────────────────┤
│ ℹ️ Informações                   │
│ Dispositivo: ABC-123            │
│ Espaço usado: 45 MB             │
│ Fotos pendentes: 2 (8.5 MB)     │
│                                  │
├──────────────────────────────────┤
│ 🏠    📋    🔄    👤            │
└──────────────────────────────────┘
```

---

## TELA 11: Perfil (Mobile)

**Rota:** `/(protected)/(tabs)/profile`
**Tab:** 👤 Perfil

### Elementos:
```
┌──────────────────────────────────┐
│           Meu Perfil             │
├──────────────────────────────────┤
│                                  │
│        ┌────────┐               │
│        │  👤    │               │
│        └────────┘               │
│   Carlos Henrique Silva          │
│   tecnico@fieldops.local         │
│   Perfil: Técnico                │
│                                  │
├──────────────────────────────────┤
│ Sobre o app                      │
│ Versão: 1.0.0                    │
│ Dispositivo: device-abc-123      │
│ Último login: 03/08/2026 08:00   │
│                                  │
├──────────────────────────────────┤
│                                  │
│ [   🔄 Forçar sincronização  ]  │
│                                  │
│ [   🚪 Sair da conta   ]        │
│                                  │
└──────────────────────────────────┘
```

### Ao clicar "Sair":
- Se existirem dados pendentes: "Existem X operações não enviadas. Se sair, os dados ficarão no dispositivo. Deseja continuar?"
- Se não: logout direto

---

## TELA 12: Não Conformidades da Inspeção (Mobile)

**Rota:** `/(protected)/inspections/[id]/non-conformities`

### Elementos:
```
┌──────────────────────────────────┐
│ ← Voltar   Não Conformidades     │
├──────────────────────────────────┤
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🔴 CRÍTICA                 │   │
│ │ Cabo elétrico danificado   │   │
│ │ Item: Cabos e conexões     │   │
│ │ 📷 1 evidência             │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🟡 MODERADA                │   │
│ │ Etiqueta de segurança      │   │
│ │ danificada                 │   │
│ │ Item: Sinalização          │   │
│ │ 📷 1 evidência             │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🟡 MODERADA                │   │
│ │ Vibração acima do padrão   │   │
│ │ Item: Ruídos e vibrações   │   │
│ │ 📷 1 evidência             │   │
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │ 🟢 LEVE                    │   │
│ │ Acúmulo de óleo            │   │
│ │ Item: Limpeza              │   │
│ │ 📷 1 evidência             │   │
│ └────────────────────────────┘   │
│                                  │
│ [  + Nova não conformidade   ]   │
│                                  │
└──────────────────────────────────┘
```

### Formulário de nova NC (bottom sheet):
- Título (obrigatório)
- Descrição (obrigatório)
- Criticidade: Baixa / Média / Alta / Crítica (select)
- Item relacionado (select, opcional)
- Botão "Adicionar evidência" (📷)
- Botão "Salvar"

---
---

# PARTE 2: WEB ADMIN (Angular)

---

## Design System Web

| Token | Valor |
|---|---|
| Primary | #2563EB |
| Secondary | #7C3AED |
| Success | #16A34A |
| Warning | #F59E0B |
| Danger | #DC2626 |
| Background | #F1F5F9 |
| Surface | #FFFFFF |
| Sidebar | #1E293B (dark) |
| Text | #1E293B |
| Border | #E2E8F0 |
| Font | Inter ou system |
| Border Radius | 8px |
| Breakpoint mínimo | 1280px |

---

## TELA WEB 1: Login (Web Admin)

**Rota:** `/login`

### Layout:
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              ┌──────────────────────┐                    │
│              │   [Logo FieldOps]    │                    │
│              │                      │                    │
│              │  Interface           │                    │
│              │  Administrativa      │                    │
│              │                      │                    │
│              │ E-mail:              │                    │
│              │ ┌──────────────────┐ │                    │
│              │ │                  │ │                    │
│              │ └──────────────────┘ │                    │
│              │                      │                    │
│              │ Senha:               │                    │
│              │ ┌──────────────────┐ │                    │
│              │ │                  │ │                    │
│              │ └──────────────────┘ │                    │
│              │                      │                    │
│              │ [     ENTRAR     ]   │                    │
│              │                      │                    │
│              └──────────────────────┘                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Card centralizado, fundo gradiente ou cor sólida
- Mesmo comportamento de validação do mobile

---

## TELA WEB 2: Dashboard (Web Admin)

**Rota:** `/app/dashboard`

### Layout:
```
┌────────┬─────────────────────────────────────────────────┐
│        │  Dashboard                            [Marina ▾]│
│ 🏠 Dash├─────────────────────────────────────────────────┤
│ 👥 Usrs│                                                 │
│ 🏢 Cli │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐│
│ 📍 Loc │  │   12    │ │    3    │ │    5    │ │  2   ││
│ 🔧 Equi│  │  Total  │ │Revisão  │ │Atrasadas│ │NCs 🔴││
│ 📋 Mod │  │inspeções│ │pendente │ │         │ │crít. ││
│ 📊 Insp│  └─────────┘ └─────────┘ └─────────┘ └──────┘│
│ ⚠️ NCs │                                                 │
│ 📜 Aud │  ┌─────────────────────────────────────────────┐│
│        │  │ Inspeções por Estado (gráfico barras)       ││
│        │  │ ■ Atribuídas: 4                             ││
│        │  │ ■ Em andamento: 3                           ││
│        │  │ ■ Enviadas: 3                               ││
│        │  │ ■ Aprovadas: 2                              ││
│        │  └─────────────────────────────────────────────┘│
│        │                                                 │
│        │  ┌─────────────────────┐ ┌─────────────────────┐│
│        │  │ Ações rápidas       │ │ NCs por criticidade ││
│        │  │                     │ │ Crítica: 2          ││
│        │  │ [+ Nova inspeção]   │ │ Alta: 5             ││
│        │  │ [📋 Revisar pend.]  │ │ Média: 8            ││
│        │  │                     │ │ Baixa: 3            ││
│        │  └─────────────────────┘ └─────────────────────┘│
│        │                                                 │
└────────┴─────────────────────────────────────────────────┘
```

---

## TELA WEB 3: Lista de Usuários (Web Admin)

**Rota:** `/app/users`
**Permissão:** Somente ADMIN

### Layout:
```
┌────────┬─────────────────────────────────────────────────┐
│        │  Usuários                        [+ Novo Usuário]│
│ Sidebar├─────────────────────────────────────────────────┤
│        │  Filtros: [Nome/Email____] [Perfil▾] [Status▾]  │
│        ├─────────────────────────────────────────────────┤
│        │  Nome           │ E-mail        │Perfil│Status│⚙│
│        │  ─────────────────────────────────────────────  │
│        │  Carlos Henrique│tecnico@...    │TEC   │Ativo │✏│
│        │  Marina Silva  │supervisor@... │SUP   │Ativo │✏│
│        │  Ana Costa     │admin@...      │ADM   │Ativo │✏│
│        │  João Pedro    │joao@...       │TEC   │Inativo│✏│
│        │                                                 │
│        │  Mostrando 1-4 de 4        [◄ 1 ►]             │
└────────┴─────────────────────────────────────────────────┘
```

### Formulário novo/editar (modal ou página):
| Campo | Tipo | Validação |
|---|---|---|
| Nome | text | required, max 100 |
| E-mail | email | required, unique |
| Senha | password | required (criar), opcional (editar), min 6 |
| Perfil | select | ADMIN, SUPERVISOR, TECHNICIAN |
| Telefone | text | opcional |
| Status | select | Ativo, Inativo, Bloqueado |

---

## TELA WEB 4: Lista de Clientes (Web Admin)

**Rota:** `/app/clients`

### Tabela:
| Nome | Documento | E-mail | Locais | Status | Ações |
|---|---|---|---|---|---|
| Indústria Modelo | 12.345.678/0001-90 | contato@... | 3 | Ativo | ✏️ 📍 |

- Botão 📍 = ver locais do cliente
- Filtros: nome, status
- Paginação server-side

### Formulário:
| Campo | Validação |
|---|---|
| Nome | required |
| Razão social | opcional |
| Documento (CNPJ) | opcional, validar formato |
| E-mail | opcional, formato email |
| Telefone | opcional |

---

## TELA WEB 5: Locais (Web Admin)

**Rota:** `/app/sites` ou `/app/clients/:id/sites`

### Tabela:
| Nome | Cliente | Cidade/UF | Contato | Equipamentos | Status | Ações |

### Formulário:
| Campo | Validação |
|---|---|
| Cliente | select, required |
| Nome | required |
| Descrição | opcional |
| Endereço | opcional |
| Cidade | opcional |
| Estado | select UFs |
| CEP | opcional, formato |
| Latitude/Longitude | opcional |
| Contato (nome) | opcional |
| Contato (telefone) | opcional |

---

## TELA WEB 6: Equipamentos (Web Admin)

**Rota:** `/app/equipment` ou `/app/sites/:id/equipment`

### Tabela:
| Nome | Patrimônio | Série | Local | QR Code | Status | Ações |

### Formulário:
| Campo | Validação |
|---|---|
| Local | select (filtrado por cliente), required |
| Nome | required |
| Nº Patrimônio | opcional |
| Nº Série | opcional |
| Fabricante | opcional |
| Modelo | opcional |
| QR Code | required, unique (com botão "Gerar automático") |
| Status | ACTIVE, INACTIVE, DECOMMISSIONED |
| Data instalação | opcional |

---

## TELA WEB 7: Construtor de Modelos ⭐ TELA MAIS IMPORTANTE DO ADMIN

**Rota:** `/app/inspection-templates/:id/edit`

### Layout completo:
```
┌────────┬─────────────────────────────────────────────────────────┐
│        │  Modelo de Inspeção                    [Prévia][Publicar]│
│ Sidebar├─────────────────────────────────────────────────────────┤
│        │                                                         │
│        │  Título: [Inspeção Preventiva de Compressor___________] │
│        │  Categoria: [Manutenção Preventiva ▾]                   │
│        │  Descrição: [Checklist para inspeção mensal de...]      │
│        │  Status: 🟡 RASCUNHO                                    │
│        │                                                         │
│        ├─────────────────────────────────────────────────────────┤
│        │                                                         │
│        │  ┌─ SEÇÃO 1: Condições Gerais ─── [↑][↓][✏️][🗑️] ────┐ │
│        │  │                                                     │ │
│        │  │  ┌──────────────────────────────────────────────┐   │ │
│        │  │  │ 1. A placa de identificação está legível? *  │   │ │
│        │  │  │    Tipo: CONFORMITY                          │   │ │
│        │  │  │    Obrig: ✅  Obs falha: ✅  Evid falha: ✅  │   │ │
│        │  │  │    [Editar] [↑] [↓] [🗑️]                    │   │ │
│        │  │  └──────────────────────────────────────────────┘   │ │
│        │  │                                                     │ │
│        │  │  ┌──────────────────────────────────────────────┐   │ │
│        │  │  │ 2. Equipamento limpo e conservado? *         │   │ │
│        │  │  │    Tipo: CONFORMITY                          │   │ │
│        │  │  │    Obrig: ✅  Obs falha: ✅  Evid falha: ✅  │   │ │
│        │  │  │    [Editar] [↑] [↓] [🗑️]                    │   │ │
│        │  │  └──────────────────────────────────────────────┘   │ │
│        │  │                                                     │ │
│        │  │  ┌──────────────────────────────────────────────┐   │ │
│        │  │  │ 3. Estrutura externa sem danos? *            │   │ │
│        │  │  │    Tipo: CONFORMITY                          │   │ │
│        │  │  │    Obrig: ✅  Obs falha: ❌  Evid falha: ❌  │   │ │
│        │  │  │    [Editar] [↑] [↓] [🗑️]                    │   │ │
│        │  │  └──────────────────────────────────────────────┘   │ │
│        │  │                                                     │ │
│        │  │  [+ Adicionar item à seção]                         │ │
│        │  └─────────────────────────────────────────────────────┘ │
│        │                                                         │
│        │  ┌─ SEÇÃO 2: Segurança ─────── [↑][↓][✏️][🗑️] ───────┐ │
│        │  │  ...itens...                                        │ │
│        │  │  [+ Adicionar item à seção]                         │ │
│        │  └─────────────────────────────────────────────────────┘ │
│        │                                                         │
│        │  [+ ADICIONAR NOVA SEÇÃO]                               │
│        │                                                         │
│        │  ──────────────────────────────────────────────────     │
│        │  Resumo: 4 seções, 12 itens | Versão atual: nenhuma     │
│        │                                                         │
└────────┴─────────────────────────────────────────────────────────┘
```

### Modal "Editar Item":
```
┌────────────────────────────────────────┐
│ Editar Item                       [X]  │
├────────────────────────────────────────┤
│                                        │
│ Pergunta/Título: *                     │
│ ┌────────────────────────────────────┐ │
│ │ A placa de identificação está...   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Descrição/Ajuda:                       │
│ ┌────────────────────────────────────┐ │
│ │ Verificar se está fixada e legível │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Tipo de resposta: *                    │
│ [CONFORMITY                        ▾] │
│                                        │
│ ☐ Se SINGLE_CHOICE, adicionar opções: │
│   (aparece dinamicamente)              │
│   ┌────────────┐ [+ Adicionar opção]  │
│   │ Opção 1    │ [🗑️]                 │
│   │ Opção 2    │ [🗑️]                 │
│   └────────────┘                       │
│                                        │
│ Configurações:                         │
│ [✅] Item obrigatório                  │
│ [✅] Observação obrigatória na falha   │
│ [✅] Evidência obrigatória na falha    │
│                                        │
│          [Cancelar]  [Salvar]          │
└────────────────────────────────────────┘
```

### Tipos disponíveis no select:
| Valor | Label no select | Descrição para o usuário |
|---|---|---|
| TEXT_SHORT | Texto curto | Resposta de até 255 caracteres |
| TEXT_LONG | Texto longo | Resposta de até 2000 caracteres |
| NUMBER | Número | Valor numérico (ex: medição) |
| BOOLEAN | Sim/Não | Apenas duas opções |
| CONFORMITY | Conforme/Não Conforme | Com opção Não Aplicável |
| SINGLE_CHOICE | Seleção única | Escolha entre opções pré-definidas |
| DATE | Data | Seleção de data |

### Validação para publicar (ao clicar "Publicar"):
```
┌────────────────────────────────────────┐
│ Validação do modelo                    │
├────────────────────────────────────────┤
│ ✅ Título preenchido                   │
│ ✅ Categoria selecionada               │
│ ✅ Pelo menos 1 seção                  │
│ ✅ Todas as seções com itens           │
│ ✅ Todos os itens com tipo definido    │
│ ❌ Seção "Funcionamento" sem itens     │
│                                        │
│ Corrija as pendências para publicar.   │
│                    [OK]                │
└────────────────────────────────────────┘
```

---

## TELA WEB 8: Agendamento de Inspeção (Web Admin)

**Rota:** `/app/inspections/new`

### Layout:
```
┌────────┬─────────────────────────────────────────────────┐
│        │  Nova Inspeção                                   │
│ Sidebar├─────────────────────────────────────────────────┤
│        │                                                 │
│        │  Modelo de inspeção: *                          │
│        │  [Inspeção Preventiva de Compressor         ▾]  │
│        │                                                 │
│        │  Versão: *                                      │
│        │  [Versão 3 (publicada em 15/07/2026)        ▾]  │
│        │                                                 │
│        │  ─── Dados do local ───                         │
│        │                                                 │
│        │  Cliente: *                                     │
│        │  [Indústria Modelo                          ▾]  │
│        │                                                 │
│        │  Local: * (filtrado pelo cliente)               │
│        │  [Unidade Sorocaba                          ▾]  │
│        │                                                 │
│        │  Equipamento: (filtrado pelo local)             │
│        │  [Compressor XPTO 500                       ▾]  │
│        │                                                 │
│        │  ─── Atribuição ───                             │
│        │                                                 │
│        │  Técnico responsável: *                         │
│        │  [Carlos Henrique                           ▾]  │
│        │                                                 │
│        │  Prioridade: *                                  │
│        │  [Média                                     ▾]  │
│        │                                                 │
│        │  Data prevista: *                               │
│        │  [03/08/2026                                📅] │
│        │                                                 │
│        │  Instruções adicionais:                         │
│        │  ┌─────────────────────────────────────────┐    │
│        │  │ Verificar bateria com atenção especial. │    │
│        │  │ Último relatório indicou corrosão.      │    │
│        │  └─────────────────────────────────────────┘    │
│        │                                                 │
│        │  [Cancelar]              [Agendar Inspeção]     │
│        │                                                 │
└────────┴─────────────────────────────────────────────────┘
```

### Comportamento dos selects encadeados:
1. Seleciona **Cliente** → carrega locais desse cliente
2. Seleciona **Local** → carrega equipamentos desse local
3. Se mudar cliente → limpa local e equipamento
4. Se mudar local → limpa equipamento

---

## TELA WEB 9: Lista de Inspeções (Web Admin)

**Rota:** `/app/inspections`

### Layout:
```
┌────────┬──────────────────────────────────────────────────────────┐
│        │  Inspeções                              [+ Nova Inspeção] │
│ Sidebar├──────────────────────────────────────────────────────────┤
│        │  [Estado▾] [Técnico▾] [Cliente▾] [Prioridade▾] [Período] │
│        │  [✅ Atrasadas] [✅ Aguardando revisão]                   │
│        ├──────────────────────────────────────────────────────────┤
│        │                                                          │
│        │  Título       │Cliente    │Técnico│Prior│Data   │Estado│⚙│
│        │  ─────────────────────────────────────────────────────── │
│        │  Compressor   │Ind.Modelo│Carlos │🔴   │03/08  │🟡AND │👁│
│        │  XPTO 500     │          │       │     │       │      │ │
│        │               │          │       │     │       │      │ │
│        │  Gerador      │Log.ABC   │Carlos │🟡   │04/08  │🔵ATR │👁│
│        │  Diesel GD-002│          │       │     │       │      │ │
│        │               │          │       │     │       │      │ │
│        │  Extintor P12 │Ind.Modelo│João   │🟢   │01/08🕐│🔴REP │👁│
│        │               │          │       │     │atrasada│      │ │
│        │               │          │       │     │       │      │ │
│        │  Empilhadeira │Com.Delta │Maria  │🔴   │02/08  │🟣REV │👁│
│        │  01           │          │       │     │       │      │ │
│        │                                                          │
│        │  Mostrando 1-10 de 24        [◄ 1 2 3 ►]                │
└────────┴──────────────────────────────────────────────────────────┘
```

### Badges de estado:
| Estado | Cor | Label |
|---|---|---|
| DRAFT | ⚪ cinza | Rascunho |
| ASSIGNED | 🔵 azul | Atribuída |
| IN_PROGRESS | 🟡 amarelo | Em andamento |
| SUBMITTED | 🟠 laranja | Enviada |
| UNDER_REVIEW | 🟣 roxo | Em revisão |
| APPROVED | 🟢 verde | Aprovada |
| REJECTED | 🔴 vermelho | Reprovada |
| CANCELED | ⚫ cinza escuro | Cancelada |

### Indicadores adicionais:
- 🕐 Ícone de relógio vermelho = atrasada (data < hoje e estado não terminal)
- 📋 Ícone = aguardando revisão

---

## TELA WEB 10: Tela de Revisão ⭐ SEGUNDA TELA MAIS IMPORTANTE

**Rota:** `/app/inspections/:id/review`

### Layout:
```
┌────────┬──────────────────────────────────────────────────────────┐
│        │ Revisão: Inspeção Compressor XPTO          [Aprovar][Rep]│
│ Sidebar├──────────────────────────────────────────────────────────┤
│        │                                                          │
│        │ ┌─ Cabeçalho ──────────────────────────────────────────┐ │
│        │ │ Técnico: Carlos Henrique                             │ │
│        │ │ Início: 03/08/2026 09:15 | Conclusão: 10:05          │ │
│        │ │ Duração: 50 minutos                                  │ │
│        │ │ Localização: -23.5015, -47.4526 [📍 Ver mapa]        │ │
│        │ │ Resultado: 8 conformes, 4 não conformes (66.7%)      │ │
│        │ │ Estado: 🟠 ENVIADA  →  [Iniciar Revisão]             │ │
│        │ └──────────────────────────────────────────────────────┘ │
│        │                                                          │
│        │ ┌─ Seção: Condições Gerais (3/3) ──────────────────────┐ │
│        │ │                                                      │ │
│        │ │  1. Placa de identificação legível?                   │ │
│        │ │     Resposta: ✅ CONFORME                             │ │
│        │ │     Obs: "Placa presente e legível"                   │ │
│        │ │     📷 [foto1.jpg]                                    │ │
│        │ │                                                      │ │
│        │ │  2. Equipamento limpo e conservado?                   │ │
│        │ │     Resposta: ❌ NÃO CONFORME                         │ │
│        │ │     Obs: "Acúmulo de óleo na base"                   │ │
│        │ │     📷 [foto2.jpg]                                    │ │
│        │ │     ⚠️ NC: Acúmulo de óleo (LEVE)                    │ │
│        │ │                                                      │ │
│        │ │  3. Estrutura externa sem danos?                      │ │
│        │ │     Resposta: ✅ CONFORME                             │ │
│        │ │                                                      │ │
│        │ └──────────────────────────────────────────────────────┘ │
│        │                                                          │
│        │ ┌─ Seção: Sistema Elétrico (3/3) ──────────────────────┐ │
│        │ │                                                      │ │
│        │ │  7. Cabos elétricos íntegros?                         │ │
│        │ │     Resposta: ❌ NÃO CONFORME                         │ │
│        │ │     Obs: "Desgaste na cobertura do cabo"             │ │
│        │ │     📷 [foto4.jpg] ← clicável (abre lightbox)        │ │
│        │ │     ⚠️ NC: Cabo danificado (CRÍTICA) 🔴              │ │
│        │ │                                                      │ │
│        │ │  9. Resistência do aterramento?                       │ │
│        │ │     Resposta: 4.2 Ω                                  │ │
│        │ │                                                      │ │
│        │ └──────────────────────────────────────────────────────┘ │
│        │                                                          │
│        │ ┌─ Não Conformidades (4) ──────────────────────────────┐ │
│        │ │ 🔴 Cabo elétrico danificado      │ CRÍTICA │ 1 foto  │ │
│        │ │ 🟡 Etiqueta segurança danificada │ MODERADA│ 1 foto  │ │
│        │ │ 🟡 Vibração acima do padrão      │ MODERADA│ 1 foto  │ │
│        │ │ 🟢 Acúmulo de óleo              │ LEVE    │ 1 foto  │ │
│        │ └──────────────────────────────────────────────────────┘ │
│        │                                                          │
│        │ ┌─ Decisão ────────────────────────────────────────────┐ │
│        │ │                                                      │ │
│        │ │  [  ✅ APROVAR  ]     [  ❌ REPROVAR  ]              │ │
│        │ │                                                      │ │
│        │ └──────────────────────────────────────────────────────┘ │
│        │                                                          │
└────────┴──────────────────────────────────────────────────────────┘
```

### Modal ao clicar "Reprovar":
```
┌────────────────────────────────────────────────┐
│ Reprovar inspeção                         [X]  │
├────────────────────────────────────────────────┤
│                                                │
│ Motivo da reprovação: * (mínimo 10 caracteres) │
│ ┌────────────────────────────────────────────┐ │
│ │ A foto do item 4 não mostra claramente a   │ │
│ │ proteção lateral. Refazer captura.         │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Itens para correção: (opcional)                │
│ ☐ 1. Placa de identificação                   │
│ ☐ 2. Equipamento limpo                        │
│ ☐ 3. Estrutura externa                        │
│ ☑ 4. Proteções mecânicas ← marcado            │
│ ☐ 5. Etiquetas                                │
│ ...                                            │
│                                                │
│         [Cancelar]   [Confirmar Reprovação]    │
└────────────────────────────────────────────────┘
```

### Lightbox de foto (ao clicar em thumbnail):
```
┌────────────────────────────────────────────────┐
│                                           [X]  │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │           FOTO EM TAMANHO REAL           │  │
│  │           (com zoom disponível)          │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Item: Cabos e conexões                        │
│  Data: 03/08/2026 09:36                        │
│  Localização: -23.5015, -47.4526               │
│                                                │
│  [◄ Anterior]              [Próxima ►]         │
└────────────────────────────────────────────────┘
```

---

## TELA WEB 11: Lista de Modelos de Inspeção

**Rota:** `/app/inspection-templates`

### Tabela:
| Título | Categoria | Versão atual | Seções | Itens | Status | Ações |
|---|---|---|---|---|---|---|
| Preventiva Compressor | Manutenção | v3 | 4 | 12 | Ativa | ✏️ 👁️ 📋 |
| Inspeção Extintor | Segurança | v2 | 3 | 8 | Ativa | ✏️ 👁️ 📋 |
| Novo checklist | - | - | 0 | 0 | Rascunho | ✏️ 🗑️ |

- ✏️ = Editar (vai para construtor)
- 👁️ = Prévia do checklist
- 📋 = Ver versões anteriores
- [+ Novo Modelo] no header

---

## TELA WEB 12: Prévia do Modelo

**Rota:** `/app/inspection-templates/:id/preview`

Renderiza o checklist exatamente como o técnico verá no mobile (mas sem interação de resposta). Serve para o supervisor validar antes de publicar.

```
┌────────────────────────────────────────────────┐
│ Prévia: Inspeção Preventiva de Compressor v3   │
├────────────────────────────────────────────────┤
│                                                │
│ ── Seção 1: Condições Gerais ──                │
│                                                │
│ 1. A placa de identificação está legível? *    │
│    [Conforme] [Não Conforme] [N/A]             │
│    📝 Obs obrigatória na falha                 │
│    📷 Evidência obrigatória na falha           │
│                                                │
│ 2. Equipamento limpo e conservado? *           │
│    [Conforme] [Não Conforme] [N/A]             │
│    ...                                         │
│                                                │
│ ── Seção 2: Segurança ──                       │
│ ...                                            │
│                                                │
│        [Voltar para edição] [Publicar]         │
└────────────────────────────────────────────────┘
```

---

## TELA WEB 13: Não Conformidades (Web Admin)

**Rota:** `/app/non-conformities`

### Tabela:
| Título | Inspeção | Item | Criticidade | Status | Data |
|---|---|---|---|---|---|
| Cabo danificado | Compressor XPTO | Cabos elétricos | 🔴 Crítica | Aberta | 03/08 |
| Etiqueta danificada | Compressor XPTO | Sinalização | 🟡 Moderada | Aberta | 03/08 |

### Filtros: criticidade, período, cliente

---

## TELA WEB 14: Auditoria (Web Admin)

**Rota:** `/app/audit`

### Tabela (somente leitura):
| Data/Hora | Usuário | Ação | Entidade | ID |
|---|---|---|---|---|
| 03/08 09:15 | Carlos | INSPECTION_STARTED | Inspection | uuid-123 |
| 03/08 10:05 | Carlos | INSPECTION_COMPLETED | Inspection | uuid-123 |
| 03/08 11:20 | Sistema | SYNC_RECEIVED | Inspection | uuid-123 |
| 03/08 14:00 | Marina | REVIEW_STARTED | Inspection | uuid-123 |
| 03/08 14:30 | Marina | INSPECTION_APPROVED | Inspection | uuid-123 |

### Filtros: ação, entidade, usuário, período

---
---

# PARTE 3: RESUMO PARA O PROTÓTIPO DE SEXTA

## Checklist de telas para o protótipo (prioridade)

### Mobile (11 telas):
| # | Tela | Prioridade para sexta | Dificuldade |
|---|---|---|---|
| 1 | Login | ⭐ ESSENCIAL | Fácil |
| 2 | Home | ⭐ ESSENCIAL | Média |
| 3 | Lista de inspeções | ⭐ ESSENCIAL | Média |
| 4 | Detalhes da inspeção | ⭐ ESSENCIAL | Fácil |
| 5 | Início da inspeção | ⭐ ESSENCIAL | Fácil |
| 6 | Checklist dinâmico | ⭐⭐ MAIS IMPORTANTE | Alta |
| 7 | Captura de foto | ⭐ ESSENCIAL | Média |
| 8 | Scanner QR Code | Pode mockar | Média |
| 9 | Resumo/Conclusão | ⭐ ESSENCIAL | Fácil |
| 10 | Sincronização | Pode simplificar | Fácil |
| 11 | Perfil | Pode simplificar | Fácil |
| 12 | Não conformidades | Pode adiar | Fácil |

### Web Admin (14 telas):
| # | Tela | Prioridade para sexta | Dificuldade |
|---|---|---|---|
| 1 | Login | ⭐ ESSENCIAL | Fácil |
| 2 | Dashboard | Pode simplificar (cards estáticos) | Fácil |
| 3 | Usuários | ⭐ ESSENCIAL | Média |
| 4 | Clientes | ⭐ ESSENCIAL | Média |
| 5 | Locais | ⭐ ESSENCIAL | Média |
| 6 | Equipamentos | ⭐ ESSENCIAL | Média |
| 7 | Construtor de modelos | ⭐⭐ MAIS IMPORTANTE | Alta |
| 8 | Agendamento | ⭐ ESSENCIAL | Média |
| 9 | Lista de inspeções | ⭐ ESSENCIAL | Média |
| 10 | Revisão | ⭐⭐ MUITO IMPORTANTE | Alta |
| 11 | Lista de modelos | ⭐ ESSENCIAL | Fácil |
| 12 | Prévia do modelo | Pode adiar | Fácil |
| 13 | Não conformidades | Pode adiar | Fácil |
| 14 | Auditoria | Pode adiar | Fácil |

---

## Estratégia para sexta-feira

### Se o time é pequeno (2-3 pessoas no front):

**Dia 1-2: Estrutura + Design System**
- Criar projetos (Expo + Angular)
- Configurar rotas e layout
- Criar componentes base (Button, Card, Badge, Input, Table)
- Definir tema de cores

**Dia 3-4: Telas com dados mockados**
- Mobile: Login → Home → Lista → Detalhes → Checklist (PRIORIDADE)
- Web: Login → Layout → Cadastros → Construtor de modelos (PRIORIDADE)

**Dia 5: Polimento + Fluxo demo**
- Garantir que dá para navegar por todo o fluxo
- Dados hardcoded que contam uma história coerente
- Testar a apresentação

### Dados mockados sugeridos:
Use o exemplo do compressor (Anexo C da documentação do professor):
- Cliente: Indústria Modelo
- Local: Unidade Sorocaba
- Equipamento: Compressor XPTO 500
- Modelo: 4 seções, 12 itens
- Técnico: Carlos
- Supervisora: Marina

Assim a demo fica coerente com o que o professor espera ver.

---

## Fluxo da Apresentação (roteiro sugerido)

1. **Supervisora (web):** Mostra modelo de inspeção já criado
2. **Supervisora (web):** Agenda inspeção → seleciona cliente/local/equip/técnico
3. **Técnico (mobile):** Abre app → vê inspeção na lista
4. **Técnico (mobile):** Abre detalhes → inicia
5. **Técnico (mobile):** Preenche checklist (mostrar 2-3 tipos diferentes)
6. **Técnico (mobile):** Tira foto → vincula ao item
7. **Técnico (mobile):** Cria uma não conformidade
8. **Técnico (mobile):** Conclui → mostra "Aguardando sync"
9. **Supervisora (web):** Vê inspeção como "Enviada" → abre revisão
10. **Supervisora (web):** Visualiza respostas + fotos → aprova

Esse fluxo em 10 passos demonstra o MVP inteiro.
