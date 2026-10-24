# Limitações conhecidas — FieldOps

## 1. Objetivo

Este documento registra limitações comprovadas no estado atual do FieldOps e decisões conscientes de escopo. Uma limitação registrada não significa necessariamente falha do MVP: itens P1/P2 e opcionais não são blockers P0. O objetivo é transparência para avaliação, demonstração e planejamento, sem duplicar a auditoria técnica.

## 2. Tabela de limitações

| Limitação | Tipo | Impacto | Status atual | Issue | Bloqueia P0? | Mitigação/estado atual | Próxima ação |
|---|---|---|---|---|---|---|---|
| Upload real de foto ainda depende de ambiente/configuração. | IMPLEMENTATION_GAP | A foto pode permanecer local e não aparecer na revisão Web. | EvidenceUploadClient condiciona upload a EXPO_PUBLIC_EVIDENCE_UPLOAD=enabled; endpoint e código de retry existem. | [#229](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/229) | SIM | Persistência local, fila e retry estão no código; isso não comprova upload E2E. | Habilitar ambiente e registrar fluxo offline → retry → upload → revisão. |
| Localização na conclusão não é comprovada no código atual. | IMPLEMENTATION_GAP | Não é possível demonstrar coordenadas finais da inspeção. | useLocation é usado no início; a tela summary não captura localização final. | [#65](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/65) | SIM | A localização de início permanece disponível. | Implementar/integração pendente e validar em dispositivo e revisão Web. |
| Painel Web público não possui URL validada. | ENVIRONMENT_GAP | Limita demonstração remota e smoke test integrado. | Build/testes locais são evidência; deploy público não foi comprovado. | [#89](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/89) | SIM | O painel pode ser demonstrado em ambiente local controlado enquanto a publicação não é validada. | Publicar, registrar URL e executar login/revisão contra API real. |
| API pública e CORS não possuem validação de ambiente ativo. | ENVIRONMENT_GAP | Pode impedir Web/Mobile de consumir API fora do ambiente local. | Docker/Render e configuração CORS existem no repositório; URL pública e smoke test não foram registrados. | [#204](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/204) | SIM | API pode ser executada localmente por Docker/README. | Publicar API, configurar origens explícitas e testar login/sync reais. |
| APK Android instalado não foi apresentado como evidência. | VALIDATION_GAP | Não há prova de execução do Mobile no Android avaliado. | eas.json e instruções de build existem; artefato instalado não foi registrado. | [#88](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/88) | SIM | Configuração EAS está versionada. | Gerar, instalar e identificar APK/build usado na demo. |
| Suíte de testes Mobile ainda não tem execução reproduzível registrada. | VALIDATION_GAP | A qualidade Mobile não pode ser apresentada como aprovada pela suíte. | Há testes de sync/componentes; a auditoria não conseguiu iniciar Jest no checkout auditado. | [#85](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/85) | SIM | API registra 180 testes aprovados e Web registra suíte aprovada; esses resultados não cobrem Mobile. | Preparar toolchain, executar testes e registrar resultado/falhas reais. |
| Fluxo offline E2E em dispositivo ainda não foi registrado. | VALIDATION_GAP | Falta prova executada de offline → persistência → reconexão → sync → ausência de duplicidade → review. | SQLite, outbox, batch, cursor, idempotência, respostas e não conformidades já estão implementados; código e testes direcionados existem. | [#92](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/92), [#197](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/197) | SIM | O mecanismo de sync estruturada não é ausente; falta execução E2E registrada. | Executar roteiro do [demo-runbook](demo-runbook.md) e registrar resultado sem alteração manual. |
| Detalhes Web de cliente/local usam dados seed. | IMPLEMENTATION_GAP | Essas telas não devem ser apresentadas como integração completa com API real. | ClientsPage importa seedClients, seedSites e seedEquipment para as visões de detalhe. | [#263](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/263), [#264](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/264) | NÃO | Cadastros principais existem; limitação é delimitada às visões de detalhe. | Integrar detalhes à API e validar smoke test Web. |
| Entidades centrais usam IDs numéricos em vez de UUID globais previstos no documento de arquitetura. | TECHNICAL_DEBT | Divergência arquitetural documentada, sem evidência de quebra do fluxo MVP. | Diversas entidades usam GenerationType.IDENTITY. | — | NÃO | Migração perto da entrega aumentaria risco; a auditoria recomenda registrar a decisão. | Planejar migração pós-entrega, sem alterar chaves no caminho crítico. |
| Notificações locais, assinatura e diferenciais adicionais não são necessários para a entrega P0. | OPTIONAL_SCOPE | Não reduz o escopo obrigatório do MVP. | Não há uso de scheduleNotificationAsync no código atual; a implementação de assinatura não está concluída. | — | NÃO | Priorizar upload, GPS, ambiente, APK, sync E2E e testes Mobile. | Avaliar somente após estabilidade do caminho crítico. |

## 3. Riscos para a demonstração

Os riscos operacionais diretos são: ambiente Web/API indisponível ou com CORS incorreto; APK não instalado; upload de foto sem validação E2E; GPS final indisponível; cenário offline/sync não ensaiado; e ausência de resultado reproduzível da suíte Mobile.

O [demo-runbook](demo-runbook.md) contém a ordem de execução, o que registrar e a proibição de substituir o fluxo do usuário por Swagger, SQL manual, edição de SQLite ou mocks.

## 4. Dívidas técnicas que não devem bloquear a entrega

- **Long → UUID:** é TECHNICAL_DEBT documentada. Uma migração transversal de chaves durante estabilização tem risco maior que benefício para o P0.
- **Refactors não críticos e polish:** não corrigem os blockers de upload, GPS, ambiente, APK, sync E2E ou testes Mobile.
- **Dependências/vulnerabilidades:** não há auditoria atual de dependências nesta documentação que permita afirmar um número de vulnerabilidades. As issues [#259](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/259) e [#260](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/260) pedem verificação atual; não repetir snapshots antigos como achado presente.
- **Recursos P1/P2:** melhorias fora do caminho crítico, incluindo notificações locais, assinatura e outros diferenciais, devem ser tratadas como OPTIONAL_SCOPE e só depois do MVP estável.

## 5. Limitações já resolvidas ou não ativas

Os itens abaixo possuem implementação no código atual e não devem reaparecer como pendências ativas neste documento:

- sync de respostas;
- sync de não conformidades;
- cursor incremental;
- QR Code com CameraView;
- botão Iniciar revisão;
- comentários por item;

Eles ainda podem ser validados em dispositivo/demonstração, mas não são funcionalidades ausentes.

## 6. Referências

- [Índice de evidências](README.md)
- [Roteiro de demonstração E2E](demo-runbook.md)
- [Escopo e rubrica oficiais](../requisitos/fieldops-requisitos-rubrica.md)
- [Auditoria técnica final](auditorias/auditoria-final-fieldops.md)
- [Plano coletivo de conclusão](plano-100-pontos-equipe.md)

