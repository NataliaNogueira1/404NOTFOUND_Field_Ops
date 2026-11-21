# Distribuição de issues

> Estado do Kanban em **15/11/2026**
> (https://github.com/users/NataliaNogueira1/projects/2/views/1).
>
> Critério original da distribuição: quem tem **menos commits recebe mais issues** (peso
> inverso ao número de commits), com **28 issues** distribuídas entre **8 pessoas** e
> restrições pedidas pela equipe (ninguém recebe de volta o que recusou).
>
> Esta versão **atualiza o documento conforme o board atual**: cada pessoa lista apenas as
> issues **não concluídas** (fora da coluna **Done**) em que está como assignee hoje. As
> issues que já foram concluídas saíram da lista, e as reatribuições e issues novas estão
> registradas em [Movimentações desde a versão anterior](#movimentações-desde-a-versão-anterior).
>
> Os números de commit são os da distribuição original (todas as branches, sem commits de
> merge, com identidades duplicadas agrupadas) e **não foram recalculados** nesta
> atualização.
>
> Algumas issues (#30, #92, #197, #302) são épicos/tarefas compartilhadas e aparecem em
> mais de uma pessoa.

## Resumo

| Pessoa | Commits | Issues abertas | Individuais | Compartilhadas |
|--------|--------:|:--------------:|:-----------:|:--------------:|
| Caroline Arruda | 21 | 4 | 3 | 1 |
| Ian Lucas | 29 | 8 | 7 | 1 |
| Andressa Bartolomeu | 36 | 8 | 7 | 1 |
| Felipe (Cutiur) | 39 | 9 | 7 | 2 |
| Júlia Paes | 47 | 3 | 1 | 2 |
| Marcela Mulato | 51 | 4 | 0 | 4 |
| Rodrigo Soares | 60 | 3 | 0 | 3 |
| Lucas Miguel | 68 | 6 | 2 | 4 |
| Natália Nogueira | 245 | 3 | 0 | 3 |

> Observação: as issues compartilhadas são contadas em cada pessoa que as possui, então a
> soma dos totais individuais é maior que o número de issues distintas.

---

## Caroline Arruda — 21 commits — 4 issues

- **#258 — Popular seed com ao menos dois exemplos de cada estado de inspeção** _(In progress)_
  Estender o `DemoSeedRunner` para gerar ≥2 inspeções em cada estado (ASSIGNED, IN_PROGRESS,
  SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELED), de forma idempotente e usando os
  fluxos reais de domínio. P1, Size M.
- **#263 — Integrar página de detalhes do cliente com a API real** _(In progress)_
  Trocar os dados mock (`@/mocks/domain`) da página de detalhe do cliente por
  `GET /api/v1/clients/{id}`, com estados de loading/erro/vazio. P1, Size S.
- **#338 — Exibir motivo de cancelamento na tela de detalhes para o técnico** _(In review)_
  Exibir o motivo de cancelamento também na visão do técnico no mobile/portal, não apenas
  na visão admin.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco: login admin,
  cadastro de cliente/local/equipamento, modelo publicado, agendamento, login do técnico,
  execução offline, sync sem duplicidade, revisão e aprovação. P0.

## Ian Lucas — 29 commits — 8 issues

Trilha de infra AWS (concentra a maior parte da cadeia de dependências). RDS (#305),
EC2 (#306), bucket S3 (#308) e `S3EvidenceStorage` (#309) já estão em **Done**:

- **#307 — Configurar LabRole como instance profile da EC2 (acesso ao S3)** _(In progress)_
  Anexar o `LabRole` à EC2 para o SDK S3 obter credencial via metadata, sem chave no
  `.env`. Depende de: EC2 e bucket S3 (ambos concluídos).
- **#310 — Expor fotos do S3 via presigned URL para o Web Admin** _(In progress)_
  Método de presigned URL (GET temporário) no port, implementado no `S3EvidenceStorage`
  e exposto no endpoint de evidências (revisão/lightbox). Depende de: #309 (concluída).
- **#312 — Configurar CloudFront (HTTPS + DNS estável) para web e API** _(In progress)_
  Distribuição CloudFront como frente única: origem S3 (default, com cache) + origem EC2
  (`/api/*`, sem cache, repassa `Authorization`). HTTPS em `*.cloudfront.net`, fallback
  SPA. Risco nº1 do Teste 01. Depende de: #306 e #311.
- **#314 — Apontar APK para o CloudFront e habilitar upload de evidências** _(In progress)_
  Build EAS com `EXPO_PUBLIC_API_URL`, habilitar `EXPO_PUBLIC_EVIDENCE_UPLOAD`, login/sync
  e upload de foto até o S3 funcionando, sem rebuild a cada sessão. Depende de: #309
  (concluída) e #312.
- **#315 — Automatizar boot da EC2 (user-data) e runbook de reset** _(In progress)_
  Script de `user-data` que no boot sobe o Docker da API e aplica Flyway + seed `demo`
  idempotente; runbook "subir → demonstrar → desligar". Depende de: #305, #306 (ambas
  concluídas).

Demais issues:

- **#89 — PBI-069: Build e publicação do painel web admin** _(Issue fechada, mas ainda na coluna Ready do board)_
  Gerar build estático do painel publicável em qualquer servidor estático, com URL da API
  por variável de ambiente e funcionando com a API de demonstração. P0.
  Pendência: mover o card para **Done** (a issue já está fechada).
- **#337 — Adicionar exibição do ID da inspeção no mobile** _(In progress)_
  Exibir o ID da inspeção (UUID abreviado) nas telas de listagem e detalhes no app mobile
  para os perfis técnico, supervisor e admin, sem quebrar o layout. `mobile`, `ux`, `sprint-3`.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.

## Andressa Bartolomeu — 36 commits — 8 issues

- **#293 — Adaptar Capítulo 5 - Gerenciamento dos Custos** _(In review)_
  Capítulo de custos conforme o template de Relatório Final.
- **#296 — Adaptar Capítulo 7 - Gerenciamento dos Recursos Humanos** _(In review)_
  Capítulo de recursos (no template, "Recursos Humanos").
- **#297 — Adaptar Capítulo 8 - Gerenciamento das Comunicações** _(In review)_
  Capítulo de comunicações conforme o template.
- **#298 — Adaptar Capítulo 9 - Gerenciamento dos Riscos** _(In review)_
  Capítulo de riscos conforme o template.
- **#246 — Tornar o botão Versões útil na tela de modelos** _(In review)_
  Parte A (só frontend): ligar o botão "Versões" a um modal que lista as versões publicadas
  do modelo via endpoint existente. Parte B (exige backend, decidir antes): alternar a versão
  ativa — pode conflitar com a regra de imutabilidade de versão. P1.
- **#255 — Exibir fotos das não conformidades para supervisor/admin** _(In review)_
  No detalhe da NC (`NonConformitiesPage`), carregar e exibir as evidências fotográficas já
  vinculadas, reaproveitando o lightbox da tela de revisão (download autenticado). P1, Size M.
- **#322 — Corrigir bugs da assinatura no dispositivo (PBI-086)** _(In review)_
  Corrigir o offset de toque no canvas e o preview incorreto da assinatura; decidir entre as
  duas implementações concorrentes e deixar só uma na `develop`, sem código morto.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.

## Felipe (Cutiur) — 39 commits — 9 issues

- **#294 — Adaptar Capítulo 6 - Gerenciamento da Qualidade** _(Ready)_
  Capítulo de qualidade conforme o template.
- **#320 — Executar demo E2E e preencher evidências de execução** _(Ready)_
  Rodar os 22 passos do `demo-runbook.md` + validação offline (sync sem duplicar) +
  recursos nativos (QR, foto, GPS, permissões), registrando prints/vídeos em
  `evidencias-e2e.md`. Proíbe Swagger/banco manual/mock. Tem blockers (#88, #89, #204,
  #229, #65). Agora só no nome do Felipe (antes era compartilhada com Rodrigo).
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox do app com os endpoints reais (respostas, evidências, NCs),
  com pull incremental por cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#259 — Resolver vulnerabilidades do npm audit no mobile** _(Ready)_
  Reduzir/eliminar as vulnerabilidades do `npm audit` em `mobile/` (baseline: 75, sendo
  2 critical e 56 high), sem quebrar build (Expo SDK 57), testes Jest nem APK. Aplicar
  primeiro correções seguras e avaliar bumps major caso a caso. P1, Size L.
- **#260 — Resolver vulnerabilidades do npm audit no web** _(Ready, reaberta)_
  Eliminar as vulnerabilidades do `npm audit` no `frontend/`, sem quebrar build, testes
  nem a geração de PDF. As vulnerabilidades de `dompurify` restantes foram separadas na
  #347. P1.
- **#347 — Migrar jspdf para 4.x e corrigir vulnerabilidade do dompurify no web** _(Ready)_
  Atualizar `jspdf`/`jspdf-autotable` para 4.x (versão fixa) e ajustar
  `generateInspectionPdf.ts`, eliminando 1 vulnerabilidade crítica e 2 altas de `dompurify`.
  Build e testes devem passar, e o PDF deve ser conferido manualmente. Atualizar
  `seguranca-dependencias.md` e `test-results.md`. Relacionada: #260, #319.
- **#332 — Exibir mensagem de modo offline abaixo da barra nativa no mobile** _(In review)_
  Exibir banner/indicador de modo offline posicionado abaixo da status bar nativa, sem
  sobrepor conteúdo.
- **#333 — Corrigir teclado sobrepondo label e campo de número no mobile** _(In review)_
  Corrigir o layout para que o teclado não cubra o label e o campo de entrada numérica
  durante o preenchimento do checklist.

## Júlia Paes — 47 commits — 3 issues

- **#316 — Validar os 12 testes ponta a ponta na AWS** _(Ready)_
  Checklist E2E no ambiente real (CloudFront + EC2 + RDS + S3), cobrindo os 12 testes do
  professor, com evidências (prints/logs). Depende de toda a infra AWS anterior.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor (PMBOK, 13 capítulos + pré/pós-textuais), removendo o texto-exemplo
  de sustentabilidade. P1, Size L.

## Marcela Mulato — 51 commits — 4 issues

- **#30 — PBI-041→047: Recursos nativos - QR Code, câmera e GPS (Sprint 5)** _(In progress, compartilhada com Lucas)_
  Épico de recursos nativos no mobile: ler QR Code, capturar foto com prévia, associar
  evidência ao item, registrar NC e localização (início/conclusão). Pendentes: GPS (PBI-045)
  e NC CRITICAL exigindo evidência. P0.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox com os endpoints reais (respostas, evidências, NCs), pull por
  cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor, removendo o texto-exemplo de sustentabilidade. P1, Size L.

## Rodrigo Soares — 60 commits — 3 issues

- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox com os endpoints reais (respostas, evidências, NCs), pull por
  cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor, removendo o texto-exemplo de sustentabilidade. P1, Size L.

## Lucas Miguel — 68 commits — 6 issues

- **#311 — Publicar Web Admin no S3 (static website)** _(Ready)_
  Build de produção do Vite (`npm run build` → `dist/`), publicar no bucket, fallback
  de SPA (recarregar rota profunda não dá 404). Fecha parte do PBI-069.
- **#313 — Configurar segredos e CORS da API no ambiente AWS** _(Ready)_
  `JWT_SECRET`, `DB_*`, `CORS_ALLOWED_ORIGINS` (= domínio do CloudFront, nunca `*`) fora
  do git (EC2/SSM). Pré-flight CORS funcionando. Depende de: #305, #306, #312.
- **#30 — PBI-041→047: Recursos nativos - QR Code, câmera e GPS (Sprint 5)** _(In progress, compartilhada com Marcela)_
  Épico de recursos nativos no mobile: ler QR Code, capturar foto com prévia, associar
  evidência ao item, registrar NC e localização. Pendentes: GPS (PBI-045) e NC CRITICAL
  exigindo evidência. P0.
- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
  Demonstrar o fluxo completo com dados reais, sem edição manual do banco (login admin →
  execução offline → sync → revisão → aprovação). P0.
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
  Integrar push/pull da outbox com os endpoints reais (respostas, evidências, NCs), pull por
  cursor e idempotência, refletindo o resultado real na tela de sync. P0, Size L.
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_
  Épico guarda-chuva das sub-issues (#288–#301): adaptar os documentos de `docs/gestao/`
  ao template do professor, removendo o texto-exemplo de sustentabilidade. P1, Size L.

## Natália Nogueira — 245 commits — 3 issues (todas compartilhadas)

Antes a Natália ficou **de fora** da distribuição (0 issues) a pedido da equipe. Hoje ela
consta como assignee apenas em issues compartilhadas:

- **#92 — PBI-072: Demonstração ponta a ponta** _(Ready, compartilhada com a equipe)_
- **#197 — Integração ponta a ponta da sincronização do app com o backend** _(Ready, compartilhada)_
- **#302 — Adaptar documentação de gestão ao template de Relatório Final (épico)** _(Ready, compartilhada)_

---

## Movimentações desde a versão anterior

Comparação com a versão de **14/11/2026**. As movimentações das versões mais antigas estão
no histórico do git deste arquivo.

**Issues novas no board**

- **#346 — Listar inspeções canceladas na lista do técnico (backend)** → Lucas. Criada e
  já concluída (issue fechada em 14/11/2026, card em **Done**, PR #352). Por isso não
  aparece na lista de issues abertas do Lucas.

**Mudanças de coluna**

- **#310** (presigned URL) e **#312** (CloudFront): Ready → **In progress** (Ian).

**Concluídas (Done) e removidas das listas**

- Ian: #305 (RDS), #306 (EC2), #308 (bucket S3), #309 (`S3EvidenceStorage`, PR #359).
- Felipe e Natália: #229 (upload de evidência no mobile, PR #356).
- Lucas: #346 (nova, ver acima).

**Sem reatribuições.** Nenhuma issue aberta mudou de assignee desde a versão anterior.

---

## Observações

- **Distribuição original: 28 issues.** O histórico das atribuições originais está no
  controle de versão deste arquivo.
- **Marcela e Rodrigo** ficaram só com issues compartilhadas (#92, #197, #302 e, no caso da
  Marcela, #30). Vale combinar quem faz o quê dentro de cada uma, ou redistribuir carga.
- **Ian caiu de 12 para 8 issues** (7 individuais), das quais 5 ainda são da trilha AWS
  (#307, #310, #312, #314, #315). A base da infra (RDS, EC2, bucket S3 e
  `S3EvidenceStorage`) já está concluída.
- **Dependências de infra AWS:** com #305, #306, #308 e #309 concluídas, o caminho crítico
  passa a ser o CloudFront (#312), que depende de #311 (Lucas, ainda em Ready). Depois
  dele vêm #313 (Lucas), #314 (Ian) e #316 (Júlia). Vale priorizar a #311 para não travar
  o Ian.
- **Issues de fechamento (#316 e #320):** dependem de quase tudo pronto; deixar para o final.
- **Inconsistência no board:** #89 está fechada, mas o card continua em Ready.
- **Cards de PR no board:** #331, #342, #349 e #350 são Pull Requests (não issues) ainda
  fora de Done e não entram na contagem.
