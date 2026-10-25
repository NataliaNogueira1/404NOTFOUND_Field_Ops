# Resposta à auditoria da IA (Grupo C — Toyota) — 20/10/2026

> Este documento responde, ponto a ponto, à auditoria automatizada aplicada pelo
> avaliador em 20/10/2026 sobre a branch `develop`. O objetivo é **recuperar os pontos
> que não foram atribuídos por falta de execução/evidência** (não por falha de
> implementação) e corrigir divergências factuais.
>
> Princípio que seguimos: concordamos com a auditoria em que **código existir não
> comprova aceite**. Por isso, para cada ponto, apontamos onde está o código, a issue,
> o teste e **como executar/validar** — e, onde a execução ainda não foi registrada,
> dizemos isso com honestidade e indicamos o próximo passo.

Última atualização: _preencher ao revisar_.

---

## 1. Diagnóstico da nota diagnóstica (69/100)

A própria auditoria registra que a nota é **diagnóstica, não oficial**, e que
*"pontos de demonstração/defesa não foram concedidos porque não houve avaliação, não
porque os alunos falharam"*. A leitura dos critérios confirma que a maior parte do que
falta é **evidência de execução**, não funcionalidade:

| Critério (máx.) | Nota diag. | Natureza do que faltou |
|---|---|---|
| Demonstração/defesa (4) | 0 | Não houve execução/defesa — recuperável com evidência E2E registrada. |
| Offline/sincronização (15) | 8 | Código e testes existem; falta E2E em dispositivo registrado. |
| Recursos nativos (10) | 6 | QR/câmera/GPS no código; falta validação em dispositivo. |
| Testes/segurança (7) | 4 | API PASS; Mobile Jest não reproduzido; `npm audit` sem número atual. |
| Mobile (20) | 15 | Arquitetura/funcionalidades presentes; aceite não homologado. |

**Conclusão:** o caminho para subir a nota é **executar e registrar** (E2E, Jest,
`npm audit`) e **integrar na `develop` o código que hoje está em branches** — não
reimplementar.

---

## 2. Resposta às pendências citadas nas issues

| Issue | Alegação da auditoria | Nossa resposta | Status / ação |
|---|---|---|---|
| #263 | Detalhe de cliente usa mocks | Correto na `develop`. Há código real em `feat/client-details-api-integration` (não mergeado). | Integrar branch e validar; issue **OPEN**. |
| #264 | Detalhe de localização usa mocks | Issue **CLOSED**; integração de detalhe de local foi feita. | Confirmar na UI e registrar evidência. |
| #262 | Motivo/autor/data de cancelamento não exibidos | Pendente de UI na tela de detalhes. | Issue **OPEN** — implementar. |
| #259 | 75 vulnerabilidades no mobile (snapshot) | A auditoria admite ser **snapshot**. Issue **CLOSED** (fix de `npm audit` mobile). | Rodar `npm audit` atual e registrar em [`seguranca-dependencias.md`](seguranca-dependencias.md). |
| #260 | 6 vulnerabilidades no web (snapshot) | Issue **OPEN**. | Rodar `npm audit` atual, corrigir e registrar. |
| #265 | Usabilidade/acessibilidade do campo de senha | Código em `feat/web-password-toggle-login` (não mergeado). | Integrar branch; issue **OPEN**. |
| #258 | Seed com mais estados de inspeção | Seed existe; ampliação pedida. | Issue **OPEN** — ampliar seed. |

---

## 3. Resposta aos blockers de demonstração

A auditoria não executou o sistema (sem APK, sem URL pública, sem Jest, sem E2E). Abaixo,
o estado real de cada blocker e o que falta para a evidência.

