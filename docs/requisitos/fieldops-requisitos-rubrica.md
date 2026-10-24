## 

# **01 \- Visão Geral**

## 1\. Visão Geral

### 1.1 Nome do produto

FieldOps — Plataforma de Inspeção em Campo

### 1.2 Resumo executivo

O FieldOps é uma plataforma digital para planejamento, execução, acompanhamento e revisão de inspeções técnicas realizadas em campo.

A solução substituirá processos baseados em formulários impressos, planilhas, mensagens e registros informais por um fluxo digital integrado. Técnicos utilizarão um aplicativo mobile para consultar as inspeções atribuídas, identificar equipamentos, responder checklists, registrar evidências e concluir atividades, inclusive em locais sem conexão com a internet.

Administradores e supervisores utilizarão uma interface administrativa web para cadastrar informações, criar modelos de inspeção, agendar atividades, atribuir técnicos, acompanhar a execução, analisar não conformidades e aprovar ou reprovar os resultados.

Uma API REST centralizará as regras de negócio, a autenticação, a autorização, a persistência, a auditoria e a integração entre o aplicativo mobile e a interface administrativa.

### 1.3 Declaração da visão do produto

Para organizações que precisam executar inspeções técnicas de forma padronizada e rastreável, o FieldOps é uma plataforma integrada que permite planejar, executar e revisar inspeções em campo, mesmo sem conexão com a internet. Diferentemente de formulários em papel, planilhas ou aplicativos genéricos, o FieldOps conecta o trabalho do técnico à gestão administrativa, preservando evidências, histórico, localização e regras de negócio em um único fluxo digital.

### 1.4 Componentes da solução

A solução será composta por quatro componentes principais:

#### Aplicativo mobile

Aplicação destinada principalmente aos técnicos de campo.

Responsabilidades principais:

autenticação e gerenciamento da sessão;

consulta das inspeções atribuídas;

identificação de equipamentos por QR Code;

execução de checklists dinâmicos;

captura de fotografias;

registro de observações e não conformidades;

captura de localização;

armazenamento local;

funcionamento offline;

sincronização com o servidor.

#### Interface administrativa web

Aplicação destinada aos administradores e supervisores.

Responsabilidades principais:

gerenciamento de usuários e perfis;

cadastro de clientes, locais e equipamentos;

criação e versionamento de modelos de inspeção;

agendamento e atribuição de inspeções;

acompanhamento do andamento;

visualização de respostas e evidências;

revisão, aprovação e reprovação;

acompanhamento de não conformidades;

consulta de indicadores.

#### API REST

Aplicação central responsável pela segurança, pelas regras de negócio e pela persistência.

Responsabilidades principais:

autenticação e autorização;

validação das operações;

aplicação das regras de negócio;

persistência em banco de dados;

upload e consulta de evidências;

sincronização de dados;

histórico e auditoria;

fornecimento de dados para mobile e web;

documentação do contrato da API.

#### Infraestrutura de dados

Componente formado pelo banco de dados, armazenamento de arquivos e mecanismos locais do aplicativo.

Elementos principais:

PostgreSQL para os dados centrais;

SQLite para a persistência local no dispositivo;

armazenamento de arquivos compatível com objetos para evidências;

logs e registros de auditoria;

ambientes separados de desenvolvimento, teste e produção.

### 1.5 Escopo do produto

O FieldOps cobrirá o fluxo compreendido entre a preparação de uma inspeção e sua aprovação final:

Configuração administrativa ↓ Criação do modelo de inspeção ↓ Agendamento e atribuição ↓ Disponibilização ao técnico ↓ Execução em campo ↓ Registro de respostas e evidências ↓ Sincronização ↓ Revisão do supervisor ↓ Aprovação ou solicitação de correção

​

### 1.6 Escopo do MVP

O MVP deverá permitir uma demonstração completa do fluxo principal:

o administrador cadastra os dados básicos;

o supervisor cria um modelo de inspeção;

o supervisor agenda a inspeção e a atribui a um técnico;

o técnico recebe a inspeção no aplicativo;

o técnico executa o checklist, registra fotos, QR Code e localização;

o técnico consegue trabalhar temporariamente sem internet;

o aplicativo sincroniza os dados pendentes;

o supervisor revisa o resultado;

o supervisor aprova ou reprova a inspeção.

### 1.7 Fora do escopo do MVP

Os seguintes recursos não são obrigatórios na primeira versão:

aplicativo mobile exclusivo para clientes;

portal público;

multiempresa com isolamento completo de dados;

pagamento ou faturamento;

roteirização automática de equipes;

transmissão contínua da localização do técnico;

chamadas de vídeo;

armazenamento de vídeos longos;

assinatura eletrônica com validade jurídica;

geração avançada de relatórios regulatórios;

integração com ERPs;

inteligência artificial para diagnóstico automático;

integração com sensores IoT;

resolução colaborativa de conflitos complexos de sincronização.

### 1.8 Premissas

A primeira versão terá o Android como plataforma mobile prioritária.

O aplicativo poderá ser executado também em outros ambientes suportados pelo Expo, mas a validação obrigatória ocorrerá em Android.

O sistema será utilizado inicialmente por uma organização operadora que presta inspeções para vários clientes.

Cada inspeção terá um técnico responsável no MVP.

O supervisor será responsável pela revisão do resultado.

O equipamento poderá ser identificado por um QR Code único.

As inspeções serão baseadas em modelos previamente configurados.

O aplicativo deverá preservar dados não sincronizados mesmo após ser fechado.

A API será o sistema oficial de registro após a sincronização.

### 1.9 Glossário inicial

| Termo | Definição |
| ----- | ----- |
| Cliente | Organização atendida pela empresa que executa as inspeções. |
| Local | Unidade, planta, prédio, setor ou área pertencente a um cliente. |
| Equipamento | Ativo físico que poderá ser inspecionado. |
| Modelo de inspeção | Estrutura reutilizável que define seções, itens e tipos de resposta. |
| Inspeção | Instância agendada de um modelo para um local ou equipamento. |
| Checklist | Conjunto de itens que devem ser respondidos durante a inspeção. |
| Evidência | Arquivo ou registro que comprova uma resposta ou ocorrência. |
| Não conformidade | Situação identificada que não atende a um requisito esperado. |
| Sincronização | Processo de troca de alterações entre o dispositivo e o servidor. |
| Snapshot | Cópia imutável do modelo utilizada por uma inspeção específica. |
| Outbox | Fila local de operações que aguardam envio ao servidor. |
| MVP | Menor versão capaz de demonstrar o fluxo de valor principal. |

# 

# 

# **02 \- Objetivos**

## 2\. Objetivos

### 2.1 Objetivo geral do produto

Desenvolver uma plataforma integrada que permita configurar, planejar, executar, sincronizar, revisar e auditar inspeções técnicas em campo de forma padronizada, segura e rastreável.

### 2.2 Objetivos específicos de negócio

Reduzir o uso de formulários em papel e planilhas isoladas.

Padronizar a execução das inspeções por meio de modelos e checklists.

Diminuir a perda e o preenchimento incompleto de informações.

Permitir que supervisores acompanhem o andamento das atividades.

Associar respostas a evidências, data, usuário, equipamento e localização.

Preservar a rastreabilidade das alterações.

Permitir a execução de inspeções em locais sem conectividade.

Reduzir o intervalo entre a execução em campo e a disponibilidade do resultado.

Facilitar a identificação e o acompanhamento de não conformidades.

### 2.3 Objetivos específicos do aplicativo mobile

Disponibilizar ao técnico apenas as inspeções relacionadas ao seu trabalho.

Apresentar uma interface adequada ao uso em campo.

Carregar checklists dinamicamente a partir da API.

Capturar fotos, QR Code e localização mediante autorização.

Armazenar localmente inspeções e respostas.

Exibir claramente o estado de sincronização.

Evitar a perda de dados em caso de falha de rede ou fechamento do aplicativo.

Permitir retomada de uma inspeção em andamento.

### 2.4 Objetivos específicos da interface administrativa

Permitir que operações administrativas sejam realizadas sem acesso direto ao banco ou ao Swagger.

Centralizar o cadastro de clientes, locais, equipamentos e usuários.

Permitir a criação e manutenção de modelos de inspeção.

Agendar e atribuir inspeções aos técnicos.

Acompanhar o status das inspeções.

Apresentar respostas, evidências e não conformidades de maneira organizada.

Permitir aprovação, reprovação e solicitação de correção.

Fornecer indicadores básicos para supervisão.

### 2.5 Objetivos específicos da API

Disponibilizar um contrato REST versionado e documentado.

Implementar autenticação e autorização por perfil.

Centralizar e validar as regras de negócio.

Manter consistência entre mobile, web e banco de dados.

Disponibilizar operações idempotentes para sincronização.

Evitar duplicidade de registros em reenvios.

Registrar auditoria das operações relevantes.

Tratar erros de forma padronizada.

### 2.6 Objetivos acadêmicos

O projeto deverá permitir que os estudantes apliquem, de maneira integrada:

#### Desenvolvimento mobile

Expo e React Native;

TypeScript;

Expo Router;

gerenciamento de estado;

consumo de API;

formulários dinâmicos;

câmera e seleção de imagens;

QR Code;

geolocalização;

SQLite;

conectividade e sincronização;

testes, acessibilidade e distribuição.

#### Desenvolvimento backend

Java e Spring Boot;

modelagem de domínio;

JPA e PostgreSQL;

validação;

autenticação JWT;

controle de acesso;

APIs REST;

upload de arquivos;

paginação e filtros;

sincronização;

testes e documentação OpenAPI.

#### Desenvolvimento web administrativo

Angular/React e TypeScript;

rotas protegidas;

formulários;

consumo de API;

componentes reutilizáveis;

tabelas, filtros e paginação;

tratamento de estados de carregamento, vazio e erro;

revisão de inspeções e visualização de evidências.

#### Engenharia de software

levantamento e refinamento de requisitos;

backlog e critérios de aceitação;

Git e pull requests;

separação de responsabilidades;

integração entre equipes;

revisão de código;

testes;

documentação técnica;

demonstrações incrementais.

### 2.7 Indicadores de sucesso do MVP

O MVP será considerado funcional quando:

um supervisor conseguir cadastrar ou selecionar os dados necessários sem utilizar diretamente o banco de dados;

um modelo de inspeção puder ser configurado pela interface administrativa;

uma inspeção puder ser criada e atribuída a um técnico;

o técnico conseguir receber e abrir a inspeção no aplicativo;

o checklist for apresentado dinamicamente;

os itens obrigatórios forem validados;

fotografias puderem ser associadas a itens do checklist;

o equipamento puder ser identificado por QR Code;

a localização puder ser registrada quando autorizada;

uma inspeção puder ser executada sem conexão após ser baixada;

o reenvio da mesma operação não criar dados duplicados;

o supervisor conseguir revisar, aprovar ou reprovar o resultado;

uma inspeção aprovada ficar protegida contra alterações comuns;

a API estiver documentada e puder ser executada a partir das instruções do projeto.

### 2.8 Não objetivos

O projeto não tem como objetivo, no MVP:

substituir sistemas corporativos completos de manutenção;

garantir conformidade com todas as normas de todos os setores industriais;

realizar diagnóstico automático;

controlar equipes em tempo real;

suportar volume corporativo de milhões de inspeções;

oferecer todas as funcionalidades de um produto comercial pronto para venda.

# **04 \- Personas**

## 4\. Personas

As personas são representações fictícias utilizadas para orientar decisões de produto. Elas não representam pessoas reais.

### 4.1 Carlos — Técnico de campo

| Atributo | Descrição |
| ----- | ----- |
| Idade | 34 anos |
| Contexto | Realiza inspeções em equipamentos instalados em diferentes locais. |
| Dispositivo | Smartphone Android corporativo ou pessoal. |
| Ambiente | Campo, indústria, áreas externas e locais com internet instável. |
| Frequência de uso | Diária. |

#### Objetivos

localizar rapidamente as inspeções do dia;

entender o que deve ser verificado;

registrar respostas com poucos passos;

anexar fotos ao item correto;

continuar trabalhando sem internet;

saber se os dados já foram enviados;

evitar retornar ao local para completar informações esquecidas.

#### Dores

formulários longos e pouco claros;

campos que exigem digitação excessiva;

perda de informações;

dificuldade para encontrar o equipamento correto;

fotografias sem identificação;

mensagens de erro técnicas;

dúvidas sobre sincronização.

#### Necessidades de experiência

botões e áreas de toque adequados;

feedback imediato;

progresso do checklist;

indicação de obrigatoriedade;

salvamento automático local;

mensagens objetivas;

funcionamento previsível em rede instável.

#### Critério de sucesso

Carlos considera o produto útil quando consegue concluir uma inspeção sem papel, sem perder respostas e sem precisar organizar as evidências manualmente depois.

### 4.2 Marina — Supervisora de inspeções

| Atributo | Descrição |
| ----- | ----- |
| Idade | 41 anos |
| Contexto | Planeja e acompanha o trabalho de vários técnicos. |
| Dispositivo | Notebook ou desktop. |
| Ambiente | Escritório ou operação administrativa. |
| Frequência de uso | Diária. |

#### Objetivos

criar e reutilizar modelos;

atribuir inspeções;

acompanhar prazos e status;

visualizar respostas e fotografias;

identificar não conformidades;

aprovar ou solicitar correções;

manter um histórico confiável.

#### Dores

informações recebidas por vários canais;

atrasos descobertos somente no final;

evidências sem contexto;

dificuldade para saber qual versão do formulário foi utilizada;

necessidade de solicitar complementos;

falta de indicadores.

#### Necessidades de experiência

painel com prioridades;

filtros eficientes;

visualização clara do progresso;

revisão item a item;

histórico de ações;

confirmação antes de decisões irreversíveis.

#### Critério de sucesso

Marina considera o produto útil quando consegue planejar, acompanhar e revisar uma inspeção sem utilizar planilhas paralelas.

### 4.3 Ana — Administradora do sistema

| Atributo | Descrição |
| ----- | ----- |
| Idade | 38 anos |
| Contexto | Mantém cadastros, usuários e permissões. |
| Dispositivo | Notebook ou desktop. |
| Frequência de uso | Semanal ou conforme necessidade. |

#### Objetivos

cadastrar usuários corretamente;

controlar perfis e situação de acesso;

evitar duplicidades;

manter clientes, locais e equipamentos atualizados;

consultar histórico de alterações relevantes.

#### Dores

cadastros distribuídos;

permissões inconsistentes;

necessidade de solicitar alterações à equipe técnica;

dificuldade para inativar registros sem perder histórico.

#### Necessidades de experiência

formulários validados;

pesquisa e filtros;

inativação em vez de exclusão destrutiva;

mensagens de erro compreensíveis;

confirmação de operações críticas.

#### Critério de sucesso

Ana considera o produto útil quando consegue manter os dados centrais sem acessar diretamente a infraestrutura técnica.

### 4.4 Roberto — Responsável do cliente

| Atributo | Descrição |
| ----- | ----- |
| Idade | 47 anos |
| Contexto | Acompanha inspeções realizadas em sua unidade. |
| Dispositivo | Notebook, tablet ou smartphone. |
| Frequência de uso | Eventual. |

#### Objetivos

consultar o resultado das inspeções;

visualizar evidências;

entender não conformidades;

acompanhar o estado das correções;

obter um registro confiável.

#### Dores

relatórios atrasados;

informações técnicas pouco organizadas;

dificuldade para localizar evidências;

falta de transparência sobre pendências.

#### Necessidades de experiência

acesso somente leitura;

linguagem clara;

filtros por local, equipamento e período;

visualização organizada do resultado.

#### Critério de sucesso

Roberto considera o produto útil quando consegue compreender o resultado e as pendências sem solicitar arquivos por e-mail.

Decisão de escopo: o perfil Cliente poderá existir no modelo de autorização, mas seu portal completo será tratado como funcionalidade futura. No MVP, o supervisor poderá apresentar ou exportar os resultados.

# **05 \- Perfis de Usuário**

## 5\. Perfis de Usuário

### 5.1 Perfis previstos

Administrador — ADMIN

Supervisor — SUPERVISOR

Técnico — TECHNICIAN

Cliente somente leitura — CLIENT\_VIEWER — futuro ou opcional

### 5.2 Matriz de permissões

| Funcionalidade | Administrador | Supervisor | Técnico | Cliente |
| ----- | ----- | ----- | ----- | ----- |
| Acessar interface administrativa | ![✅][image1]​ | ![✅][image2]​ | Opcional | Futuro |
| Acessar aplicativo de campo | Opcional | Opcional | ![✅][image3]​ | ![❌][image4]​ |
| Gerenciar usuários | ![✅][image5]​ | ![❌][image6]​ | ![❌][image7]​ | ![❌][image8]​ |
| Gerenciar perfis | ![✅][image9]​ | ![❌][image10]​ | ![❌][image11]​ | ![❌][image12]​ |
| Cadastrar clientes | ![✅][image13]​ | ![✅][image14]​ | ![❌][image15]​ | ![❌][image16]​ |
| Cadastrar locais | ![✅][image17]​ | ![✅][image18]​ | ![❌][image19]​ | ![❌][image20]​ |
| Cadastrar equipamentos | ![✅][image21]​ | ![✅][image22]​ | Consulta | Consulta própria |
| Criar modelos de inspeção | ![✅][image23]​ | ![✅][image24]​ | ![❌][image25]​ | ![❌][image26]​ |
| Publicar versão de modelo | ![✅][image27]​ | ![✅][image28]​ | ![❌][image29]​ | ![❌][image30]​ |
| Agendar inspeção | ![✅][image31]​ | ![✅][image32]​ | ![❌][image33]​ | ![❌][image34]​ |
| Atribuir técnico | ![✅][image35]​ | ![✅][image36]​ | ![❌][image37]​ | ![❌][image38]​ |
| Consultar todas as inspeções | ![✅][image39]​ | ![✅][image40]​ | ![❌][image41]​ | ![❌][image42]​ |
| Consultar inspeções atribuídas | ![✅][image43]​ | ![✅][image44]​ | ![✅][image45]​ | ![❌][image46]​ |
| Iniciar inspeção | ![❌][image47]​ | Opcional | ![✅][image48]​ | ![❌][image49]​ |
| Responder checklist | ![❌][image50]​ | Opcional | ![✅][image51]​ | ![❌][image52]​ |
| Registrar evidência | ![❌][image53]​ | Opcional | ![✅][image54]​ | ![❌][image55]​ |
| Registrar não conformidade | ![❌][image56]​ | Opcional | ![✅][image57]​ | ![❌][image58]​ |
| Enviar para revisão | ![❌][image59]​ | Opcional | ![✅][image60]​ | ![❌][image61]​ |
| Revisar inspeção | ![❌][image62]​ | ![✅][image63]​ | ![❌][image64]​ | ![❌][image65]​ |
| Aprovar ou reprovar | ![❌][image66]​ | ![✅][image67]​ | ![❌][image68]​ | ![❌][image69]​ |
| Consultar auditoria | ![✅][image70]​ | ![✅][image71]​ | Próprias ações | ![❌][image72]​ |
| Consultar indicadores | ![✅][image73]​ | ![✅][image74]​ | Próprios | Futuro |
| Consultar resultado do cliente | ![✅][image75]​ | ![✅][image76]​ | Conforme atribuição | Futuro |

### 5.3 Princípios de autorização

O sistema deverá aplicar o princípio do menor privilégio.

A interface não deverá ser considerada mecanismo suficiente de segurança; as permissões serão validadas pela API.

O técnico somente poderá alterar inspeções atribuídas a ele e em estado compatível.

O supervisor poderá revisar as inspeções pertencentes ao seu escopo operacional.

O administrador gerenciará acesso e cadastros, mas não será automaticamente autorizado a alterar respostas de uma inspeção.

Registros aprovados deverão ser protegidos contra edição comum.

Operações não autorizadas deverão retornar erro padronizado e não revelar dados sensíveis.

### 5.4 Situação do usuário

Um usuário poderá estar:

ativo;

inativo;

bloqueado temporariamente.

Usuários inativos ou bloqueados não poderão iniciar novas sessões. A inativação não excluirá o histórico relacionado ao usuário.

# **06 \- Casos de Uso**

## 6\. Casos de Uso

### 6.1 Catálogo resumido

| ID | Caso de uso | Ator principal | Canal | Prioridade |
| ----- | ----- | ----- | ----- | ----- |
| UC-01 | Autenticar usuário | Todos | Mobile/Web | P0 |
| UC-02 | Gerenciar usuários | Administrador | Web | P0 |
| UC-03 | Gerenciar clientes, locais e equipamentos | Administrador/Supervisor | Web | P0 |
| UC-04 | Criar modelo de inspeção | Supervisor | Web | P0 |
| UC-05 | Publicar versão do modelo | Supervisor | Web | P0 |
| UC-06 | Agendar e atribuir inspeção | Supervisor | Web | P0 |
| UC-07 | Baixar inspeções atribuídas | Técnico | Mobile | P0 |
| UC-08 | Identificar equipamento por QR Code | Técnico | Mobile | P0 |
| UC-09 | Iniciar inspeção | Técnico | Mobile | P0 |
| UC-10 | Responder checklist | Técnico | Mobile | P0 |
| UC-11 | Registrar evidência | Técnico | Mobile | P0 |
| UC-12 | Registrar não conformidade | Técnico | Mobile | P0 |
| UC-13 | Concluir inspeção offline | Técnico | Mobile | P0 |
| UC-14 | Sincronizar alterações | Técnico/Sistema | Mobile/API | P0 |
| UC-15 | Acompanhar inspeções | Supervisor | Web | P0 |
| UC-16 | Revisar inspeção | Supervisor | Web | P0 |
| UC-17 | Aprovar ou reprovar inspeção | Supervisor | Web | P0 |
| UC-18 | Consultar histórico | Administrador/Supervisor | Web | P1 |
| UC-19 | Consultar indicadores | Supervisor | Web | P1 |
| UC-20 | Consultar resultado como cliente | Cliente | Web | P2 |

### 6.2 UC-01 — Autenticar usuário

Ator principal: qualquer usuário ativo.

Pré-condições: usuário cadastrado e ativo.

Gatilho: o usuário informa suas credenciais.

#### Fluxo principal

O usuário informa e-mail e senha.

A aplicação valida o formato dos campos.

A aplicação envia as credenciais à API.

A API valida o usuário e a senha.

A API retorna tokens e informações mínimas do perfil.

A aplicação armazena a sessão de forma apropriada ao canal.

O usuário é direcionado à área autorizada.

#### Fluxos alternativos

Credenciais inválidas: exibir mensagem sem informar qual campo está incorreto.

Usuário inativo: negar acesso e orientar contato com a administração.

Falha de rede no mobile: permitir somente o acesso offline quando existir uma sessão previamente válida e dados locais autorizados.

Token expirado: tentar renovação conforme contrato da API.

#### Pós-condições

Sessão autenticada criada; ou

acesso negado sem alteração indevida de dados.

### 6.3 UC-04 — Criar modelo de inspeção

Ator principal: supervisor.

Pré-condições: usuário autenticado com permissão.

Gatilho: necessidade de padronizar um tipo de inspeção.

#### Fluxo principal

O supervisor cria um modelo em estado de rascunho.

Informa título, descrição e categoria.

Cria uma ou mais seções.

Adiciona itens às seções.

Define o tipo de resposta de cada item.

Define obrigatoriedade, regras de evidência e ordem.

Salva o rascunho.

Valida a prévia do checklist.

Publica uma versão do modelo.

#### Fluxos alternativos

Modelo sem itens: publicação bloqueada.

Item sem tipo de resposta: publicação bloqueada.

Modelo já utilizado: alterações estruturais geram nova versão.

#### Pós-condições

Uma versão imutável do modelo fica disponível para novas inspeções.

### 6.4 UC-06 — Agendar e atribuir inspeção

Ator principal: supervisor.

Pré-condições: cliente, local, equipamento, técnico e modelo válidos.

Gatilho: necessidade de executar uma inspeção.

#### Fluxo principal

O supervisor seleciona o modelo publicado.

Seleciona cliente, local e equipamento, quando aplicável.

Define técnico, prioridade e data prevista.

Informa orientações adicionais.

Confirma o agendamento.

A API cria a inspeção e seu snapshot de itens.

A inspeção fica disponível para sincronização pelo técnico.

#### Fluxos alternativos

Técnico inativo: operação bloqueada.

Modelo sem versão publicada: operação bloqueada.

Equipamento incompatível com o local: operação bloqueada.

#### Pós-condições

Inspeção criada em estado atribuído.

### 6.5 UC-07 — Baixar inspeções atribuídas

Ator principal: técnico.

Pré-condições: sessão válida e conectividade.

Gatilho: atualização manual ou automática dos dados.

#### Fluxo principal

O aplicativo consulta alterações disponíveis para o técnico.

A API retorna inspeções e dados auxiliares autorizados.

O aplicativo grava os dados em SQLite.

O aplicativo atualiza a data da última sincronização.

As inspeções ficam disponíveis offline.

#### Fluxos alternativos

Falha parcial: manter dados anteriores e registrar o erro.

Inspeção cancelada no servidor: atualizar o estado local sem apagar respostas pendentes de forma silenciosa.

#### Pós-condições

Base local atualizada ou preservada em caso de falha.

### 6.6 UC-08 — Identificar equipamento por QR Code

Ator principal: técnico.

Pré-condições: permissão de câmera concedida e equipamento com código cadastrado.

Gatilho: técnico inicia a leitura.

#### Fluxo principal

O aplicativo solicita ou verifica a permissão da câmera.

O técnico aponta a câmera para o QR Code.

O aplicativo lê o identificador.

O aplicativo procura o equipamento na base local.

Quando necessário e possível, consulta a API.

Exibe os dados do equipamento.

O técnico confirma o vínculo com a inspeção.

#### Fluxos alternativos

Código desconhecido: informar que o equipamento não foi localizado.

Equipamento diferente do previsto: solicitar confirmação ou bloquear conforme regra da inspeção.

Permissão negada: disponibilizar identificação manual quando permitido.

### 6.7 UC-09 — Iniciar inspeção

Ator principal: técnico.

Pré-condições: inspeção atribuída ao técnico e disponível localmente.

Gatilho: seleção da ação “Iniciar inspeção”.

#### Fluxo principal

O aplicativo apresenta os dados principais.

O técnico confirma o início.

O aplicativo registra data e hora do dispositivo.

Solicita a localização, quando prevista.

Altera o estado local para em andamento.

Registra a operação na outbox.

Apresenta o checklist.

#### Fluxos alternativos

Inspeção cancelada: início bloqueado após atualização do estado.

Localização negada: continuar somente se a política da inspeção permitir.

### 6.8 UC-10 — Responder checklist

Ator principal: técnico.

Pré-condições: inspeção em andamento.

Gatilho: abertura de uma seção ou item.

#### Fluxo principal

O aplicativo apresenta as seções e os itens do snapshot.

Renderiza o componente adequado ao tipo de resposta.

O técnico informa a resposta.

O aplicativo valida o valor.

A resposta é salva imediatamente no banco local.

O progresso é atualizado.

A operação pendente é registrada para sincronização.

#### Fluxos alternativos

Resposta não conforme: exigir observação quando configurado.

Item crítico: exigir evidência quando aplicável.

Valor inválido: impedir o avanço e apresentar orientação.

### 6.9 UC-11 — Registrar evidência

Ator principal: técnico.

Pré-condições: permissão de câmera ou arquivos e inspeção editável.

Gatilho: ação de adicionar evidência.

#### Fluxo principal

O técnico escolhe capturar foto ou selecionar imagem.

O aplicativo obtém a imagem.

Exibe uma prévia.

O técnico confirma ou refaz a captura.

O aplicativo associa a evidência à inspeção, resposta ou não conformidade.

O arquivo é armazenado localmente.

A evidência é adicionada à fila de sincronização.

#### Fluxos alternativos

Arquivo excede o limite: informar e permitir nova captura.

Falha no envio: manter o arquivo local e marcar como pendente.

Exclusão antes da sincronização: remover localmente e cancelar a operação pendente.

### 6.10 UC-12 — Registrar não conformidade

Ator principal: técnico.

Pré-condições: inspeção em andamento.

Gatilho: identificação de problema ou resposta configurada como não conforme.

#### Fluxo principal

O técnico seleciona ou confirma a criação da não conformidade.

Informa título, descrição e criticidade.

Adiciona evidências quando necessário.

O aplicativo valida os campos.

Salva o registro localmente.

Relaciona a não conformidade ao item e à inspeção.

Adiciona a operação à outbox.

### 6.11 UC-13 — Concluir inspeção offline

Ator principal: técnico.

Pré-condições: inspeção em andamento e dados locais disponíveis.

Gatilho: ação de concluir.

#### Fluxo principal

O aplicativo valida os itens obrigatórios.

Valida observações e evidências exigidas.

Apresenta o resumo.

O técnico confirma a conclusão.

O aplicativo registra data e hora local.

O estado local muda para aguardando sincronização.

As respostas ficam bloqueadas para edição comum.

A operação de conclusão é adicionada à outbox.

#### Fluxos alternativos

