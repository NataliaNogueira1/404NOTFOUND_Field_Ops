# 12 RESULTADOS E DISCUSSÃO

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 12 do Relatório Final, adaptado ao *Template - Relatório Final*.

Este capítulo consolida os resultados disponíveis no repositório e discute a
adequação da estratégia adotada. A análise distingue entregas implementadas e
evidências de validação: a existência de código, testes ou planejamento de
infraestrutura não é tratada como homologação ponta a ponta.

---

## 12.1 Portfólio e Programas Propostos

No contexto do FieldOps, o portfólio não corresponde a produtos independentes,
mas a um produto integrado para planejamento, execução e revisão de inspeções
em campo. A decomposição em frentes permite organizar dependências, recursos e
entregas sem perder a visão única do fluxo: o administrador configura e
acompanha inspeções no painel Web; o técnico as executa no aplicativo; e a API
centraliza regras de negócio, persistência e sincronização. Essa estrutura é
coerente com a [EAP](./eap.md), que reúne gestão, backend, Web, Mobile,
infraestrutura e qualidade como componentes da mesma entrega.

| Frente / entrega | Objetivo no produto integrado | Resultado atual |
|---|---|---|
| API Backend | Oferecer autenticação por perfis, regras de negócio, cadastros, modelos, inspeções, revisão, auditoria e sincronização. | Implementada e testada em escopo automatizado registrado. |
| Painel Web administrativo | Permitir cadastros, construtor de modelos, agendamento, revisão, decisão e acompanhamento por dashboard. | Implementado e testado em escopo automatizado registrado. |
| Aplicativo Mobile | Permitir ao técnico consultar, executar e concluir inspeções em campo. | Implementado; validação em APK/dispositivo permanece necessária. |
| Persistência e sincronização offline | Manter dados locais, enfileirar operações e reconciliar alterações ao reconectar. | Implementada; validação E2E em dispositivo permanece necessária. |
| Recursos nativos e evidências | Apoiar leitura de QR Code, câmera, evidências e localização na atividade de campo. | Implementados no código; homologação em dispositivo e fluxo integrado pendentes. |
| Infraestrutura e implantação | Disponibilizar Web, API, banco e evidências no ambiente final. | Planejada para ambiente AWS; implantação e validação final pendentes. |
| Gestão, qualidade e documentação | Controlar escopo, custos, responsabilidades, comunicação, riscos e evidências técnicas. | Implementados e documentados ao longo do projeto. |

O núcleo técnico conecta autenticação e autorização por perfil aos cadastros de
usuários, clientes, locais e equipamentos; estes sustentam os modelos de
inspeção versionados, o agendamento e a atribuição. No Mobile, o checklist
dinâmico utiliza o snapshot da inspeção, armazena respostas e não
conformidades em SQLite e as registra em uma outbox. A sincronização trata
operações como respostas e não conformidades com identificadores estáveis,
idempotência e pull incremental por cursor. Após o envio, a inspeção pode ser
revisada no Web, aprovada ou reprovada, com eventos de auditoria associados às
transições de estado. Os diagramas de entidades e de estados documentam essa
integração em [Diagramas da API](../arquitetura/api-diagrams.md).

Também estão presentes funcionalidades de apoio ao trabalho de campo, como
leitura de QR Code, captura de evidências por câmera e captura de localização
no início e na conclusão. Esses recursos, assim como a fila de evidências e as
tentativas de reenvio, representam resultados de implementação; a sua operação
conjunta em aparelho físico, rede real e revisão Web ainda depende de registro
de validação.

Quanto à qualidade, a evidência mais recente registrada em
[Testes e qualidade](../avaliacao/test-results.md) informa 180 testes da API
sem falhas ou erros na auditoria técnica; para o Web, o registro de 08/11/2026
informa build aprovado e 219 testes aprovados em 42 arquivos; e, para o
Mobile, a mesma atualização registra 141 testes aprovados em 15 suítes por
`npx jest --ci`. Essa última execução ocorreu com Node 24 e
`npm ci --ignore-scripts`, enquanto o projeto declara Node 22, razão pela qual
ela não substitui a preparação reproduzível do ambiente padrão, o APK nem os
testes em dispositivo. Em nenhum dos casos os resultados automatizados provam
a demonstração E2E final.

