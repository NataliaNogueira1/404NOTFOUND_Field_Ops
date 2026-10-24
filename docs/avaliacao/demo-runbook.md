# Roteiro de demonstração E2E — FieldOps

## 1. Objetivo da demonstração

Demonstrar, sem Swagger como substituto de interface nem alterações manuais no banco, o fluxo entre Web Admin/Supervisor, API Spring Boot e Mobile Expo: planejamento, execução de campo, recursos nativos, operação offline, sync, revisão, decisão e auditoria.

Este roteiro diferencia comportamento implementado no código de evidência efetivamente executada. Uma etapa marcada como **PENDING** não deve ser apresentada como validada até que haja registro da execução real.

## 2. Pré-requisitos

| Pré-requisito | Estado | Observação |
|---|---|---|
| API acessível | PENDING_VALIDATION | Usar a API do ambiente de demonstração, com health/login funcionais. |
| Painel Web acessível | PENDING_VALIDATION | A publicação e a URL pública do painel ainda precisam de evidência. |
| APK/build Mobile instalado | PENDING_VALIDATION | A configuração EAS existe; um APK instalado ainda não foi registrado. |
| Usuários de demonstração | Disponível no código | DevUsersBootstrapRunner e DemoSeedRunner preparam o ambiente; usar apenas contas de demo autorizadas, sem exibir senhas. |
| Dados seed ou criados pela UI | Disponível no código | Deve haver cliente, local, equipamento com QR, template publicado e técnico disponíveis. |
| Permissões de câmera/localização | Necessário | Conceder no dispositivo antes dos passos nativos; testar a recusa quando aplicável. |
| Rede controlável | Necessário | Deve ser possível desligar e religar a rede para o cenário offline. |
| Ambiente de revisão | Necessário | O SUPERVISOR deve acessar a fila de revisão após a sincronização. |

Referências: [seed de usuários](../../api/src/main/java/com/fieldops/config/DevUsersBootstrapRunner.java), [seed de demonstração](../../api/src/main/java/com/fieldops/config/DemoSeedRunner.java), [README da API](../../api/README.md) e [configuração EAS](../../mobile/eas.json).

## 3. Perfis usados

| Papel | Uso na demonstração |
|---|---|
| ADMINISTRATOR | Cadastra/organiza dados mestres e, quando necessário, cria e atribui a inspeção. |
| SUPERVISOR | Acompanha, inicia revisão, comenta itens, aprova ou reprova e consulta auditoria. |
| TECHNICIAN | Recebe, executa e sincroniza a inspeção no Mobile; corrige uma inspeção reprovada. |

## 4. Fluxo principal E2E