Itens obrigatórios pendentes: conclusão bloqueada e itens destacados.

Evidência obrigatória ausente: conclusão bloqueada.

### 6.12 UC-14 — Sincronizar alterações

Ator principal: sistema, com acompanhamento do técnico.

Pré-condições: sessão válida, conectividade e operações pendentes.

Gatilho: ação manual, abertura do aplicativo ou evento de conectividade.

#### Fluxo principal

O aplicativo identifica operações pendentes.

Organiza as operações por dependência.

Envia um lote com identificadores idempotentes.

A API valida autorização e versão dos registros.

A API processa cada operação.

Retorna o resultado individual de cada item.

O aplicativo marca operações concluídas.

Mantém falhas como pendentes e registra a mensagem.

Baixa alterações do servidor.

Atualiza o estado da inspeção.

#### Fluxos alternativos

Token expirado: renovar e repetir de maneira controlada.

Conflito: preservar a alteração local, informar o usuário e aplicar a política definida.

Falha de arquivo: sincronizar dados textuais e manter a evidência pendente, quando permitido.

Reenvio: a API retorna o resultado anterior sem duplicar dados.

### 6.13 UC-16 — Revisar inspeção

Ator principal: supervisor.

Pré-condições: inspeção enviada e disponível para revisão.

Gatilho: abertura da inspeção na interface administrativa.

#### Fluxo principal

O supervisor visualiza o resumo.

Consulta as informações do equipamento e do técnico.

Navega pelas seções do checklist.

Analisa respostas, observações, localização e evidências.

Consulta não conformidades.

Registra comentários de revisão quando necessário.

Decide aprovar ou reprovar.

### 6.14 UC-17 — Aprovar ou reprovar inspeção

Ator principal: supervisor.

Pré-condições: inspeção em revisão.

Gatilho: decisão do supervisor.

#### Fluxo de aprovação

O supervisor seleciona aprovar.

Confirma a decisão.

A API registra usuário, data e comentário.

A inspeção passa para aprovada.

O conteúdo fica protegido contra alterações comuns.

#### Fluxo de reprovação

O supervisor seleciona reprovar.

Informa obrigatoriamente o motivo.

Pode indicar itens que exigem correção.

A API registra a revisão.

A inspeção passa para reprovada.

O técnico poderá recebê-la novamente conforme fluxo de correção.

# **07 \- Fluxo Geral**

## 7\. Fluxo Geral

### 7.1 Fluxo de valor ponta a ponta

ADMINISTRAÇÃO Cadastrar usuários, clientes, locais e equipamentos ↓ CONFIGURAÇÃO Criar e publicar modelo de inspeção ↓ PLANEJAMENTO Agendar inspeção e atribuir técnico ↓ DISTRIBUIÇÃO Aplicativo baixa a inspeção e o checklist ↓ EXECUÇÃO Técnico inicia, responde, fotografa e registra ocorrências ↓ OPERAÇÃO OFFLINE Dados são preservados em SQLite e na fila local ↓ SINCRONIZAÇÃO Aplicativo envia operações pendentes e baixa atualizações ↓ REVISÃO Supervisor analisa respostas, evidências e não conformidades ↓ DECISÃO Aprovar ou reprovar com solicitação de correção ↓ ENCERRAMENTO Resultado permanece disponível para consulta e auditoria

​

### 7.2 Fluxo administrativo

O administrador cria ou ativa os usuários.

O administrador ou supervisor cadastra cliente, local e equipamento.

O supervisor cria um modelo em rascunho.

O supervisor organiza o modelo em seções e itens.

O supervisor publica uma versão.

O supervisor agenda uma inspeção utilizando a versão publicada.

O supervisor atribui a inspeção a um técnico.

O supervisor acompanha os estados da inspeção.

Após o envio, o supervisor abre a revisão.

O supervisor aprova ou reprova o resultado.

### 7.3 Fluxo do técnico

O técnico autentica-se.

O aplicativo sincroniza os dados autorizados.

O técnico consulta as inspeções atribuídas.

Abre os detalhes da inspeção.

Confirma o equipamento, opcionalmente por QR Code.

Inicia a inspeção.

Responde aos itens do checklist.

Registra observações, fotografias e não conformidades.

O aplicativo salva cada alteração localmente.

O técnico verifica o progresso.

Conclui a inspeção.

O aplicativo envia imediatamente ou mantém o envio pendente.

O técnico acompanha o estado da sincronização.

Em caso de reprovação, recebe a inspeção para correção.

### 7.4 Estados de negócio da inspeção

O estado de negócio da inspeção não deve ser confundido com o estado de sincronização do dispositivo.

| Estado | Descrição | Quem provoca a entrada |
| ----- | ----- | ----- |
| RASCUNHO | Inspeção ainda não disponibilizada ao técnico. | Supervisor |
| ATRIBUÍDA | Inspeção vinculada a um técnico e disponível para sincronização. | Supervisor |
| EM\_ANDAMENTO | Técnico iniciou a execução. | Técnico |
| ENVIADA | Resultado recebido pelo servidor e disponível para revisão. | Técnico/API |
| EM\_REVISÃO | Supervisor iniciou formalmente a análise. | Supervisor |
| APROVADA | Resultado aceito e protegido contra edição comum. | Supervisor |
| REPROVADA | Resultado devolvido com motivo de correção. | Supervisor |
| CANCELADA | Inspeção interrompida administrativamente. | Supervisor/Administrador |

### 7.5 Estados locais de sincronização

| Estado local | Significado |
| ----- | ----- |
| SINCRONIZADO | Não existem alterações locais pendentes. |
| PENDENTE | Existem operações aguardando envio. |
| SINCRONIZANDO | O aplicativo está processando a fila. |
| ERRO | Uma ou mais operações falharam. |
| CONFLITO | Existe divergência que exige política específica ou intervenção. |

### 7.6 Transições permitidas no MVP

| Estado atual | Ação | Próximo estado |
| ----- | ----- | ----- |
| RASCUNHO | Atribuir técnico | ATRIBUÍDA |
| ATRIBUÍDA | Iniciar | EM\_ANDAMENTO |
| ATRIBUÍDA | Cancelar | CANCELADA |
| EM\_ANDAMENTO | Concluir e sincronizar | ENVIADA |
| EM\_ANDAMENTO | Cancelar administrativamente | CANCELADA |
| ENVIADA | Iniciar revisão | EM\_REVISÃO |
| EM\_REVISÃO | Aprovar | APROVADA |
| EM\_REVISÃO | Reprovar | REPROVADA |
| REPROVADA | Reabrir para correção | EM\_ANDAMENTO |
| REPROVADA | Cancelar | CANCELADA |

Quando a inspeção for concluída sem internet, o estado de negócio local poderá representar a conclusão, mas o servidor continuará com o último estado conhecido. A interface deverá exibir “Aguardando sincronização” até a confirmação da API.

### 7.7 Fluxo offline

Inspeção é baixada enquanto há conexão ↓ Dados são armazenados em SQLite ↓ Técnico perde a conexão ↓ Respostas e evidências são salvas localmente ↓ Cada alteração gera uma operação na outbox ↓ Técnico conclui a inspeção ↓ Aplicativo marca “Aguardando sincronização” ↓ Conexão retorna ↓ Outbox é enviada em ordem ↓ API confirma ou rejeita cada operação ↓ Aplicativo atualiza dados e estado de sincronização

​

### 7.8 Fluxo de correção

Supervisor reprova a inspeção ↓ Motivo e itens de correção são registrados ↓ Técnico sincroniza a atualização ↓ Aplicativo apresenta a inspeção como “Requer correção” ↓ Técnico altera somente o que está liberado ↓ Nova versão das respostas é enviada ↓ Supervisor realiza nova revisão

​

### 7.9 Tratamento de exceções relevantes

Aplicativo fechado durante o preenchimento: respostas já confirmadas devem permanecer salvas localmente.

Falha ao enviar uma foto: dados textuais não devem ser descartados; a foto permanecerá pendente.

Inspeção cancelada enquanto o técnico está offline: na próxima sincronização, o sistema deverá preservar alterações locais e informar o cancelamento antes de descartar qualquer dado.

Sessão expirada: o aplicativo deverá tentar renovar a sessão; caso não consiga, manter os dados locais e solicitar nova autenticação.

Operação reenviada: a API deverá reconhecer o identificador idempotente e impedir duplicidade.

Modelo alterado após o agendamento: a inspeção continuará utilizando o snapshot da versão selecionada.

# **08 \- Funcionalidades**

## 8\. Funcionalidades

### 8.1 Classificação de prioridade

| Prioridade | Significado |
| ----- | ----- |
| P0 | Obrigatória para o MVP e para a demonstração final. |
| P1 | Importante, implementada após a estabilidade do fluxo principal. |
| P2 | Evolução futura ou desafio adicional. |

### 8.2 Funcionalidades do MVP — P0

#### Autenticação e acesso

login por e-mail e senha;

emissão e renovação de token;

encerramento de sessão;

armazenamento seguro da sessão no mobile;

proteção de rotas no mobile e na web;

autorização por perfil na API;

inativação de usuário.

#### Cadastros administrativos

usuários;

clientes;

locais de inspeção;

equipamentos;

código QR único por equipamento;

pesquisa, paginação e filtros básicos;

inativação lógica de registros.

#### Modelos de inspeção

criação de modelo em rascunho;

criação e ordenação de seções;

criação e ordenação de itens;

definição do tipo de resposta;

definição de item obrigatório;

definição de exigência de observação ou evidência;

prévia do checklist;

publicação de versão;

preservação de versões já utilizadas.

#### Planejamento de inspeções

seleção de modelo publicado;

seleção de cliente, local e equipamento;

definição de técnico responsável;

definição de prioridade e data prevista;

instruções adicionais;

cancelamento com justificativa;

acompanhamento por estado.

#### Aplicativo do técnico

login;

tela inicial com resumo;

lista de inspeções atribuídas;

filtros por estado, data e prioridade;

detalhes da inspeção;

leitura de QR Code;

início da inspeção;

checklist dinâmico;

salvamento automático local;

indicador de progresso;

observações;

fotografias;

registro de localização no início e na conclusão, quando autorizado;

criação de não conformidade;

validação dos itens obrigatórios;

conclusão da inspeção;

tela de sincronização;

retomada de inspeção em andamento;

visualização de erro de sincronização.

#### Operação offline e sincronização

download das inspeções atribuídas;

armazenamento em SQLite;

persistência de respostas;

persistência da referência local das evidências;

outbox de operações;

envio em lote;

identificação idempotente;

repetição controlada em caso de falha;

atualização do estado local;

download de alterações do servidor;

apresentação da última sincronização.

#### Revisão administrativa

lista de inspeções enviadas;

filtros por técnico, cliente, estado e período;

visualização do resumo;

visualização por seção e item;

visualização das fotografias;

consulta da localização registrada;

consulta de não conformidades;

abertura da revisão;

aprovação;

reprovação com motivo obrigatório;

histórico mínimo de mudanças de estado.

#### API e plataforma

API versionada;

documentação OpenAPI;

validação de entrada;

tratamento global de erros;

paginação e ordenação;

upload de imagens;

controle de acesso;

auditoria de ações críticas;

scripts de banco ou migrações;

dados de demonstração;

instruções de execução.

### 8.3 Funcionalidades importantes — P1

dashboard administrativo com indicadores;

contagem de inspeções atrasadas;

pesquisa textual avançada;

comentários de revisão por item;

histórico detalhado das respostas;

notificações locais;

notificações push;

exportação simples de dados;

geração de relatório em PDF;

assinatura desenhada no dispositivo;

reatribuição de técnico;

múltiplas evidências por item com descrição;

comparação entre inspeções do mesmo equipamento;

resolução assistida de conflitos;

modo escuro;

biometria para reabrir sessão local;

painel de sincronizações com detalhes técnicos para suporte.

### 8.4 Funcionalidades futuras — P2

portal completo do cliente;

múltiplas organizações e multi-tenancy;

fluxo de tratamento de não conformidades;

planos de ação;

ordens de serviço;

manutenção preventiva;

assinatura eletrônica avançada;

geofencing;

rotas e otimização de deslocamentos;

registro de áudio;

vídeo;

reconhecimento óptico de caracteres;

análise de imagens por inteligência artificial;

sugestão automática de criticidade;

integração com sensores IoT;

integração com ERP;

webhooks;

integrações com armazenamento corporativo;

relatórios regulatórios específicos;

painéis analíticos avançados.

### 8.5 Tipos de resposta previstos

#### Obrigatórios no MVP

texto curto;

texto longo;

número;

verdadeiro ou falso;

conforme ou não conforme;

seleção única;

data;

fotografia ou evidência associada.

#### Opcionais no MVP ou P1

seleção múltipla;

escala numérica;

horário;

assinatura;

localização como resposta;

QR Code como resposta;

arquivo;

medição com unidade.

### 8.6 Recorte de escopo recomendado para 16 semanas

Para preservar a qualidade, o projeto deverá priorizar:

um único técnico responsável por inspeção;

um único fluxo de revisão;

tipos de resposta essenciais;

fotografia como principal evidência;

Android como validação mobile;

sincronização baseada em fila e idempotência, sem edição colaborativa simultânea;

dashboard administrativo simples;

portal do cliente fora do MVP.

# **09 \- Regras de Negócio**

## 9\. Regras de Negócio

### 9.1 Usuários e acesso

RN-001. Somente usuários ativos poderão iniciar uma nova sessão.

RN-002. A inativação de um usuário não excluirá seus registros históricos.

RN-003. A API deverá validar o perfil em todas as operações protegidas.

RN-004. O técnico somente poderá consultar integralmente as inspeções atribuídas a ele.

RN-005. O supervisor poderá consultar e revisar inspeções pertencentes ao seu escopo.

RN-006. O administrador poderá gerenciar usuários e cadastros, mas não deverá alterar respostas de inspeção por padrão.

RN-007. Credenciais e tokens não poderão ser gravados em logs.

RN-008. A troca de senha ou o bloqueio do usuário deverá invalidar sessões conforme a política definida pela API.

### 9.2 Clientes, locais e equipamentos

RN-009. Todo local deverá pertencer a um cliente.

RN-010. Todo equipamento deverá pertencer a um local no MVP.

RN-011. O código QR de um equipamento deverá ser único.

RN-012. Um equipamento inativo não poderá ser utilizado em uma nova inspeção.

RN-013. Registros já utilizados em inspeções deverão ser inativados, não excluídos fisicamente.

RN-014. O local selecionado para a inspeção deverá ser compatível com o equipamento selecionado.

### 9.3 Modelos de inspeção

RN-015. Todo modelo deverá possuir título, categoria e ao menos uma seção com item válido antes da publicação.

RN-016. Todo item deverá possuir um tipo de resposta.

RN-017. A ordem de seções e itens deverá ser explícita.

RN-018. Um modelo em rascunho poderá ser alterado livremente por usuário autorizado.

RN-019. Uma versão publicada não poderá ser alterada de forma destrutiva.

RN-020. Alterações em um modelo publicado deverão gerar nova versão.

RN-021. Uma inspeção deverá preservar um snapshot dos itens da versão utilizada.

RN-022. A desativação de um modelo não afetará inspeções existentes.

RN-023. Tipos de resposta não suportados pelo aplicativo não poderão ser publicados para uso no MVP.

### 9.4 Planejamento e atribuição

RN-024. Uma inspeção deverá estar vinculada a uma versão publicada de modelo.

RN-025. Uma inspeção deverá possuir cliente, local, técnico e data prevista.

RN-026. O equipamento poderá ser opcional somente quando o tipo de inspeção for definido para local ou ambiente.

RN-027. Somente técnico ativo poderá receber nova atribuição.

RN-028. Uma inspeção atribuída deverá aparecer para o técnico após sincronização.

RN-029. O cancelamento deverá registrar usuário, data e justificativa.

RN-030. Uma inspeção aprovada não poderá ser cancelada pelo fluxo comum.

RN-031. O MVP permitirá somente um técnico responsável por inspeção.

### 9.5 Execução

RN-032. Somente inspeções atribuídas poderão ser iniciadas.

RN-033. Somente o técnico responsável poderá iniciar e responder a inspeção, salvo permissão administrativa excepcional não prevista no MVP.

RN-034. O início deverá registrar data e hora do dispositivo e, após sincronização, data e hora de recebimento no servidor.

RN-035. Cada resposta deverá estar vinculada a um item do snapshot da inspeção.

RN-036. Respostas deverão ser validadas conforme seu tipo.

RN-037. Itens obrigatórios deverão ser respondidos antes da conclusão.

RN-038. Quando configurado, uma resposta não conforme deverá exigir observação.

RN-039. Quando configurado como crítico, um item não conforme deverá exigir ao menos uma evidência.

RN-040. O progresso deverá considerar itens respondidos em relação aos itens aplicáveis.

RN-041. O aplicativo deverá salvar localmente cada alteração confirmada.

RN-042. A conclusão deverá registrar o momento real informado pelo dispositivo e o momento de recebimento pelo servidor.

RN-043. Após a conclusão local, as respostas ficarão bloqueadas até eventual reprovação ou falha que permita correção.

RN-044. A inspeção enviada deverá ser revisada antes da aprovação.

### 9.6 Evidências

RN-045. Toda evidência deverá estar vinculada a uma inspeção e, quando aplicável, a uma resposta ou não conformidade.

RN-046. O sistema aceitará somente formatos e tamanhos permitidos.

RN-047. Uma evidência ainda não sincronizada não poderá ser apagada silenciosamente por limpeza de cache.

RN-048. A exclusão de uma evidência já sincronizada deverá ser auditada e respeitar o estado da inspeção.

RN-049. Evidências de inspeções aprovadas serão somente leitura.

RN-050. O nome original do arquivo não será utilizado como único identificador.

RN-051. Metadados sensíveis desnecessários poderão ser removidos ou ignorados conforme política do produto.

### 9.7 Não conformidades

RN-052. Toda não conformidade deverá pertencer a uma inspeção.

RN-053. A não conformidade poderá ser associada a um item específico.

RN-054. A criticidade deverá assumir um valor válido: baixa, média, alta ou crítica.

RN-055. Não conformidades críticas deverão exigir descrição e evidência.

RN-056. A exclusão de uma não conformidade após envio deverá ser substituída por alteração de estado ou operação auditável.

RN-057. O tratamento completo da não conformidade após a aprovação pertence a uma versão futura, mas seu registro fará parte do MVP.

### 9.8 Localização e QR Code

RN-058. O aplicativo deverá solicitar consentimento antes de acessar câmera ou localização.

RN-059. A recusa da permissão deverá produzir orientação e alternativa quando a regra permitir.

RN-060. A localização não será coletada continuamente no MVP.

RN-061. A localização poderá ser registrada no início e na conclusão.

RN-062. O sistema deverá armazenar latitude, longitude, precisão e horário quando disponíveis.

RN-063. A leitura de QR Code não deverá, sozinha, autorizar acesso a dados não permitidos ao usuário.

RN-064. Divergência entre o equipamento previsto e o lido deverá ser informada antes da continuidade.

### 9.9 Offline e sincronização

RN-065. Inspeções previamente baixadas deverão permanecer acessíveis sem conexão.

RN-066. Dados não sincronizados deverão sobreviver ao fechamento e à reabertura do aplicativo.

RN-067. Cada operação enviada deverá possuir identificador idempotente único.

RN-068. O reenvio da mesma operação não poderá criar duplicidade.

RN-069. Operações deverão ser processadas respeitando dependências.

RN-070. Falha em uma operação não deverá apagar outras operações pendentes.

RN-071. O aplicativo deverá exibir a quantidade de operações pendentes.

RN-072. O aplicativo deverá informar data e resultado da última sincronização.

RN-073. O servidor será a fonte oficial após a confirmação da sincronização.

RN-074. O aplicativo deverá preservar a data de execução capturada no dispositivo, além da data de recebimento no servidor.

RN-075. Conflitos deverão ser detectados por versão, data ou outro mecanismo explícito.

RN-076. No MVP, dados aprovados no servidor prevalecerão e não aceitarão atualização tardia comum.

RN-077. Uma inspeção cancelada no servidor não deverá ter seus dados locais pendentes descartados sem aviso.

RN-078. Arquivos poderão ser sincronizados separadamente dos dados estruturados, mantendo rastreamento do estado individual.

### 9.10 Revisão e aprovação

RN-079. Somente supervisor autorizado poderá iniciar a revisão.

RN-080. A reprovação deverá possuir motivo.

RN-081. A aprovação deverá registrar supervisor, data e comentário opcional.

RN-082. Uma inspeção aprovada ficará bloqueada para edição comum.

RN-083. Correções após reprovação deverão preservar histórico das versões anteriores.

RN-084. O supervisor não deverá alterar silenciosamente a resposta fornecida pelo técnico.

RN-085. Ajustes administrativos deverão ser diferenciados de respostas de campo e auditados.

### 9.11 Auditoria e integridade

RN-086. Alterações críticas deverão registrar usuário, data, ação e entidade.

RN-087. Datas de criação e atualização deverão ser mantidas pelo servidor.

RN-088. Entidades utilizadas em registros históricos não poderão ser excluídas fisicamente pelo fluxo comum.

RN-089. A API deverá rejeitar transições de estado inválidas.

RN-090. A documentação da API deverá refletir os estados, validações e erros implementados.

# **10 \- Modelo de10 \- Modelo de Dados**

# **10\. Modelo de Dados**

## **10.1 Objetivo do modelo**

# **O modelo de dados do FieldOps deverá suportar todo o ciclo de vida das inspeções:**

# **Cadastro do cliente**

#         **↓**

# **Cadastro dos locais e equipamentos**

#         **↓**

# **Criação do modelo de inspeção**

#         **↓**

# **Publicação de uma versão imutável**

#         **↓**

# **Agendamento da inspeção**

#         **↓**

# **Criação do snapshot do checklist**

#         **↓**

# **Execução em campo**

#         **↓**

# **Registro de respostas e evidências**

#         **↓**

# **Sincronização**

#         **↓**

# **Revisão e aprovação**

#         **↓**

# **Auditoria e preservação do histórico**

# 

# **O FieldOps utilizará dois contextos de persistência:**

| Contexto | Tecnologia | Responsabilidade |
| ----- | ----- | ----- |
| **Persistência central** | **PostgreSQL** | **Fonte oficial dos dados sincronizados, regras de integridade, histórico e auditoria** |
| **Persistência local** | **SQLite** | **Operação offline, armazenamento das inspeções do técnico, respostas, evidências pendentes e fila de sincronização** |

# ---

## **10.2 Princípios de modelagem**

### **Identificadores globais**

# **As entidades deverão utilizar identificadores UUID.**

# **Isso permitirá:**

* # **criar registros no dispositivo sem depender do servidor;**

* # **evitar identificadores locais temporários;**

* # **reduzir remapeamentos durante a sincronização;**

* # **reenviar operações sem criar registros duplicados;**

* # **identificar entidades de forma consistente entre SQLite e PostgreSQL.**

### **Separação entre modelo e execução**

# **O modelo reutilizável de inspeção não deverá ser confundido com uma inspeção realizada.**

# **Modelo de inspeção**

#         **↓**

# **Versão publicada**

#         **↓**

# **Inspeção agendada**

#         **↓**

# **Snapshot dos itens**

#         **↓**

# **Respostas**

# 

# **O modelo define como futuras inspeções deverão funcionar.**

# **A inspeção representa uma execução real em determinada data, cliente, local ou equipamento.**

### **Versionamento imutável**

# **Uma versão publicada de um modelo não poderá ser alterada de forma destrutiva.**

# **Quando houver mudanças no checklist, uma nova versão deverá ser criada.**

# **Isso garante que inspeções antigas continuem associadas ao conteúdo que estava válido no momento do agendamento.**

### **Snapshot da inspeção**

# **Cada inspeção possuirá uma cópia dos itens da versão utilizada.**

# **Essa cópia será armazenada em `InspectionItemSnapshot`.**

# **O snapshot preservará:**

* # **título da seção;**

* # **ordem da seção;**

* # **texto do item;**

* # **descrição;**

* # **tipo de resposta;**

* # **obrigatoriedade;**

* # **regras de observação;**

* # **regras de evidência;**

* # **opções de seleção;**

* # **ordem do item.**

### **Preservação histórica**

# **Entidades utilizadas por inspeções não deverão ser excluídas fisicamente pelo fluxo comum.**

# **Deverão ser utilizados:**

* # **inativação;**

* # **exclusão lógica;**

* # **versionamento;**

* # **snapshots;**

* # **eventos de auditoria.**

### **Estado de negócio e sincronização**

# **O estado da inspeção deverá permanecer separado do estado de sincronização do dispositivo.**

# **Exemplo:**

# **Estado de negócio: EM\_ANDAMENTO**

# **Estado local: PENDENTE**

# 

# **Isso significa que a inspeção está sendo executada, mas possui alterações locais ainda não enviadas.**

### **Arquivos fora do banco relacional**

# **Fotografias e outros arquivos grandes não serão armazenados diretamente no PostgreSQL.**

# **O banco guardará:**

* # **identificador da evidência;**

* # **tipo;**

* # **tamanho;**

* # **formato;**

* # **chave do arquivo;**

* # **vínculo com a inspeção;**

* # **vínculo com a resposta ou não conformidade;**

* # **datas de captura e envio.**

# **O arquivo será mantido em armazenamento de objetos ou mecanismo equivalente.**

### **Controle de concorrência**

# **Entidades sujeitas a alterações concorrentes deverão possuir controle de versão otimista.**

# **Exemplo:**

# **version \= 3**

# 

# **Uma atualização baseada na versão 2 deverá ser rejeitada ou tratada como conflito caso o servidor já esteja na versão 3\.**

# ---

## **10.3 Diagrama conceitual textual**

# **USER**

#  **├── cria ou agenda ── N INSPECTION**

#  **├── executa ───────── N INSPECTION**

#  **├── revisa ────────── N INSPECTION\_REVIEW**

#  **└── realiza ações ─── N AUDIT\_EVENT**

# 

# **CLIENT 1 ── N INSPECTION\_SITE**

# **INSPECTION\_SITE 1 ── 0..N EQUIPMENT**

# 

# **INSPECTION\_TEMPLATE 1 ── N INSPECTION\_TEMPLATE\_VERSION**

# **INSPECTION\_TEMPLATE\_VERSION 1 ── N TEMPLATE\_SECTION**

# **TEMPLATE\_SECTION 1 ── N TEMPLATE\_ITEM**

# 

# **INSPECTION\_TEMPLATE\_VERSION 1 ── N INSPECTION**

# 

# **CLIENT 1 ── N INSPECTION**

# **INSPECTION\_SITE 1 ── N INSPECTION**

# **EQUIPMENT 1 ── 0..N INSPECTION**

# **USER 1 ── N INSPECTION**

# 

# **INSPECTION 1 ── N INSPECTION\_ITEM\_SNAPSHOT**

# **INSPECTION\_ITEM\_SNAPSHOT 1 ── 0..1 INSPECTION\_RESPONSE**

# **INSPECTION\_RESPONSE 1 ── 0..N EVIDENCE**

# 

# **INSPECTION 1 ── 0..N NON\_CONFORMITY**

# **INSPECTION\_RESPONSE 1 ── 0..N NON\_CONFORMITY**

# **NON\_CONFORMITY 1 ── 0..N EVIDENCE**

# 

# **INSPECTION 1 ── 0..N INSPECTION\_REVIEW**

# **INSPECTION 1 ── N AUDIT\_EVENT**

# 

# ---

## **10.4 Como interpretar as cardinalidades**

### **Cardinalidade `1 ── N`**

# **Representa um relacionamento de um para muitos.**

# **Exemplo:**

# **CLIENT 1 ── N INSPECTION\_SITE**

# 

# **Um cliente pode possuir vários locais de inspeção.**

# **Cada local pertence a um cliente.**

### **Cardinalidade `1 ── 0..N`**

# **Representa um relacionamento de um para zero ou muitos.**

# **Exemplo:**

# **INSPECTION\_RESPONSE 1 ── 0..N EVIDENCE**

# 

# **Uma resposta pode não possuir evidências ou pode possuir várias evidências.**

### **Cardinalidade `1 ── 0..1`**

# **Representa um relacionamento de um para zero ou um.**

# **Exemplo:**

# **INSPECTION\_ITEM\_SNAPSHOT 1 ── 0..1 INSPECTION\_RESPONSE**

# 

# **Um item pode ainda não ter sido respondido ou pode possuir uma única resposta.**

# ---

# **10.5 Estrutura organizacional**

## **10.5.1 Client**

# **A entidade `Client` representa a empresa, instituição ou organização atendida pela operação de inspeções.**

# **Um cliente poderá possuir vários locais de inspeção.**

# **CLIENT**

#     **├── INSPECTION\_SITE**

#     **├── INSPECTION\_SITE**

#     **└── INSPECTION\_SITE**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **name** | **string** | **Nome de exibição obrigatório** |
| **legal\_name** | **string** | **Razão social opcional no MVP** |
| **document** | **string** | **Documento opcional e validado** |
| **email** | **string** | **Opcional** |
| **phone** | **string** | **Opcional** |
| **status** | **enum** | **ACTIVE ou INACTIVE** |
| **created\_at** | **datetime** | **Gerado pelo servidor** |
| **updated\_at** | **datetime** | **Gerado pelo servidor** |
| **version** | **integer** | **Controle otimista** |

