# Evidências de execução ponta a ponta (E2E) — FieldOps

> **TEMPLATE PARA PREENCHER.** Este documento guarda as **provas de que o fluxo
> completo foi executado de verdade** (Web + API + Mobile juntos), que é o que a rubrica
> do professor exige para conceder os pontos de **Demonstração/defesa** e para homologar
> Offline/sync e Recursos nativos.
>
> "E2E" = *end-to-end* (ponta a ponta): o caminho real do usuário atravessando os três
> sistemas, do planejamento no Web até a auditoria final.
>
> **Regra obrigatória (rubrica, seção 19):** a evidência deve ser do **fluxo real pela
> interface**. Não vale print do Swagger, edição manual de banco/SQLite, mock de API nem
> manipulação artificial para forçar sucesso. Reiniciar serviço/app e repetir o passo é
> permitido; ocultar falha não é.

Responsável pelo registro: _preencher_ · Data da execução: _preencher_.

---

## 1. Como preencher

Para **cada passo executado**, registre:

1. **Screenshot ou gravação curta** (arquivo em `docs/avaliacao/evidencias/` — ver
   convenção de nomes abaixo; **não** versionar vídeos grandes, preferir link).
2. **Data/hora** e **ambiente** (local / AWS / Render).
3. **URL usada** (se pública) e **identificação do build/APK**.
4. **Perfil** utilizado (ADMINISTRATOR / SUPERVISOR / TECHNICIAN) — **sem senha**.
5. **Resultado esperado × observado**.
6. **Logs de erro** (se houver, **sem segredos**).
7. **Issue/PR** relacionado, quando pertinente.

Marque cada linha como: ✅ OK · ⚠️ OK com ressalva · ❌ Falhou · ⬜ Não executado.

> Convenção de nome de arquivo de evidência: `e2e-<passo>-<AAAAMMDD>.png|mp4`
> (ex.: `e2e-foto-revisao-20261101.png`).

---

## 2. Ambiente da execução (preencher uma vez por rodada)

| Item | Valor | Observação |
|---|---|---|
| Data/hora | | |
| Ambiente da API | | local / Docker / AWS / Render — URL |
| Ambiente do Web | | local / AWS — URL |
| Build/APK do Mobile | | perfil EAS + identificador do build |
| Dispositivo Android | | modelo / versão do Android |
| Seed utilizado | | `demo` / dados criados pela UI |
| Executor(es) | | nome(s) |

---

## 3. Fluxo principal E2E (espelha o `demo-runbook.md`, seção 4)

| # | Passo | Perfil | Evidência (arquivo/link) | Esperado × Observado | Status |
|---|---|---|---|---|---|
| 1 | Login administrativo no Web | ADMIN | | | ⬜ |
| 2 | Preparar dados (cliente/local/equip. com QR) pela UI | ADMIN | | | ⬜ |
| 3 | Selecionar/criar template com item obrigatório e NC | SUPERVISOR | | | ⬜ |
| 4 | Publicar versão do template | SUPERVISOR | | | ⬜ |
| 5 | Criar e agendar inspeção, atribuir ao técnico | ADMIN/SUP | | | ⬜ |
| 6 | Login técnico no Mobile (APK) | TECHNICIAN | | | ⬜ |
| 7 | Baixar e abrir a inspeção (pull/sync) | TECHNICIAN | | | ⬜ |
| 8 | Iniciar inspeção (horário + GPS início) | TECHNICIAN | | | ⬜ |
| 9 | Confirmar equipamento por QR Code (dispositivo) | TECHNICIAN | | | ⬜ |
| 10 | Preencher checklist + observação + 1 NC | TECHNICIAN | | | ⬜ |
| 11 | Capturar fotografia do item | TECHNICIAN | | | ⬜ |
| 12 | Registrar localização | TECHNICIAN | | | ⬜ |
| 13 | **Entrar em modo offline** (desligar rede) e continuar | TECHNICIAN | | | ⬜ |
| 14 | Confirmar persistência local (reabrir inspeção/app) | TECHNICIAN | | | ⬜ |
| 15 | Reconectar e sincronizar | TECHNICIAN | | | ⬜ |
| 16 | **Repetir sync/retry sem editar** → sem duplicidade | TECHNICIAN | | | ⬜ |
| 17 | Abrir revisão no Web, iniciar revisão | SUPERVISOR | | | ⬜ |
| 18 | Verificar respostas, NCs, **foto** e **GPS** | SUPERVISOR | | | ⬜ |
| 19 | Comentar por item e reprovar com motivo | SUPERVISOR | | | ⬜ |
| 20 | Corrigir no Mobile (puxar decisão, ajustar, reenviar) | TECHNICIAN | | | ⬜ |
| 21 | Aprovar o reenvio | SUPERVISOR | | | ⬜ |
| 22 | Consultar histórico/auditoria do ciclo | SUPERVISOR | | | ⬜ |

**Critério de sucesso do fluxo principal:** uma inspeção criada no Web é executada no
Mobile, permanece utilizável sem rede, sincroniza sem duplicar, é reprovada, corrigida,
reenviada, aprovada e deixa auditoria visível.

---

## 4. Validação offline (detalhe — `demo-runbook.md`, seção 5)

| # | Verificação | Evidência | Status |
|---|---|---|---|
| O1 | Baixar online, desligar rede, abrir inspeção sem rede | | ⬜ |
| O2 | Alterar respostas/NCs offline e confirmar persistência | | ⬜ |
| O3 | Fechar/reabrir app e recuperar o estado | | ⬜ |
| O4 | Religar rede e sincronizar | | ⬜ |
| O5 | Repetir sync sem novas edições (sem duplicidade no Web) | | ⬜ |
| O6 | Forçar falha de rede no envio e testar retry sem editar dados | | ⬜ |

---

## 5. Recursos nativos (detalhe — `demo-runbook.md`, seção 6)

| Recurso | Evidência | Esperado × Observado | Status |
|---|---|---|---|
| QR Code (dispositivo) | | | ⬜ |
| Câmera/foto (captura local) | | | ⬜ |
| Upload de foto → aparece na revisão Web (#229) | | | ⬜ |
| Localização no início | | | ⬜ |
| GPS na conclusão (#65) | | | ⬜ |
| Permissões (conceder e recusar) | | | ⬜ |

---

## 6. Pendências/observações da execução

> Registrar aqui qualquer passo que ficou ❌/⚠️, com causa e próximo passo. Não declarar
> como aprovado um passo que não foi executado.

- _preencher_

---

## 7. Referências

- [Roteiro de demonstração E2E](demo-runbook.md)
- [Registro de testes](test-results.md)
- [Matriz de rastreabilidade](matriz-rastreabilidade.md)
- [Limitações conhecidas](known-limitations.md)