O resultado consolidado, portanto, é uma solução com frentes técnicas
conectadas e mecanismos de teste e documentação disponíveis, mas com a
homologação do caminho completo ainda em etapa de validação final. A execução
dos 12 testes ponta a ponta na AWS, vinculada à atividade de validação própria,
deverá ser registrada na etapa de encerramento; não constitui resultado
concluído deste capítulo.

## 12.2 Análise da Estratégia e Viabilidade

A estratégia de dividir a solução entre API Spring Boot, painel React/Vite e
aplicativo Expo/React Native foi adequada ao problema de inspeção em campo. A
API concentra o domínio e o PostgreSQL; o Web atende administrador e
supervisor; e o Mobile atende o técnico quando a conectividade é limitada. O
uso de SQLite, outbox, idempotência e pull incremental responde diretamente ao
principal risco técnico identificado: perda, duplicidade ou inconsistência de
dados na sincronização. As respostas previstas para esse risco e para
dependências entre frentes estão formalizadas no
[Capítulo 9 — Gerenciamento dos Riscos](./relatorio-final-cap9-gerenciamento-riscos.md).

Essa separação, porém, exigiu coordenação contínua. Mudanças de contrato da API
podem afetar simultaneamente Web e Mobile; por isso, o projeto adotou OpenAPI,
alinhamentos entre lideranças e revisão de código como mecanismos de integração,
conforme o [Plano de Comunicação](./plano-de-comunicacao.md). A divisão de
responsabilidades da equipe de nove integrantes, registrada na
[Matriz RACI](./matriz-raci.md), concentrou a execução em Backend, Web, Mobile e
Gestão, mas também trouxe a limitação de acúmulo de papéis nas lideranças. Essa
restrição reforçou a necessidade de priorização do MVP e de sequenciamento das
dependências, em vez de tratar todas as funcionalidades como independentes.

Sob o aspecto econômico, a proposta é viável dentro da linha de base aprovada:
o investimento consolidado de R$ 204.000,00 inclui R$ 189.395,00 em custos
diretos e R$ 14.605,00 de reserva de contingência. A maior parcela é destinada
a recursos humanos, o que é compatível com a natureza de desenvolvimento e
integração do produto. Esses valores já estão consolidados no
[Capítulo 5 — Gerenciamento dos Custos](./relatorio-final-cap5-gerenciamento-custos.md)
e não são recalculados neste capítulo.

Em prazo, o cronograma organizou o núcleo do MVP nas duas sprints, priorizando
autenticação, cadastros, checklist, operação offline, sincronização e revisão.
A estratégia de redução de escopo documentada preserva esse caminho crítico e
posterga diferenciais quando necessário. Essa decisão é compatível com o
[cronograma do projeto](./cronograma.md), mas não elimina a dependência de
ambiente para a demonstração final.

Quanto à infraestrutura, a proposta AWS prevê Web estático em S3 com
CloudFront, API Spring Boot em EC2, PostgreSQL em RDS privado e evidências em
S3 privado. A compatibilidade da arquitetura com a stack foi analisada em
[Arquitetura do FieldOps na AWS](../arquitetura/arquitetura-aws.md), inclusive
quanto ao uso de configuração por ambiente, CORS e armazenamento de evidências.
Trata-se de plano de implantação e validação: não há, nesta evidência,
confirmação de URL pública, recursos AWS ativos, evidência em S3/CloudFront/EC2
ou RDS, nem homologação dos 12 testes do professor.

A análise crítica indica que as decisões técnicas endereçaram os pontos mais
sensíveis do domínio — execução offline, rastreabilidade de mudanças e revisão
administrativa — e que a documentação reduziu ambiguidades entre as frentes.
Em contrapartida, a complexidade de sincronizar dados e evidências, a
necessidade de configurar ambiente acessível ao aplicativo e a validação de
recursos nativos aumentam o risco de integração. As limitações verificáveis,
como validação de ambiente público, APK/dispositivo e fluxo E2E, permanecem
registradas em [Limitações conhecidas](../avaliacao/known-limitations.md).

Assim, a solução apresenta viabilidade técnica, operacional e econômica para
o escopo do MVP, condicionada à conclusão da homologação. A infraestrutura
final encontra-se no plano de implantação/validação, e a validação ponta a
ponta final será registrada na etapa de encerramento, sem antecipar como
concluídos resultados que ainda dependem dessa evidência.