### **Relacionamentos**

# **CLIENT 1 ── N INSPECTION\_SITE**

# **CLIENT 1 ── N INSPECTION**

# 

# **Um cliente inativo continuará relacionado às inspeções históricas, mas não poderá ser selecionado em novos agendamentos.**

# ---

## **10.5.2 InspectionSite**

# **A entidade `InspectionSite` representa uma unidade, fábrica, loja, obra, depósito, prédio, setor ou outra localização pertencente ao cliente.**

### **Exemplo**

# **Cliente: Indústria Alfa**

#     **├── Unidade Sorocaba**

#     **├── Unidade Itu**

#     **└── Unidade Campinas**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **client\_id** | **UUID** | **Cliente proprietário** |
| **name** | **string** | **Obrigatório** |
| **description** | **string** | **Opcional** |
| **address\_line** | **string** | **Endereço** |
| **city** | **string** | **Cidade** |
| **state** | **string** | **Estado** |
| **postal\_code** | **string** | **CEP** |
| **latitude** | **decimal** | **Coordenada opcional** |
| **longitude** | **decimal** | **Coordenada opcional** |
| **contact\_name** | **string** | **Responsável local opcional** |
| **contact\_phone** | **string** | **Opcional** |
| **status** | **enum** | **ACTIVE ou INACTIVE** |
| **created\_at** | **datetime** | **Auditoria** |
| **updated\_at** | **datetime** | **Auditoria** |
| **version** | **integer** | **Controle otimista** |

### **Relacionamentos**

# **CLIENT 1 ── N INSPECTION\_SITE**

# **INSPECTION\_SITE 1 ── 0..N EQUIPMENT**

# **INSPECTION\_SITE 1 ── N INSPECTION**

# 

# **Todo local deverá pertencer a um cliente.**

# ---

## **10.5.3 Equipment**

# **A entidade `Equipment` representa o ativo físico que poderá ser identificado e inspecionado.**

### **Exemplo**

# **Unidade Sorocaba**

#     **├── Empilhadeira 01**

#     **├── Gerador 02**

#     **├── Compressor 03**

#     **└── Extintor 15**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **site\_id** | **UUID** | **Local ao qual pertence** |
| **name** | **string** | **Obrigatório** |
| **asset\_number** | **string** | **Número patrimonial opcional** |
| **serial\_number** | **string** | **Número de série opcional** |
| **manufacturer** | **string** | **Fabricante opcional** |
| **model** | **string** | **Modelo opcional** |
| **description** | **string** | **Opcional** |
| **qr\_code** | **string** | **Único** |
| **status** | **enum** | **ACTIVE, INACTIVE ou DECOMMISSIONED** |
| **installed\_at** | **date** | **Opcional** |
| **created\_at** | **datetime** | **Auditoria** |
| **updated\_at** | **datetime** | **Auditoria** |
| **version** | **integer** | **Controle otimista** |

### **Relacionamentos**

# **INSPECTION\_SITE 1 ── 0..N EQUIPMENT**

# **EQUIPMENT 1 ── 0..N INSPECTION**

# 

# **No MVP, todo equipamento deverá pertencer a um local.**

# **Uma inspeção poderá não possuir equipamento quando for destinada ao ambiente ou ao local como um todo.**

# ---

# **10.6 Usuários e responsabilidades**

## **10.6.1 User**

# **A entidade `User` representa as pessoas autorizadas a utilizar o FieldOps.**

### **Perfis previstos**

# **ADMIN**

# **SUPERVISOR**

# **TECHNICIAN**

# **CLIENT\_VIEWER**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **name** | **string** | **Obrigatório** |
| **email** | **string** | **Obrigatório e único** |
| **password\_hash** | **string** | **Nunca exposto pela API** |
| **role** | **enum** | **Perfil autorizado** |
| **status** | **enum** | **ACTIVE, INACTIVE ou BLOCKED** |
| **phone** | **string** | **Opcional** |
| **created\_at** | **datetime** | **Gerado pelo servidor** |
| **updated\_at** | **datetime** | **Gerado pelo servidor** |
| **version** | **integer** | **Controle otimista** |

### **Relacionamentos principais**

# **USER**

#  **├── cria ou agenda → INSPECTION**

#  **├── executa → INSPECTION**

#  **├── supervisiona → INSPECTION**

#  **├── revisa → INSPECTION\_REVIEW**

#  **└── realiza → AUDIT\_EVENT**

# 

# **Uma inspeção poderá possuir referências distintas para:**

* # **usuário que criou;**

* # **técnico responsável;**

* # **supervisor responsável;**

* # **usuário que cancelou;**

* # **usuário que aprovou ou reprovou.**

# **A inativação de um usuário não excluirá seu histórico.**

# ---

# **10.7 Modelos de inspeção**

# ---

## **10.7.1 InspectionTemplate**

# **A entidade `InspectionTemplate` representa a identidade lógica e reutilizável de um modelo de inspeção.**

# **Exemplo:**

# **Checklist de Inspeção de Extintores**

# 

# **Ela não representa diretamente uma versão publicada.**

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Identidade lógica do modelo** |
| **title** | **string** | **Obrigatório** |
| **description** | **string** | **Opcional** |
| **category** | **string** | **Obrigatório** |
| **status** | **enum** | **DRAFT, ACTIVE ou INACTIVE** |
| **current\_version** | **integer** | **Última versão publicada** |
| **created\_by** | **UUID** | **Usuário criador** |
| **created\_at** | **datetime** | **Auditoria** |
| **updated\_at** | **datetime** | **Auditoria** |
| **version** | **integer** | **Controle otimista do registro** |

### **Relacionamento**

# **INSPECTION\_TEMPLATE 1 ── N INSPECTION\_TEMPLATE\_VERSION**

# 

# **Um modelo pode possuir várias versões.**

# ---

## **10.7.2 InspectionTemplateVersion**

# **A entidade `InspectionTemplateVersion` representa uma publicação imutável do modelo.**

### **Exemplo**

# **Checklist de Extintores**

#     **├── Versão 1**

#     **├── Versão 2**

#     **└── Versão 3**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave da versão** |
| **template\_id** | **UUID** | **Modelo lógico** |
| **version\_number** | **integer** | **Sequencial por modelo** |
| **title\_snapshot** | **string** | **Título preservado** |
| **description\_snapshot** | **string** | **Descrição preservada** |
| **published\_by** | **UUID** | **Usuário responsável** |
| **published\_at** | **datetime** | **Data de publicação** |
| **active\_for\_new\_inspections** | **boolean** | **Permite novos agendamentos** |
| **created\_at** | **datetime** | **Auditoria** |

### **Relacionamentos**

# **INSPECTION\_TEMPLATE 1 ── N INSPECTION\_TEMPLATE\_VERSION**

# **INSPECTION\_TEMPLATE\_VERSION 1 ── N TEMPLATE\_SECTION**

# **INSPECTION\_TEMPLATE\_VERSION 1 ── N INSPECTION**

# 

# **Cada inspeção deverá utilizar uma versão específica.**

# **A versão utilizada não poderá ser alterada após a publicação.**

# ---

## **10.7.3 TemplateSection**

# **A entidade `TemplateSection` organiza os itens do checklist em grupos.**

### **Exemplo**

# **Checklist de Empilhadeira**

#     **├── Identificação**

#     **├── Condições externas**

#     **├── Sistema elétrico**

#     **├── Sistema hidráulico**

#     **└── Resultado final**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **template\_version\_id** | **UUID** | **Versão proprietária** |
| **title** | **string** | **Obrigatório** |
| **description** | **string** | **Opcional** |
| **display\_order** | **integer** | **Ordem explícita** |
| **created\_at** | **datetime** | **Auditoria** |

### **Relacionamento**

# **INSPECTION\_TEMPLATE\_VERSION 1 ── N TEMPLATE\_SECTION**

# 

# **A seção pertence à versão publicada, e não diretamente ao modelo lógico.**

# ---

## **10.7.4 TemplateItem**

# **A entidade `TemplateItem` representa uma pergunta, verificação, instrução ou medição pertencente a uma seção.**

### **Exemplo**

# **Seção: Sistema elétrico**

#     **├── A bateria apresenta danos?**

#     **├── Os cabos estão corretamente isolados?**

#     **├── As luzes estão funcionando?**

#     **└── A buzina está funcionando?**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **section\_id** | **UUID** | **Seção proprietária** |
| **code** | **string** | **Código legível opcional** |
| **title** | **string** | **Pergunta ou instrução** |
| **description** | **string** | **Texto de ajuda opcional** |
| **response\_type** | **enum** | **Tipo da resposta** |
| **required** | **boolean** | **Define obrigatoriedade** |
| **observation\_required\_on\_failure** | **boolean** | **Exige observação na falha** |
| **evidence\_required\_on\_failure** | **boolean** | **Exige evidência na falha** |
| **options\_json** | **JSON** | **Alternativas e configurações** |
| **display\_order** | **integer** | **Ordem explícita** |
| **created\_at** | **datetime** | **Auditoria** |

### **Tipos de resposta do MVP**

# **TEXT\_SHORT**

# **TEXT\_LONG**

# **NUMBER**

# **BOOLEAN**

# **CONFORMITY**

# **SINGLE\_CHOICE**

# **DATE**

# 

### **Relacionamento**

# **TEMPLATE\_SECTION 1 ── N TEMPLATE\_ITEM**

# 

# ---

## **10.7.5 Exemplo completo de modelo**

# **INSPECTION\_TEMPLATE**

# **Checklist de Extintores**

# 

#     **└── INSPECTION\_TEMPLATE\_VERSION**

#         **Versão 2**

# 

#             **├── TEMPLATE\_SECTION**

#             **│   Identificação**

#             **│       ├── Número do patrimônio**

#             **│       └── Localização**

#             **│**

#             **├── TEMPLATE\_SECTION**

#             **│   Condições físicas**

#             **│       ├── O lacre está intacto?**

#             **│       ├── O manômetro está na faixa verde?**

#             **│       └── Existe corrosão?**

#             **│**

#             **└── TEMPLATE\_SECTION**

#                 **Evidências**

#                     **└── Fotografar o extintor**

# 

# ---

# **10.8 Execução da inspeção**

## **10.8.1 Inspection**

# **A entidade `Inspection` representa uma execução real de um checklist.**

# **Ela estará relacionada:**

* # **a uma versão publicada;**

* # **a um cliente;**

* # **a um local;**

* # **opcionalmente a um equipamento;**

* # **a um técnico;**

* # **a um supervisor;**

* # **a uma data prevista;**

* # **a um estado de negócio.**

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **Tipo sugerido** | **Regra** |
| **id** | **UUID** | **Identificador global** |
| **template\_version\_id** | **UUID** | **Versão utilizada** |
| **client\_id** | **UUID** | **Cliente** |
| **site\_id** | **UUID** | **Local** |
| **equipment\_id** | **UUID** | **Opcional conforme o tipo** |
| **technician\_id** | **UUID** | **Técnico responsável** |
| **supervisor\_id** | **UUID** | **Supervisor responsável** |
| **created\_by** | **UUID** | **Usuário que criou ou agendou** |
| **title** | **string** | **Nome de apresentação** |
| **instructions** | **string** | **Orientações adicionais** |
| **priority** | **enum** | **LOW, MEDIUM, HIGH ou CRITICAL** |
| **status** | **enum** | **Estado de negócio** |
| **scheduled\_for** | **datetime** | **Data prevista** |
| **started\_at\_device** | **datetime** | **Horário registrado no dispositivo** |
| **started\_at\_server** | **datetime** | **Horário recebido pelo servidor** |
| **completed\_at\_device** | **datetime** | **Horário registrado no dispositivo** |
| **submitted\_at\_server** | **datetime** | **Horário confirmado pelo servidor** |
| **approved\_at** | **datetime** | **Data de aprovação** |
| **canceled\_at** | **datetime** | **Data do cancelamento** |
| **canceled\_by** | **UUID** | **Usuário que cancelou** |
| **canceled\_reason** | **string** | **Obrigatório no cancelamento** |
| **created\_at** | **datetime** | **Auditoria** |
| **updated\_at** | **datetime** | **Auditoria** |
| **version** | **integer** | **Controle otimista** |

### **Estados de negócio**

# **DRAFT**

# **ASSIGNED**

# **IN\_PROGRESS**

# **SUBMITTED**

# **UNDER\_REVIEW**

# **APPROVED**

# **REJECTED**

# **CANCELED**

# 

### **Relacionamentos**

# **INSPECTION\_TEMPLATE\_VERSION 1 ── N INSPECTION**

# **CLIENT 1 ── N INSPECTION**

# **INSPECTION\_SITE 1 ── N INSPECTION**

# **EQUIPMENT 1 ── 0..N INSPECTION**

# **USER 1 ── N INSPECTION**

# 

# **Uma inspeção poderá estar relacionada a um equipamento ou somente ao local.**

# ---

## **10.8.2 Criação da inspeção**

# **Ao confirmar o agendamento, a API deverá:**

1. # **validar cliente, local, equipamento, técnico e supervisor;**

2. # **validar que a versão do modelo está publicada;**

3. # **criar a inspeção;**

4. # **copiar as seções e os itens da versão;**

5. # **criar os registros de `InspectionItemSnapshot`;**

6. # **registrar o evento de auditoria;**

7. # **disponibilizar a inspeção para sincronização pelo técnico.**

# ---

## **10.8.3 InspectionItemSnapshot**

# **A entidade `InspectionItemSnapshot` preserva o conteúdo do checklist utilizado pela inspeção.**

### **Por que o snapshot é necessário**

# **Considere a pergunta original:**

# **O extintor está dentro da validade?**

# 

# **Em uma versão futura, ela pode ser alterada para:**

# **O extintor está dentro da validade indicada no selo?**

# 

# **A inspeção antiga deverá continuar exibindo a pergunta original.**

# **Sem o snapshot, um relatório histórico poderia apresentar um texto diferente daquele que o técnico respondeu.**

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **inspection\_id** | **UUID** | **Inspeção proprietária** |
| **source\_template\_item\_id** | **UUID** | **Referência histórica opcional** |
| **section\_title** | **string** | **Texto preservado** |
| **section\_description** | **string** | **Descrição preservada** |
| **section\_order** | **integer** | **Ordem preservada** |
| **item\_code** | **string** | **Código preservado** |
| **item\_title** | **string** | **Texto preservado** |
| **item\_description** | **string** | **Ajuda preservada** |
| **response\_type** | **enum** | **Tipo preservado** |
| **required** | **boolean** | **Obrigatoriedade preservada** |
| **rules\_json** | **JSON** | **Configurações preservadas** |
| **options\_json** | **JSON** | **Alternativas preservadas** |
| **item\_order** | **integer** | **Ordem preservada** |
| **created\_at** | **datetime** | **Data de criação do snapshot** |

### **Relacionamento**

# **INSPECTION 1 ── N INSPECTION\_ITEM\_SNAPSHOT**

# 

# **Uma inspeção terá um snapshot para cada item do checklist.**

# ---

## **10.8.4 InspectionResponse**

# **A entidade `InspectionResponse` armazena a resposta fornecida para um item do snapshot.**

### **Cardinalidade**

# **INSPECTION\_ITEM\_SNAPSHOT 1 ── 0..1 INSPECTION\_RESPONSE**

# 

# **Um item poderá:**

* # **não possuir resposta enquanto estiver pendente;**

* # **possuir uma resposta depois de preenchido.**

# **Não deverão existir duas respostas atuais para o mesmo item.**

### **Restrição recomendada**

# **UNIQUE(inspection\_item\_id)**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Gerável no dispositivo** |
| **inspection\_id** | **UUID** | **Inspeção** |
| **inspection\_item\_id** | **UUID** | **Item do snapshot** |
| **value\_text** | **string** | **Valor textual** |
| **value\_number** | **decimal** | **Valor numérico** |
| **value\_boolean** | **boolean** | **Valor lógico** |
| **value\_date** | **date** | **Data** |
| **value\_json** | **JSON** | **Seleções ou estruturas adicionais** |
| **observation** | **string** | **Comentário do técnico** |
| **conformity** | **enum** | **NOT\_APPLICABLE, CONFORMING ou NON\_CONFORMING** |
| **answered\_by** | **UUID** | **Técnico** |
| **answered\_at\_device** | **datetime** | **Horário do dispositivo** |
| **server\_received\_at** | **datetime** | **Horário de recebimento** |
| **created\_at** | **datetime** | **Auditoria** |
| **updated\_at** | **datetime** | **Auditoria** |
| **version** | **integer** | **Controle otimista** |

### **Exemplos**

#### **Resposta lógica**

# **Pergunta: O lacre está intacto?**

# **Resposta: Sim**

# 

#### **Resposta numérica**

# **Pergunta: Qual é a pressão medida?**

# **Resposta: 8,5**

# 

#### **Resposta textual**

# **Pergunta: Descreva a irregularidade.**

# **Resposta: Cabo elétrico com isolamento danificado.**

# 

# **10.9 Evidências**

## **10.9.1 Evidence**

# **A entidade `Evidence` representa um arquivo ou registro utilizado para comprovar uma resposta ou ocorrência.**

# **No MVP, o principal tipo será fotografia.**

### **Possíveis vínculos**

# **Uma evidência poderá estar relacionada:**

* # **diretamente à inspeção;**

* # **a uma resposta;**

* # **a uma não conformidade.**

### **Relacionamentos**

# **INSPECTION 1 ── 0..N EVIDENCE**

# **INSPECTION\_RESPONSE 1 ── 0..N EVIDENCE**

# **NON\_CONFORMITY 1 ── 0..N EVIDENCE**

# 

# **Uma evidência sempre pertencerá a uma inspeção.**

# **Os vínculos com resposta e não conformidade serão opcionais conforme o contexto.**

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Gerável no dispositivo** |
| **inspection\_id** | **UUID** | **Obrigatório** |
| **response\_id** | **UUID** | **Opcional** |
| **non\_conformity\_id** | **UUID** | **Opcional** |
| **type** | **enum** | **PHOTO no MVP** |
| **storage\_key** | **string** | **Referência no serviço de arquivos** |
| **local\_uri** | **string** | **Somente no banco local** |
| **original\_file\_name** | **string** | **Opcional e não utilizado como identificador** |
| **mime\_type** | **string** | **Formato validado** |
| **size\_bytes** | **long** | **Tamanho do arquivo** |
| **checksum** | **string** | **Integridade e deduplicação opcional** |
| **description** | **string** | **Opcional** |
| **latitude** | **decimal** | **Opcional** |
| **longitude** | **decimal** | **Opcional** |
| **captured\_at\_device** | **datetime** | **Horário da captura** |
| **server\_received\_at** | **datetime** | **Recebimento dos metadados** |
| **uploaded\_at** | **datetime** | **Confirmação do arquivo** |
| **created\_by** | **UUID** | **Técnico** |
| **created\_at** | **datetime** | **Auditoria** |

### **Exemplo**

# **Pergunta:**

# **A bateria está em boas condições?**

# 

# **Resposta:**

# **Não**

# 

# **Evidências:**

#     **├── Foto geral da bateria**

#     **└── Foto aproximada dos terminais com corrosão**

# 

# **O arquivo local não poderá ser removido enquanto o servidor não confirmar o upload.**

# ---

# **10.10 Não conformidades**

## **10.10.1 NonConformity**

# **A entidade `NonConformity` representa um problema, desvio ou irregularidade identificada durante a inspeção.**

### **Exemplo**

# **Inspeção da Empilhadeira 01**

#     **├── Pneu dianteiro desgastado**

#     **├── Buzina não funciona**

#     **└── Vazamento hidráulico**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Gerável no dispositivo** |
| **inspection\_id** | **UUID** | **Obrigatório** |
| **inspection\_item\_id** | **UUID** | **Item relacionado opcional** |
| **response\_id** | **UUID** | **Resposta relacionada opcional** |
| **title** | **string** | **Obrigatório** |
| **description** | **string** | **Obrigatório** |
| **severity** | **enum** | **LOW, MEDIUM, HIGH ou CRITICAL** |
| **status** | **enum** | **OPEN no MVP** |
| **created\_by** | **UUID** | **Técnico** |
| **created\_at\_device** | **datetime** | **Data de campo** |
| **server\_received\_at** | **datetime** | **Data de recebimento** |
| **created\_at** | **datetime** | **Auditoria** |
| **updated\_at** | **datetime** | **Auditoria** |
| **version** | **integer** | **Controle otimista** |

### **Relacionamentos**

# **INSPECTION 1 ── 0..N NON\_CONFORMITY**

# **INSPECTION\_RESPONSE 1 ── 0..N NON\_CONFORMITY**

# **NON\_CONFORMITY 1 ── 0..N EVIDENCE**

# 

# **A associação com a resposta permite localizar diretamente:**

* # **a pergunta;**

* # **a resposta;**

* # **a observação;**

* # **as evidências;**

* # **a não conformidade gerada.**

### **Exemplo completo**

# **Pergunta:**

# **O manômetro está na faixa adequada?**

# 

# **Resposta:**

# **Não**

# 

# **Não conformidade:**

# **Manômetro fora da faixa operacional.**

# 

# **Gravidade:**

# **Alta**

# 

# **Evidências:**

#     **└── Fotografia do manômetro**

# 

# ---

# **10.11 Revisão da inspeção**

## **10.11.1 InspectionReview**

# **A entidade `InspectionReview` registra cada ciclo de revisão executado por um supervisor.**

# **Uma inspeção poderá ser revisada mais de uma vez.**

### **Exemplo**

# **1\. Técnico envia a inspeção**

# **2\. Supervisor solicita correção**

# **3\. Técnico corrige**

# **4\. Supervisor revisa novamente**

# **5\. Supervisor aprova**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **inspection\_id** | **UUID** | **Inspeção revisada** |
| **reviewer\_id** | **UUID** | **Supervisor** |
| **decision** | **enum** | **APPROVED ou REJECTED** |
| **reason** | **string** | **Obrigatório na reprovação** |
| **comments** | **string** | **Opcional** |
| **reviewed\_at** | **datetime** | **Data do servidor** |
| **review\_cycle** | **integer** | **Número da rodada** |
| **created\_at** | **datetime** | **Auditoria** |

### **Relacionamento**

# **INSPECTION 1 ── 0..N INSPECTION\_REVIEW**

# 

### **Exemplo de registros**

| Ciclo | Responsável | Decisão |
| ----- | ----- | ----- |
| **1** | **Supervisor João** | **REJECTED** |
| **2** | **Supervisor João** | **APPROVED** |

# **Não deverão ser utilizados apenas campos como `approved_by` para representar todo o processo, pois isso eliminaria o histórico das revisões anteriores.**

# ---

# **10.12 Auditoria**

## **10.12.1 AuditEvent**

# **A entidade `AuditEvent` registra as ações relevantes realizadas no sistema.**

### **Exemplos de eventos**

# **INSPECTION\_CREATED**

# **INSPECTION\_ASSIGNED**

# **INSPECTION\_STARTED**

# **RESPONSE\_CREATED**

# **RESPONSE\_UPDATED**

# **EVIDENCE\_ADDED**

# **EVIDENCE\_REMOVED**

# **NON\_CONFORMITY\_CREATED**

# **INSPECTION\_COMPLETED**

# **INSPECTION\_SUBMITTED**

# **REVIEW\_STARTED**

# **INSPECTION\_APPROVED**

# **INSPECTION\_REJECTED**

# **INSPECTION\_CANCELED**

# 

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **id** | **UUID** | **Chave primária** |
| **inspection\_id** | **UUID** | **Inspeção relacionada, quando aplicável** |
| **actor\_id** | **UUID** | **Usuário responsável, quando conhecido** |
| **action** | **string** | **Ação realizada** |
| **entity\_type** | **string** | **Tipo da entidade afetada** |
| **entity\_id** | **UUID** | **Identificador afetado** |
| **occurred\_at** | **datetime** | **Data do servidor** |
| **device\_occurred\_at** | **datetime** | **Data do dispositivo, quando aplicável** |
| **previous\_value\_json** | **JSON** | **Estado anterior não sensível** |
| **new\_value\_json** | **JSON** | **Novo estado não sensível** |
| **metadata\_json** | **JSON** | **Metadados adicionais** |
| **request\_id** | **string** | **Correlação técnica** |
| **device\_id** | **string** | **Dispositivo, quando aplicável** |

### **Relacionamento**

# **INSPECTION 1 ── N AUDIT\_EVENT**

# 

### **Exemplo de histórico**

# **08:00 — Inspeção criada**

# **08:05 — Inspeção atribuída ao técnico**

# **08:12 — Técnico iniciou a inspeção**

# **08:20 — Resposta registrada**

# **08:23 — Fotografia capturada**

# **08:30 — Não conformidade criada**

# **08:50 — Inspeção concluída no dispositivo**

# **09:15 — Sincronização confirmada**

# **09:40 — Supervisor iniciou a revisão**

# **09:50 — Supervisor solicitou correção**

# **11:20 — Técnico enviou a correção**

# **12:00 — Supervisor aprovou**

# 

# **Os registros de auditoria não poderão ser alterados ou excluídos por usuários comuns.**

# ---

# **10.13 Estruturas locais do aplicativo mobile**

# **O SQLite deverá armazenar os dados necessários para que o técnico execute as inspeções sem conexão.**

## **10.13.1 Dados centrais replicados localmente**

# **O aplicativo poderá manter representações locais de:**

* # **usuário autenticado;**

* # **cliente relacionado;**

* # **local relacionado;**

* # **equipamento relacionado;**

* # **inspeções atribuídas;**

* # **snapshots dos itens;**

* # **respostas;**

* # **evidências;**

* # **não conformidades;**

* # **revisões e solicitações de correção.**

# **A base local não será uma cópia completa do PostgreSQL.**

# **Somente os dados autorizados e necessários ao técnico serão baixados.**

# ---

## **10.13.2 Estado local das entidades**

# **Entidades sincronizáveis poderão possuir metadados locais adicionais.**

| Campo local | Finalidade |
| ----- | ----- |
| **local\_sync\_status** | **Indicar sincronizado, pendente, erro ou conflito** |
| **is\_dirty** | **Informar se existem alterações locais** |
| **last\_synced\_at** | **Data da última confirmação** |
| **base\_version** | **Versão do servidor usada como base** |
| **local\_updated\_at** | **Última alteração no dispositivo** |
| **sync\_error** | **Último erro sanitizado** |
| **deleted\_locally** | **Exclusão lógica ainda não confirmada** |

# **Esses campos não precisam existir da mesma forma no PostgreSQL.**

# ---

## **10.13.3 SyncOperation**

# **A entidade local `SyncOperation` representa uma operação pendente na outbox.**

# **Cada alteração sincronizável deverá gerar ou atualizar uma operação.**

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **operation\_id** | **UUID** | **Chave idempotente** |
| **entity\_type** | **string** | **Tipo da entidade** |
| **entity\_id** | **UUID** | **Registro afetado** |
| **operation\_type** | **enum** | **CREATE, UPDATE, DELETE\_LOGICAL, TRANSITION ou UPLOAD** |
| **base\_version** | **integer** | **Versão usada como base** |
| **payload\_json** | **JSON** | **Dados necessários** |
| **dependency\_ids** | **JSON** | **Operações que devem ser concluídas antes** |
| **status** | **enum** | **PENDING, PROCESSING, FAILED, CONFLICT ou COMPLETED** |
| **attempt\_count** | **integer** | **Número de tentativas** |
| **last\_error** | **string** | **Mensagem sanitizada** |
| **created\_at** | **datetime** | **Data local** |
| **updated\_at** | **datetime** | **Última alteração** |
| **last\_attempt\_at** | **datetime** | **Última tentativa** |
| **completed\_at** | **datetime** | **Confirmação local** |

### **Exemplo de dependência**

# **Operação 1: criar resposta**

#         **↓**

# **Operação 2: enviar fotografia vinculada à resposta**

# 

# **A operação de upload não deverá ser enviada antes da criação da resposta relacionada.**

# ---

## **10.13.4 SyncMetadata**

# **A estrutura `SyncMetadata` armazena informações gerais da sincronização local.**

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| **user\_id** | **UUID** | **Usuário da base local** |
| **device\_id** | **UUID** | **Identificador da instalação** |
| **last\_pull\_cursor** | **string** | **Cursor de alterações do servidor** |
| **last\_sync\_started\_at** | **datetime** | **Início da última tentativa** |
| **last\_successful\_sync** | **datetime** | **Última sincronização completa** |
| **last\_sync\_result** | **enum** | **SUCCESS, PARTIAL ou FAILED** |
| **pending\_operations** | **integer** | **Quantidade pendente, quando mantida** |
| **schema\_version** | **integer** | **Versão do banco local** |

# **O cursor somente deverá ser atualizado após as alterações recebidas serem gravadas com sucesso no SQLite.**

# ---

# **10.14 Fluxo de persistência offline**

## **10.14.1 Download inicial**

# **Aplicativo solicita alterações**

#         **↓**

