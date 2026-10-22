# Registro de testes e qualidade — FieldOps

## 1. Resumo executivo

Este registro contém somente execuções comprovadas pelas auditorias e verificações de ambiente realizadas. A existência de arquivos de teste não equivale a uma execução aprovada.

| Aplicação | Tipo | Status | Resultado | Observação |
|---|---|---|---|---|
| API | Testes automatizados Maven | PASS | 180 testes; 0 failures; 0 errors. | Resultado registrado na auditoria técnica de 20/10/2026. |
| API | Maven verify / integração Testcontainers | NOT_RUN | Sem resultado completo registrado. | Há teste Failsafe que requer Docker; não é falha funcional dos 180 testes aprovados. |
| Web | Testes | PASS | Suíte aprovada. | Não há contagem de testes comprovada neste registro. |
| Web | Lint | PASS | Lint aprovado. | Resultado registrado pelas auditorias. |
| Web | Build | PASS | Build aprovado. | Resultado registrado pelas auditorias. |
| Mobile | Jest | BLOCKED | Não há suíte reproduzível aprovada. | A tentativa auditada não iniciou Jest no checkout; há bloqueio de ambiente/dependência. |
| Mobile | APK/dispositivo | NOT_RUN | Sem artefato instalado e validado registrado. | Não é substituído por testes automatizados. |

## 2. API / Spring Boot

### Testes automatizados

| Comando | Status | Resultado | Evidência/observação |
|---|---|---|---|
| cd api; .\mvnw.cmd test | PASS | 180 testes; 0 failures; 0 errors; 0 ignorados. | Execução registrada em [Auditoria_Final_FieldOps.md](../analise/Auditoria_Final_FieldOps.md). |

O resultado acima cobre a execução automatizada registrada. Ele não deve ser confundido com validação Mobile, deploy público ou demonstração E2E.

### Maven verify e Testcontainers

| Comando | Status | Resultado | Evidência/observação |
|---|---|---|---|
| cd api; .\mvnw.cmd verify | NOT_RUN | Não há resultado completo comprovado neste registro. | UserRepositoryIT informa que roda com verify/Failsafe e requer Docker/Testcontainers. Executar somente com Docker disponível. |

O cenário de verify não é um FAIL dos testes automatizados aprovados. A dependência de Docker/Testcontainers é requisito de infraestrutura para esse teste de integração. Não houve inicialização de containers nesta tarefa.

Referências: [pom.xml](../../api/pom.xml), [UserRepositoryIT](../../api/src/test/java/com/fieldops/user/repository/UserRepositoryIT.java), [testes da API](../../api/src/test/java).

## 3. Frontend Web

Os scripts reais em [frontend/package.json](../../frontend/package.json) são test, lint e build.

| Verificação | Comando | Status | Resultado | Evidência/observação |
|---|---|---|---|---|
| Testes | cd frontend; npm run test | PASS | Suíte aprovada. | A auditoria registra execução bem-sucedida; não há contagem de testes confirmada aqui. |
| Lint | cd frontend; npm run lint | PASS | Lint aprovado. | Resultado registrado pelas auditorias. |
| Build | cd frontend; npm run build | PASS | Build aprovado. | O script executa tsc -b && vite build. |

## 4. Mobile

Os scripts reais estão em [mobile/package.json](../../mobile/package.json): test executa jest; lint executa eslint; build:apk usa EAS.

| Verificação | Comando | Status | Resultado | Evidência/observação |
|---|---|---|---|---|
| Jest | cd mobile; npm run test | BLOCKED | Nenhuma execução aprovada registrada. | A auditoria registrou que mobile/npm.cmd test -- --runInBand não iniciou porque jest não estava disponível no checkout. |
| Lint | cd mobile; npm run lint | NOT_RUN | Sem resultado global registrado neste documento. | Não inferir aprovação a partir de arquivos de configuração. |
| APK | cd mobile; npm run build:apk | NOT_RUN | Sem APK instalado/validado registrado. | Configuração EAS não é evidência de build executado. |

O bloqueio histórico de preparação Mobile está associado a better-sqlite3, node-gyp, Python e toolchain de compilação nativa. A confirmação de Node v22.23.3 e npm 10.9.9 no ambiente local não prova que Jest tenha sido executado com sucesso. Há testes no código, mas ainda é necessária uma execução Jest reproduzível.

Referências: [Jest config](../../mobile/jest.config.js), [testes de sync](../../mobile/src/infrastructure/sync/__tests__), [testes de persistência](../../mobile/src/infrastructure/database/repositories/__tests__), [testes de sincronização](../../mobile/src/features/synchronization/__tests__).

## 5. Testes existentes por área