1. **Login administrativo.** Entrar no painel como ADMINISTRATOR.
2. **Preparar dados pela interface.** Confirmar ou cadastrar cliente, local e equipamento; usar equipamento com QR válido. Detalhes de cliente/local com seed não são prova de integração completa (**PENDING**: #263/#264).
3. **Selecionar ou criar template.** Usar um template publicado pelo seed ou criar um template na UI, com item obrigatório e item que permita observação/NC.
4. **Publicar a versão.** Se o template foi criado nesta demo, publicá-lo pela UI antes do agendamento.
5. **Criar e agendar inspeção.** Criar a inspeção pela UI e atribuí-la ao TECHNICIAN.
6. **Login técnico no Mobile.** Abrir o build instalado e entrar como TECHNICIAN.
7. **Baixar e abrir inspeção.** Executar pull/sync e abrir a inspeção atribuída.
8. **Iniciar inspeção.** Iniciar o fluxo Mobile. A localização no início depende de permissão e aparelho; registrar o resultado observado.
9. **Confirmar equipamento por QR Code.** Abrir scanner e ler o QR. **PENDING:** validar em dispositivo físico durante a apresentação.
10. **Preencher checklist.** Responder itens, adicionar observação e registrar ao menos uma não conformidade.
11. **Capturar fotografia.** Tirar/anexar foto localmente. **PENDING:** a chegada da foto ao backend/revisão depende de #229 e de ambiente com EXPO_PUBLIC_EVIDENCE_UPLOAD habilitado.
12. **Registrar localização.** Registrar o comportamento de início. **PENDING:** GPS na conclusão depende de #65; não declarar como concluído.
13. **Entrar em modo offline.** Desligar Wi-Fi/dados móveis e continuar preenchendo respostas e não conformidades.
14. **Confirmar persistência local.** Voltar à lista e reabrir a inspeção para confirmar respostas/NCs visíveis. Fechar/reabrir o app somente após testar no build utilizado; até então, **PENDING** como validação em dispositivo.
15. **Reconectar e sincronizar.** Religar rede e iniciar sincronização pelo Mobile.
16. **Comprovar ausência de duplicidade.** Acionar novo sync/retry controlado sem editar dados e confirmar pela UI/revisão que não há segunda resposta ou NC. Não usar banco ou Swagger para corrigir o resultado.
17. **Abrir revisão no Web.** Entrar como SUPERVISOR, abrir a fila, iniciar revisão e verificar respostas por seção/item e NCs.
18. **Revisar evidências e localização.** Verificar somente o que chegou pelo fluxo real. Foto na revisão e GPS na conclusão são **PENDING** enquanto #229/#65 não tiverem evidência E2E.
19. **Comentar e reprovar.** Adicionar comentário por item e reprovar com motivo pela UI.
20. **Corrigir no Mobile.** Como TECHNICIAN, sincronizar/puxar a decisão, visualizar o motivo, reabrir para correção, ajustar resposta/NC e reenviar.
21. **Aprovar.** Como SUPERVISOR, revisar o reenvio e aprovar pela UI.
22. **Consultar histórico/auditoria.** Exibir a linha do tempo/histórico e relacionar os eventos a criação, sync, revisão, reprovação, correção e aprovação.

Evidências de implementação: [rotas Web](../../frontend/src/routes/AppRoutes.tsx), [revisão Web](../../frontend/src/pages/inspections/InspectionReviewPage.tsx), [API de revisão](../../frontend/src/api/inspectionReview.ts), [rota QR](<../../mobile/app/(protected)/scanner.tsx>), [rota de início](<../../mobile/app/(protected)/inspections/[id]/start.tsx>), [sync Mobile](../../mobile/src/infrastructure/sync/InspectionSyncService.ts), [serviço de revisão](../../api/src/main/java/com/fieldops/inspection/service/InspectionService.java) e [auditoria Web](../../frontend/src/pages/audit/AuditPage.tsx).

## 5. Validação offline

### Implementado no código

- Persistência SQLite: [DatabaseProvider](../../mobile/src/infrastructure/database/DatabaseProvider.tsx), [migrations](../../mobile/src/infrastructure/database/migrations.ts) e repositories.
- Fila/outbox: [SyncQueueRepository](../../mobile/src/infrastructure/database/repositories/SyncQueueRepository.ts).
- Batch, dependências de operações e idempotência: [InspectionSyncService](../../mobile/src/infrastructure/sync/InspectionSyncService.ts), [SyncBatchService](../../api/src/main/java/com/fieldops/sync/service/SyncBatchService.java) e [IdempotencyService](../../api/src/main/java/com/fieldops/sync/service/IdempotencyService.java).
- Cursor incremental, respostas e NCs: [teste PBI-053](../../mobile/src/infrastructure/sync/__tests__/pbi053.test.ts) e [teste PBI-051](../../mobile/src/infrastructure/sync/__tests__/pbi051-answers-ncs.test.ts).

### Ainda precisa ser validado em dispositivo

1. Baixar uma inspeção online, desligar a rede e confirmar que ela abre sem rede.
2. Alterar respostas/NCs offline e confirmar que permanecem após voltar à lista.
3. Fechar/reabrir o app somente após confirmar a recuperação no build apresentado.
4. Religar rede, sincronizar e repetir o sync sem novas edições.
5. Confirmar no Web que respostas e NCs aparecem uma vez, sem duplicidade.
6. Forçar falha de rede controlada durante o envio e testar retry sem alterar dados manualmente.

O código contém operationId, dependencyIds, cursor e retry, mas o cenário offline completo em dispositivo permanece **PENDING** até execução registrada.

## 6. Recursos nativos

| Recurso | Demonstração | Estado |
|---|---|---|
| QR Code | Ler QR do equipamento com [CameraView](<../../mobile/app/(protected)/scanner.tsx>). | PENDING: executar no dispositivo. |
| Câmera/foto | Capturar foto na rota de evidência e confirmar persistência local. | PENDING: validar permissões e captura no dispositivo. |
| Upload de foto | Sincronizar foto e vê-la no Web. | PENDING: #229; requer ambiente e upload habilitado. |
| Localização no início | Conceder/recusar permissão e registrar o comportamento. | PENDING: validar no dispositivo. |
| GPS na conclusão | Concluir e verificar coordenadas finais no Web. | PENDING: #65 bloqueia a prova atual. |
| Permissões | Exibir comportamento com autorização e recusa de câmera/localização. | PENDING: validar no dispositivo. |

## 7. Revisão e decisão

O SUPERVISOR deve demonstrar pela UI:

1. abrir inspeção submetida e selecionar **Iniciar revisão**;
2. percorrer respostas por seção/item;
3. conferir NCs e, somente se sincronizada, evidência fotográfica;
4. inserir comentário por item;
5. reprovar com motivo;
6. confirmar que TECHNICIAN recebe a decisão no pull/sync e pode corrigir;
7. revisar o reenvio e aprovar;
8. abrir histórico/auditoria para mostrar eventos do ciclo.

Referências: [cliente de revisão](../../frontend/src/api/inspectionReview.ts), [comentários de revisão](../../api/src/main/java/com/fieldops/reviewcomment/controller/ReviewCommentController.java), [transição Mobile](../../api/src/main/java/com/fieldops/inspection/service/MobileInspectionService.java) e [teste de reprovação no Mobile](../../mobile/src/infrastructure/database/repositories/__tests__/pbi062.test.ts).

## 8. Evidências a registrar durante a demo

Para cada etapa efetivamente executada, registrar em local apropriado da equipe, sem versionar arquivos grandes:

- screenshot ou gravação curta;
- data/hora e ambiente;
- URL usada, quando pública;
- identificação do build/APK;
- perfil utilizado, sem senha;
- resultado esperado e observado;
- logs de erro, se houver, sem segredos;
- referência da issue/PR quando pertinente.

## 9. Pontos que não podem depender de ação manual

A demonstração não pode exigir:

- alteração manual de estado no banco;
- INSERT/UPDATE manual;
- Swagger como substituto da UI;
- edição de SQLite;
- mock de API;
- manipulação artificial para forçar sucesso.

O plano B operacional pode reiniciar serviço ou app e repetir passo documentado. Ele não pode ocultar falhas, editar dados diretamente ou declarar etapa pendente como aprovada.

## 10. Blockers conhecidos atuais

| Blocker | Impacto na demonstração | Estado |
|---|---|---|
| #229 — upload de evidência | Foto pode ficar local e não chegar à revisão Web. | PENDING |
| #65 — GPS na conclusão | Não é possível provar coordenadas finais no fluxo apresentado. | PENDING |
| Publicação do painel Web (#89) | Impede prova por URL pública e smoke test integrado. | PENDING |
| API pública/CORS (#204) | Bloqueia integração real de Web/Mobile fora do ambiente local controlado. | PENDING |
| APK instalado (#88) | Sem APK validado, não há prova Mobile em Android. | PENDING |
| Testes Mobile reproduzíveis (#85) | Não há resultado atual da suíte Jest para anexar à avaliação. | PENDING |

## 11. Checklist rápido para o dia da apresentação

- [ ] API online e health/login confirmados.
- [ ] Painel Web online e login confirmado.
- [ ] APK/build Mobile instalado e identificado.
- [ ] Usuários de demonstração validados, sem expor senhas.
- [ ] Seed carregado ou dados preparados integralmente pela UI.
- [ ] Câmera autorizada.
- [ ] Localização autorizada.
- [ ] Inspeção atribuída ao TECHNICIAN.
- [ ] Modo offline testável: rede pode ser desligada/religada.
- [ ] Ambiente de revisão disponível ao SUPERVISOR.
- [ ] Registro de data/hora, build e resultados pronto.
- [ ] Plano B operacional documentado: reiniciar serviço/app e repetir o passo, sem manipular banco ou dados.

## 12. Critério de sucesso da demo

A demonstração E2E é aprovada quando uma inspeção criada e atribuída no Web é executada no Mobile, permanece utilizável sem rede, sincroniza após reconexão sem duplicar respostas/NCs, é revisada e reprovada no Web, volta ao TECHNICIAN para correção, é reenviada, aprovada e deixa histórico/auditoria visível.

Para alegar cobertura completa de recursos nativos, a mesma execução também deve comprovar QR em dispositivo, foto efetivamente sincronizada/exibida na revisão e GPS na conclusão. Enquanto #229 e #65 não tiverem evidência E2E, essa cobertura permanece **PENDING**.