# **API identifica o técnico**

#         **↓**

# **API retorna inspeções autorizadas**

#         **↓**

# **Aplicativo grava os dados em transação**

#         **↓**

# **SQLite confirma a persistência**

#         **↓**

# **Cursor local é atualizado**

#         **↓**

# **Inspeções ficam disponíveis offline**

# 

## **10.14.2 Salvamento de resposta**

# **Técnico responde um item**

#         **↓**

# **Aplicativo valida o valor**

#         **↓**

# **Resposta é salva no SQLite**

#         **↓**

# **Operação é criada ou consolidada na outbox**

#         **↓**

# **Interface informa “Salvo no dispositivo”**

# 

# **A interface não deverá aguardar uma resposta da API para considerar o valor salvo localmente.**

## **10.14.3 Salvamento de evidência**

# **Técnico captura a fotografia**

#         **↓**

# **Arquivo é mantido no dispositivo**

#         **↓**

# **Metadados são salvos no SQLite**

#         **↓**

# **Operação de upload é criada**

#         **↓**

# **Evidência aparece como pendente**

# 

# **O arquivo somente poderá ser removido após confirmação segura do servidor ou exclusão explícita permitida.**

## **10.14.4 Conclusão offline**

# **Aplicativo valida o checklist**

#         **↓**

# **Técnico confirma a conclusão**

#         **↓**

# **Data do dispositivo é registrada**

#         **↓**

# **Inspeção é bloqueada localmente**

#         **↓**

# **Operação de conclusão entra na outbox**

#         **↓**

# **Interface exibe “Aguardando sincronização”**

# 

## **10.14.5 Envio da outbox**

# **Conectividade disponível**

#         **↓**

# **Aplicativo seleciona operações pendentes**

#         **↓**

# **Operações são ordenadas por dependência**

#         **↓**

# **Lote é enviado com IDs idempotentes**

#         **↓**

# **API processa cada operação**

#         **↓**

# **Aplicativo registra o resultado individual**

#         **↓**

# **Operações confirmadas são encerradas**

#         **↓**

# **Falhas continuam pendentes**

# 

# ---

# **10.15 Regras de integridade**

## **10.15.1 Restrições obrigatórias**

# **Deverão existir restrições para garantir:**

* # **e-mail de usuário único;**

* # **QR Code de equipamento único;**

* # **número da versão único dentro do modelo;**

* # **ordem de seção coerente dentro da versão;**

* # **ordem de item coerente dentro da seção;**

* # **no máximo uma resposta atual por item do snapshot;**

* # **vínculo válido entre cliente, local e equipamento;**

* # **vínculo válido entre inspeção e versão publicada;**

* # **vínculo da resposta com item pertencente à mesma inspeção;**

* # **vínculo da evidência com a inspeção correta;**

* # **vínculo da não conformidade com a inspeção correta;**

* # **identificador de operação de sincronização único.**

## **10.15.2 Índices recomendados**

### **User**

# **UNIQUE(email)**

# **INDEX(status)**

# **INDEX(role)**

# 

### **Equipment**

# **UNIQUE(qr\_code)**

# **INDEX(site\_id)**

# **INDEX(status)**

# **INDEX(asset\_number)**

# 

### **Inspection**

# **INDEX(technician\_id, status)**

# **INDEX(supervisor\_id, status)**

# **INDEX(client\_id)**

# **INDEX(site\_id)**

# **INDEX(equipment\_id)**

# **INDEX(scheduled\_for)**

# **INDEX(status, scheduled\_for)**

# 

### **InspectionItemSnapshot**

# **INDEX(inspection\_id)**

# **INDEX(inspection\_id, section\_order, item\_order)**

# 

### **InspectionResponse**

# **UNIQUE(inspection\_item\_id)**

# **INDEX(inspection\_id)**

# **INDEX(answered\_by)**

# 

### **Evidence**

# **INDEX(inspection\_id)**

# **INDEX(response\_id)**

# **INDEX(non\_conformity\_id)**

# **INDEX(uploaded\_at)**

# 

### **NonConformity**

# **INDEX(inspection\_id)**

# **INDEX(severity)**

# **INDEX(status)**

# 

### **AuditEvent**

# **INDEX(entity\_type, entity\_id)**

# **INDEX(inspection\_id)**

# **INDEX(actor\_id)**

# **INDEX(occurred\_at)**

# **INDEX(request\_id)**

# 

# ---

# **10.16 Exclusão, inativação e histórico**

## **Exclusão lógica**

# **Deverão ser inativados, em vez de excluídos fisicamente:**

* # **usuários;**

* # **clientes;**

* # **locais;**

* # **equipamentos;**

* # **modelos de inspeção.**

## **Registros históricos**

# **Não deverão ser excluídos pelo fluxo comum:**

* # **versões publicadas;**

* # **inspeções;**

* # **snapshots;**

* # **respostas sincronizadas;**

* # **revisões;**

* # **eventos de auditoria.**

## **Evidências**

# **A exclusão de uma evidência sincronizada deverá:**

1. # **validar o estado da inspeção;**

2. # **validar a permissão do usuário;**

3. # **registrar auditoria;**

4. # **remover ou bloquear o acesso ao objeto;**

5. # **preservar os metadados necessários para rastreabilidade.**

# ---

# **10.17 Exemplo completo**

## **Contexto**

# **Cliente:**

# **Indústria ABC**

# 

# **Local:**

# **Fábrica Sorocaba**

# 

# **Equipamento:**

# **Gerador Diesel GD-001**

# 

# **Modelo:**

# **Checklist de Inspeção de Geradores**

# 

# **Versão:**

# **Versão 3**

# 

# **Inspeção:**

# **Inspeção \#2026-00045**

# 

## **Itens do snapshot**

# **1\. O nível de óleo está adequado?**

# **2\. Existem vazamentos?**

# **3\. A bateria está em boas condições?**

# **4\. O gerador iniciou corretamente?**

# 

## **Respostas**

# **1\. Sim**

# **2\. Não existem vazamentos**

# **3\. Não**

# **4\. Sim**

# 

## **Evidências da bateria**

# **\- Foto geral da bateria**

# **\- Foto aproximada dos terminais**

# 

## **Não conformidade**

# **Título:**

# **Corrosão nos terminais da bateria**

# 

# **Descrição:**

# **Foram identificados sinais de corrosão nos terminais.**

# 

# **Gravidade:**

# **HIGH**

# 

# **Status:**

# **OPEN**

# 

## **Revisão**

# **Ciclo: 1**

# **Decisão: APPROVED**

# **Comentário: Inspeção aprovada com não conformidade aberta.**

# 

## **Eventos de auditoria**

# **\- Inspeção criada**

# **\- Snapshot gerado**

# **\- Inspeção atribuída**

# **\- Inspeção iniciada**

# **\- Respostas registradas**

# **\- Evidências adicionadas**

# **\- Não conformidade criada**

# **\- Inspeção concluída**

# **\- Dados sincronizados**

# **\- Revisão iniciada**

# **\- Inspeção aprovada**

# 

# ---

# **10.18 Resumo das entidades**

| Entidade | Responsabilidade |
| ----- | ----- |
| **`User`** | **Representar usuários, perfis e responsáveis pelas ações** |
| **`Client`** | **Representar a organização atendida** |
| **`InspectionSite`** | **Representar o local onde a inspeção ocorre** |
| **`Equipment`** | **Representar o ativo físico inspecionado** |
| **`InspectionTemplate`** | **Representar a identidade lógica do checklist** |
| **`InspectionTemplateVersion`** | **Representar uma publicação imutável do modelo** |
| **`TemplateSection`** | **Organizar os itens da versão em grupos** |
| **`TemplateItem`** | **Definir perguntas, verificações e regras** |
| **`Inspection`** | **Representar uma execução agendada do checklist** |
| **`InspectionItemSnapshot`** | **Preservar os itens utilizados na execução** |
| **`InspectionResponse`** | **Armazenar a resposta do técnico** |
| **`Evidence`** | **Armazenar metadados de fotografias e arquivos** |
| **`NonConformity`** | **Registrar problemas encontrados** |
| **`InspectionReview`** | **Registrar ciclos de revisão e decisões** |
| **`AuditEvent`** | **Registrar ações e mudanças relevantes** |
| **`SyncOperation`** | **Representar operações pendentes da outbox** |
| **`SyncMetadata`** | **Armazenar o estado geral da sincronização local** |

# ---

# **10.19 Decisões consolidadas do modelo**

1. # **O PostgreSQL será a fonte oficial após a sincronização.**

2. # **O SQLite será uma persistência operacional, e não apenas um cache descartável.**

3. # **Todas as entidades sincronizáveis utilizarão UUID.**

4. # **O modelo de inspeção possuirá versões publicadas imutáveis.**

5. # **Seções e itens pertencerão à versão publicada.**

6. # **Cada inspeção utilizará uma única versão do modelo.**

7. # **Cada inspeção possuirá snapshots dos itens.**

8. # **Cada item do snapshot poderá possuir no máximo uma resposta atual.**

9. # **Uma resposta poderá possuir nenhuma ou várias evidências.**

10. # **A evidência sempre estará vinculada a uma inspeção.**

11. # **A não conformidade poderá ser vinculada à resposta que a originou.**

12. # **Uma inspeção poderá passar por vários ciclos de revisão.**

13. # **Alterações críticas serão registradas por eventos de auditoria.**

14. # **O estado de negócio permanecerá separado do estado de sincronização.**

15. # **Operações offline serão registradas em uma outbox persistente.**

16. # **Operações de sincronização serão idempotentes.**

17. # **Arquivos serão sincronizados separadamente dos dados estruturados.**

18. # **O aplicativo não descartará silenciosamente dados locais pendentes.**

19. # **Registros históricos serão preservados por versionamento, snapshot, inativação e auditoria.**

#  **Dados**

# **10\. Modelo de Dados**

## **10.1 Objetivo do modelo**

O modelo de dados do FieldOps deverá suportar todo o ciclo de vida das inspeções:

Cadastro do cliente

        ↓

Cadastro dos locais e equipamentos

        ↓

Criação do modelo de inspeção

        ↓

Publicação de uma versão imutável

        ↓

Agendamento da inspeção

        ↓

Criação do snapshot do checklist

        ↓

Execução em campo

        ↓

Registro de respostas e evidências

        ↓

Sincronização

        ↓

Revisão e aprovação

        ↓

Auditoria e preservação do histórico

O FieldOps utilizará dois contextos de persistência:

| Contexto | Tecnologia | Responsabilidade |
| ----- | ----- | ----- |
| Persistência central | PostgreSQL | Fonte oficial dos dados sincronizados, regras de integridade, histórico e auditoria |
| Persistência local | SQLite | Operação offline, armazenamento das inspeções do técnico, respostas, evidências pendentes e fila de sincronização |

---

## **10.2 Princípios de modelagem**

### **Identificadores globais**

As entidades deverão utilizar identificadores UUID.

Isso permitirá:

* criar registros no dispositivo sem depender do servidor;  
* evitar identificadores locais temporários;  
* reduzir remapeamentos durante a sincronização;  
* reenviar operações sem criar registros duplicados;  
* identificar entidades de forma consistente entre SQLite e PostgreSQL.

### **Separação entre modelo e execução**

O modelo reutilizável de inspeção não deverá ser confundido com uma inspeção realizada.

Modelo de inspeção

        ↓

Versão publicada

        ↓

Inspeção agendada

        ↓

Snapshot dos itens

        ↓

Respostas

O modelo define como futuras inspeções deverão funcionar.

A inspeção representa uma execução real em determinada data, cliente, local ou equipamento.

### **Versionamento imutável**

Uma versão publicada de um modelo não poderá ser alterada de forma destrutiva.

Quando houver mudanças no checklist, uma nova versão deverá ser criada.

Isso garante que inspeções antigas continuem associadas ao conteúdo que estava válido no momento do agendamento.

### **Snapshot da inspeção**

Cada inspeção possuirá uma cópia dos itens da versão utilizada.

Essa cópia será armazenada em `InspectionItemSnapshot`.

O snapshot preservará:

* título da seção;  
* ordem da seção;  
* texto do item;  
* descrição;  
* tipo de resposta;  
* obrigatoriedade;  
* regras de observação;  
* regras de evidência;  
* opções de seleção;  
* ordem do item.

### **Preservação histórica**

Entidades utilizadas por inspeções não deverão ser excluídas fisicamente pelo fluxo comum.

Deverão ser utilizados:

* inativação;  
* exclusão lógica;  
* versionamento;  
* snapshots;  
* eventos de auditoria.

### **Estado de negócio e sincronização**

O estado da inspeção deverá permanecer separado do estado de sincronização do dispositivo.

Exemplo:

Estado de negócio: EM\_ANDAMENTO

Estado local: PENDENTE

Isso significa que a inspeção está sendo executada, mas possui alterações locais ainda não enviadas.

### **Arquivos fora do banco relacional**

Fotografias e outros arquivos grandes não serão armazenados diretamente no PostgreSQL.

O banco guardará:

* identificador da evidência;  
* tipo;  
* tamanho;  
* formato;  
* chave do arquivo;  
* vínculo com a inspeção;  
* vínculo com a resposta ou não conformidade;  
* datas de captura e envio.

O arquivo será mantido em armazenamento de objetos ou mecanismo equivalente.

### **Controle de concorrência**

Entidades sujeitas a alterações concorrentes deverão possuir controle de versão otimista.

Exemplo:

version \= 3

Uma atualização baseada na versão 2 deverá ser rejeitada ou tratada como conflito caso o servidor já esteja na versão 3\.

---

## **10.3 Diagrama conceitual textual**

USER

 ├── cria ou agenda ── N INSPECTION

 ├── executa ───────── N INSPECTION

 ├── revisa ────────── N INSPECTION\_REVIEW

 └── realiza ações ─── N AUDIT\_EVENT

CLIENT 1 ── N INSPECTION\_SITE

INSPECTION\_SITE 1 ── 0..N EQUIPMENT

INSPECTION\_TEMPLATE 1 ── N INSPECTION\_TEMPLATE\_VERSION

INSPECTION\_TEMPLATE\_VERSION 1 ── N TEMPLATE\_SECTION

TEMPLATE\_SECTION 1 ── N TEMPLATE\_ITEM

INSPECTION\_TEMPLATE\_VERSION 1 ── N INSPECTION

CLIENT 1 ── N INSPECTION

INSPECTION\_SITE 1 ── N INSPECTION

EQUIPMENT 1 ── 0..N INSPECTION

USER 1 ── N INSPECTION

INSPECTION 1 ── N INSPECTION\_ITEM\_SNAPSHOT

INSPECTION\_ITEM\_SNAPSHOT 1 ── 0..1 INSPECTION\_RESPONSE

INSPECTION\_RESPONSE 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N NON\_CONFORMITY

INSPECTION\_RESPONSE 1 ── 0..N NON\_CONFORMITY

NON\_CONFORMITY 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N INSPECTION\_REVIEW

INSPECTION 1 ── N AUDIT\_EVENT

---

## **10.4 Como interpretar as cardinalidades**

### **Cardinalidade `1 ── N`**

Representa um relacionamento de um para muitos.

Exemplo:

CLIENT 1 ── N INSPECTION\_SITE

Um cliente pode possuir vários locais de inspeção.

Cada local pertence a um cliente.

### **Cardinalidade `1 ── 0..N`**

Representa um relacionamento de um para zero ou muitos.

Exemplo:

INSPECTION\_RESPONSE 1 ── 0..N EVIDENCE

Uma resposta pode não possuir evidências ou pode possuir várias evidências.

### **Cardinalidade `1 ── 0..1`**

Representa um relacionamento de um para zero ou um.

Exemplo:

INSPECTION\_ITEM\_SNAPSHOT 1 ── 0..1 INSPECTION\_RESPONSE

Um item pode ainda não ter sido respondido ou pode possuir uma única resposta.

---

# **10.5 Estrutura organizacional**

## **10.5.1 Client**

A entidade `Client` representa a empresa, instituição ou organização atendida pela operação de inspeções.

Um cliente poderá possuir vários locais de inspeção.

CLIENT

    ├── INSPECTION\_SITE

    ├── INSPECTION\_SITE

    └── INSPECTION\_SITE

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| name | string | Nome de exibição obrigatório |
| legal\_name | string | Razão social opcional no MVP |
| document | string | Documento opcional e validado |
| email | string | Opcional |
| phone | string | Opcional |
| status | enum | ACTIVE ou INACTIVE |
| created\_at | datetime | Gerado pelo servidor |
| updated\_at | datetime | Gerado pelo servidor |
| version | integer | Controle otimista |

### **Relacionamentos**

CLIENT 1 ── N INSPECTION\_SITE

CLIENT 1 ── N INSPECTION

Um cliente inativo continuará relacionado às inspeções históricas, mas não poderá ser selecionado em novos agendamentos.

---

## **10.5.2 InspectionSite**

A entidade `InspectionSite` representa uma unidade, fábrica, loja, obra, depósito, prédio, setor ou outra localização pertencente ao cliente.

### **Exemplo**

Cliente: Indústria Alfa

    ├── Unidade Sorocaba

    ├── Unidade Itu

    └── Unidade Campinas

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| client\_id | UUID | Cliente proprietário |
| name | string | Obrigatório |
| description | string | Opcional |
| address\_line | string | Endereço |
| city | string | Cidade |
| state | string | Estado |
| postal\_code | string | CEP |
| latitude | decimal | Coordenada opcional |
| longitude | decimal | Coordenada opcional |
| contact\_name | string | Responsável local opcional |
| contact\_phone | string | Opcional |
| status | enum | ACTIVE ou INACTIVE |
| created\_at | datetime | Auditoria |
| updated\_at | datetime | Auditoria |
| version | integer | Controle otimista |

### **Relacionamentos**

CLIENT 1 ── N INSPECTION\_SITE

INSPECTION\_SITE 1 ── 0..N EQUIPMENT

INSPECTION\_SITE 1 ── N INSPECTION

Todo local deverá pertencer a um cliente.

---

## **10.5.3 Equipment**

A entidade `Equipment` representa o ativo físico que poderá ser identificado e inspecionado.

### **Exemplo**

Unidade Sorocaba

    ├── Empilhadeira 01

    ├── Gerador 02

    ├── Compressor 03

    └── Extintor 15

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| site\_id | UUID | Local ao qual pertence |
| name | string | Obrigatório |
| asset\_number | string | Número patrimonial opcional |
| serial\_number | string | Número de série opcional |
| manufacturer | string | Fabricante opcional |
| model | string | Modelo opcional |
| description | string | Opcional |
| qr\_code | string | Único |
| status | enum | ACTIVE, INACTIVE ou DECOMMISSIONED |
| installed\_at | date | Opcional |
| created\_at | datetime | Auditoria |
| updated\_at | datetime | Auditoria |
| version | integer | Controle otimista |

### **Relacionamentos**

INSPECTION\_SITE 1 ── 0..N EQUIPMENT

EQUIPMENT 1 ── 0..N INSPECTION

No MVP, todo equipamento deverá pertencer a um local.

Uma inspeção poderá não possuir equipamento quando for destinada ao ambiente ou ao local como um todo.

---

# **10.6 Usuários e responsabilidades**

## **10.6.1 User**

A entidade `User` representa as pessoas autorizadas a utilizar o FieldOps.

### **Perfis previstos**

ADMIN

SUPERVISOR

TECHNICIAN

CLIENT\_VIEWER

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| name | string | Obrigatório |
| email | string | Obrigatório e único |
| password\_hash | string | Nunca exposto pela API |
| role | enum | Perfil autorizado |
| status | enum | ACTIVE, INACTIVE ou BLOCKED |
| phone | string | Opcional |
| created\_at | datetime | Gerado pelo servidor |
| updated\_at | datetime | Gerado pelo servidor |
| version | integer | Controle otimista |

### **Relacionamentos principais**

USER

 ├── cria ou agenda → INSPECTION

 ├── executa → INSPECTION

 ├── supervisiona → INSPECTION

 ├── revisa → INSPECTION\_REVIEW

 └── realiza → AUDIT\_EVENT

Uma inspeção poderá possuir referências distintas para:

* usuário que criou;  
* técnico responsável;  
* supervisor responsável;  
* usuário que cancelou;  
* usuário que aprovou ou reprovou.

A inativação de um usuário não excluirá seu histórico.

---

# **10.7 Modelos de inspeção**

---

## **10.7.1 InspectionTemplate**

A entidade `InspectionTemplate` representa a identidade lógica e reutilizável de um modelo de inspeção.

Exemplo:

Checklist de Inspeção de Extintores

Ela não representa diretamente uma versão publicada.

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Identidade lógica do modelo |
| title | string | Obrigatório |
| description | string | Opcional |
| category | string | Obrigatório |
| status | enum | DRAFT, ACTIVE ou INACTIVE |
| current\_version | integer | Última versão publicada |
| created\_by | UUID | Usuário criador |
| created\_at | datetime | Auditoria |
| updated\_at | datetime | Auditoria |
| version | integer | Controle otimista do registro |

### **Relacionamento**

INSPECTION\_TEMPLATE 1 ── N INSPECTION\_TEMPLATE\_VERSION

Um modelo pode possuir várias versões.

---

## **10.7.2 InspectionTemplateVersion**

A entidade `InspectionTemplateVersion` representa uma publicação imutável do modelo.

### **Exemplo**

Checklist de Extintores

    ├── Versão 1

    ├── Versão 2

    └── Versão 3

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave da versão |
| template\_id | UUID | Modelo lógico |
| version\_number | integer | Sequencial por modelo |
| title\_snapshot | string | Título preservado |
| description\_snapshot | string | Descrição preservada |
| published\_by | UUID | Usuário responsável |
| published\_at | datetime | Data de publicação |
| active\_for\_new\_inspections | boolean | Permite novos agendamentos |
| created\_at | datetime | Auditoria |

### **Relacionamentos**

INSPECTION\_TEMPLATE 1 ── N INSPECTION\_TEMPLATE\_VERSION

INSPECTION\_TEMPLATE\_VERSION 1 ── N TEMPLATE\_SECTION

INSPECTION\_TEMPLATE\_VERSION 1 ── N INSPECTION

Cada inspeção deverá utilizar uma versão específica.

A versão utilizada não poderá ser alterada após a publicação.

---

## **10.7.3 TemplateSection**

A entidade `TemplateSection` organiza os itens do checklist em grupos.

### **Exemplo**

Checklist de Empilhadeira

    ├── Identificação

    ├── Condições externas

    ├── Sistema elétrico

    ├── Sistema hidráulico

    └── Resultado final

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| template\_version\_id | UUID | Versão proprietária |
| title | string | Obrigatório |
| description | string | Opcional |
| display\_order | integer | Ordem explícita |
| created\_at | datetime | Auditoria |

### **Relacionamento**

INSPECTION\_TEMPLATE\_VERSION 1 ── N TEMPLATE\_SECTION

A seção pertence à versão publicada, e não diretamente ao modelo lógico.

---

## **10.7.4 TemplateItem**

A entidade `TemplateItem` representa uma pergunta, verificação, instrução ou medição pertencente a uma seção.

### **Exemplo**

Seção: Sistema elétrico

    ├── A bateria apresenta danos?

    ├── Os cabos estão corretamente isolados?

    ├── As luzes estão funcionando?

    └── A buzina está funcionando?

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| section\_id | UUID | Seção proprietária |
| code | string | Código legível opcional |
| title | string | Pergunta ou instrução |
| description | string | Texto de ajuda opcional |
| response\_type | enum | Tipo da resposta |
| required | boolean | Define obrigatoriedade |
| observation\_required\_on\_failure | boolean | Exige observação na falha |
| evidence\_required\_on\_failure | boolean | Exige evidência na falha |
| options\_json | JSON | Alternativas e configurações |
| display\_order | integer | Ordem explícita |
| created\_at | datetime | Auditoria |

### **Tipos de resposta do MVP**

TEXT\_SHORT

TEXT\_LONG

NUMBER

BOOLEAN

CONFORMITY

SINGLE\_CHOICE

DATE

### **Relacionamento**

TEMPLATE\_SECTION 1 ── N TEMPLATE\_ITEM

---

## **10.7.5 Exemplo completo de modelo**

INSPECTION\_TEMPLATE

Checklist de Extintores

    └── INSPECTION\_TEMPLATE\_VERSION

        Versão 2

            ├── TEMPLATE\_SECTION

            │   Identificação

            │       ├── Número do patrimônio

            │       └── Localização

            │

            ├── TEMPLATE\_SECTION

            │   Condições físicas

            │       ├── O lacre está intacto?

            │       ├── O manômetro está na faixa verde?

            │       └── Existe corrosão?

            │

            └── TEMPLATE\_SECTION

                Evidências

                    └── Fotografar o extintor

---

# **10.8 Execução da inspeção**

## **10.8.1 Inspection**

A entidade `Inspection` representa uma execução real de um checklist.

Ela estará relacionada:

* a uma versão publicada;  
* a um cliente;  
* a um local;  
* opcionalmente a um equipamento;  
* a um técnico;  
* a um supervisor;  
* a uma data prevista;  
* a um estado de negócio.

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | Tipo sugerido | Regra |
| id | UUID | Identificador global |
| template\_version\_id | UUID | Versão utilizada |
| client\_id | UUID | Cliente |
| site\_id | UUID | Local |
| equipment\_id | UUID | Opcional conforme o tipo |
| technician\_id | UUID | Técnico responsável |
| supervisor\_id | UUID | Supervisor responsável |
| created\_by | UUID | Usuário que criou ou agendou |
| title | string | Nome de apresentação |
| instructions | string | Orientações adicionais |
| priority | enum | LOW, MEDIUM, HIGH ou CRITICAL |
| status | enum | Estado de negócio |
| scheduled\_for | datetime | Data prevista |
| started\_at\_device | datetime | Horário registrado no dispositivo |
| started\_at\_server | datetime | Horário recebido pelo servidor |
| completed\_at\_device | datetime | Horário registrado no dispositivo |
| submitted\_at\_server | datetime | Horário confirmado pelo servidor |
| approved\_at | datetime | Data de aprovação |
| canceled\_at | datetime | Data do cancelamento |
| canceled\_by | UUID | Usuário que cancelou |
| canceled\_reason | string | Obrigatório no cancelamento |
| created\_at | datetime | Auditoria |
| updated\_at | datetime | Auditoria |
| version | integer | Controle otimista |

### **Estados de negócio**

DRAFT

ASSIGNED

IN\_PROGRESS

SUBMITTED

UNDER\_REVIEW

APPROVED

REJECTED

CANCELED

### **Relacionamentos**

INSPECTION\_TEMPLATE\_VERSION 1 ── N INSPECTION

CLIENT 1 ── N INSPECTION

INSPECTION\_SITE 1 ── N INSPECTION

EQUIPMENT 1 ── 0..N INSPECTION

USER 1 ── N INSPECTION

Uma inspeção poderá estar relacionada a um equipamento ou somente ao local.

---

## **10.8.2 Criação da inspeção**

Ao confirmar o agendamento, a API deverá:

1. validar cliente, local, equipamento, técnico e supervisor;  
2. validar que a versão do modelo está publicada;  
3. criar a inspeção;  
4. copiar as seções e os itens da versão;  
5. criar os registros de `InspectionItemSnapshot`;  
6. registrar o evento de auditoria;  
7. disponibilizar a inspeção para sincronização pelo técnico.

---

## **10.8.3 InspectionItemSnapshot**

A entidade `InspectionItemSnapshot` preserva o conteúdo do checklist utilizado pela inspeção.

### **Por que o snapshot é necessário**

Considere a pergunta original:

O extintor está dentro da validade?

Em uma versão futura, ela pode ser alterada para:

O extintor está dentro da validade indicada no selo?

A inspeção antiga deverá continuar exibindo a pergunta original.

Sem o snapshot, um relatório histórico poderia apresentar um texto diferente daquele que o técnico respondeu.

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| inspection\_id | UUID | Inspeção proprietária |
| source\_template\_item\_id | UUID | Referência histórica opcional |
| section\_title | string | Texto preservado |
| section\_description | string | Descrição preservada |
| section\_order | integer | Ordem preservada |
| item\_code | string | Código preservado |
| item\_title | string | Texto preservado |
| item\_description | string | Ajuda preservada |
| response\_type | enum | Tipo preservado |
| required | boolean | Obrigatoriedade preservada |
| rules\_json | JSON | Configurações preservadas |
| options\_json | JSON | Alternativas preservadas |
| item\_order | integer | Ordem preservada |
| created\_at | datetime | Data de criação do snapshot |

### **Relacionamento**

INSPECTION 1 ── N INSPECTION\_ITEM\_SNAPSHOT

Uma inspeção terá um snapshot para cada item do checklist.

---

## **10.8.4 InspectionResponse**

A entidade `InspectionResponse` armazena a resposta fornecida para um item do snapshot.

### **Cardinalidade**

INSPECTION\_ITEM\_SNAPSHOT 1 ── 0..1 INSPECTION\_RESPONSE

Um item poderá:

* não possuir resposta enquanto estiver pendente;  
* possuir uma resposta depois de preenchido.

Não deverão existir duas respostas atuais para o mesmo item.