| Blocker | Estado real | O que falta |
|---|---|---|
| **#229 — upload de evidência** | Código pronto em `feat/mobile-evidence-upload-sync` (`feat: enable evidence photo upload to backend`); endpoint `POST /inspections/{id}/evidence` existe no backend; flag `EXPO_PUBLIC_EVIDENCE_UPLOAD`. | Integrar a branch na `develop`, habilitar a flag e registrar o fluxo foto → sync → revisão. |
| **#65 — GPS na conclusão** | Código em `feat/pbi-045-end-location` (**não mergeado**). Issue está **CLOSED** — inconsistência. | Integrar na `develop`, validar em dispositivo e reabrir/registrar a issue. |
| **#89 — publicação do painel web** | CI existe (`frontend-ci.yml`); publicação não configurada. | Publicar (arquitetura AWS prevista) e registrar URL. |
| **#204 — API pública/CORS** | Código em `fix/204-render-datasource-config` (**não mergeado**). Issue **CLOSED** — inconsistência. | Integrar, publicar API e registrar smoke test. |
| **#88 — APK instalado** | `eas.json` com perfil APK; sem artefato registrado. | Gerar APK, instalar e identificar build na evidência. |
| **#85 — testes Mobile reproduzíveis** | Issue **CLOSED**; testes existem; Jest não reproduzido na auditoria. | Preparar toolchain, rodar Jest e colar resultado em [`test-results.md`](test-results.md). |

---

## 4. Correções factuais à auditoria

Pontos em que a auditoria está desatualizada em relação ao código/estado atual
(verificados na [análise de sprint](../analises/sprints/analise-sprint1-back-web.md)):

- **Stack do web:** a auditoria usa a rubrica corretamente, mas vale reforçar que o web
  é **React 19 + Vite + TypeScript** (não Angular), confirmado em `frontend/package.json`
  e `frontend/vite.config.ts`.
- **QR Code:** está implementado com `CameraView`/`expo-camera` (PBI-041 ✅), sem botão
  "simular leitura". Falta apenas validar em dispositivo.
- **Pull incremental (cursor):** implementado (PBI-053 ✅), com `pullChanges(cursor)`.
- **Sync de respostas e NCs:** enviados via batch idempotente (PBI-051/052 ✅).
- **Comentários de revisão e dashboard:** integrados ao backend real (PBI-089/083 ✅).
- **#264 e #259:** estão **fechadas** — não devem ser apresentadas como pendências ativas.

> Importante: estas correções **não contestam** a postura da auditoria de exigir
> execução. Elas apenas evitam que itens já resolvidos no código sejam contados como
> ausentes.

---

## 5. Divergências de processo que vamos corrigir

A auditoria desconfiou (com razão) de "fechamento administrativo de issues". Encontramos
e vamos corrigir casos de **issue fechada com código fora da `develop`**:

- #65 (GPS conclusão), #204 (API pública), #79 (iniciar revisão), #148 (assinatura, P1).

Ação: reabrir/registrar essas issues, integrar as branches na `develop` e **só manter
fechado o que estiver efetivamente na branch avaliada**. Detalhe em
[`matriz-rastreabilidade.md`](matriz-rastreabilidade.md) (seção 3.1).

---

## 6. Plano de recuperação de pontos (ordem sugerida)

1. **Integrar na `develop`** (com revisão/PR): #229 (upload), #65 (GPS conclusão),
   #204 (API pública), #79 (iniciar revisão), #263 (detalhe cliente), #265 (senha).
2. **Publicar** API e Web (arquitetura AWS — issues #305–#316) e registrar URLs.
3. **Gerar e instalar o APK** (#88) e identificar o build.
4. **Executar e registrar**: Jest Mobile (#85), `npm audit` web/mobile (#259/#260),
   e o **cenário E2E** do [`demo-runbook.md`](demo-runbook.md) em
   [`evidencias-e2e.md`](evidencias-e2e.md).
5. **Atualizar** [`test-results.md`](test-results.md) e
   [`matriz-rastreabilidade.md`](matriz-rastreabilidade.md) com os resultados reais.

---

## 7. Referências

- [Matriz de rastreabilidade](matriz-rastreabilidade.md)
- [Evidências E2E (a preencher)](evidencias-e2e.md)
- [Segurança de dependências (a preencher)](seguranca-dependencias.md)
- [Registro de testes](test-results.md)
- [Roteiro de demonstração E2E](demo-runbook.md)
- [Limitações conhecidas](known-limitations.md)
- [Análise de sprint](../analises/sprints/analise-sprint1-back-web.md)