| Aplicação | Áreas cobertas por fontes de teste | Referências representativas |
|---|---|---|
| API | auth, autorização, sync, evidence, review e audit. | [auth](../../api/src/test/java/com/fieldops/auth), [authorization](../../api/src/test/java/com/fieldops/shared/security/RoleAuthorizationTest.java), [sync](../../api/src/test/java/com/fieldops/sync), [evidence](../../api/src/test/java/com/fieldops/evidence), [review](../../api/src/test/java/com/fieldops/inspection/controller/ReviewInspectionControllerTest.java), [audit](../../api/src/test/java/com/fieldops/audit) |
| Web | auth/session, dashboard, templates, inspections, review e audit. | [session](../../frontend/src/auth/session.test.tsx), [dashboard](../../frontend/src/pages/dashboard/DashboardPage.test.tsx), [templates](../../frontend/src/pages/inspectionTemplates), [inspections](../../frontend/src/pages/inspections), [audit](../../frontend/src/api/audit.test.ts) |
| Mobile | sync, respostas/NCs, evidências, persistência e correção após reprovação. | [sync](../../mobile/src/infrastructure/sync/__tests__), [respostas/NCs](../../mobile/src/infrastructure/sync/__tests__/pbi051-answers-ncs.test.ts), [evidências](../../mobile/src/infrastructure/sync/__tests__/pbi044.test.ts), [persistência](../../mobile/src/infrastructure/database/repositories/__tests__), [correção](../../mobile/src/infrastructure/database/repositories/__tests__/pbi062.test.ts) |

## 6. Validações que testes automatizados não substituem

Mesmo quando uma suíte automatizada passa, ainda exigem validação E2E:

- APK instalado;
- QR em dispositivo físico;
- câmera e permissões;
- GPS;
- upload real de evidência;
- offline → online;
- sync sem duplicidade;
- review Web com dados vindos do Mobile;
- demonstração E2E.

Esses itens devem seguir o [demo-runbook](demo-runbook.md) e permanecem sob validação E2E.

## 7. Matriz de execução

| Aplicação | Verificação | Status | Reproduzível atualmente? | Próxima ação |
|---|---|---|---|---|
| API | Testes automatizados | PASS | SIM, conforme execução auditada. | Repetir antes da entrega. |
| API | Maven verify/Testcontainers | NOT_RUN | Depende de Docker disponível. | Executar verify em ambiente com Docker e registrar resultado. |
| Web | Testes | PASS | SIM, conforme execução auditada. | Repetir antes da apresentação. |
| Web | Lint | PASS | SIM, conforme execução auditada. | Repetir antes do merge final. |
| Web | Build | PASS | SIM, conforme execução auditada. | Repetir antes do deploy. |
| Mobile | Jest | BLOCKED | NÃO. | Corrigir/preparar ambiente e executar a suíte. |
| Mobile | APK/dispositivo | NOT_RUN | NÃO. | Gerar e validar build em Android. |

## 8. Procedimento de reprodução

Executar a partir do diretório raiz do repositório, após instalar as dependências de cada aplicação conforme seus READMEs:

### API

1. cd api
2. .\mvnw.cmd test
3. .\mvnw.cmd verify somente com Docker disponível para Testcontainers.

### Web

1. cd frontend
2. npm run test
3. npm run lint
4. npm run build

### Mobile

1. cd mobile
2. npm run test
3. npm run lint
4. npm run build:apk quando houver conta/ambiente EAS configurado para a demonstração.

Os comandos Mobile não devem ser interpretados como resultados aprovados até a execução ser registrada.

## 9. Ambiente

| Item | Evidência | Observação |
|---|---|---|
| Node | v22.23.3 observado no ambiente local em 21/10/2026. | Ambiente utilizado; não é requisito oficial por si só. |
| npm | 10.9.9 observado no ambiente local em 21/10/2026. | Ambiente utilizado; não prova execução Jest. |
| Java do projeto | 21 declarado em [api/pom.xml](../../api/pom.xml). | Versão configurada pelo projeto. |
| Java local | 25.0.2 observado no ambiente local em 21/10/2026. | Ambiente utilizado; não substitui a configuração do projeto. |
| Maven Wrapper local | 3.9.16 observado por api/mvnw.cmd --version. | Usar o Wrapper do repositório; mvn global não é necessário. |

## 10. Pendências de validação

- execução Jest Mobile reproduzível;
- execução Maven verify com Docker/Testcontainers disponível;
- validação E2E em dispositivo, incluindo recursos nativos e sync.

Para limites funcionais e de ambiente, consulte [known-limitations.md](known-limitations.md). Este documento não substitui o registro da demonstração E2E.