### **Restrição recomendada**

UNIQUE(inspection\_item\_id)

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Gerável no dispositivo |
| inspection\_id | UUID | Inspeção |
| inspection\_item\_id | UUID | Item do snapshot |
| value\_text | string | Valor textual |
| value\_number | decimal | Valor numérico |
| value\_boolean | boolean | Valor lógico |
| value\_date | date | Data |
| value\_json | JSON | Seleções ou estruturas adicionais |
| observation | string | Comentário do técnico |
| conformity | enum | NOT\_APPLICABLE, CONFORMING ou NON\_CONFORMING |
| answered\_by | UUID | Técnico |
| answered\_at\_device | datetime | Horário do dispositivo |
| server\_received\_at | datetime | Horário de recebimento |
| created\_at | datetime | Auditoria |
| updated\_at | datetime | Auditoria |
| version | integer | Controle otimista |

### **Exemplos**

#### **Resposta lógica**

Pergunta: O lacre está intacto?

Resposta: Sim

#### **Resposta numérica**

Pergunta: Qual é a pressão medida?

Resposta: 8,5

#### **Resposta textual**

Pergunta: Descreva a irregularidade.

Resposta: Cabo elétrico com isolamento danificado.

# **10.9 Evidências**

## **10.9.1 Evidence**

A entidade `Evidence` representa um arquivo ou registro utilizado para comprovar uma resposta ou ocorrência.

No MVP, o principal tipo será fotografia.

### **Possíveis vínculos**

Uma evidência poderá estar relacionada:

* diretamente à inspeção;  
* a uma resposta;  
* a uma não conformidade.

### **Relacionamentos**

INSPECTION 1 ── 0..N EVIDENCE

INSPECTION\_RESPONSE 1 ── 0..N EVIDENCE

NON\_CONFORMITY 1 ── 0..N EVIDENCE

Uma evidência sempre pertencerá a uma inspeção.

Os vínculos com resposta e não conformidade serão opcionais conforme o contexto.

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Gerável no dispositivo |
| inspection\_id | UUID | Obrigatório |
| response\_id | UUID | Opcional |
| non\_conformity\_id | UUID | Opcional |
| type | enum | PHOTO no MVP |
| storage\_key | string | Referência no serviço de arquivos |
| local\_uri | string | Somente no banco local |
| original\_file\_name | string | Opcional e não utilizado como identificador |
| mime\_type | string | Formato validado |
| size\_bytes | long | Tamanho do arquivo |
| checksum | string | Integridade e deduplicação opcional |
| description | string | Opcional |
| latitude | decimal | Opcional |
| longitude | decimal | Opcional |
| captured\_at\_device | datetime | Horário da captura |
| server\_received\_at | datetime | Recebimento dos metadados |
| uploaded\_at | datetime | Confirmação do arquivo |
| created\_by | UUID | Técnico |
| created\_at | datetime | Auditoria |

### **Exemplo**

Pergunta:

A bateria está em boas condições?

Resposta:

Não

Evidências:

    ├── Foto geral da bateria

    └── Foto aproximada dos terminais com corrosão

O arquivo local não poderá ser removido enquanto o servidor não confirmar o upload.

---

# **10.10 Não conformidades**

## **10.10.1 NonConformity**

A entidade `NonConformity` representa um problema, desvio ou irregularidade identificada durante a inspeção.

### **Exemplo**

Inspeção da Empilhadeira 01

    ├── Pneu dianteiro desgastado

    ├── Buzina não funciona

    └── Vazamento hidráulico

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Gerável no dispositivo |
| inspection\_id | UUID | Obrigatório |
| inspection\_item\_id | UUID | Item relacionado opcional |
| response\_id | UUID | Resposta relacionada opcional |
| title | string | Obrigatório |
| description | string | Obrigatório |
| severity | enum | LOW, MEDIUM, HIGH ou CRITICAL |
| status | enum | OPEN no MVP |
| created\_by | UUID | Técnico |
| created\_at\_device | datetime | Data de campo |
| server\_received\_at | datetime | Data de recebimento |
| created\_at | datetime | Auditoria |
| updated\_at | datetime | Auditoria |
| version | integer | Controle otimista |

### **Relacionamentos**

INSPECTION 1 ── 0..N NON\_CONFORMITY

INSPECTION\_RESPONSE 1 ── 0..N NON\_CONFORMITY

NON\_CONFORMITY 1 ── 0..N EVIDENCE

A associação com a resposta permite localizar diretamente:

* a pergunta;  
* a resposta;  
* a observação;  
* as evidências;  
* a não conformidade gerada.

### **Exemplo completo**

Pergunta:

O manômetro está na faixa adequada?

Resposta:

Não

Não conformidade:

Manômetro fora da faixa operacional.

Gravidade:

Alta

Evidências:

    └── Fotografia do manômetro

---

# **10.11 Revisão da inspeção**

## **10.11.1 InspectionReview**

A entidade `InspectionReview` registra cada ciclo de revisão executado por um supervisor.

Uma inspeção poderá ser revisada mais de uma vez.

### **Exemplo**

1\. Técnico envia a inspeção

2\. Supervisor solicita correção

3\. Técnico corrige

4\. Supervisor revisa novamente

5\. Supervisor aprova

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| inspection\_id | UUID | Inspeção revisada |
| reviewer\_id | UUID | Supervisor |
| decision | enum | APPROVED ou REJECTED |
| reason | string | Obrigatório na reprovação |
| comments | string | Opcional |
| reviewed\_at | datetime | Data do servidor |
| review\_cycle | integer | Número da rodada |
| created\_at | datetime | Auditoria |

### **Relacionamento**

INSPECTION 1 ── 0..N INSPECTION\_REVIEW

### **Exemplo de registros**

| Ciclo | Responsável | Decisão |
| ----- | ----- | ----- |
| 1 | Supervisor João | REJECTED |
| 2 | Supervisor João | APPROVED |

Não deverão ser utilizados apenas campos como `approved_by` para representar todo o processo, pois isso eliminaria o histórico das revisões anteriores.

---

# **10.12 Auditoria**

## **10.12.1 AuditEvent**

A entidade `AuditEvent` registra as ações relevantes realizadas no sistema.

### **Exemplos de eventos**

INSPECTION\_CREATED

INSPECTION\_ASSIGNED

INSPECTION\_STARTED

RESPONSE\_CREATED

RESPONSE\_UPDATED

EVIDENCE\_ADDED

EVIDENCE\_REMOVED

NON\_CONFORMITY\_CREATED

INSPECTION\_COMPLETED

INSPECTION\_SUBMITTED

REVIEW\_STARTED

INSPECTION\_APPROVED

INSPECTION\_REJECTED

INSPECTION\_CANCELED

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| id | UUID | Chave primária |
| inspection\_id | UUID | Inspeção relacionada, quando aplicável |
| actor\_id | UUID | Usuário responsável, quando conhecido |
| action | string | Ação realizada |
| entity\_type | string | Tipo da entidade afetada |
| entity\_id | UUID | Identificador afetado |
| occurred\_at | datetime | Data do servidor |
| device\_occurred\_at | datetime | Data do dispositivo, quando aplicável |
| previous\_value\_json | JSON | Estado anterior não sensível |
| new\_value\_json | JSON | Novo estado não sensível |
| metadata\_json | JSON | Metadados adicionais |
| request\_id | string | Correlação técnica |
| device\_id | string | Dispositivo, quando aplicável |

### **Relacionamento**

INSPECTION 1 ── N AUDIT\_EVENT

### **Exemplo de histórico**

08:00 — Inspeção criada

08:05 — Inspeção atribuída ao técnico

08:12 — Técnico iniciou a inspeção

08:20 — Resposta registrada

08:23 — Fotografia capturada

08:30 — Não conformidade criada

08:50 — Inspeção concluída no dispositivo

09:15 — Sincronização confirmada

09:40 — Supervisor iniciou a revisão

09:50 — Supervisor solicitou correção

11:20 — Técnico enviou a correção

12:00 — Supervisor aprovou

Os registros de auditoria não poderão ser alterados ou excluídos por usuários comuns.

---

# **10.13 Estruturas locais do aplicativo mobile**

O SQLite deverá armazenar os dados necessários para que o técnico execute as inspeções sem conexão.

## **10.13.1 Dados centrais replicados localmente**

O aplicativo poderá manter representações locais de:

* usuário autenticado;  
* cliente relacionado;  
* local relacionado;  
* equipamento relacionado;  
* inspeções atribuídas;  
* snapshots dos itens;  
* respostas;  
* evidências;  
* não conformidades;  
* revisões e solicitações de correção.

A base local não será uma cópia completa do PostgreSQL.

Somente os dados autorizados e necessários ao técnico serão baixados.

---

## **10.13.2 Estado local das entidades**

Entidades sincronizáveis poderão possuir metadados locais adicionais.

| Campo local | Finalidade |
| ----- | ----- |
| local\_sync\_status | Indicar sincronizado, pendente, erro ou conflito |
| is\_dirty | Informar se existem alterações locais |
| last\_synced\_at | Data da última confirmação |
| base\_version | Versão do servidor usada como base |
| local\_updated\_at | Última alteração no dispositivo |
| sync\_error | Último erro sanitizado |
| deleted\_locally | Exclusão lógica ainda não confirmada |

Esses campos não precisam existir da mesma forma no PostgreSQL.

---

## **10.13.3 SyncOperation**

A entidade local `SyncOperation` representa uma operação pendente na outbox.

Cada alteração sincronizável deverá gerar ou atualizar uma operação.

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| operation\_id | UUID | Chave idempotente |
| entity\_type | string | Tipo da entidade |
| entity\_id | UUID | Registro afetado |
| operation\_type | enum | CREATE, UPDATE, DELETE\_LOGICAL, TRANSITION ou UPLOAD |
| base\_version | integer | Versão usada como base |
| payload\_json | JSON | Dados necessários |
| dependency\_ids | JSON | Operações que devem ser concluídas antes |
| status | enum | PENDING, PROCESSING, FAILED, CONFLICT ou COMPLETED |
| attempt\_count | integer | Número de tentativas |
| last\_error | string | Mensagem sanitizada |
| created\_at | datetime | Data local |
| updated\_at | datetime | Última alteração |
| last\_attempt\_at | datetime | Última tentativa |
| completed\_at | datetime | Confirmação local |

### **Exemplo de dependência**

Operação 1: criar resposta

        ↓

Operação 2: enviar fotografia vinculada à resposta

A operação de upload não deverá ser enviada antes da criação da resposta relacionada.

---

## **10.13.4 SyncMetadata**

A estrutura `SyncMetadata` armazena informações gerais da sincronização local.

### **Campos**

| Campo | Tipo sugerido | Regra |
| ----- | ----- | ----- |
| user\_id | UUID | Usuário da base local |
| device\_id | UUID | Identificador da instalação |
| last\_pull\_cursor | string | Cursor de alterações do servidor |
| last\_sync\_started\_at | datetime | Início da última tentativa |
| last\_successful\_sync | datetime | Última sincronização completa |
| last\_sync\_result | enum | SUCCESS, PARTIAL ou FAILED |
| pending\_operations | integer | Quantidade pendente, quando mantida |
| schema\_version | integer | Versão do banco local |

O cursor somente deverá ser atualizado após as alterações recebidas serem gravadas com sucesso no SQLite.

---

# **10.14 Fluxo de persistência offline**

## **10.14.1 Download inicial**

Aplicativo solicita alterações

        ↓

API identifica o técnico

        ↓

API retorna inspeções autorizadas

        ↓

Aplicativo grava os dados em transação

        ↓

SQLite confirma a persistência

        ↓

Cursor local é atualizado

        ↓

Inspeções ficam disponíveis offline

## **10.14.2 Salvamento de resposta**

Técnico responde um item

        ↓

Aplicativo valida o valor

        ↓

Resposta é salva no SQLite

        ↓

Operação é criada ou consolidada na outbox

        ↓

Interface informa “Salvo no dispositivo”

A interface não deverá aguardar uma resposta da API para considerar o valor salvo localmente.

## **10.14.3 Salvamento de evidência**

Técnico captura a fotografia

        ↓

Arquivo é mantido no dispositivo

        ↓

Metadados são salvos no SQLite

        ↓

Operação de upload é criada

        ↓

Evidência aparece como pendente

O arquivo somente poderá ser removido após confirmação segura do servidor ou exclusão explícita permitida.

## **10.14.4 Conclusão offline**

Aplicativo valida o checklist

        ↓

Técnico confirma a conclusão

        ↓

Data do dispositivo é registrada

        ↓

Inspeção é bloqueada localmente

        ↓

Operação de conclusão entra na outbox

        ↓

Interface exibe “Aguardando sincronização”

## **10.14.5 Envio da outbox**

Conectividade disponível

        ↓

Aplicativo seleciona operações pendentes

        ↓

Operações são ordenadas por dependência

        ↓

Lote é enviado com IDs idempotentes

        ↓

API processa cada operação

        ↓

Aplicativo registra o resultado individual

        ↓

Operações confirmadas são encerradas

        ↓

Falhas continuam pendentes

---

# **10.15 Regras de integridade**

## **10.15.1 Restrições obrigatórias**

Deverão existir restrições para garantir:

* e-mail de usuário único;  
* QR Code de equipamento único;  
* número da versão único dentro do modelo;  
* ordem de seção coerente dentro da versão;  
* ordem de item coerente dentro da seção;  
* no máximo uma resposta atual por item do snapshot;  
* vínculo válido entre cliente, local e equipamento;  
* vínculo válido entre inspeção e versão publicada;  
* vínculo da resposta com item pertencente à mesma inspeção;  
* vínculo da evidência com a inspeção correta;  
* vínculo da não conformidade com a inspeção correta;  
* identificador de operação de sincronização único.

## **10.15.2 Índices recomendados**

### **User**

UNIQUE(email)

INDEX(status)

INDEX(role)

### **Equipment**

UNIQUE(qr\_code)

INDEX(site\_id)

INDEX(status)

INDEX(asset\_number)

### **Inspection**

INDEX(technician\_id, status)

INDEX(supervisor\_id, status)

INDEX(client\_id)

INDEX(site\_id)

INDEX(equipment\_id)

INDEX(scheduled\_for)

INDEX(status, scheduled\_for)

### **InspectionItemSnapshot**

INDEX(inspection\_id)

INDEX(inspection\_id, section\_order, item\_order)

### **InspectionResponse**

UNIQUE(inspection\_item\_id)

INDEX(inspection\_id)

INDEX(answered\_by)

### **Evidence**

INDEX(inspection\_id)

INDEX(response\_id)

INDEX(non\_conformity\_id)

INDEX(uploaded\_at)

### **NonConformity**

INDEX(inspection\_id)

INDEX(severity)

INDEX(status)

### **AuditEvent**

INDEX(entity\_type, entity\_id)

INDEX(inspection\_id)

INDEX(actor\_id)

INDEX(occurred\_at)

INDEX(request\_id)

---

# **10.16 Exclusão, inativação e histórico**

## **Exclusão lógica**

Deverão ser inativados, em vez de excluídos fisicamente:

* usuários;  
* clientes;  
* locais;  
* equipamentos;  
* modelos de inspeção.

## **Registros históricos**

Não deverão ser excluídos pelo fluxo comum:

* versões publicadas;  
* inspeções;  
* snapshots;  
* respostas sincronizadas;  
* revisões;  
* eventos de auditoria.

## **Evidências**

A exclusão de uma evidência sincronizada deverá:

1. validar o estado da inspeção;  
2. validar a permissão do usuário;  
3. registrar auditoria;  
4. remover ou bloquear o acesso ao objeto;  
5. preservar os metadados necessários para rastreabilidade.

---

# **10.17 Exemplo completo**

## **Contexto**

Cliente:

Indústria ABC

Local:

Fábrica Sorocaba

Equipamento:

Gerador Diesel GD-001

Modelo:

Checklist de Inspeção de Geradores

Versão:

Versão 3

Inspeção:

Inspeção \#2026-00045

## **Itens do snapshot**

1\. O nível de óleo está adequado?

2\. Existem vazamentos?

3\. A bateria está em boas condições?

4\. O gerador iniciou corretamente?

## **Respostas**

1\. Sim

2\. Não existem vazamentos

3\. Não

4\. Sim

## **Evidências da bateria**

\- Foto geral da bateria

\- Foto aproximada dos terminais

## **Não conformidade**

Título:

Corrosão nos terminais da bateria

Descrição:

Foram identificados sinais de corrosão nos terminais.

Gravidade:

HIGH

Status:

OPEN

## **Revisão**

Ciclo: 1

Decisão: APPROVED

Comentário: Inspeção aprovada com não conformidade aberta.

## **Eventos de auditoria**

\- Inspeção criada

\- Snapshot gerado

\- Inspeção atribuída

\- Inspeção iniciada

\- Respostas registradas

\- Evidências adicionadas

\- Não conformidade criada

\- Inspeção concluída

\- Dados sincronizados

\- Revisão iniciada

\- Inspeção aprovada

---

# **10.18 Resumo das entidades**

| Entidade | Responsabilidade |
| ----- | ----- |
| `User` | Representar usuários, perfis e responsáveis pelas ações |
| `Client` | Representar a organização atendida |
| `InspectionSite` | Representar o local onde a inspeção ocorre |
| `Equipment` | Representar o ativo físico inspecionado |
| `InspectionTemplate` | Representar a identidade lógica do checklist |
| `InspectionTemplateVersion` | Representar uma publicação imutável do modelo |
| `TemplateSection` | Organizar os itens da versão em grupos |
| `TemplateItem` | Definir perguntas, verificações e regras |
| `Inspection` | Representar uma execução agendada do checklist |
| `InspectionItemSnapshot` | Preservar os itens utilizados na execução |
| `InspectionResponse` | Armazenar a resposta do técnico |
| `Evidence` | Armazenar metadados de fotografias e arquivos |
| `NonConformity` | Registrar problemas encontrados |
| `InspectionReview` | Registrar ciclos de revisão e decisões |
| `AuditEvent` | Registrar ações e mudanças relevantes |
| `SyncOperation` | Representar operações pendentes da outbox |
| `SyncMetadata` | Armazenar o estado geral da sincronização local |

---

# **10.19 Decisões consolidadas do modelo**

1. O PostgreSQL será a fonte oficial após a sincronização.  
2. O SQLite será uma persistência operacional, e não apenas um cache descartável.  
3. Todas as entidades sincronizáveis utilizarão UUID.  
4. O modelo de inspeção possuirá versões publicadas imutáveis.  
5. Seções e itens pertencerão à versão publicada.  
6. Cada inspeção utilizará uma única versão do modelo.  
7. Cada inspeção possuirá snapshots dos itens.  
8. Cada item do snapshot poderá possuir no máximo uma resposta atual.  
9. Uma resposta poderá possuir nenhuma ou várias evidências.  
10. A evidência sempre estará vinculada a uma inspeção.  
11. A não conformidade poderá ser vinculada à resposta que a originou.  
12. Uma inspeção poderá passar por vários ciclos de revisão.  
13. Alterações críticas serão registradas por eventos de auditoria.  
14. O estado de negócio permanecerá separado do estado de sincronização.  
15. Operações offline serão registradas em uma outbox persistente.  
16. Operações de sincronização serão idempotentes.  
17. Arquivos serão sincronizados separadamente dos dados estruturados.  
18. O aplicativo não descartará silenciosamente dados locais pendentes.  
19. Registros históricos serão preservados por versionamento, snapshot, inativação e auditoria.

# **11 \- Arquitetura**

## 11\. Arquitetura

### 11.1 Visão arquitetural

O FieldOps adotará uma arquitetura distribuída composta por aplicações independentes que compartilham um contrato de API.

┌─────────────────────────────┐ │ Aplicativo Mobile │ │ Expo \+ React Native │ │ SQLite \+ Secure Store │ └──────────────┬──────────────┘ │ HTTPS / JSON / Multipart ▼ ┌─────────────────────────────┐ │ API REST │ │ Java \+ Spring Boot │ │ Segurança \+ Regras │ └───────┬──────────────┬──────┘ │ │ ▼ ▼ ┌──────────────┐ ┌──────────────────┐ │ PostgreSQL │ │ Armazenamento de │ │ Dados │ │ evidências │ └──────────────┘ └──────────────────┘ ▲ │ HTTPS / JSON ┌───────┴─────────────────────┐ │ Interface Administrativa │ │ Angular \+ TypeScript │ └─────────────────────────────┘

​

### 11.2 Princípios arquiteturais

Separação clara entre interface, aplicação, domínio e infraestrutura.

API como ponto central de regras e autorização.

Contrato documentado antes da integração.

Aplicativo mobile preparado para rede instável.

Persistência local como parte da arquitetura, não como correção posterior.

Operações de sincronização idempotentes.

Modelos de inspeção versionados.

Entidades históricas preservadas.

Erros padronizados.

Configurações sensíveis fora do repositório.

Componentes independentes implantáveis separadamente.

### 11.3 Contextos funcionais

#### Identidade e acesso

Responsável por usuários, perfis, autenticação, tokens e autorização.

#### Cadastros

Responsável por clientes, locais e equipamentos.

#### Modelos de inspeção

Responsável por rascunhos, seções, itens, tipos de resposta e publicação de versões.

#### Planejamento

Responsável por criação, agendamento, atribuição e cancelamento de inspeções.

#### Execução de campo

Responsável por início, respostas, evidências, localização, QR Code e conclusão.

#### Sincronização

Responsável por lotes, idempotência, cursores, conflitos e confirmação de operações.

#### Revisão

Responsável por análise, aprovação, reprovação e ciclos de correção.

#### Auditoria e indicadores

Responsável por histórico, métricas e rastreabilidade.

### 11.4 Arquitetura do aplicativo mobile (Sugestão)

Estrutura sugerida:

src/ ├── app/ \# Rotas do Expo Router ├── features/ │ ├── auth/ │ ├── home/ │ ├── inspections/ │ ├── checklist/ │ ├── evidence/ │ ├── scanner/ │ ├── location/ │ └── synchronization/ ├── components/ \# Componentes compartilhados ├── design-system/ \# Tokens, tema e componentes visuais ├── application/ \# Casos de uso e orquestração ├── domain/ \# Tipos e regras independentes da interface ├── infrastructure/ │ ├── api/ │ ├── database/ │ ├── repositories/ │ ├── storage/ │ └── sync/ ├── hooks/ ├── schemas/ ├── utils/ └── config/

​

#### Responsabilidades por camada

Rotas e telas: navegação, composição e estados visuais.

Features: organização por capacidade de negócio.

Aplicação: coordenação de ações como iniciar, salvar, concluir e sincronizar.

Domínio: tipos, estados e validações independentes da plataforma.

Infraestrutura: API, SQLite, armazenamento de arquivos e conectividade.

Design system: consistência visual e acessibilidade.

### 11.5 Arquitetura da interface administrativa

Estrutura sugerida:

src/app/ ├── core/ │ ├── auth/ │ ├── guards/ │ ├── interceptors/ │ ├── http/ │ └── layout/ ├── shared/ │ ├── components/ │ ├── directives/ │ ├── pipes/ │ └── validators/ ├── features/ │ ├── dashboard/ │ ├── users/ │ ├── clients/ │ ├── sites/ │ ├── equipment/ │ ├── templates/ │ ├── inspections/ │ ├── reviews/ │ └── non-conformities/ └── app.routes.ts

​

Princípios:

carregamento de módulos por rota;

proteção por guard e autorização real na API;

serviços tipados;

componentes reutilizáveis para tabelas, filtros, estados e formulários;

formulários reativos;

interceptador de autenticação e tratamento de erros;

separação entre modelos de API e modelos de apresentação quando necessário.

### 11.6 Arquitetura da API Spring Boot

Estrutura sugerida por domínio ou feature:

com.fieldops ├── auth/ ├── user/ ├── client/ ├── site/ ├── equipment/ ├── template/ ├── inspection/ ├── evidence/ ├── synchronization/ ├── review/ ├── audit/ └── shared/

​

Cada feature poderá conter:

controller/ application/ domain/ repository/ dto/ mapper/ validation/

​

#### Responsabilidades

Controller: transporte HTTP e conversão de entrada e saída.

Application/Service: orquestração dos casos de uso.

Domain: regras e transições de estado.

Repository: acesso aos dados.

DTO: contrato externo, separado das entidades JPA.

Validation: validações de negócio adicionais.

Mapper: conversão explícita entre camadas.

### 11.7 Persistência central

PostgreSQL como banco relacional.

Migrações versionadas.

Índices para e-mail, QR Code, estados, técnico e datas.

Restrições de unicidade no banco para regras críticas.

Controle otimista com campo de versão onde necessário.

Exclusão lógica para entidades históricas.

Transações em casos de uso que alteram múltiplas entidades.

### 11.8 Armazenamento de evidências

O banco armazenará metadados e a chave do objeto.

Em desenvolvimento poderá ser utilizado armazenamento local controlado ou serviço compatível com S3.

Em produção, recomenda-se armazenamento de objetos.

O acesso deverá ocorrer por endpoint autorizado ou URL temporária, evitando exposição pública permanente.

Uploads deverão validar formato, tamanho e vínculo com a inspeção.

### 11.9 Estratégia offline-first

#### Dados baixados

O aplicativo armazenará somente os dados necessários ao técnico:

perfil mínimo;

inspeções atribuídas;

cliente e local relacionados;

equipamento relacionado;

snapshot dos itens;

respostas existentes;

revisões e solicitações de correção pertinentes.

#### Escrita local

Toda alteração de campo será gravada primeiro no SQLite. A interface não dependerá de uma resposta imediata da rede para considerar a alteração salva localmente.

#### Outbox

Cada alteração sincronizável criará uma operação com:

identificador idempotente;

tipo de entidade;

identificador global;

tipo de operação;

payload;

dependências;

número de tentativas;

estado e erro.

#### Envio

Operações serão ordenadas por dependência.

Dados estruturados poderão ser enviados antes dos arquivos.

A API retornará resultado individual por operação.

Operações confirmadas sairão da fila ativa.

Falhas permanecerão disponíveis para nova tentativa.

#### Download de alterações

A API disponibilizará alterações desde um cursor ou instante confiável.

O aplicativo atualizará a base local após concluir o envio ou de forma independente.

O cursor será atualizado somente após persistência local bem-sucedida.

#### Conflitos

No MVP:

inspeções aprovadas no servidor não aceitarão alterações atrasadas comuns;

versões divergentes gerarão conflito explícito;

a aplicação não descartará silenciosamente o valor local;

casos complexos poderão exigir nova inspeção ou ação administrativa.

### 11.10 Segurança

Todo tráfego externo deverá utilizar HTTPS em ambientes publicados.

Senhas serão armazenadas com hash seguro no backend.

Tokens de acesso terão duração limitada.

Tokens sensíveis no mobile serão armazenados em mecanismo seguro.

A interface administrativa evitará persistir tokens em locais desnecessariamente expostos.

A API validará autorização em cada endpoint.

Uploads serão validados.

Logs não conterão senhas, tokens ou arquivos.

Segredos serão fornecidos por variáveis de ambiente ou mecanismo equivalente.

CORS será configurado somente para origens autorizadas.

Erros externos não deverão expor stack trace.

### 11.11 Observabilidade

O MVP deverá oferecer:

identificador de correlação por requisição;

logs de autenticação sem conteúdo sensível;

logs de falha de sincronização;

auditoria de transições de estado;

registro de upload com identificador da evidência;

tratamento global de exceções;

mensagens amigáveis na interface e detalhes técnicos controlados no servidor.

### 11.12 Ambientes

| Ambiente | Finalidade |
| ----- | ----- |
| Local | Desenvolvimento individual. |
| Integração | Integração contínua entre mobile, web e API. |
| Teste/Demonstração | Avaliação e apresentação. |
| Produção acadêmica | Opcional, com acesso controlado. |

Cada ambiente deverá possuir:

URL própria da API;

configuração de banco;

configuração de armazenamento;

credenciais separadas;

dados de teste adequados;

indicação visual quando necessário.

### 11.13 CI/CD e qualidade

Pipelines sugeridos:

#### API

compilação;

testes;

análise estática;

criação de imagem de contêiner;

publicação no ambiente de integração.

#### Interface administrativa

instalação reproduzível;

lint;

testes;

build;

publicação estática.

#### Aplicativo mobile

verificação de tipos;

lint;

testes;

validação de configuração;

build de distribuição com EAS no marco final.

### 11.14 Requisitos não funcionais arquiteturais

| ID | Requisito |
| ----- | ----- |
| RNF-001 | A aplicação mobile deverá preservar dados pendentes após reinicialização. |
| RNF-002 | A API deverá responder erros em formato padronizado. |
| RNF-003 | Listagens administrativas deverão utilizar paginação. |
| RNF-004 | O aplicativo deverá apresentar estados de carregamento, vazio, erro e offline. |
| RNF-005 | Operações de sincronização deverão ser idempotentes. |
| RNF-006 | A interface mobile deverá ser utilizável em telas Android comuns. |
| RNF-007 | A interface administrativa deverá ser responsiva para notebook e desktop. |
| RNF-008 | O contrato da API deverá ser documentado. |
| RNF-009 | O código deverá passar por análise de tipos e lint. |
| RNF-010 | Dados sensíveis não deverão ser incluídos no repositório. |
| RNF-011 | Alterações críticas deverão ser auditáveis. |
| RNF-012 | Os componentes deverão poder ser executados por instruções documentadas. |

