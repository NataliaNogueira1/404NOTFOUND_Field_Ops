# Distribuição de issues não atribuídas

> Critério: quem tem **menos commits recebe mais issues** (peso inverso ao número de
> commits). A Natália ficou **de fora** (0 issues) a pedido da equipe.
> Total distribuído: **28 issues** entre **8 pessoas**.
>
> Esta versão aplica as **restrições pedidas pela equipe**: algumas issues foram
> recusadas por certas pessoas e **redistribuídas** entre as demais (ninguém recebe de
> volta o que recusou; a Natália continua com 0).
>
> Os números de commit consideram **todas as branches** (locais e remotas, inclusive as
> que ainda não entraram na `develop`), sem commits de merge, agrupando identidades
> duplicadas (mesmo autor com nomes/emails diferentes).
>
> A lista de cada pessoa mistura as issues recém-distribuídas com as que ela **já tinha
> atribuídas** no board (excluindo as que estão na coluna **Done**). As issues já
> existentes aparecem sem descrição detalhada, apenas com o status atual entre parênteses.
> Algumas issues (ex.: #92, #197, #302) são épicos/tarefas compartilhadas e aparecem em
> mais de uma pessoa. O contador "Qtde de issues" do resumo conta **apenas as 28
> recém-distribuídas**, não as prévias.

## Resumo

| Pessoa | Commits | Total de issues | Novas | Prévias |
|--------|--------:|:---------------:|:-----:|:-------:|
| Caroline Arruda | 21 | 11 | 6 | 5 |
| Ian Lucas | 29 | 7 | 4 | 3 |
| Andressa Bartolomeu | 36 | 8 | 4 | 4 |
| Felipe (Cutiur) | 39 | 7 | 2 (1 compart.) | 5 |
| Júlia Paes | 47 | 4 | 2 | 2 |
| Marcela Mulato | 51 | 9 | 4 | 5 |
| Rodrigo Soares | 60 | 7 | 3 (1 compart.) | 4 |
| Lucas Miguel | 68 | 9 | 4 | 5 |
| Natália Nogueira | 245 | 0 | 0 | 0 |
| **Total distribuído (novas)** | | | **28** | |

> Observação: o total por pessoa inclui issues já existentes. Issues compartilhadas
> (ex.: #92, #197, #302) são contadas em cada pessoa que as possui, então a soma dos
> totais individuais é maior que o número de issues distintas.

---

## Caroline Arruda — 21 commits — 11 issues (6 novas + 5 prévias)

- **#288 — Adaptar elementos pré-textuais ao template de Relatório Final (capa, resumo, sumário)**
  Capa e folha de rosto (trocar `<NOME>`/`<TÍTULO>`), Resumo/Abstract do FieldOps,
  3 palavras-chave, listas (figuras/tabelas/siglas) e sumário final. Remover o texto
  de sustentabilidade do modelo. Size M, P1.
- **#289 — Adaptar Capítulo 1 - Introdução**
  1.1 contexto/restrições, 1.2 justificativa + objetivos, 1.3 metodologia e ferramentas
  de gestão. Status: parcial.
- **#290 — Adaptar Capítulo 2 - Gerenciamento da Integração**
  Derivar do Termo de Abertura (TAP) e da visão geral. Status: parcial.
- **#291 — Adaptar Capítulo 3 - Escopo e EAP**
  Gerenciamento do escopo, incluindo a EAP.
- **#292 — Adaptar Capítulo 4 - Cronograma e Roadmap**
  Gerenciamento do tempo/cronograma (no template aparece como "Gerenciamento do Tempo").
- **#299 — Adaptar Capítulo 10 - Gerenciamento das Aquisições**
  Capítulo de aquisições conforme o template.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco: login admin,
  cadastro de cliente/local/equipamento, modelo publicado, agendamento, login do técnico,
  execução offline, sync sem duplicidade, revisão e aprovação. P0.
- **#258 — Popular seed com ao menos dois exemplos de cada estado de inspeção** _(Ready)_
  Estender o `DemoSeedRunner` para gerar ≥2 inspeções em cada estado (ASSIGNED, IN_PROGRESS,
  SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELED), de forma idempotente e usando os
  fluxos reais de domínio. P1, Size M.
- **#262 — Exibir justificativa de cancelamento na tela de detalhes da inspeção** _(In progress)_
  Mostrar o motivo, quem cancelou e quando (`canceledReason/By/At`) na tela de detalhes
  quando a inspeção está CANCELADA; o bloco não deve aparecer em outros estados. P1, Size S.
- **#263 — Integrar página de detalhes do cliente com a API real** _(In review)_
  Trocar os dados mock (`@/mocks/domain`) da página de detalhe do cliente por
  `GET /api/v1/clients/{id}`, com estados de loading/erro/vazio. P1, Size S.
- **#273 — Mobile: visualizar inspeção após envio (estado ENVIADA/APROVADA)** _(In review)_
  Garantir que inspeções SUBMITTED/APPROVED apareçam na listagem e sejam navegáveis em
  modo somente-leitura (sem botão de ação), funcionando offline via SQLite.

## Ian Lucas — 29 commits — 7 issues (4 novas + 3 prévias)

- **#307 — Configurar LabRole como instance profile da EC2 (acesso ao S3)**
  Anexar o `LabRole` à EC2 para o SDK S3 obter credencial via metadata, sem chave no
  `.env`. Depende de: EC2 e bucket S3.
- **#308 — Criar bucket S3 privado para evidências**
  Bucket privado com Block Public Access, acesso só via LabRole, acesso anônimo retorna
  403. Base para o `S3EvidenceStorage`.
- **#310 — Expor fotos do S3 via presigned URL para o Web Admin**
  Método de presigned URL (GET temporário) no port, implementado no `S3EvidenceStorage`
  e exposto no endpoint de evidências (revisão/lightbox). Depende de: #309.
- **#312 — Configurar CloudFront (HTTPS + DNS estável) para web e API**
  Distribuição CloudFront como frente única: origem S3 (default, com cache) + origem EC2
  (`/api/*`, sem cache, repassa `Authorization`). HTTPS em `*.cloudfront.net`, fallback
  SPA. Risco nº1 do Teste 01. Depende de: #306 e #311.
- **#89 — PBI-069: Build e publicação do painel web admin** _(Ready; issue fechada)_
  Gerar build estático do painel publicável em qualquer servidor estático, com URL da API
  por variável de ambiente e funcionando com a API de demonstração. P0.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#147 — PBI-084: Notificações locais de prazo** _(In progress)_
  Notificações locais no mobile (offline, via `expo-notifications`) agendadas a partir do
  `dueDate` das inspeções, com lembrete, reagendamento após sync e tratamento de permissão. P1.

## Andressa Bartolomeu — 36 commits — 8 issues (4 novas + 4 prévias)

- **#296 — Adaptar Capítulo 7 - Gerenciamento dos Recursos Humanos**
  Capítulo de recursos (no template, "Recursos Humanos").
- **#297 — Adaptar Capítulo 8 - Gerenciamento das Comunicações**
  Capítulo de comunicações conforme o template.
- **#298 — Adaptar Capítulo 9 - Gerenciamento dos Riscos**
  Capítulo de riscos conforme o template.
- **#293 — Adaptar Capítulo 5 - Gerenciamento dos Custos**
  Capítulo de custos conforme o template.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#246 — Tornar o botão Versões útil na tela de modelos** _(In progress)_
  Parte A (só frontend): ligar o botão "Versões" a um modal que lista as versões publicadas
  do modelo via endpoint existente. Parte B (exige backend, decidir antes): alternar a versão
  ativa — pode conflitar com a regra de imutabilidade de versão. P1.
- **#255 — Exibir fotos das não conformidades para supervisor/admin** _(In progress)_
  No detalhe da NC (`NonConformitiesPage`), carregar e exibir as evidências fotográficas já
  vinculadas, reaproveitando o lightbox da tela de revisão (download autenticado). P1, Size M.
- **#322 — Corrigir bugs da assinatura no dispositivo (PBI-086)** _(In progress)_
  Corrigir o offset de toque no canvas e o preview incorreto da assinatura; decidir entre as
  duas implementações concorrentes e deixar só uma na `develop`, sem código morto.

## Felipe (Cutiur) — 39 commits — 7 issues (2 novas, 1 compart. + 5 prévias)

- **#294 — Adaptar Capítulo 6 - Gerenciamento da Qualidade**
  Capítulo de qualidade conforme o template.
- **#320 — Executar demo E2E e preencher evidências de execução** _(compartilhada com Rodrigo Soares)_
  Rodar os 22 passos do `demo-runbook.md` + validação offline (sync sem duplicar) +
  recursos nativos (QR, foto, GPS, permissões), registrando prints/vídeos em
  `evidencias-e2e.md`. Proíbe Swagger/banco manual/mock. Tem blockers (#88, #89, #204,
  #229, #65).
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox do app com os endpoints reais (respostas, evidências, NCs),
  com pull incremental por cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#229 — Mobile: enviar upload de evidência (foto) para o backend** _(Blocked)_
  Ajustar o `EvidenceUploadClient` ao contrato real do endpoint de upload (arquivo +
  metadados + `operationId`), tirando a foto do estado PENDING, com retry e sem duplicar.
  Depende do endpoint backend #221.
- **#260 — Resolver vulnerabilidades do npm audit no web** _(Ready)_
  Eliminar as vulnerabilidades do `npm audit` no `frontend/` (bump major do `jspdf`/`jspdf-autotable`
  + fixes não-major), sem quebrar build, testes nem a geração de PDF. P1, Size M.
- **#265 — Adicionar toggle de visibilidade no campo de senha do login web** _(In review)_
  Adicionar botão de olho (`Eye`/`EyeOff` do lucide-react já instalado) no componente `Input`
  para alternar mostrar/ocultar senha, acessível e sem nova dependência. P1, Size XS.

## Júlia Paes — 47 commits — 4 issues (2 novas + 2 prévias)

- **#301 — Adaptar Capítulos 12 e 13 - Resultados e Considerações Finais**
  Capítulos 12 e 13 + elementos pós-textuais (síntese final). Status: a produzir.
- **#316 — Validar os 12 testes ponta a ponta na AWS**
  Checklist E2E no ambiente real (CloudFront + EC2 + RDS + S3), cobrindo os 12 testes do
  professor, com evidências (prints/logs). Depende de toda a infra AWS anterior.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das 13 sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor (PMBOK, 13 capítulos + pré/pós-textuais), removendo o texto-exemplo
  de sustentabilidade. P1, Size L.

## Marcela Mulato — 51 commits — 9 issues (4 novas + 5 prévias)

- **#314 — Apontar APK para o CloudFront e habilitar upload de evidências**
  Build EAS com `EXPO_PUBLIC_API_URL`, habilitar `EXPO_PUBLIC_EVIDENCE_UPLOAD`, login/sync
  e upload de foto até o S3 funcionando, sem rebuild a cada sessão. Depende de: #309 e #312.
- **#315 — Automatizar boot da EC2 (user-data) e runbook de reset**
  Script de `user-data` que no boot sobe o Docker da API e aplica Flyway + seed `demo`
  idempotente; runbook "subir → demonstrar → desligar". Depende de: #305, #306.
- **#306 — Provisionar EC2 com Docker para a API**
  Sobe a imagem do `api/Dockerfile` (perfil `demo`), `.env` fora do git, `/actuator/health`
  UP, conecta no RDS. Depende de: #305.
- **#309 — Implementar S3EvidenceStorage no port FileStorage**
  Nova implementação do port `FileStorage` selecionada por `@Profile` (demo/prod = S3,
  dev = filesystem); upload e leitura via S3. É a pendência do Teste 10. `./mvnw test`
  deve passar. Depende de: #308 e #307.
- **#30 — PBI-041→047: Recursos nativos - QR Code, câmera e GPS (Sprint 5)** _(In progress)_
  Épico de recursos nativos no mobile: ler QR Code, capturar foto com prévia, associar
  evidência ao item, registrar NC e localização (início/conclusão). Pendentes: GPS (PBI-045)
  e NC CRITICAL exigindo evidência. P0.
- **#31 — PBI-048→055: Offline e sincronização idempotente (Sprint 6)** _(In progress)_
  Épico de offline/sync: outbox persistente no SQLite, push em lote com idempotência e
  conflito preservando dados locais. Pendente: pull incremental por cursor (PBI-053). P0.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox com os endpoints reais (respostas, evidências, NCs), pull por
  cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das 13 sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor, removendo o texto-exemplo de sustentabilidade. P1, Size L.

## Rodrigo Soares — 60 commits — 7 issues (3 novas, 1 compart. + 4 prévias)

- **#319 — Preencher documento de segurança de dependências (npm audit)**
  Rodar `npm audit` no Web e Mobile, preencher contagens por severidade datadas em
  `docs/avaliacao/seguranca-dependencias.md`, salvar os JSONs em `evidencias/` (sem
  segredos). Execução local e rápida.
- **#300 — Adaptar Capítulo 11 - Gerenciamento das Partes Interessadas**
  Capítulo de partes interessadas conforme o template.
- **#320 — Executar demo E2E e preencher evidências de execução** _(compartilhada com Felipe)_
  Rodar os 22 passos do `demo-runbook.md` + validação offline (sync sem duplicar) +
  recursos nativos (QR, foto, GPS, permissões), registrando prints/vídeos em
  `evidencias-e2e.md`. Proíbe Swagger/banco manual/mock. Tem blockers (#88, #89, #204,
  #229, #65).
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox com os endpoints reais (respostas, evidências, NCs), pull por
  cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#227 — Integrar portal web do técnico com a API (substituir mocks)** _(In review)_
  Substituir os mocks (`@/mocks/technician`) das telas do portal do técnico por chamadas reais
  aos endpoints existentes, com loading/vazio/erro e permissão por perfil TECHNICIAN.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das 13 sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor, removendo o texto-exemplo de sustentabilidade. P1, Size L.

## Lucas Miguel — 68 commits — 9 issues (4 novas + 5 prévias)

- **#278 — Unificar filtro de data da listagem de inspeções para intervalo from/to**
  Trocar o parâmetro `dueDate` (data exata) por `from`/`to` (intervalo inclusivo,
  opcional) no backend (`AdminInspectionController`/`AdminCatalogListService`) e no front
  (`adminCatalog.ts`/`InspectionsPage.tsx`), alinhando listagem e CSV. Atualizar testes
  unitários. (bug, sprint-3, P1)
- **#305 — Provisionar RDS PostgreSQL privado na AWS**
  Instância RDS PostgreSQL 16, `db.t3.micro`, Single-AZ, `Publicly accessible = No`,
  porta 5432 só para a SG da EC2, criar DB subnet group. Fundação da infra (sem
  dependências).
- **#311 — Publicar Web Admin no S3 (static website)**
  Build de produção do Vite (`npm run build` → `dist/`), publicar no bucket, fallback
  de SPA (recarregar rota profunda não dá 404). Fecha parte do PBI-069.
- **#313 — Configurar segredos e CORS da API no ambiente AWS**
  `JWT_SECRET`, `DB_*`, `CORS_ALLOWED_ORIGINS` (= domínio do CloudFront, nunca `*`) fora
  do git (EC2/SSM). Pré-flight CORS funcionando. Depende de: #305, #306, #312.
- **#30 — PBI-041→047: Recursos nativos - QR Code, câmera e GPS (Sprint 5)** _(In progress)_
  Épico de recursos nativos no mobile: ler QR Code, capturar foto com prévia, associar
  evidência ao item, registrar NC e localização. Pendentes: GPS (PBI-045) e NC CRITICAL
  exigindo evidência. P0.
- **#31 — PBI-048→055: Offline e sincronização idempotente (Sprint 6)** _(In progress)_
  Épico de offline/sync: outbox persistente no SQLite, push em lote com idempotência e
  conflito preservando dados locais. Pendente: pull incremental por cursor (PBI-053). P0.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox com os endpoints reais (respostas, evidências, NCs), pull por
  cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das 13 sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor, removendo o texto-exemplo de sustentabilidade. P1, Size L.

## Natália Nogueira — 245 commits — 0 issues

Responsável pela aprovação dos pull requests.

---

## Observações

- **Total real: 28 issues** (não 29 — havia um erro de contagem nas versões anteriores
  deste documento; a lista de issues abertas sem assignee sempre teve 28 itens).
- **Issue compartilhada:** #320 é responsabilidade conjunta de **Felipe + Rodrigo**
  (contabilizada uma vez no total de 28, mas aparece nas duas seções).
- **Dependências de infra AWS:** a trilha é acoplada
  (#305 → #306 → #307/#309/#315; #312 depende de #306 + #311; #313/#314/#316 dependem de
  várias). Com a redistribuição, ela ficou espalhada entre Ian, Marcela e Lucas
  — precisa de coordenação entre eles para não travar.
- **Issues de fechamento (#316 e #320):** dependem de quase tudo pronto; deixar para o final.
