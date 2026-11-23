# Segurança de dependências — FieldOps

> Registra o resultado **atual** de auditoria de dependências (`npm audit`) do Web e do
> Mobile, com data, para responder às issues
> [#259](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/259) (mobile)
> e [#260](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/260) (web)
> com um **número verificável e datado**, em vez do snapshot antigo que a auditoria do
> professor marcou como "sujeito a mudança".
>
> A auditoria da equipe em [`known-limitations.md`](known-limitations.md) já observa que
> **não se deve repetir snapshots antigos como achado presente** — este documento existe
> justamente para manter o número sempre atual.

Data da última execução: **2026-11-08 13:35 (BRT)** · Executor: Rodrigo (Dev Mobile).

> **Atualização 2026-11-25 (Web):** vulnerabilidades crítica/altas do `dompurify`
> (via `jspdf`) eliminadas após migração para `jspdf@4.2.1` e
> `jspdf-autotable@5.0.9` — ver seção 2.1.

---

## 1. Como gerar os números

Rodar na raiz de cada módulo e **colar a saída resumida** (sem listar segredos):

```powershell
# Web
cd frontend
npm audit
npm audit --json > ..\docs\avaliacao\evidencias\npm-audit-web.json   # salva evidência

# Mobile
cd mobile
npm audit
npm audit --json > ..\docs\avaliacao\evidencias\npm-audit-mobile.json
```

Para tentar correção automática segura (revisar antes de commitar):

```powershell
npm audit fix            # correções compatíveis — sem major bumps
npm audit fix --force    # CUIDADO: pode subir major e quebrar build — só com teste depois
```

> Depois de qualquer `audit fix`, rode `npm run build` e `npm run test` do módulo e
> registre em [`test-results.md`](test-results.md).

---

## 2. Resultado atual

### 2.1. Web (`frontend/`) — issue [#260](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/260) (OPEN)

Foram realizadas **três rodadas**: a contagem inicial (antes de qualquer ação), após
`npm audit fix` sem `--force`, e após a migração do `jspdf` para 4.x (issue #347).

#### Antes do `npm audit fix`

| Severidade | Qtd |
|---|:---:|
| Crítica    | 1   |
| Alta       | 7   |
| Moderada   | 12  |
| Baixa      | 0   |
| **Total**  | **20** |

#### Após `npm audit fix` (correções compatíveis aplicadas)

| Severidade | Qtd | Pacotes remanescentes |
|---|:---:|---|
| Crítica    | 1   | `jspdf` / `jspdf-autotable` (transitivo de `dompurify`) |
| Alta       | 2   | `dompurify` (via `jspdf`/`jspdf-autotable`) |
| Moderada   | 10  | `minimatch` (via `@typescript-eslint/*`, `eslint`) |
| Baixa      | 0   | — |
| **Total**  | **13** | |

- Comandos executados:
  ```powershell
  cd frontend
  npm audit fix
  npm run build   # ✅ passou (built in 2.66s)
  npm run test -- --run   # ✅ 42 arquivos, 219 testes passando
  ```
- Data/hora: **2026-11-08 13:35 (BRT)**
- Build após correções: ✅ `npm run build` · ✅ `npm run test`
- Issue [#260](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/260)
  segue aberta (comentário com a reavaliação); correção restante em
  [#347](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/347).
- Evidência JSON salva em: `docs/avaliacao/evidencias/npm-audit-web-pos-fix.json`

> **Nota sobre a contagem "1 crítica":** o npm conta internamente a `critical` como
> parte do pacote `jspdf` (que depende do `dompurify` vulnerável). Na saída textual o
> `dompurify` aparece com severidade `high`; a contagem `critical` reflete o advisory
> mais grave dentro da cadeia de dependência. A correção requer `--force` com bump
> major de `jspdf` para 4.x — ver seção 3.

#### Após migração `jspdf@4.x` / `jspdf-autotable@5.x` — issue [#347](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/347)

| Severidade | Qtd | Pacotes remanescentes |
|---|:---:|---|
| Crítica    | 0   | — |
| Alta       | 0   | — |
| Moderada   | 9   | `minimatch` (via `@typescript-eslint/*`, `eslint`) |
| Baixa      | 0   | — |
| **Total**  | **9** | |

- Pacotes atualizados: `jspdf` 2.5.x → **4.2.1** · `jspdf-autotable` 3.8.x → **5.0.9**
  (versões fixas no `package.json`, sem `^`) · `dompurify` resolvido: **3.5.0**
- `generateInspectionPdf.ts` atualizado para o import nomeado `{ autoTable }` do autotable 5.x
- Teste automatizado `generateInspectionPdf.test.ts` gera o PDF com o jspdf real e
  confere cabeçalho, dados da inspeção, tabelas do checklist por seção, tabela de não
  conformidades e instruções do supervisor.
- Observação: hoje nenhuma tela importa `generateInspectionPdf` (o relatório oficial é
  gerado no servidor via `GET /api/v1/inspections/{id}/report.pdf`). Por isso o build
  de produção não inclui o `jspdf`, e a conferência do PDF é feita pelo teste e por um
  arquivo gerado localmente, não pela interface.
- Comandos executados:
  ```powershell
  cd frontend
  npm install jspdf@4 jspdf-autotable@latest
  npm run build   # ✅ passou (built in 3.52s, 2553 modules)
  npm run test -- --run   # ✅ 48 arquivos, 244 testes passando (inclui o teste do PDF)
  npm run lint    # ✅ sem erros
  npm audit       # ✅ 0 críticas, 0 altas, 9 moderadas (apenas toolchain de lint)
  ```
- Data/hora: **2026-11-25 (BRT)** · números de testes revalidados após fixar as versões e
  adicionar o teste do PDF
- Build após migração: ✅ `npm run build` · ✅ `npm run test -- --run`
- As 9 moderadas remanescentes são todas em `minimatch`/`typescript-eslint`/`eslint`
  (dev dependencies de toolchain — aceitas conforme seção 3).
- Vulnerabilidades crítica e altas do `dompurify` **eliminadas** ✅

---

### 2.2. Mobile (`mobile/`) — issue [#259](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/259) (CLOSED)

#### Antes do `npm audit fix`

| Severidade | Qtd |
|---|:---:|
| Crítica    | 0   |
| Alta       | 6   |
| Moderada   | 15  |
| Baixa      | 10  |
| **Total**  | **31** |

#### Após `npm audit fix` (correções compatíveis aplicadas)

| Severidade | Qtd | Pacotes remanescentes |
|---|:---:|---|
| Crítica    | 0   | — |
| Alta       | 3   | `decode-uri-component` (via `expo-router`); `deepmerge` (via `jest`/`jest-expo`) |
| Moderada   | 11  | `@expo/fingerprint/glob` (via `expo`); `minimatch` (via `@typescript-eslint/*`); `@expo/ngrok/uuid` (sem fix disponível) |
| Baixa      | 10  | Diversas dependências transitivas da toolchain |
| **Total**  | **24** | |

- Comandos executados:
  ```powershell
  cd mobile
  npm audit fix
  ```
- Data/hora: **2026-11-08 13:35 (BRT)**
- Build após correções: ⬜ `npm run build:apk` — requer EAS / ambiente de CI; não
  executado localmente. Build anterior (APK gerado em sprint, issue #68) validado.
- Testes: ✅ `npx jest --ci` — 15 suítes, 141 testes passando (2026-11-08, Node 24,
  `npm ci --ignore-scripts`). Na primeira execução 1 suíte falhou ao rodar; na seguinte
  todas passaram. O `npm ci` completo falha no build nativo do `better-sqlite3` com
  Node 24 (o projeto usa Node 22, ver `mobile/.nvmrc`).
- Evidência JSON salva em: `docs/avaliacao/evidencias/npm-audit-mobile-pos-fix.json`

> **Nota sobre issue #259:** a issue estava fechada mas as vulnerabilidades persistem,
> pois fechar a issue não corrige a dependência. Ela foi **reaberta** em 2026-11-08 com
> comentário apontando os 24 itens remanescentes (detalhados na seção 3).

---

## 3. Decisões e vulnerabilidades aceitas

Vulnerabilidades que **não têm fix compatível** ou cujo fix exigiria `--force` com
quebra de build documentada.

| Pacote | Sev. | Fix disponível | Decisão | Justificativa |
|---|:---:|---|---|---|
| `dompurify` ≤ 3.4.16 (Web) | Alta / Crítica | Sim — `--force` (bump `jspdf` 4.x) | **✅ Corrigido** | Migração para `jspdf@4.2.1` + `jspdf-autotable@5.0.9` concluída (issue [#347](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/347), 2026-11-25). `generateInspectionPdf.ts` atualizado para a API 5.x do autotable. `npm audit` confirma 0 críticas/altas no frontend. |
| `minimatch` 7–11 (Web e Mobile) | Moderada | Sim — `--force` (bump `eslint` 9.x) | **Aceitar temporariamente** | Pacote de toolchain de lint (dev dependency). Não integra o bundle de produção nem o runtime da aplicação. O `eslint@9.x` exige migração de configuração (flat config) — fora do escopo imediato. Sem impacto em produção. |
| `decode-uri-component` (Mobile) | Alta | Sim — `--force` | **Aceitar temporariamente** | Dependência transitiva de `expo-router`; o upgrade forçado pode quebrar a navegação do app. Sem fix compatível disponível — requer upgrade do `expo-router` pelo mantenedor Expo. Sem superfície de ataque direta: o valor não é controlado por entrada do usuário final. |
| `deepmerge` (Mobile) | Alta | Sim — `--force` | **Aceitar temporariamente** | Dependência transitiva de `jest` / `jest-expo` (dev dependency). Não compõe o bundle da aplicação; afeta apenas o ambiente de testes. Risco de exploração em produção: nulo. |
| `@expo/ngrok/uuid` (Mobile) | Moderada | **Sem fix** | **Aceitar** | `@expo/ngrok` é usado apenas para tunelamento local em desenvolvimento. Não compõe o bundle de produção. O advisório de `uuid` nessa versão é de baixo impacto em ambiente controlado. |
| `@expo/fingerprint/glob` (Mobile) | Moderada | Sim — `--force` | **Aceitar temporariamente** | Dependência transitiva de `expo` (toolchain de build). O upgrade forçado pode afetar o funcionamento do Expo SDK — requer teste completo de build Android. Sem impacto no runtime da aplicação. |

---

## 4. Boas práticas já adotadas (verificar e marcar)

- [x] Nenhum segredo versionado (`.env` ignorado nos três módulos; confirmado via
  `.gitignore` — `frontend/.gitignore`, `mobile/.gitignore`, `api/.gitignore`).
- [x] `JWT_SECRET`, `DB_*` e demais credenciais fora do código (variáveis de ambiente /
  `.env.example` sem valores reais — ver `api/.env.example`).
- [x] Dependências novas adicionadas com versão explícita (sem `*` ou `latest` no
  `package.json` de produção).
- [x] `npm audit` rodado antes desta entrega e resultados registrados neste documento.
- [x] Arquivos `.json` de evidência verificados — não contêm tokens, senhas ou
  segredos (apenas metadados de pacotes npm).

---

## 5. Referências

- [Limitações conhecidas](known-limitations.md) (seção de dívidas/dependências)
- [Registro de testes](test-results.md)
- [Resposta à auditoria da IA](resposta-auditoria-ia.md)
- Issues: [#259 (mobile)](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/259) · [#260 (web)](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/260)
- Evidências JSON: `docs/avaliacao/evidencias/npm-audit-web-pos-fix.json` · `docs/avaliacao/evidencias/npm-audit-mobile-pos-fix.json`