# **12 \- API REST**

## 12\. API REST

### 12.1 Convenções gerais

Prefixo: /api/v1.

Formato principal: JSON.

Upload: multipart/form-data ou fluxo documentado equivalente.

Identificadores: UUID.

Datas e horas: formato ISO 8601 com fuso ou UTC conforme contrato.

Autenticação: token Bearer.

Paginação: parâmetros page, size, sort ou padrão equivalente documentado.

Filtros: parâmetros de consulta explícitos.

Erros: objeto padronizado.

Documentação: OpenAPI e interface Swagger.

### 12.2 Estrutura de erro sugerida

{ "timestamp": "2026-08-01T14:30:00Z", "status": 422, "code": "INSPECTION\_REQUIRED\_ITEMS\_MISSING", "message": "A inspeção possui itens obrigatórios sem resposta.", "path": "/api/v1/inspections/00000000-0000-0000-0000-000000000000/submit", "requestId": "req-123", "fieldErrors": \[ { "field": "responses", "message": "Existem 2 itens obrigatórios pendentes." } \] }

​

### 12.3 Códigos HTTP esperados

| Código | Uso |
| ----- | ----- |
| 200 | Consulta ou alteração concluída. |
| 201 | Recurso criado. |
| 204 | Operação concluída sem corpo. |
| 400 | Requisição malformada. |
| 401 | Sessão ausente ou inválida. |
| 403 | Usuário autenticado sem permissão. |
| 404 | Recurso não encontrado ou não visível ao usuário. |
| 409 | Conflito de estado, versão ou unicidade. |
| 413 | Arquivo acima do limite. |
| 415 | Formato de arquivo não suportado. |
| 422 | Regra de negócio ou validação semântica não atendida. |
| 500 | Falha interna não prevista, sem exposição de detalhes sensíveis. |

### 12.4 Autenticação

POST /api/v1/auth/login POST /api/v1/auth/refresh POST /api/v1/auth/logout GET /api/v1/auth/me

​

#### Exemplo de login

{ "email": "tecnico@fieldops.local", "password": "senha-informada-pelo-usuario" }

​

#### Exemplo de resposta

{ "accessToken": "token", "refreshToken": "token-de-renovacao", "expiresIn": 900, "user": { "id": "8a50e30d-2a58-4a24-944e-10a9948abf01", "name": "Carlos Técnico", "email": "tecnico@fieldops.local", "role": "TECHNICIAN" } }

​

### 12.5 Usuários

GET /api/v1/users GET /api/v1/users/{id} POST /api/v1/users PUT /api/v1/users/{id} PATCH /api/v1/users/{id}/status POST /api/v1/users/{id}/reset-password

​

Filtros sugeridos:

name;

email;

role;

status.

### 12.6 Clientes

GET /api/v1/clients GET /api/v1/clients/{id} POST /api/v1/clients PUT /api/v1/clients/{id} PATCH /api/v1/clients/{id}/status

​

### 12.7 Locais

GET /api/v1/sites GET /api/v1/sites/{id} GET /api/v1/clients/{clientId}/sites POST /api/v1/sites PUT /api/v1/sites/{id} PATCH /api/v1/sites/{id}/status

​

### 12.8 Equipamentos

GET /api/v1/equipment GET /api/v1/equipment/{id} GET /api/v1/equipment/by-qr/{qrCode} GET /api/v1/sites/{siteId}/equipment POST /api/v1/equipment PUT /api/v1/equipment/{id} PATCH /api/v1/equipment/{id}/status

​

### 12.9 Modelos de inspeção

GET /api/v1/inspection-templates GET /api/v1/inspection-templates/{id} POST /api/v1/inspection-templates PUT /api/v1/inspection-templates/{id} POST /api/v1/inspection-templates/{id}/sections PUT /api/v1/inspection-templates/{id}/sections/{sectionId} POST /api/v1/inspection-templates/{id}/sections/{sectionId}/items PUT /api/v1/inspection-templates/{id}/items/{itemId} POST /api/v1/inspection-templates/{id}/publish GET /api/v1/inspection-templates/{id}/versions GET /api/v1/inspection-template-versions/{versionId}

​

#### Exemplo resumido de item

{ "title": "A proteção do equipamento está íntegra?", "description": "Verifique trincas, ausência de parafusos e partes soltas.", "responseType": "CONFORMITY", "required": true, "observationRequiredOnFailure": true, "evidenceRequiredOnFailure": true, "displayOrder": 3 }

​

### 12.10 Inspeções

GET /api/v1/inspections GET /api/v1/inspections/{id} POST /api/v1/inspections PUT /api/v1/inspections/{id} POST /api/v1/inspections/{id}/assign POST /api/v1/inspections/{id}/cancel POST /api/v1/inspections/{id}/start POST /api/v1/inspections/{id}/submit POST /api/v1/inspections/{id}/begin-review POST /api/v1/inspections/{id}/approve POST /api/v1/inspections/{id}/reject GET /api/v1/inspections/{id}/history

​

Filtros administrativos:

estado;

técnico;

supervisor;

cliente;

local;

equipamento;

prioridade;

período previsto;

atraso.

#### Endpoints direcionados ao técnico

GET /api/v1/mobile/inspections GET /api/v1/mobile/inspections/{id}

​

A API deverá filtrar os dados pelo usuário autenticado, sem depender apenas de technicianId informado pelo cliente.

### 12.11 Respostas

GET /api/v1/inspections/{inspectionId}/responses PUT /api/v1/inspections/{inspectionId}/responses/{responseId} POST /api/v1/inspections/{inspectionId}/responses:batch

​

#### Exemplo de resposta do checklist

{ "id": "62327a9a-ec19-46a2-89ae-b49086b657f9", "inspectionItemId": "ab18a638-1c45-4a15-a444-b4235506e912", "valueBoolean": false, "conformity": "NON\_CONFORMING", "observation": "Proteção lateral apresenta trinca.", "answeredAtDevice": "2026-08-01T10:12:30-03:00", "baseVersion": 0 }

​

### 12.12 Evidências

POST /api/v1/inspections/{inspectionId}/evidence GET /api/v1/inspections/{inspectionId}/evidence GET /api/v1/evidence/{id} DELETE /api/v1/evidence/{id}

​

Metadados mínimos do upload:

identificador idempotente;

inspeção;

resposta ou não conformidade relacionada;

tipo;

data de captura;

descrição opcional.

### 12.13 Não conformidades

GET /api/v1/non-conformities GET /api/v1/non-conformities/{id} POST /api/v1/inspections/{inspectionId}/non-conformities PUT /api/v1/non-conformities/{id} PATCH /api/v1/non-conformities/{id}/status

​

### 12.14 Revisões

GET /api/v1/inspections/{inspectionId}/reviews POST /api/v1/inspections/{inspectionId}/begin-review POST /api/v1/inspections/{inspectionId}/approve POST /api/v1/inspections/{inspectionId}/reject

​

#### Exemplo de reprovação

{ "reason": "A fotografia do item 4 não permite identificar o número de série.", "itemsToCorrect": \[ "ab18a638-1c45-4a15-a444-b4235506e912" \] }

​

### 12.15 Sincronização

POST /api/v1/mobile/sync/push GET /api/v1/mobile/sync/pull?cursor={cursor} POST /api/v1/mobile/sync

​

O projeto poderá utilizar um endpoint combinado ou endpoints separados. O contrato escolhido deverá ser único e documentado.

#### Exemplo resumido de lote

{ "deviceId": "b38f54fd-6d7c-4249-b80f-5d0362103f82", "lastPullCursor": "cursor-anterior", "operations": \[ { "operationId": "5f30d6de-a4e0-4da8-b1c1-2acbd6f2850e", "entityType": "INSPECTION\_RESPONSE", "entityId": "62327a9a-ec19-46a2-89ae-b49086b657f9", "operationType": "UPSERT", "baseVersion": 0, "payload": { "inspectionItemId": "ab18a638-1c45-4a15-a444-b4235506e912", "conformity": "NON\_CONFORMING", "observation": "Proteção lateral apresenta trinca." } } \] }

​

#### Exemplo resumido de resultado

{ "results": \[ { "operationId": "5f30d6de-a4e0-4da8-b1c1-2acbd6f2850e", "status": "APPLIED", "entityVersion": 1 } \], "changes": \[\], "nextCursor": "novo-cursor", "serverTime": "2026-08-01T14:15:00Z" }

​

#### Estados por operação

APPLIED;

ALREADY\_APPLIED;

REJECTED;

CONFLICT;

DEPENDENCY\_FAILED.

### 12.16 Indicadores

GET /api/v1/dashboard/summary GET /api/v1/dashboard/inspections-by-status GET /api/v1/dashboard/non-conformities-by-severity

​

Indicadores são P1, mas um resumo básico poderá entrar no MVP administrativo.

### 12.17 Contrato entre disciplinas

Antes de uma funcionalidade ser integrada, deverão estar definidos:

endpoint;

método HTTP;

autorização;

corpo de entrada;

corpo de saída;

validações;

erros esperados;

exemplo no OpenAPI;

versão do contrato;

responsável pela implementação.

Quando o backend ainda não estiver pronto, mobile e web poderão utilizar mocks baseados no mesmo contrato. A substituição do mock não deverá exigir alteração completa da interface.

### 12.18 Compatibilidade e evolução

Mudanças incompatíveis deverão gerar nova versão ou planejamento explícito de migração.

Campos novos opcionais não deverão quebrar clientes existentes.

Valores de enum deverão ser tratados de forma controlada.

O mobile deverá informar sua versão quando necessário para diagnóstico.

A API poderá recusar versões incompatíveis com mensagem clara.

# **13 \- Aplicativo Mobile**

## 13\. Aplicativo Mobile

### 13.1 Objetivo

Oferecer ao técnico uma ferramenta confiável para receber e executar inspeções em campo, com interface simples, recursos nativos e funcionamento offline.

### 13.2 Usuário principal

Técnico de campo.

Usuários secundários poderão utilizar o aplicativo para testes ou execução excepcional, mas a experiência será projetada para o técnico.

### 13.3 Mapa de navegação sugerido

app/ ├── \_layout.tsx ├── (public)/ │ └── login.tsx └── (protected)/ ├── \_layout.tsx ├── (tabs)/ │ ├── index.tsx \# Início │ ├── inspections.tsx \# Lista │ ├── sync.tsx \# Sincronização │ └── profile.tsx \# Perfil ├── inspections/ │ ├── \[inspectionId\]/index.tsx \# Detalhes │ ├── \[inspectionId\]/start.tsx │ ├── \[inspectionId\]/checklist.tsx │ ├── \[inspectionId\]/summary.tsx │ └── \[inspectionId\]/non-conformities.tsx ├── scanner.tsx ├── evidence/ │ ├── capture.tsx │ └── preview.tsx └── sync/ └── details.tsx

​

### 13.4 Catálogo de telas

#### Login

e-mail;

senha;

ação entrar;

carregamento;

erro de credenciais;

indicação de indisponibilidade de rede;

informação sobre acesso offline, quando disponível.

#### Início

saudação e usuário;

inspeções do dia;

inspeções atrasadas;

inspeções em andamento;

pendências de sincronização;

ação rápida para sincronizar;

ação rápida para QR Code.

#### Lista de inspeções

pesquisa local;

filtros por estado, data e prioridade;

cartões com cliente, local, equipamento, prazo e estado;

indicador offline;

indicador de sincronização;

atualização manual.

#### Detalhes da inspeção

título;

cliente;

local;

equipamento;

prioridade;

data prevista;

instruções;

progresso;

estado;

mapa ou coordenadas, quando disponíveis;

ação iniciar, continuar, corrigir ou consultar.

#### Checklist

seções expansíveis ou navegação por etapas;

itens ordenados;

componente conforme tipo de resposta;

indicação de obrigatoriedade;

observação;

evidências;

não conformidade;

salvamento local;

progresso;

navegação para pendências.

#### Captura e evidências

solicitação de permissão;

câmera;

seleção de galeria, quando permitida;

prévia;

refazer;

descrição;

vínculo visível com item;

estado de upload.

#### Scanner

leitura de QR Code;

indicador de processamento;

equipamento encontrado;

divergência com equipamento previsto;

opção manual quando autorizada.

#### Resumo e conclusão

total de itens;

itens respondidos;

itens obrigatórios pendentes;

não conformidades;

evidências;

localização;

confirmação de conclusão;

aviso de que o envio poderá permanecer pendente.

#### Sincronização

última sincronização;

quantidade pendente;

operações com erro;

ação tentar novamente;

status por evidência;

mensagens compreensíveis;

detalhes técnicos limitados para suporte.

#### Perfil

nome;

e-mail;

perfil;

versão do aplicativo;

identificador do dispositivo quando necessário;

ação sincronizar;

ação sair.

### 13.5 Componentes dinâmicos do checklist

O aplicativo deverá possuir um mapeamento explícito entre tipo e componente:

TEXT\_SHORT → Input de texto TEXT\_LONG → Área de texto NUMBER → Input numérico BOOLEAN → Seletor Sim/Não CONFORMITY → Conforme/Não conforme/Não aplicável SINGLE\_CHOICE → Seleção única DATE → Seletor de data

​

Tipos desconhecidos não deverão quebrar a tela. O aplicativo deverá indicar incompatibilidade e impedir conclusão quando o item obrigatório não puder ser respondido.

### 13.6 Estratégia de estado e dados (Tecnologias)

Sugestão de responsabilidades:

TanStack Query: estado de dados remotos, invalidação e consultas online.

SQLite: fonte de dados operacional das inspeções disponíveis offline.

Zustand ou Context: estado pequeno de interface e sessão, evitando duplicar dados de servidor.

React Hook Form: formulários e composição dos tipos de resposta.

Zod ou mecanismo equivalente: validação de dados e contratos no cliente.

Secure Store: dados sensíveis da sessão.

O banco local não deve ser tratado apenas como cache descartável enquanto existirem alterações pendentes.

### 13.7 Recursos nativos obrigatórios

#### Câmera

solicitar permissão;

capturar imagem;

apresentar prévia;

refazer;

associar ao item;

manter arquivo pendente.

#### QR Code

ler código;

localizar equipamento;

validar divergência;

oferecer alternativa conforme regra.

#### Localização

solicitar permissão;

capturar posição pontual;

registrar precisão e horário;

tratar indisponibilidade;

não coletar continuamente no MVP.

#### Conectividade

detectar ausência de rede;

não bloquear o preenchimento;

acionar sincronização de forma controlada;

exibir estado atual.

### 13.8 Experiência offline

O técnico deverá distinguir claramente:

salvo no dispositivo;

aguardando envio;

enviado com sucesso;

falha no envio;

conflito.

A interface não deverá usar apenas mensagens temporárias para essa informação. O estado deverá permanecer visível na lista, no detalhe ou na tela de sincronização.

### 13.9 Requisitos de usabilidade

Botões principais com tamanho adequado para toque.

Contraste suficiente.

Texto de erro próximo ao campo ou ação relacionada.

Evitar formulários excessivamente densos.

Preservar o contexto ao alternar entre checklist e câmera.

Permitir retomar a posição no checklist.

Confirmar ações irreversíveis.

Exibir progresso.

Não depender exclusivamente de cor para comunicar estado.

Utilizar linguagem de negócio, não mensagens técnicas da API.

### 13.10 Requisitos de desempenho

Listas deverão ser virtualizadas quando necessário.

Imagens deverão ter tamanho e qualidade controlados.

O aplicativo não deverá carregar todas as fotografias em resolução integral simultaneamente.

Consultas locais deverão possuir índices adequados.

Renderizações do checklist deverão evitar atualização de todos os itens a cada digitação.

Sincronização deverá ser executada em lotes controlados.

### 13.11 Testes mobile prioritários

proteção de rota;

validação de login;

renderização de cada tipo de item;

validação de obrigatoriedade;

cálculo de progresso;

persistência local de resposta;

criação de operação na outbox;

comportamento offline;

redução de operações duplicadas;

tratamento de permissão negada;

conclusão bloqueada por pendências;

apresentação de erro de sincronização.

### 13.12 Escopo mínimo do mobile

O aplicativo mobile será considerado completo no MVP quando o técnico conseguir:

autenticar-se;

sincronizar suas inspeções;

abrir uma inspeção offline;

identificar o equipamento;

iniciar;

responder itens dinâmicos;

registrar observação;

capturar uma foto;

registrar localização;

registrar não conformidade;

concluir;

sincronizar;

acompanhar o resultado do envio;

receber uma solicitação de correção.

# **14 \- Interface Administrativa Web**

## 14\. Interface Administrativa Web

### 14.1 Objetivo

Fornecer aos administradores e supervisores uma interface adequada para configurar o sistema, planejar inspeções, acompanhar a operação e revisar resultados, sem necessidade de acesso direto ao banco de dados ou à documentação interativa da API.

### 14.2 Usuários principais

Administrador;

Supervisor.

O perfil de cliente somente leitura será uma evolução posterior.

### 14.3 Mapa de navegação sugerido

/login /app ├── /dashboard ├── /users ├── /clients │ └── /:clientId/sites ├── /sites │ └── /:siteId/equipment ├── /equipment ├── /inspection-templates │ ├── /new │ ├── /:templateId/edit │ ├── /:templateId/preview │ └── /:templateId/versions ├── /inspections │ ├── /new │ ├── /:inspectionId │ └── /:inspectionId/review ├── /non-conformities └── /audit

​

### 14.4 Layout principal

menu lateral ou navegação equivalente;

cabeçalho com usuário e ambiente;

breadcrumbs quando necessários;

área central responsiva;

mensagens globais controladas;

confirmação de ações críticas;

tratamento consistente de carregamento, vazio e erro.

### 14.5 Dashboard

#### MVP

total de inspeções por estado;

inspeções atrasadas;

inspeções aguardando revisão;

não conformidades por criticidade;

atalhos para criar inspeção e revisar pendências.

#### Evoluções

tendências por período;

desempenho por técnico;

tempo médio;

distribuição geográfica;

comparação entre clientes e equipamentos.

### 14.6 Usuários

Funcionalidades:

listar;

pesquisar;

filtrar por perfil e estado;

cadastrar;

editar dados permitidos;

ativar, inativar ou bloquear;

redefinir acesso por fluxo controlado;

visualizar inspeções relacionadas, quando autorizado.

### 14.7 Clientes, locais e equipamentos

#### Clientes

listagem;

cadastro;

edição;

inativação;

acesso aos locais relacionados.

#### Locais

vínculo com cliente;

endereço;

coordenadas opcionais;

contato local;

equipamentos relacionados.

#### Equipamentos

identificação;

patrimônio;

número de série;

fabricante e modelo;

QR Code;

situação;

histórico de inspeções, como P1.

### 14.8 Construtor de modelos de inspeção

Esta é uma das principais telas administrativas.

Deverá permitir:

criar modelo em rascunho;

editar título, descrição e categoria;

criar seções;

ordenar seções;

criar itens;

selecionar tipo de resposta;

configurar obrigatoriedade;

configurar observação e evidência em caso de não conformidade;

configurar opções de seleção;

reordenar itens;

visualizar prévia;

validar pendências;

publicar versão;

consultar versões anteriores.

#### Decisão de escopo

Arrastar e soltar é desejável, mas não obrigatório. A ordenação poderá ser implementada inicialmente por botões de mover ou campo de ordem.

### 14.9 Planejamento de inspeções

A tela deverá permitir:

selecionar modelo e versão publicada;

selecionar cliente;

selecionar local filtrado pelo cliente;

selecionar equipamento filtrado pelo local;

selecionar técnico ativo;

definir supervisor;

definir data prevista;

definir prioridade;

incluir instruções;

validar dados;

criar e atribuir;

cancelar com justificativa;

consultar histórico de estado.

### 14.10 Acompanhamento

A listagem de inspeções deverá conter:

identificador ou título;

cliente;

local;

equipamento;

técnico;

prioridade;

data prevista;

estado;

progresso, quando disponível;

última atualização;

indicação de atraso.

Filtros:

texto;

estado;

técnico;

cliente;

prioridade;

período;

atrasadas;

aguardando revisão.

### 14.11 Tela de revisão

A revisão deverá apresentar:

cabeçalho da inspeção;

técnico e horários;

localização registrada;

progresso e resultado;

seções do checklist;

resposta por item;

observação;

fotografias relacionadas;

não conformidades;

histórico de revisões;

ação aprovar;

ação reprovar;

campo de motivo;

confirmação da decisão.

A interface não deverá permitir que o supervisor edite silenciosamente a resposta original do técnico.

### 14.12 Não conformidades

No MVP:

listar por inspeção;

exibir criticidade;

exibir descrição e evidências;

filtrar por criticidade;

consultar item relacionado.

O acompanhamento completo de plano de ação será P2.

### 14.13 Controle de acesso na interface

Rotas deverão possuir guards.

Menus deverão respeitar o perfil.

Botões não autorizados não deverão ser apresentados.

A API continuará sendo responsável pela decisão final.

Um erro 403 deverá ser tratado de forma clara.

### 14.14 Integração com a API

Serviços tipados.

Interceptador de autenticação.

Renovação de sessão conforme contrato.

Tratamento central de erros comuns.

Cancelamento ou controle de requisições quando necessário.

Paginação no servidor.

Filtros refletidos em parâmetros de consulta.

Modelos de entrada e saída compatíveis com OpenAPI.

### 14.15 Estados obrigatórios de interface

Toda tela de dados deverá considerar:

carregando;

sucesso com dados;

sucesso sem dados;

erro de validação;

erro de autorização;

erro de rede;

erro interno;

ação em processamento;

confirmação de sucesso.

### 14.16 Testes prioritários

guard de rota;

permissões por perfil;

validação de formulário;

filtro encadeado cliente → local → equipamento;

criação de modelo;

bloqueio de publicação inválida;

criação de inspeção;

apresentação dos estados;

aprovação;

motivo obrigatório na reprovação;

tratamento de erro da API.

### 14.17 Escopo mínimo da interface administrativa

A interface será considerada completa no MVP quando:

o administrador gerenciar usuários;

o supervisor cadastrar ou selecionar cliente, local e equipamento;

o supervisor criar e publicar um modelo;

o supervisor agendar e atribuir uma inspeção;

a inspeção aparecer no acompanhamento;

o supervisor visualizar o resultado sincronizado;

as fotografias estiverem vinculadas aos itens;

as não conformidades forem apresentadas;

o supervisor aprovar ou reprovar;

a decisão for refletida no aplicativo após sincronização.

# **15 \- Backlog do Produto**

## 15\. Backlog do Produto

### 15.1 Estrutura recomendada no Notion (Sugestão)

Criar um banco de dados chamado Product Backlog — FieldOps com as seguintes propriedades:

| Propriedade | Tipo no Notion | Finalidade |
| ----- | ----- | ----- |
| ID | Texto | Identificador único do item. |
| Título | Título | Nome curto da história ou tarefa. |
| Épico | Relação ou seleção | Agrupamento funcional. |
| História de usuário | Texto longo | Necessidade sob a perspectiva do usuário. |
| Componente | Seleção múltipla | Mobile, Admin, API, Banco ou Infraestrutura. |
| Prioridade | Seleção | P0, P1 ou P2. |
| Sprint | Relação ou seleção | Sprint planejada. |
| Status | Status | Backlog, Refinamento, Pronto, Em andamento, Em revisão, Concluído ou Bloqueado. |
| Responsável | Pessoa | Responsável principal. |
| Dependências | Relação | Itens que precisam ser concluídos antes. |
| Critérios de aceitação | Texto ou relação | Condições de aprovação. |
| Pontos | Número | Estimativa relativa. |
| Evidências | Arquivos/URL | Pull request, vídeo, prints ou relatório. |
| Disciplina | Seleção múltipla | Expo, Spring Boot, Angular ou Integração. |

### 15.2 Épicos

| ID | Épico | Resultado esperado |
| ----- | ----- | ----- |
| EP-01 | Fundação técnica | Projetos executáveis, padronizados e integráveis. |
| EP-02 | Identidade e acesso | Usuários autenticados e autorizados. |
| EP-03 | Cadastros operacionais | Clientes, locais e equipamentos disponíveis. |
| EP-04 | Modelos de inspeção | Checklists configuráveis e versionados. |
| EP-05 | Planejamento | Inspeções agendadas e atribuídas. |
| EP-06 | Execução de campo | Técnico executa checklist pelo mobile. |
| EP-07 | Recursos nativos e evidências | QR Code, câmera e localização integrados. |
| EP-08 | Offline e sincronização | Operação sem rede e envio confiável. |
| EP-09 | Revisão e decisão | Supervisor revisa, aprova ou reprova. |
| EP-10 | Qualidade e entrega | Testes, documentação, builds e demonstração. |

### 15.3 Backlog priorizado do MVP

#### EP-01 — Fundação técnica

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-001 | Como equipe, quero repositórios e convenções definidos para desenvolver os componentes de forma coordenada. | Todos | P0 | 1 |
| PBI-002 | Como desenvolvedor mobile, quero um projeto Expo com TypeScript, rotas e estrutura por features para iniciar o produto. | Mobile | P0 | 1 |
| PBI-003 | Como desenvolvedor web, quero um projeto Angular/React com layout, rotas e estrutura modular para iniciar o painel. | Admin | P0 | 1 |
| PBI-004 | Como desenvolvedor backend, quero uma API Spring Boot conectada ao PostgreSQL e com migrações para iniciar os serviços. | API/Banco | P0 | 1 |
| PBI-005 | Como equipe, quero lint, verificação de tipos e fluxo de pull request para manter um padrão mínimo de qualidade. | Todos | P0 | 1 |
| PBI-006 | Como integrador, quero um contrato inicial OpenAPI e dados simulados para que os frontends possam avançar em paralelo. | API/Integração | P0 | 1 |

#### EP-02 — Identidade e acesso

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-007 | Como usuário, quero autenticar-me com e-mail e senha para acessar somente os recursos permitidos. | API | P0 | 2 |
| PBI-008 | Como técnico, quero iniciar e encerrar minha sessão no aplicativo. | Mobile | P0 | 2 |
| PBI-009 | Como administrador ou supervisor, quero iniciar e encerrar minha sessão na interface web. | Admin | P0 | 2 |
| PBI-010 | Como sistema, quero renovar a sessão sem solicitar credenciais a todo momento. | Mobile/Admin/API | P0 | 2 |
| PBI-011 | Como administrador, quero cadastrar, editar e inativar usuários. | Admin/API | P0 | 2 |
| PBI-012 | Como responsável por segurança, quero que a API valide o perfil em cada operação. | API | P0 | 2 |

#### EP-03 — Cadastros operacionais

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-013 | Como supervisor, quero gerenciar clientes para organizar as inspeções por organização atendida. | Admin/API | P0 | 2 |
| PBI-014 | Como supervisor, quero gerenciar locais vinculados a clientes. | Admin/API | P0 | 2 |
| PBI-015 | Como supervisor, quero gerenciar equipamentos vinculados aos locais. | Admin/API | P0 | 2 |
| PBI-016 | Como supervisor, quero atribuir um código QR único ao equipamento. | Admin/API | P0 | 2 |
| PBI-017 | Como usuário administrativo, quero pesquisar, filtrar e paginar os cadastros. | Admin/API | P0 | 2 |

#### EP-04 — Modelos de inspeção

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-018 | Como supervisor, quero criar um modelo de inspeção em rascunho. | Admin/API | P0 | 3 |
| PBI-019 | Como supervisor, quero criar e ordenar seções do checklist. | Admin/API | P0 | 3 |
| PBI-020 | Como supervisor, quero criar itens com diferentes tipos de resposta. | Admin/API | P0 | 3 |
| PBI-021 | Como supervisor, quero definir itens obrigatórios e regras de evidência. | Admin/API | P0 | 3 |
| PBI-022 | Como supervisor, quero visualizar uma prévia antes de publicar. | Admin | P0 | 3 |
| PBI-023 | Como supervisor, quero publicar uma versão imutável do modelo. | Admin/API | P0 | 3 |
| PBI-024 | Como sistema, quero preservar o snapshot utilizado pela inspeção. | API/Banco | P0 | 3 |

#### EP-05 — Planejamento

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-025 | Como supervisor, quero agendar uma inspeção a partir de um modelo publicado. | Admin/API | P0 | 3 |
| PBI-026 | Como supervisor, quero selecionar cliente, local e equipamento de forma encadeada. | Admin/API | P0 | 3 |
| PBI-027 | Como supervisor, quero atribuir a inspeção a um técnico ativo. | Admin/API | P0 | 3 |
| PBI-028 | Como supervisor, quero definir prioridade, prazo e instruções. | Admin/API | P0 | 3 |
| PBI-029 | Como supervisor, quero cancelar uma inspeção com justificativa. | Admin/API | P0 | 3 |
| PBI-030 | Como supervisor, quero acompanhar a inspeção em uma listagem com filtros. | Admin/API | P0 | 4 |

#### EP-06 — Execução de campo

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-031 | Como técnico, quero baixar e visualizar as inspeções atribuídas a mim. | Mobile/API | P0 | 4 |
| PBI-032 | Como técnico, quero filtrar minhas inspeções por estado, data e prioridade. | Mobile | P0 | 4 |
| PBI-033 | Como técnico, quero consultar os detalhes antes de iniciar. | Mobile | P0 | 4 |
| PBI-034 | Como técnico, quero iniciar a inspeção e registrar o horário. | Mobile/API | P0 | 4 |
| PBI-035 | Como técnico, quero visualizar o checklist gerado dinamicamente. | Mobile/API | P0 | 4 |
| PBI-036 | Como técnico, quero responder diferentes tipos de item. | Mobile | P0 | 4 |
| PBI-037 | Como técnico, quero que cada resposta seja salva localmente. | Mobile | P0 | 4 |
| PBI-038 | Como técnico, quero visualizar o progresso e os itens pendentes. | Mobile | P0 | 4 |
| PBI-039 | Como técnico, quero registrar observações em itens. | Mobile/API | P0 | 4 |
| PBI-040 | Como técnico, quero concluir somente quando todas as regras forem atendidas. | Mobile/API | P0 | 4 |

#### EP-07 — Recursos nativos e evidências

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-041 | Como técnico, quero ler o QR Code para confirmar o equipamento. | Mobile/API | P0 | 5 |
| PBI-042 | Como técnico, quero capturar uma fotografia e visualizar a prévia. | Mobile | P0 | 5 |
| PBI-043 | Como técnico, quero associar a fotografia ao item correto. | Mobile/API | P0 | 5 |
| PBI-044 | Como técnico, quero manter a fotografia pendente quando o upload falhar. | Mobile | P0 | 5 |
| PBI-045 | Como técnico, quero registrar a localização no início e na conclusão. | Mobile/API | P0 | 5 |
| PBI-046 | Como técnico, quero registrar uma não conformidade com criticidade e evidência. | Mobile/API | P0 | 5 |
| PBI-047 | Como supervisor, quero visualizar evidências e não conformidades no acompanhamento. | Admin/API | P0 | 5 |

#### EP-08 — Offline e sincronização

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-048 | Como técnico, quero acessar inspeções previamente baixadas sem internet. | Mobile | P0 | 6 |
| PBI-049 | Como técnico, quero que respostas permaneçam após fechar o aplicativo. | Mobile | P0 | 6 |
| PBI-050 | Como sistema, quero registrar alterações em uma outbox persistente. | Mobile | P0 | 6 |
| PBI-051 | Como sistema, quero enviar operações em lote e respeitar dependências. | Mobile/API | P0 | 6 |
| PBI-052 | Como sistema, quero impedir duplicidades quando uma operação for reenviada. | API | P0 | 6 |
| PBI-053 | Como sistema, quero baixar alterações utilizando cursor de sincronização. | Mobile/API | P0 | 6 |
| PBI-054 | Como técnico, quero visualizar pendências, falhas e última sincronização. | Mobile | P0 | 6 |
| PBI-055 | Como sistema, quero detectar conflito de versão e preservar os dados para análise. | Mobile/API | P0 | 6 |

#### EP-09 — Revisão e decisão

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-056 | Como supervisor, quero visualizar inspeções aguardando revisão. | Admin/API | P0 | 7 |
| PBI-057 | Como supervisor, quero revisar respostas por seção e item. | Admin/API | P0 | 7 |
| PBI-058 | Como supervisor, quero ampliar e relacionar fotografias aos itens. | Admin/API | P0 | 7 |
| PBI-059 | Como supervisor, quero iniciar formalmente uma revisão. | Admin/API | P0 | 7 |
| PBI-060 | Como supervisor, quero aprovar uma inspeção. | Admin/API | P0 | 7 |
| PBI-061 | Como supervisor, quero reprovar uma inspeção informando o motivo. | Admin/API | P0 | 7 |
| PBI-062 | Como técnico, quero receber a inspeção reprovada com instruções de correção. | Mobile/API | P0 | 7 |
| PBI-063 | Como responsável por auditoria, quero registrar as mudanças de estado. | API/Banco | P0 | 7 |

#### EP-10 — Qualidade e entrega

| ID | História de usuário | Componente | Prioridade | Sprint |
| ----- | ----- | ----- | ----- | ----- |
| PBI-064 | Como usuário, quero mensagens compreensíveis para carregamento, vazio, erro e offline. | Mobile/Admin | P0 | 7 |
| PBI-065 | Como equipe, quero testes automatizados dos fluxos críticos. | Todos | P0 | 7 |
| PBI-066 | Como equipe, quero dados de demonstração reproduzíveis. | API/Banco | P0 | 8 |
| PBI-067 | Como avaliador, quero executar os projetos a partir do README. | Todos | P0 | 8 |
| PBI-068 | Como técnico, quero instalar uma build Android de demonstração. | Mobile | P0 | 8 |
| PBI-069 | Como usuário administrativo, quero acessar uma versão publicada do painel. | Admin | P0 | 8 |
| PBI-070 | Como equipe, quero uma API publicada ou executável por contêiner para demonstração. | API/Infra | P0 | 8 |
| PBI-071 | Como avaliador, quero consultar o OpenAPI e os principais diagramas. | API/Documentação | P0 | 8 |
| PBI-072 | Como equipe, quero demonstrar o fluxo ponta a ponta com dados reais de teste. | Todos | P0 | 8 |

### 15.4 Itens P1 sugeridos

| ID | História resumida | Componente |
| ----- | ----- | ----- |
| PBI-073 | Dashboard com indicadores por estado e criticidade. | Admin/API |
| PBI-074 | Notificações locais de prazo. | Mobile |
| PBI-075 | Notificações push de nova atribuição. | Mobile/API |
| PBI-076 | Assinatura desenhada. | Mobile/API |
| PBI-077 | Relatório PDF básico. | API/Admin |
| PBI-078 | Histórico detalhado de respostas. | Admin/API |
| PBI-079 | Comentários de revisão por item. | Admin/API |
| PBI-080 | Biometria para reabertura local. | Mobile |
| PBI-081 | Tema escuro. | Mobile/Admin |
| PBI-082 | Exportação CSV. | Admin/API |

### 15.5 Política de refinamento

Um item poderá entrar em uma sprint somente quando possuir:

história ou resultado esperado compreensível;

responsável funcional;

componente afetado;

prioridade;

dependências identificadas;

critérios de aceitação;

contrato de API, quando houver integração;

tamanho pequeno o suficiente para a sprint;

dados ou mock necessários.

# **16 \- Roadmap**

## 16\. Roadmap

### 16.1 Premissa acadêmica

O planejamento considera 16 semanas efetivas de aula, embora o calendário institucional possua 20 semanas. As demais semanas poderão ser comprometidas por avaliações, palestras, feriados, eventos e atividades institucionais e não deverão ser utilizadas como dependência para concluir o MVP.

Na disciplina de Expo, cada semana terá:

2 aulas de 50 minutos para conteúdo e demonstração;

3 aulas de 50 minutos para desenvolvimento orientado do projeto.

Carga efetiva da disciplina:

32 aulas de conteúdo;

48 aulas de projeto;

80 aulas de 50 minutos.

### 16.2 Rotina semanal da disciplina de Expo

| Aula | Finalidade |
| ----- | ----- |
| Aula 1 | Conceitos, arquitetura, decisões e exemplos. |
| Aula 2 | Demonstração prática guiada e exercício controlado. |
| Aula 3 | Refinamento da história, critérios de aceitação e preparação da integração. |
| Aula 4 | Desenvolvimento da funcionalidade no FieldOps. |
| Aula 5 | Integração, testes, revisão de código e demonstração parcial. |

### 16.3 Organização em oito sprints

Cada sprint terá duas semanas:

4 aulas de conteúdo Expo;

6 aulas de projeto Expo;

entregas correspondentes no backend e na interface administrativa;

incremento demonstrável ao final.

### 16.4 Roadmap integrado

| Sprint | Semanas | Conteúdo principal de Expo | Entrega mobile | Entrega administrativa | Entrega backend | Incremento demonstrável |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | 1–2 | Arquitetura, TypeScript, Expo Router, componentes e qualidade | Projeto base, rotas protegidas simuladas, design system e dados mockados | Projeto Angular, layout, rotas e telas iniciais | API base, PostgreSQL, migrações e OpenAPI inicial | Três aplicações executáveis com contrato inicial |
| 2 | 3–4 | Consumo de API, autenticação, sessão segura e tratamento de erros | Login real, sessão, logout e tela inicial | Login, usuários e cadastros básicos | JWT, autorização, usuários, clientes, locais e equipamentos | Usuários autenticados e cadastros disponíveis |
| 3 | 5–6 | Dados remotos, cache, listas, filtros e estados de interface | Lista e detalhes de inspeções inicialmente mockados e depois integrados | Construtor de modelos e agendamento | Modelos versionados, snapshot, inspeções e atribuição | Supervisor cria e atribui uma inspeção |
| 4 | 7–8 | React Hook Form, validação e formulários dinâmicos | Início, checklist, respostas, observações e progresso | Acompanhamento das inspeções | Consulta mobile, respostas, transições e validações | Técnico executa uma inspeção online |
| 5 | 9–10 | Câmera, imagens, permissões, QR Code e localização | Evidências, leitura do equipamento, GPS e não conformidade | Visualização de evidências e ocorrências | Upload, QR Code, localização e não conformidades | Inspeção online com recursos nativos |
| 6 | 11–12 | SQLite, conectividade, repositórios locais, outbox e sincronização | Download, operação offline, fila, tela de sincronização | Visualização do estado recebido | Push/pull, idempotência, cursor e conflitos básicos | Inspeção concluída offline e sincronizada |
| 7 | 13–14 | Testes, performance, acessibilidade e tratamento de falhas | Correção, robustez, testes e estados de erro | Revisão, aprovação, reprovação e histórico | Revisão, auditoria e testes de integração | Ciclo completo com reprovação e correção |
| 8 | 15–16 | EAS, ambientes, versionamento e distribuição | Build Android, documentação e ajustes finais | Build e publicação web | Contêiner, ambiente de demonstração e OpenAPI final | Produto integrado apresentado ponta a ponta |

### 16.5 Detalhamento por semana

#### Semana 1 — Fundação e diagnóstico

Conteúdo Expo

revisão do ecossistema;

diagnóstico do conhecimento anterior;

arquitetura do produto;

TypeScript aplicado ao domínio;

convenções do repositório.

Projeto Expo

criar o projeto;

configurar TypeScript, lint e aliases;

criar estrutura por features;

registrar decisões no README;

preparar o fluxo Git.

Dependências integradas

repositórios criados;

contrato inicial de autenticação e inspeção;

definição dos identificadores e enums.

#### Semana 2 — Navegação e base visual

Conteúdo Expo

Expo Router;

grupos de rotas;

layouts;

proteção de rotas;

design system e componentes reutilizáveis.

Projeto Expo

rotas públicas e protegidas;

shell da aplicação;

login visual;

início e lista simulada;

componentes de botão, campo, cartão e estado.

Marco

demonstração navegável com mocks.

#### Semana 3 — Comunicação com API

Conteúdo Expo

cliente HTTP;

variáveis por ambiente;

DTOs;

interceptação;

estados de carregamento e erro.

Projeto Expo

serviço de API;

integração com endpoint de login simulado ou real;

tratamento padronizado de falhas;

configuração local e de integração.

#### Semana 4 — Autenticação e sessão

Conteúdo Expo

JWT no cliente;

renovação;

armazenamento seguro;

logout;

sessão offline limitada.

Projeto Expo

login real;

persistência segura;

carregamento da sessão;

proteção de rotas;

logout e expiração.

Marco

autenticação integrada com Spring Boot.

#### Semana 5 — Dados remotos e cache

Conteúdo Expo

TanStack Query;

chaves de consulta;

cache;

invalidação;

separação entre estado remoto e estado da interface.

Projeto Expo

consulta de inspeções;

estados de carregamento, vazio e erro;

atualização manual;

estrutura inicial do repositório de inspeções.

#### Semana 6 — Listas, filtros e detalhes

Conteúdo Expo

listas virtualizadas;

paginação;

filtros;

navegação parametrizada;

otimização inicial.

Projeto Expo

lista completa;

filtros locais ou remotos;

tela de detalhes;

apresentação de prioridade, prazo e estado.

Marco

técnico visualiza inspeção atribuída.

#### Semana 7 — Formulários e validação

Conteúdo Expo

React Hook Form;

schemas;

validação;

componentes controlados;

mensagens de erro.

Projeto Expo

componentes para tipos básicos;

validação de item;

observação;

estrutura de resposta.

#### Semana 8 — Checklist dinâmico

Conteúdo Expo

renderização por configuração;

seções;

progresso;

otimização de formulários longos;

resumo e confirmação.

Projeto Expo

checklist dinâmico;

início da inspeção;

respostas online;

progresso;

conclusão com validação.

Marco

execução online completa sem evidências.

#### Semana 9 — Câmera e arquivos

Conteúdo Expo

permissões;

captura;

seleção de imagem;

URI local;

tamanho e qualidade;

upload multipart.

Projeto Expo

componente de evidência;

captura e prévia;

vínculo com item;

upload online;

tratamento de falha.

#### Semana 10 — QR Code e localização

Conteúdo Expo

scanner;

ciclo de leitura;

GPS;

precisão;

consentimento;

uso pontual da localização.

Projeto Expo

confirmar equipamento por QR Code;

registrar início e conclusão;

apresentar divergência;

criar não conformidade.

Marco

inspeção online com recursos nativos.

#### Semana 11 — SQLite e repositórios locais

Conteúdo Expo

modelagem local;

migração;

consultas;

repositório;

consistência local.

Projeto Expo

banco local;

download da inspeção;

persistência das respostas;

retomada após reiniciar o aplicativo.

#### Semana 12 — Outbox e sincronização

Conteúdo Expo

detecção de conectividade;

outbox;

idempotência;

dependências;

repetição;

conflitos.

Projeto Expo

fila persistente;

envio em lote;

download por cursor;

tela de sincronização;

conclusão offline.

Marco

inspeção executada offline e recebida pelo servidor.

#### Semana 13 — Testes e falhas

Conteúdo Expo

testes de componentes;

testes de regras;

mocks de rede;

erros recuperáveis;

logging controlado.

Projeto Expo

testes dos componentes dinâmicos;

testes da outbox;

cenários de permissão negada;

cenários de falha de envio.

#### Semana 14 — Performance e acessibilidade

Conteúdo Expo

profiling;

renderizações;

listas;

imagens;

acessibilidade;

feedback de estado.

Projeto Expo

otimizações;

correções de acessibilidade;

fluxo de inspeção reprovada;

revisão de experiência.

Marco

fluxo de revisão e correção estável.

#### Semana 15 — Build e ambientes

Conteúdo Expo

configuração do aplicativo;

ambientes;

versionamento;

EAS Build;

distribuição interna.

Projeto Expo

ícones e configurações;

variáveis por ambiente;

build Android;

instalação em dispositivo;

correção de problemas de build.

#### Semana 16 — Integração e apresentação

Conteúdo Expo

preparação de release;

checklist de publicação;

documentação;

análise retrospectiva.

Projeto Expo

teste ponta a ponta;

dados de demonstração;

vídeo ou apresentação;

README final;

entrega das evidências.

Marco final

demonstração completa: criar → atribuir → executar offline → sincronizar → revisar → aprovar ou reprovar.

### 16.6 Marcos obrigatórios

| Marco | Final da semana | Evidência |
| ----- | ----- | ----- |
| M1 — Fundação | 2 | Aplicações base e navegação simulada. |
| M2 — Autenticação | 4 | Login integrado nos dois frontends. |
| M3 — Planejamento | 6 | Modelo e inspeção criados pela web. |
| M4 — Execução online | 8 | Checklist dinâmico enviado à API. |
| M5 — Recursos nativos | 10 | Foto, QR Code e localização. |
| M6 — Offline | 12 | Inspeção concluída sem rede e sincronizada. |
| M7 — Revisão | 14 | Aprovação ou reprovação com histórico. |
| M8 — Release | 16 | Build, painel e API demonstrados. |

### 16.7 Gestão de risco do cronograma

Caso exista atraso, a redução de escopo deverá seguir esta ordem:

remover dashboard avançado;

limitar tipos de resposta aos essenciais;

manter apenas fotografia capturada, sem galeria;

simplificar o construtor de modelos sem arrastar e soltar;

limitar o conflito à detecção e bloqueio;

adiar notificações, PDF e assinatura;

manter obrigatoriamente autenticação, planejamento, checklist, foto, offline, sincronização e revisão.

# **17 \- Critérios de Aceitação**

## 17\. Critérios de Aceitação

### 17.1 Critérios gerais do produto

O incremento somente será aceito quando:

a funcionalidade atender às regras de negócio relacionadas;

o perfil correto conseguir executar a ação;

perfis não autorizados forem bloqueados pela API;

os estados de carregamento, vazio, erro e sucesso estiverem tratados;

os dados persistirem no componente adequado;

erros não provocarem perda silenciosa de dados;

o contrato da API estiver atualizado;

o fluxo estiver integrado quando depender de mais de uma aplicação;

as evidências de teste estiverem disponíveis;

não existirem erros críticos conhecidos no fluxo entregue.

### 17.2 AC-AUTH — Autenticação

#### Cenário: login válido

Dado que o usuário está ativo

E informa e-mail e senha válidos

Quando solicita o acesso

Então a API deve criar uma sessão válida

E retornar o perfil autorizado

E a aplicação deve direcioná-lo à área protegida.

#### Cenário: credenciais inválidas

Dado que as credenciais não são válidas

Quando o usuário tenta entrar

Então o acesso deve ser negado

E a mensagem não deve revelar se o e-mail existe.

#### Cenário: usuário inativo

Dado que o usuário está inativo

Quando tenta entrar

Então a API deve negar a sessão

E a aplicação deve apresentar orientação compreensível.

#### Cenário: token expirado

Dado que o token de acesso expirou

E o token de renovação ainda é válido

Quando a aplicação realiza uma operação protegida

Então a sessão deve ser renovada de forma controlada

E a operação original poderá ser repetida uma única vez.

#### Cenário: logout

Dado que o usuário está autenticado

Quando encerra a sessão

Então os dados sensíveis da sessão devem ser removidos

E as rotas protegidas não devem permanecer acessíveis.

### 17.3 AC-USERS — Usuários e perfis

O administrador consegue cadastrar usuário com nome, e-mail, perfil e situação.

O e-mail não pode ser duplicado.

O perfil deve aceitar somente valores previstos.

Um usuário inativo não consegue iniciar nova sessão.

A inativação não remove inspeções ou auditoria associadas.

Um técnico não consegue acessar endpoints administrativos.

Um supervisor não consegue gerenciar usuários quando essa permissão não estiver atribuída.

### 17.4 AC-MASTER — Clientes, locais e equipamentos

#### Cliente

Nome é obrigatório.

Registro pode ser pesquisado e filtrado.

Cliente inativo não pode ser utilizado em nova inspeção.

#### Local

Todo local deve possuir cliente.

A interface deve filtrar locais pelo cliente selecionado.

Local inativo não pode receber nova inspeção.

#### Equipamento

Todo equipamento deve possuir local no MVP.

QR Code deve ser único.

A seleção administrativa deve mostrar somente equipamentos do local escolhido.

Equipamento inativo não pode ser utilizado em nova inspeção.

O técnico consegue consultar os dados mínimos do equipamento relacionado à inspeção.

### 17.5 AC-TEMPLATE — Modelo de inspeção

#### Cenário: criar rascunho

Dado que o supervisor possui permissão

Quando cria um modelo

Então o modelo deve permanecer em rascunho

E poderá receber seções e itens.

#### Cenário: publicar modelo válido

Dado que o modelo possui título

E ao menos uma seção

E ao menos um item válido

Quando o supervisor publica o modelo

Então uma versão numerada deve ser criada

E a versão deve ficar disponível para novas inspeções.

#### Cenário: publicação inválida

Dado que existe item sem tipo de resposta

Ou o modelo não possui itens

Quando o supervisor tenta publicar

Então a operação deve ser bloqueada

E as pendências devem ser apresentadas.

#### Cenário: alterar modelo já utilizado

Dado que uma versão publicada já foi utilizada

Quando o supervisor altera a estrutura

Então uma nova versão deve ser criada

E inspeções existentes devem manter o snapshot anterior.

### 17.6 AC-SCHEDULING — Agendamento e atribuição

O supervisor deve selecionar uma versão publicada.

Cliente, local, técnico e data prevista são obrigatórios.

O equipamento é obrigatório quando o modelo exigir inspeção de equipamento.

O local deve pertencer ao cliente.

O equipamento deve pertencer ao local.

O técnico deve estar ativo.

Após a confirmação, a inspeção deve possuir snapshot dos itens.

A inspeção deve ficar visível ao técnico após sincronização.

O cancelamento deve exigir justificativa e registrar auditoria.

### 17.7 AC-MOBILE-LIST — Lista e detalhes no mobile

O técnico visualiza somente inspeções autorizadas.

A lista apresenta estado, prioridade, data, cliente e local.

A interface diferencia atrasada, em andamento e pendente de sincronização.

Filtros não devem apagar os dados locais.

A ausência de inspeções deve apresentar estado vazio, não erro.

A falha de atualização não deve remover os dados anteriormente armazenados.

O detalhe deve funcionar offline para inspeções baixadas.

### 17.8 AC-START — Início da inspeção

#### Cenário: iniciar inspeção atribuída

Dado que a inspeção está atribuída ao técnico

Quando o técnico confirma o início

Então a data e hora do dispositivo devem ser registradas

E a inspeção deve passar a em andamento localmente

E uma operação deve ser criada na outbox.

#### Cenário: inspeção não autorizada

Dado que a inspeção pertence a outro técnico

Quando o usuário tenta iniciá-la

Então a API deve negar a operação.

#### Cenário: localização negada

Dado que a localização foi solicitada

E o usuário negou a permissão

Quando a regra permitir continuidade

Então a inspeção poderá iniciar

E a ausência da localização deverá ser registrada ou informada.

### 17.9 AC-CHECKLIST — Checklist dinâmico

Itens devem aparecer na ordem definida pelo snapshot.

O componente deve corresponder ao tipo de resposta.

Valores inválidos devem ser bloqueados com mensagem clara.

Resposta confirmada deve ser salva em SQLite.

Fechar e reabrir o aplicativo deve preservar respostas.

O progresso deve ser recalculado corretamente.

Itens obrigatórios pendentes devem ser identificáveis.

Resposta não conforme deve exigir observação quando configurado.

Resposta crítica não conforme deve exigir evidência quando configurado.

Tipo desconhecido deve produzir estado controlado, sem encerrar o aplicativo inesperadamente.

### 17.10 AC-EVIDENCE — Evidências

#### Cenário: capturar fotografia

Dado que a permissão da câmera foi concedida

Quando o técnico captura uma fotografia

Então a aplicação deve apresentar uma prévia

E permitir confirmar ou refazer

E associar a imagem ao item correto.

#### Cenário: trabalhar offline

Dado que não existe conectividade

Quando o técnico confirma a fotografia

Então o arquivo deve permanecer no dispositivo

E um upload pendente deve ser criado

E a evidência deve continuar visível.

#### Cenário: falha de upload

Dado que o servidor não confirmou o arquivo

Quando a sincronização termina parcialmente

Então a evidência deve permanecer pendente

E os demais dados confirmados não devem ser revertidos

E o técnico deve poder tentar novamente.

#### Critérios adicionais

Formato e tamanho devem ser validados.

Evidência deve possuir identificador próprio.

Evidência sincronizada deve aparecer na interface administrativa.

Evidência de inspeção aprovada deve ser somente leitura.

### 17.11 AC-QR — QR Code

A câmera deve solicitar permissão antes do uso.

O código deve ser lido uma única vez por ciclo de confirmação.

O equipamento deve ser procurado primeiro nos dados autorizados.

Equipamento não localizado deve produzir mensagem clara.

Divergência com o equipamento previsto deve exigir confirmação ou bloquear conforme regra.

A leitura não pode permitir acesso a equipamento fora do escopo do usuário.

Quando autorizado, deve existir identificação manual alternativa.

### 17.12 AC-LOCATION — Localização

A aplicação deve solicitar consentimento.

A coleta deve ser pontual, não contínua.

Latitude, longitude, precisão e horário devem ser armazenados quando disponíveis.

Falha de localização não deve encerrar o aplicativo.

A ausência deve ser apresentada quando a localização for obrigatória.

Os dados sincronizados devem estar visíveis na revisão.

### 17.13 AC-NONCONFORMITY — Não conformidades

Título, descrição e criticidade devem ser validados.

O registro deve estar relacionado à inspeção.

O item relacionado deve ser preservado quando informado.

Criticidade crítica deve exigir evidência.

O registro deve funcionar offline.

A não conformidade sincronizada deve aparecer na revisão administrativa.

A exclusão após envio deve respeitar a regra de auditoria.

### 17.14 AC-COMPLETE — Conclusão

#### Cenário: inspeção válida

Dado que todos os itens obrigatórios estão respondidos

E observações e evidências exigidas foram registradas

Quando o técnico confirma a conclusão

Então o aplicativo deve registrar o horário

E bloquear edição comum

E criar a operação de conclusão.

#### Cenário: inspeção incompleta

Dado que existe item obrigatório pendente

Quando o técnico tenta concluir

Então a operação deve ser bloqueada

E a aplicação deve indicar os itens pendentes.

#### Cenário: conclusão offline

Dado que não existe conectividade

Quando a inspeção válida é concluída

Então ela deve ficar marcada como aguardando sincronização

E os dados devem permanecer no dispositivo.

### 17.15 AC-SYNC — Sincronização

#### Cenário: envio bem-sucedido

Dado que existem operações pendentes

E existe conectividade

Quando a sincronização é executada

Então as operações devem ser enviadas na ordem correta

E as confirmações devem ser persistidas localmente

E a quantidade pendente deve ser atualizada.

#### Cenário: reenvio da mesma operação

Dado que uma operação já foi aplicada

Quando o aplicativo a envia novamente com o mesmo identificador

Então a API deve responder como já processada ou equivalente

E não deve criar duplicidade.

#### Cenário: falha parcial

Dado que um lote possui várias operações

Quando uma delas falha

Então o resultado individual deve ser retornado

E operações confirmadas devem permanecer confirmadas

E a falha deve continuar pendente.

#### Cenário: conflito

Dado que a versão do servidor é diferente da versão-base

Quando a alteração é enviada

Então a API deve retornar conflito

E a aplicação deve preservar a alteração local

E apresentar estado de conflito.

#### Critérios adicionais

O cursor somente deve avançar após persistência local.

A tela deve mostrar última sincronização.

Sair e entrar no aplicativo não pode apagar a outbox.

Arquivos pendentes devem ter estado individual.

### 17.16 AC-ADMIN-MONITOR — Acompanhamento administrativo

A listagem deve usar paginação.

Deve permitir filtros por estado, técnico, cliente, prioridade e período.

Inspeções atrasadas devem ser identificadas.

Dados de carregamento, vazio e erro devem ser tratados.

A visualização deve respeitar o perfil.

A atualização de estado após sincronização deve aparecer sem necessidade de manipulação direta do banco.

### 17.17 AC-REVIEW — Revisão, aprovação e reprovação

#### Cenário: iniciar revisão

Dado que a inspeção foi enviada

Quando o supervisor inicia a revisão

Então o estado deve mudar para em revisão

E a ação deve ser auditada.

#### Cenário: aprovar

Dado que a inspeção está em revisão

Quando o supervisor confirma a aprovação

Então o estado deve mudar para aprovada

E o revisor e o horário devem ser registrados

E as respostas devem ficar protegidas contra edição comum.

#### Cenário: reprovar

Dado que a inspeção está em revisão

Quando o supervisor tenta reprovar sem motivo

Então a ação deve ser bloqueada.

Dado que um motivo válido foi informado

Quando o supervisor confirma

Então o estado deve mudar para reprovada

E o técnico deve receber a informação na próxima sincronização.

### 17.18 AC-SECURITY — Segurança e autorização

Endpoints protegidos rejeitam requisições sem sessão válida.

Um técnico não consulta inspeções de outro técnico por alteração manual de URL.

Um usuário sem perfil administrativo não gerencia cadastros.

Arquivos não são disponibilizados publicamente sem controle.

Senhas e tokens não aparecem em logs.

Respostas de erro não apresentam stack trace ao cliente.

Segredos não são versionados.

A interface não é utilizada como única barreira de autorização.

### 17.19 AC-RELEASE — Aceitação da versão final

A versão final deverá demonstrar, sem edição manual do banco durante o fluxo:

login administrativo;

cadastro ou seleção de cliente, local e equipamento;

criação ou seleção de modelo publicado;

agendamento e atribuição;

login do técnico;

download da inspeção;

início;

resposta do checklist;

foto;

QR Code;

localização;

perda simulada de conectividade;

conclusão offline;

retorno da conectividade;

sincronização sem duplicidade;

visualização administrativa;

aprovação ou reprovação;

atualização no aplicativo;

consulta do histórico mínimo.

# **18 \- Definição de Pronto \- Definition of Done**

## 18\. Definição de Pronto — Definition of Done

### 18.1 DoD de história de usuário

Uma história somente poderá ser marcada como Concluída quando:

#### Requisitos

A história possui critérios de aceitação claros.

As regras de negócio relacionadas foram verificadas.

Dependências foram resolvidas ou explicitamente aceitas.

O comportamento de erro foi definido.

#### Código

O código está no repositório correto.

A implementação foi realizada em branch apropriada.

Existe pull request ou processo equivalente de revisão.

O código passa no lint.

O código passa na verificação de tipos.

Não existem segredos ou credenciais no repositório.

Não existem logs sensíveis.

Não existem erros ou warnings relevantes ignorados sem justificativa.

#### Testes

Os critérios de aceitação foram testados.

Casos principais e ao menos uma exceção relevante foram verificados.

Testes automatizados foram adicionados quando a regra for crítica ou repetível.

Regressões visíveis foram verificadas.

#### Interface

Estado de carregamento foi tratado.

Estado vazio foi tratado quando aplicável.

Estado de erro foi tratado.

A ação em processamento evita envio acidental duplicado.

Mensagens são compreensíveis.

A interface respeita as permissões.

Acessibilidade básica foi verificada.

#### Integração

O contrato da API está implementado ou atualizado.

DTOs de entrada e saída estão coerentes.

Erros esperados são tratados.

A autorização foi validada no backend.

A funcionalidade foi testada no ambiente de integração quando aplicável.

#### Documentação e evidência

README ou documentação relacionada foi atualizada.

OpenAPI foi atualizado quando necessário.

A história possui evidência de funcionamento.

Limitações conhecidas foram registradas.

### 18.2 DoD específico do mobile

Além do DoD geral:

A funcionalidade foi testada em dispositivo ou emulador Android.

O comportamento sem conectividade foi considerado.

Alterações locais relevantes persistem após reinicialização.

Permissões negadas são tratadas.

Dados sensíveis utilizam armazenamento adequado.

Rotas protegidas não ficam acessíveis sem sessão.

A funcionalidade não provoca perda de operações pendentes.

O estado de sincronização é apresentado quando relevante.

### 18.3 DoD específico da interface administrativa

Além do DoD geral:

A rota possui proteção compatível.

A tela usa paginação quando lista dados potencialmente numerosos.

Filtros são coerentes com os parâmetros da API.

Formulários possuem validação visual e no servidor.

A tela não permite ação crítica sem confirmação.

Erros 401, 403, 404, 409 e 422 são tratados de forma adequada.

A interface foi testada em resolução comum de notebook.

### 18.4 DoD específico da API

Além do DoD geral:

Endpoint documentado no OpenAPI.

DTO separado da entidade de persistência.

Validação de entrada implementada.

Autorização implementada.

Regra de negócio testada.

Erro padronizado.

Migração de banco incluída quando necessária.

Restrições críticas também protegidas no banco quando aplicável.

Operação de sincronização testada para repetição quando aplicável.

Logs não expõem conteúdo sensível.

### 18.5 DoD da sprint

Uma sprint somente será concluída quando:

O incremento planejado estiver integrado.

Mobile, admin e API utilizarem o mesmo contrato nos itens entregues.

A demonstração da sprint puder ser executada com dados de teste.

Não houver defeito bloqueador no fluxo principal.

Itens não concluídos retornarem ao backlog com novo planejamento.

O backlog e o status das histórias estiverem atualizados.

Pull requests relevantes estiverem revisados.

Riscos e débitos técnicos estiverem registrados.

A equipe realizar uma revisão curta do incremento.

A equipe registrar ao menos uma ação de melhoria para a próxima sprint.

### 18.6 DoD do MVP

O MVP somente será considerado pronto quando:

O fluxo ponta a ponta descrito em AC-RELEASE funcionar.

A build Android puder ser instalada.

A interface administrativa possuir build executável ou publicada.

A API puder ser executada por instruções documentadas.

O banco puder ser criado por migrações.

Existirem usuários e dados de demonstração.

A autenticação e autorização estiverem funcionais.

O checklist dinâmico estiver integrado.

Fotografia, QR Code e localização funcionarem.

A inspeção puder ser realizada offline após o download.

A sincronização não criar duplicidade no cenário testado.

O supervisor puder aprovar ou reprovar.

A documentação principal estiver atualizada.

Não existirem defeitos críticos conhecidos sem plano de contenção.

### 18.7 Definição de defeitos por severidade

| Severidade | Definição | Conduta |
| ----- | ----- | ----- |
| Crítico | Perda de dados, falha de segurança, impossibilidade de executar o fluxo principal ou duplicidade grave. | Bloqueia a entrega. |
| Alto | Funcionalidade P0 indisponível sem alternativa aceitável. | Deve ser corrigido antes da release. |
| Médio | Problema com alternativa conhecida, sem perda de dados. | Pode ser aceito com registro e plano. |
| Baixo | Problema visual ou melhoria não essencial. | Pode permanecer no backlog. |

# **19 \- Critérios de Avaliação**

## 19\. Critérios de Avaliação

### 19.1 Princípios da avaliação

A avaliação deverá considerar tanto o produto entregue quanto a aprendizagem individual. A existência de uma funcionalidade pronta não será suficiente quando o estudante não conseguir explicar as decisões, o fluxo de dados e sua contribuição.

Princípios:

avaliação incremental, não concentrada apenas na última semana;

equilíbrio entre funcionamento, qualidade e compreensão;

evidências por commits, pull requests, testes e demonstrações;

integração real entre as aplicações;

distinção entre nota da equipe e desempenho individual;

valorização da confiabilidade, não apenas da quantidade de telas.

### 19.2 Rubrica integrada do produto — 100 pontos

| Dimensão | Pontos | Evidências esperadas |
| ----- | ----- | ----- |
| Visão, requisitos e aderência ao escopo | 5 | Backlog coerente, histórias e regras atendidas. |
| Arquitetura e organização | 10 | Separação de responsabilidades, estrutura e decisões documentadas. |
| Aplicativo mobile | 20 | Navegação, checklist, estados, persistência e experiência de campo. |
| Recursos nativos | 10 | Câmera, QR Code, localização e permissões. |
| Offline e sincronização | 15 | SQLite, outbox, idempotência, falhas e estado visível. |
| Interface administrativa | 10 | Cadastros, modelos, planejamento, acompanhamento e revisão. |
| API, regras e modelo de dados | 15 | Segurança, validações, endpoints, persistência e documentação. |
| Testes, segurança e qualidade | 7 | Testes críticos, lint, tratamento de erros e ausência de segredos. |
| Documentação e processo | 4 | README, OpenAPI, backlog, PRs e evidências. |
| Demonstração e defesa técnica | 4 | Fluxo ponta a ponta e explicação individual. |
| Total | 100 |  |

### 19.3 Rubrica para a disciplina de Expo — 100 pontos

Considerando que a disciplina possui 2 aulas semanais de conteúdo e 3 de projeto:

| Dimensão | Pontos | Critérios |
| ----- | ----- | ----- |
| Avaliações individuais de conteúdo | 25 | TypeScript, navegação, dados, formulários, recursos nativos, SQLite e sincronização. |
| Fundação e arquitetura mobile | 10 | Estrutura, rotas, componentes, tipos e organização. |
| Integração, sessão e dados remotos | 10 | API, autenticação, erros, cache e listas. |
| Checklist dinâmico | 15 | Renderização, validação, progresso e persistência. |
| Recursos nativos | 15 | Câmera, QR Code, localização e permissões. |
| Offline e sincronização | 15 | SQLite, outbox, idempotência no cliente e recuperação de falhas. |
| Testes, acessibilidade e performance | 5 | Casos críticos, qualidade de uso e otimização. |
| Build, documentação e defesa | 5 | Build Android, README e explicação da contribuição. |
| Total | 100 |  |

### 19.4 Rubrica para Java/Spring Boot — 100 pontos

| Dimensão | Pontos |
| ----- | ----- |
| Modelagem do domínio e banco | 15 |
| API REST e DTOs | 15 |
| Autenticação e autorização | 15 |
| Regras de negócio e transições | 15 |
| Modelos versionados e snapshots | 10 |
| Sincronização e idempotência | 10 |
| Upload, evidências e auditoria | 5 |
| Testes automatizados | 8 |
| OpenAPI, execução e documentação | 5 |
| Defesa individual | 2 |
| Total | 100 |

### 19.5 Rubrica para a interface administrativa — 100 pontos

| Dimensão | Pontos |
| ----- | ----- |
| Arquitetura Angular e organização | 10 |
| Autenticação, guards e autorização visual | 10 |
| Cadastros e formulários | 15 |
| Construtor de modelos | 20 |
| Planejamento e acompanhamento | 15 |
| Revisão, aprovação e reprovação | 15 |
| Estados de interface, acessibilidade e responsividade | 5 |
| Testes e qualidade | 5 |
| Build, documentação e defesa | 5 |
| Total | 100 |

### 19.6 Avaliação por marcos

| Marco | Peso sugerido no projeto | Critério principal |
| ----- | ----- | ----- |
| M1 — Fundação | 5% | Projetos executáveis e organizados. |
| M2 — Autenticação | 10% | Sessão integrada e autorização. |
| M3 — Planejamento | 10% | Modelo e inspeção criados pela web. |
| M4 — Execução online | 15% | Checklist dinâmico e respostas. |
| M5 — Recursos nativos | 15% | Foto, QR Code e localização. |
| M6 — Offline | 20% | Persistência e sincronização confiável. |
| M7 — Revisão | 10% | Aprovação, reprovação e correção. |
| M8 — Release | 15% | Integração final, build, documentação e defesa. |
| Total | 100% |  |

### 19.7 Componente individual

A nota individual poderá considerar:

avaliação prática ou teórica;

explicação oral de uma parte do código;

histórico de commits;

pull requests abertos e revisados;

capacidade de reproduzir e corrigir um defeito;

compreensão da integração com a API;

participação nas demonstrações;

cumprimento das responsabilidades assumidas.

A quantidade de commits não deverá ser utilizada isoladamente. Serão considerados relevância, qualidade, autoria real e capacidade de explicar a contribuição.

### 19.8 Evidências obrigatórias por equipe

URL dos repositórios;

backlog atualizado;

pull requests principais;

README de cada aplicação;

instruções de execução;

OpenAPI;

esquema ou diagrama de dados;

build Android;

build ou URL da interface administrativa;

ambiente ou contêiner da API;

usuários de demonstração;

roteiro da demonstração;

registro dos testes principais;

lista de limitações conhecidas.

### 19.9 Penalidades técnicas sugeridas

Poderão reduzir a avaliação:

credenciais ou segredos no repositório;

perda de dados não sincronizados;

ausência de autorização no backend;

duplicidade causada por reenvio previsível;

uso do Swagger ou banco como substituto da interface administrativa no fluxo final;

telas estáticas apresentadas como integração concluída;

alteração manual de banco durante a demonstração;

funcionalidades copiadas sem compreensão;

ausência de histórico ou evidências de participação;

impossibilidade de executar o projeto a partir da documentação.

### 19.10 Bônus ou diferenciais

Após a conclusão estável do MVP, poderão ser valorizados:

notificações push;

relatório PDF;

assinatura;

biometria;

dashboard avançado;

acessibilidade ampliada;

testes ponta a ponta;

monitoramento;

deploy automatizado;

resolução assistida de conflitos;

portal do cliente;

solução criativa validada com usuários.

Funcionalidades adicionais não compensam falhas graves no fluxo principal, na segurança ou na preservação dos dados offline.

# **20 \- Anexo A \- Checklist executivo do projeto**

## Anexo A — Checklist executivo do projeto

### Produto

Visão e escopo compreendidos pela equipe.

Personas e perfis definidos.

MVP separado das funcionalidades futuras.

Backlog priorizado.

Dependências entre disciplinas identificadas.

### Mobile

Login e sessão.

Lista e detalhe.

Checklist dinâmico.

Câmera.

QR Code.

Localização.

SQLite.

Outbox.

Sincronização.

Build Android.

### Administrativo

Login e guards.

Usuários.

Clientes, locais e equipamentos.

Modelos e versões.

Agendamento e atribuição.

Acompanhamento.

Revisão.

Aprovação e reprovação.

Build web.

### Backend

Autenticação e autorização.

Migrações.

Cadastros.

Modelos e snapshot.

Inspeções e estados.

Respostas.

Evidências.

Não conformidades.

Sincronização idempotente.

Revisão e auditoria.

OpenAPI.

### Entrega

Fluxo ponta a ponta testado.

Dados de demonstração.

READMEs atualizados.

Limitações registradas.

Evidências de participação.

Apresentação preparada.

# **20 \- Anexo B \- Decisões de escopo consolidadas**

# **Anexo B — Decisões de escopo consolidadas**

1. O produto possui três aplicações: mobile, administrativa web e API REST.  
2. A interface administrativa faz parte do MVP e não será substituída pelo Swagger.  
3. O mobile é prioritariamente Android.  
4. O aplicativo deverá operar offline após baixar uma inspeção.  
5. O SQLite é persistência operacional, não cache descartável.  
6. A sincronização utilizará operações idempotentes.  
7. O modelo de inspeção será versionado.  
8. Cada inspeção preservará um snapshot dos itens.  
9. O MVP terá um técnico responsável por inspeção.  
10. O portal do cliente ficará fora do MVP.  
11. Fotografias serão a evidência principal.  
12. QR Code e localização serão recursos obrigatórios do projeto mobile.  
13. A coleta de localização será pontual.  
14. A revisão será realizada pela interface administrativa.  
15. As 16 semanas efetivas são o limite para planejamento do MVP.  
16. As semanas institucionais restantes não serão consideradas reserva de desenvolvimento.  
17. A avaliação combinará produto da equipe e domínio individual.

# **21 \- Anexo C \- Exemplo de Ficha de Inspeção**

## Ficha de Inspeção de Equipamento

### 1\. Identificação da inspeção

| Campo | Informação |
| ----- | ----- |
| Código da inspeção | INS-2026-00045 |
| Tipo de inspeção | Inspeção preventiva mensal |
| Status | Em andamento |
| Data da inspeção | 03/08/2026 |
| Horário de início | 09:15 |
| Horário de término | 10:05 |
| Inspetor responsável | Carlos Henrique Silva |
| Empresa responsável | FieldOps Serviços Técnicos |
| Ordem de serviço | OS-2026-0187 |

### 2\. Template aplicado

| Campo | Informação |
| ----- | ----- |
| Nome do template | Inspeção Preventiva de Compressor de Ar |
| Código do template | TPL-COMP-PREV |
| Versão aplicada | 3.0 |
| Identificador da versão | TPL-COMP-PREV-V3 |
| Data de publicação | 15/07/2026 |
| Status da versão | Publicada |
| Tipo de equipamento associado | Compressor de ar |
| Total de seções | 4 |
| Total de itens | 12 |

A inspeção permanece vinculada à versão 3.0, mesmo que uma nova versão do template seja publicada posteriormente.

### 3\. Dados do cliente

| Campo | Informação |
| ----- | ----- |
| Cliente | Indústria Modelo Ltda. |
| CNPJ | 12.345.678/0001-90 |
| Unidade | Unidade Sorocaba |
| Responsável local | Ana Paula Ferreira |
| Telefone | (15) 99999-9999 |
| E-mail | ana.ferreira@empresa.com.br |

### 4\. Local da inspeção

| Campo | Informação |
| ----- | ----- |
| Local | Galpão de Produção 02 |
| Setor | Linha de Montagem |
| Endereço | Avenida Industrial, 1000 – Sorocaba/SP |
| Ponto de referência | Próximo ao quadro elétrico principal |
| Coordenadas | \-23.5015, \-47.4526 |

### 5\. Equipamento inspecionado

| Campo | Informação |
| ----- | ----- |
| Equipamento | Compressor de ar |
| Tipo de equipamento | Compressor de ar |
| Código interno | COMP-004 |
| Fabricante | Atlas Modelo |
| Modelo | XPTO 500 |
| Número de série | SN-458796 |
| Ano de fabricação | 2021 |
| Data da última manutenção | 10/05/2026 |
| Horímetro | 3.845 horas |
| Situação operacional | Em funcionamento |

## 6\. Checklist de inspeção

### 6.1 Condições gerais

#### Item 1 — Identificação do equipamento

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-GER-001 |
| Snapshot do item | SNAP-INS-00045-001 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |
| Evidência obrigatória | Sim |

Pergunta: A placa de identificação está presente, legível e fixada corretamente?

~~Conforme~~

Não conforme

Não aplicável

Não foi possível verificar

Observação: Placa presente e com todas as informações legíveis.

Evidência registrada: EVD-001 — Fotografia da placa de identificação.

#### Item 2 — Limpeza e conservação

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-GER-002 |
| Snapshot do item | SNAP-INS-00045-002 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |
| Evidência em caso de não conformidade | Obrigatória |

Pergunta: O equipamento apresenta condições adequadas de limpeza e conservação?

Conforme

~~Não conforme~~

Não aplicável

Não foi possível verificar

Observação: Foi identificado acúmulo de óleo e poeira próximo à base do equipamento.

Classificação da não conformidade: Leve.

Evidência registrada: EVD-002 — Fotografia da região com acúmulo de resíduos.

#### Item 3 — Estrutura externa

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-GER-003 |
| Snapshot do item | SNAP-INS-00045-003 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |

Pergunta: A estrutura externa está livre de trincas, deformações ou corrosão?

~~Conforme~~

Não conforme

Não aplicável

Não foi possível verificar

Observação: Não foram identificados danos estruturais aparentes.

### 6.2 Segurança

#### Item 4 — Proteções mecânicas

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-SEG-001 |
| Snapshot do item | SNAP-INS-00045-004 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |

Pergunta: As proteções das partes móveis estão instaladas e fixadas corretamente?

~~Conforme~~

Não conforme

Não aplicável

Não foi possível verificar

Observação: Todas as proteções estavam instaladas e sem folgas.

#### Item 5 — Sinalização de segurança

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-SEG-002 |
| Snapshot do item | SNAP-INS-00045-005 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |
| Evidência em caso de não conformidade | Obrigatória |

Pergunta: As etiquetas e sinalizações de advertência estão visíveis e legíveis?

Conforme

~~Não conforme~~

Não aplicável

Não foi possível verificar

Observação: A etiqueta de risco elétrico está parcialmente apagada.

Classificação da não conformidade: Moderada.

Ação recomendada: Substituir a etiqueta de advertência.

Evidência registrada: EVD-003 — Fotografia da etiqueta danificada.

#### Item 6 — Botão de emergência

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-SEG-003 |
| Snapshot do item | SNAP-INS-00045-006 |
| Tipo de resposta | Seleção única com teste |
| Resposta obrigatória | Sim |
| Teste obrigatório | Sim |

Pergunta: O botão de parada de emergência está acessível e funcionando corretamente?

~~Conforme~~

Não conforme

Não aplicável

Não foi possível verificar

Teste realizado: Acionamento do botão durante operação controlada.

Resultado: O equipamento foi desligado imediatamente.

### 6.3 Sistema elétrico

#### Item 7 — Cabos e conexões

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-ELE-001 |
| Snapshot do item | SNAP-INS-00045-007 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |
| Evidência em caso de não conformidade | Obrigatória |
| Gera bloqueio operacional | Sim |

Pergunta: Os cabos elétricos estão íntegros, organizados e sem condutores expostos?

Conforme

~~Não conforme~~

Não aplicável

Não foi possível verificar

Observação: Um cabo de alimentação apresenta desgaste na cobertura externa.

Classificação da não conformidade: Crítica.

Ação imediata: Isolar o equipamento até a substituição do cabo.

Evidência registrada: EVD-004 — Fotografia do cabo elétrico.

#### Item 8 — Painel elétrico

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-ELE-002 |
| Snapshot do item | SNAP-INS-00045-008 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |

Pergunta: O painel elétrico está fechado, identificado e sem sinais de aquecimento?

~~Conforme~~

Não conforme

Não aplicável

Não foi possível verificar

Observação: Painel em condições normais, sem sinais visíveis de superaquecimento.

#### Item 9 — Aterramento

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-ELE-003 |
| Snapshot do item | SNAP-INS-00045-009 |
| Tipo de resposta | Medição numérica |
| Unidade | Ω |
| Resposta obrigatória | Sim |
| Valor mínimo | 0 Ω |
| Valor máximo | 10 Ω |

Pergunta: Qual é a resistência medida no sistema de aterramento?

Valor medido: 4,2 Ω.

Limite estabelecido: Até 10 Ω.

Resultado calculado: Conforme.

### 6.4 Funcionamento

#### Item 10 — Ruídos e vibrações

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-FUN-001 |
| Snapshot do item | SNAP-INS-00045-010 |
| Tipo de resposta | Seleção única |
| Resposta obrigatória | Sim |
| Evidência em caso de não conformidade | Obrigatória |

Pergunta: O equipamento opera sem ruídos ou vibrações anormais?

Conforme

~~Não conforme~~

Não aplicável

Não foi possível verificar

Observação: Foi observado aumento de vibração durante o funcionamento em carga máxima.

Classificação da não conformidade: Moderada.

Ação recomendada: Verificar alinhamento, rolamentos e elementos de fixação.

Evidência registrada: EVD-005 — Vídeo do equipamento em funcionamento.

#### Item 11 — Pressão de operação

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-FUN-002 |
| Snapshot do item | SNAP-INS-00045-011 |
| Tipo de resposta | Medição numérica |
| Unidade | bar |
| Resposta obrigatória | Sim |
| Valor mínimo | 7 bar |
| Valor máximo | 8 bar |

Pergunta: Qual é a pressão de operação do equipamento?

Valor medido: 7,8 bar.

Faixa permitida: Entre 7 e 8 bar.

Resultado calculado: Conforme.

#### Item 12 — Temperatura de operação

| Campo | Informação |
| ----- | ----- |
| Código do item no template | COMP-FUN-003 |
| Snapshot do item | SNAP-INS-00045-012 |
| Tipo de resposta | Medição numérica |
| Unidade | °C |
| Resposta obrigatória | Sim |
| Valor máximo | 85 °C |

Pergunta: Qual é a temperatura do equipamento durante a operação?

Valor medido: 72 °C.

Limite permitido: Até 85 °C.

Resultado calculado: Conforme.

## 7\. Não conformidades identificadas

### NC-001 — Acúmulo de óleo e resíduos

| Campo | Informação |
| ----- | ----- |
| Item relacionado | Item 2 — Limpeza e conservação |
| Código do item | COMP-GER-002 |
| Snapshot relacionado | SNAP-INS-00045-002 |
| Severidade | Leve |
| Descrição | Acúmulo de óleo e poeira na base do equipamento |
| Risco associado | Queda, contaminação e dificuldade de identificação de vazamentos |
| Ação corretiva | Limpar a área e verificar a existência de vazamento |
| Responsável | Equipe de manutenção |
| Prazo | 05/08/2026 |
| Status | Aberta |

### NC-002 — Etiqueta de segurança danificada

| Campo | Informação |
| ----- | ----- |
| Item relacionado | Item 5 — Sinalização de segurança |
| Código do item | COMP-SEG-002 |
| Snapshot relacionado | SNAP-INS-00045-005 |
| Severidade | Moderada |
| Descrição | Etiqueta de risco elétrico parcialmente ilegível |
| Risco associado | Falha na comunicação do risco aos operadores |
| Ação corretiva | Substituir a etiqueta |
| Responsável | Técnico de segurança |
| Prazo | 07/08/2026 |
| Status | Aberta |

### NC-003 — Cabo elétrico danificado

| Campo | Informação |
| ----- | ----- |
| Item relacionado | Item 7 — Cabos e conexões |
| Código do item | COMP-ELE-001 |
| Snapshot relacionado | SNAP-INS-00045-007 |
| Severidade | Crítica |
| Descrição | Desgaste na cobertura externa do cabo de alimentação |
| Risco associado | Choque elétrico, curto-circuito ou incêndio |
| Ação imediata | Interromper o uso do equipamento |
| Ação corretiva | Substituir o cabo e realizar novo teste elétrico |
| Responsável | Manutenção elétrica |
| Prazo | Imediato |
| Status | Em tratamento |

### NC-004 — Vibração acima do padrão

| Campo | Informação |
| ----- | ----- |
| Item relacionado | Item 10 — Ruídos e vibrações |
| Código do item | COMP-FUN-001 |
| Snapshot relacionado | SNAP-INS-00045-010 |
| Severidade | Moderada |
| Descrição | Vibração anormal durante operação em carga máxima |
| Risco associado | Desgaste prematuro ou falha mecânica |
| Ação corretiva | Verificar rolamentos, alinhamento e fixação |
| Responsável | Manutenção mecânica |
| Prazo | 06/08/2026 |
| Status | Aberta |

## 8\. Evidências registradas

| Evidência | Item relacionado | Tipo | Descrição |
| ----- | ----- | ----- | ----- |
| EVD-001 | COMP-GER-001 | Fotografia | Placa de identificação do equipamento |
| EVD-002 | COMP-GER-002 | Fotografia | Acúmulo de óleo próximo à base |
| EVD-003 | COMP-SEG-002 | Fotografia | Etiqueta de risco elétrico danificada |
| EVD-004 | COMP-ELE-001 | Fotografia | Cabo elétrico com desgaste |
| EVD-005 | COMP-FUN-001 | Vídeo | Vibração durante operação em carga máxima |
| EVD-006 | COMP-ELE-003 | Documento | Relatório de medição do aterramento |

## 9\. Resultado da inspeção

### Resumo

| Resultado | Quantidade |
| ----- | ----- |
| Itens conformes | 8 |
| Itens não conformes | 4 |
| Itens não aplicáveis | 0 |
| Itens não verificados | 0 |
| Total de itens | 12 |

Percentual de conformidade: 66,7%

### Classificação final

Aprovado

~~Aprovado com restrições~~

Reprovado

Inspeção incompleta

### Parecer do inspetor

O equipamento apresenta condições gerais satisfatórias, porém foi identificada uma não conformidade crítica relacionada ao cabo de alimentação.

O equipamento deve permanecer fora de operação até que o cabo seja substituído e uma nova verificação elétrica seja realizada.

Também deverão ser corrigidas as não conformidades relacionadas à sinalização de segurança, à limpeza da base e à vibração durante a operação.

## 10\. Rastreabilidade do template

| Campo | Informação |
| ----- | ----- |
| Template aplicado | Inspeção Preventiva de Compressor de Ar |
| Código do template | TPL-COMP-PREV |
| Versão aplicada | 3.0 |
| Identificador da versão | TPL-COMP-PREV-V3 |
| Quantidade de itens copiados | 12 |
| Data de criação dos snapshots | 03/08/2026 às 09:15 |
| Alterações posteriores permitidas | Não |
| Integridade dos snapshots | Validada |

Cada item apresentado nesta inspeção foi copiado da versão do template vigente no momento da abertura da inspeção.

Os snapshots preservam:

o código do item;

o título;

a pergunta;

o tipo de resposta;

as opções disponíveis;

a unidade de medida;

os valores mínimos e máximos;

as regras de obrigatoriedade;

os critérios de conformidade;

as exigências de evidência;

a ordem do item;

a seção de origem.

## 11\. Próximas ações

| Ação | Responsável | Prazo | Status |
| ----- | ----- | ----- | ----- |
| Substituir o cabo de alimentação | Manutenção elétrica | Imediato | Pendente |
| Realizar nova inspeção elétrica | Inspetor responsável | Após o reparo | Pendente |
| Substituir a etiqueta de advertência | Técnico de segurança | 07/08/2026 | Pendente |
| Limpar a base do equipamento | Manutenção | 05/08/2026 | Pendente |
| Verificar vibração e alinhamento | Manutenção mecânica | 06/08/2026 | Pendente |

## 12\. Assinaturas

### Inspetor

Nome: Carlos Henrique Silva

Data: 03/08/2026

Assinatura: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

### Responsável pelo local

Nome: Ana Paula Ferreira

Data: 03/08/2026

Assinatura: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

### Revisor da inspeção

Nome: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Data: //\_\_\_\_\_\_\_\_

Decisão:

Aprovada

Devolvida para correção

Necessita de nova inspeção

Comentários do revisor:

# **22 Anexo D \- Diagrama de Classe**

**![][image77]**

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image20]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image21]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image22]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image23]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image24]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image25]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image26]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image27]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image28]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image29]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image30]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image31]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image32]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image33]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image34]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image35]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image36]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image37]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image38]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image39]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image40]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image41]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image42]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image43]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image44]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image45]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image46]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image47]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image48]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image49]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image50]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image51]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image52]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image53]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image54]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image55]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image56]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image57]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image58]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image59]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image60]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image61]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image62]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image63]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image64]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image65]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image66]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image67]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image68]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image69]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image70]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image71]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image72]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image73]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image74]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image75]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image76]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPAQMAAAABGAcJAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABBJREFUeF5j/P+fiYGBSAQAWXkCHBoII68AAAAASUVORK5CYII=>

[image77]: <data:image/png;base64,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>