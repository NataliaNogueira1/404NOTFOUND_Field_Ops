
01 - Visão Geral
1. Visão Geral
1.1 Nome do produto
FieldOps — Plataforma de Inspeção em Campo
1.2 Resumo executivo
O FieldOps é uma plataforma digital para planejamento, execução, acompanhamento e revisão de inspeções técnicas realizadas em campo.
A solução substituirá processos baseados em formulários impressos, planilhas, mensagens e registros informais por um fluxo digital integrado. Técnicos utilizarão um aplicativo mobile para consultar as inspeções atribuídas, identificar equipamentos, responder checklists, registrar evidências e concluir atividades, inclusive em locais sem conexão com a internet.
Administradores e supervisores utilizarão uma interface administrativa web para cadastrar informações, criar modelos de inspeção, agendar atividades, atribuir técnicos, acompanhar a execução, analisar não conformidades e aprovar ou reprovar os resultados.
Uma API REST centralizará as regras de negócio, a autenticação, a autorização, a persistência, a auditoria e a integração entre o aplicativo mobile e a interface administrativa.
1.3 Declaração da visão do produto
Para organizações que precisam executar inspeções técnicas de forma padronizada e rastreável, o FieldOps é uma plataforma integrada que permite planejar, executar e revisar inspeções em campo, mesmo sem conexão com a internet. Diferentemente de formulários em papel, planilhas ou aplicativos genéricos, o FieldOps conecta o trabalho do técnico à gestão administrativa, preservando evidências, histórico, localização e regras de negócio em um único fluxo digital.
1.4 Componentes da solução
A solução será composta por quatro componentes principais:
Aplicativo mobile
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
Interface administrativa web
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
API REST
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
Infraestrutura de dados
Componente formado pelo banco de dados, armazenamento de arquivos e mecanismos locais do aplicativo.
Elementos principais:
PostgreSQL para os dados centrais;
SQLite para a persistência local no dispositivo;
armazenamento de arquivos compatível com objetos para evidências;
logs e registros de auditoria;
ambientes separados de desenvolvimento, teste e produção.
1.5 Escopo do produto
O FieldOps cobrirá o fluxo compreendido entre a preparação de uma inspeção e sua aprovação final:
Configuração administrativa ↓ Criação do modelo de inspeção ↓ Agendamento e atribuição ↓ Disponibilização ao técnico ↓ Execução em campo ↓ Registro de respostas e evidências ↓ Sincronização ↓ Revisão do supervisor ↓ Aprovação ou solicitação de correção
​
1.6 Escopo do MVP
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
1.7 Fora do escopo do MVP
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
1.8 Premissas
A primeira versão terá o Android como plataforma mobile prioritária.
O aplicativo poderá ser executado também em outros ambientes suportados pelo Expo, mas a validação obrigatória ocorrerá em Android.
O sistema será utilizado inicialmente por uma organização operadora que presta inspeções para vários clientes.
Cada inspeção terá um técnico responsável no MVP.
O supervisor será responsável pela revisão do resultado.
O equipamento poderá ser identificado por um QR Code único.
As inspeções serão baseadas em modelos previamente configurados.
O aplicativo deverá preservar dados não sincronizados mesmo após ser fechado.
A API será o sistema oficial de registro após a sincronização.
1.9 Glossário inicial
Termo
Definição
Cliente
Organização atendida pela empresa que executa as inspeções.
Local
Unidade, planta, prédio, setor ou área pertencente a um cliente.
Equipamento
Ativo físico que poderá ser inspecionado.
Modelo de inspeção
Estrutura reutilizável que define seções, itens e tipos de resposta.
Inspeção
Instância agendada de um modelo para um local ou equipamento.
Checklist
Conjunto de itens que devem ser respondidos durante a inspeção.
Evidência
Arquivo ou registro que comprova uma resposta ou ocorrência.
Não conformidade
Situação identificada que não atende a um requisito esperado.
Sincronização
Processo de troca de alterações entre o dispositivo e o servidor.
Snapshot
Cópia imutável do modelo utilizada por uma inspeção específica.
Outbox
Fila local de operações que aguardam envio ao servidor.
MVP
Menor versão capaz de demonstrar o fluxo de valor principal.




02 - Objetivos
2. Objetivos
2.1 Objetivo geral do produto
Desenvolver uma plataforma integrada que permita configurar, planejar, executar, sincronizar, revisar e auditar inspeções técnicas em campo de forma padronizada, segura e rastreável.
2.2 Objetivos específicos de negócio
Reduzir o uso de formulários em papel e planilhas isoladas.
Padronizar a execução das inspeções por meio de modelos e checklists.
Diminuir a perda e o preenchimento incompleto de informações.
Permitir que supervisores acompanhem o andamento das atividades.
Associar respostas a evidências, data, usuário, equipamento e localização.
Preservar a rastreabilidade das alterações.
Permitir a execução de inspeções em locais sem conectividade.
Reduzir o intervalo entre a execução em campo e a disponibilidade do resultado.
Facilitar a identificação e o acompanhamento de não conformidades.
2.3 Objetivos específicos do aplicativo mobile
Disponibilizar ao técnico apenas as inspeções relacionadas ao seu trabalho.
Apresentar uma interface adequada ao uso em campo.
Carregar checklists dinamicamente a partir da API.
Capturar fotos, QR Code e localização mediante autorização.
Armazenar localmente inspeções e respostas.
Exibir claramente o estado de sincronização.
Evitar a perda de dados em caso de falha de rede ou fechamento do aplicativo.
Permitir retomada de uma inspeção em andamento.
2.4 Objetivos específicos da interface administrativa
Permitir que operações administrativas sejam realizadas sem acesso direto ao banco ou ao Swagger.
Centralizar o cadastro de clientes, locais, equipamentos e usuários.
Permitir a criação e manutenção de modelos de inspeção.
Agendar e atribuir inspeções aos técnicos.
Acompanhar o status das inspeções.
Apresentar respostas, evidências e não conformidades de maneira organizada.
Permitir aprovação, reprovação e solicitação de correção.
Fornecer indicadores básicos para supervisão.
2.5 Objetivos específicos da API
Disponibilizar um contrato REST versionado e documentado.
Implementar autenticação e autorização por perfil.
Centralizar e validar as regras de negócio.
Manter consistência entre mobile, web e banco de dados.
Disponibilizar operações idempotentes para sincronização.
Evitar duplicidade de registros em reenvios.
Registrar auditoria das operações relevantes.
Tratar erros de forma padronizada.
2.6 Objetivos acadêmicos
O projeto deverá permitir que os estudantes apliquem, de maneira integrada:
Desenvolvimento mobile
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
Desenvolvimento backend
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
Desenvolvimento web administrativo
Angular/React e TypeScript;
rotas protegidas;
formulários;
consumo de API;
componentes reutilizáveis;
tabelas, filtros e paginação;
tratamento de estados de carregamento, vazio e erro;
revisão de inspeções e visualização de evidências.
Engenharia de software
levantamento e refinamento de requisitos;
backlog e critérios de aceitação;
Git e pull requests;
separação de responsabilidades;
integração entre equipes;
revisão de código;
testes;
documentação técnica;
demonstrações incrementais.
2.7 Indicadores de sucesso do MVP
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
2.8 Não objetivos
O projeto não tem como objetivo, no MVP:
substituir sistemas corporativos completos de manutenção;
garantir conformidade com todas as normas de todos os setores industriais;
realizar diagnóstico automático;
controlar equipes em tempo real;
suportar volume corporativo de milhões de inspeções;
oferecer todas as funcionalidades de um produto comercial pronto para venda.

04 - Personas
4. Personas
As personas são representações fictícias utilizadas para orientar decisões de produto. Elas não representam pessoas reais.
4.1 Carlos — Técnico de campo
Atributo
Descrição
Idade
34 anos
Contexto
Realiza inspeções em equipamentos instalados em diferentes locais.
Dispositivo
Smartphone Android corporativo ou pessoal.
Ambiente
Campo, indústria, áreas externas e locais com internet instável.
Frequência de uso
Diária.

Objetivos
localizar rapidamente as inspeções do dia;
entender o que deve ser verificado;
registrar respostas com poucos passos;
anexar fotos ao item correto;
continuar trabalhando sem internet;
saber se os dados já foram enviados;
evitar retornar ao local para completar informações esquecidas.
Dores
formulários longos e pouco claros;
campos que exigem digitação excessiva;
perda de informações;
dificuldade para encontrar o equipamento correto;
fotografias sem identificação;
mensagens de erro técnicas;
dúvidas sobre sincronização.
Necessidades de experiência
botões e áreas de toque adequados;
feedback imediato;
progresso do checklist;
indicação de obrigatoriedade;
salvamento automático local;
mensagens objetivas;
funcionamento previsível em rede instável.
Critério de sucesso
Carlos considera o produto útil quando consegue concluir uma inspeção sem papel, sem perder respostas e sem precisar organizar as evidências manualmente depois.
4.2 Marina — Supervisora de inspeções
Atributo
Descrição
Idade
41 anos
Contexto
Planeja e acompanha o trabalho de vários técnicos.
Dispositivo
Notebook ou desktop.
Ambiente
Escritório ou operação administrativa.
Frequência de uso
Diária.

Objetivos
criar e reutilizar modelos;
atribuir inspeções;
acompanhar prazos e status;
visualizar respostas e fotografias;
identificar não conformidades;
aprovar ou solicitar correções;
manter um histórico confiável.
Dores
informações recebidas por vários canais;
atrasos descobertos somente no final;
evidências sem contexto;
dificuldade para saber qual versão do formulário foi utilizada;
necessidade de solicitar complementos;
falta de indicadores.
Necessidades de experiência
painel com prioridades;
filtros eficientes;
visualização clara do progresso;
revisão item a item;
histórico de ações;
confirmação antes de decisões irreversíveis.
Critério de sucesso
Marina considera o produto útil quando consegue planejar, acompanhar e revisar uma inspeção sem utilizar planilhas paralelas.
4.3 Ana — Administradora do sistema
Atributo
Descrição
Idade
38 anos
Contexto
Mantém cadastros, usuários e permissões.
Dispositivo
Notebook ou desktop.
Frequência de uso
Semanal ou conforme necessidade.

Objetivos
cadastrar usuários corretamente;
controlar perfis e situação de acesso;
evitar duplicidades;
manter clientes, locais e equipamentos atualizados;
consultar histórico de alterações relevantes.
Dores
cadastros distribuídos;
permissões inconsistentes;
necessidade de solicitar alterações à equipe técnica;
dificuldade para inativar registros sem perder histórico.
Necessidades de experiência
formulários validados;
pesquisa e filtros;
inativação em vez de exclusão destrutiva;
mensagens de erro compreensíveis;
confirmação de operações críticas.
Critério de sucesso
Ana considera o produto útil quando consegue manter os dados centrais sem acessar diretamente a infraestrutura técnica.
4.4 Roberto — Responsável do cliente
Atributo
Descrição
Idade
47 anos
Contexto
Acompanha inspeções realizadas em sua unidade.
Dispositivo
Notebook, tablet ou smartphone.
Frequência de uso
Eventual.

Objetivos
consultar o resultado das inspeções;
visualizar evidências;
entender não conformidades;
acompanhar o estado das correções;
obter um registro confiável.
Dores
relatórios atrasados;
informações técnicas pouco organizadas;
dificuldade para localizar evidências;
falta de transparência sobre pendências.
Necessidades de experiência
acesso somente leitura;
linguagem clara;
filtros por local, equipamento e período;
visualização organizada do resultado.
Critério de sucesso
Roberto considera o produto útil quando consegue compreender o resultado e as pendências sem solicitar arquivos por e-mail.
Decisão de escopo: o perfil Cliente poderá existir no modelo de autorização, mas seu portal completo será tratado como funcionalidade futura. No MVP, o supervisor poderá apresentar ou exportar os resultados.

05 - Perfis de Usuário
5. Perfis de Usuário
5.1 Perfis previstos
Administrador — ADMIN
Supervisor — SUPERVISOR
Técnico — TECHNICIAN
Cliente somente leitura — CLIENT_VIEWER — futuro ou opcional
5.2 Matriz de permissões
Funcionalidade
Administrador
Supervisor
Técnico
Cliente
Acessar interface administrativa
​
​
Opcional
Futuro
Acessar aplicativo de campo
Opcional
Opcional
​
​
Gerenciar usuários
​
​
​
​
Gerenciar perfis
​
​
​
​
Cadastrar clientes
​
​
​
​
Cadastrar locais
​
​
​
​
Cadastrar equipamentos
​
​
Consulta
Consulta própria
Criar modelos de inspeção
​
​
​
​
Publicar versão de modelo
​
​
​
​
Agendar inspeção
​
​
​
​
Atribuir técnico
​
​
​
​
Consultar todas as inspeções
​
​
​
​
Consultar inspeções atribuídas
​
​
​
​
Iniciar inspeção
​
Opcional
​
​
Responder checklist
​
Opcional
​
​
Registrar evidência
​
Opcional
​
​
Registrar não conformidade
​
Opcional
​
​
Enviar para revisão
​
Opcional
​
​
Revisar inspeção
​
​
​
​
Aprovar ou reprovar
​
​
​
​
Consultar auditoria
​
​
Próprias ações
​
Consultar indicadores
​
​
Próprios
Futuro
Consultar resultado do cliente
​
​
Conforme atribuição
Futuro

5.3 Princípios de autorização
O sistema deverá aplicar o princípio do menor privilégio.
A interface não deverá ser considerada mecanismo suficiente de segurança; as permissões serão validadas pela API.
O técnico somente poderá alterar inspeções atribuídas a ele e em estado compatível.
O supervisor poderá revisar as inspeções pertencentes ao seu escopo operacional.
O administrador gerenciará acesso e cadastros, mas não será automaticamente autorizado a alterar respostas de uma inspeção.
Registros aprovados deverão ser protegidos contra edição comum.
Operações não autorizadas deverão retornar erro padronizado e não revelar dados sensíveis.
5.4 Situação do usuário
Um usuário poderá estar:
ativo;
inativo;
bloqueado temporariamente.
Usuários inativos ou bloqueados não poderão iniciar novas sessões. A inativação não excluirá o histórico relacionado ao usuário.


06 - Casos de Uso
6. Casos de Uso
6.1 Catálogo resumido
ID
Caso de uso
Ator principal
Canal
Prioridade
UC-01
Autenticar usuário
Todos
Mobile/Web
P0
UC-02
Gerenciar usuários
Administrador
Web
P0
UC-03
Gerenciar clientes, locais e equipamentos
Administrador/Supervisor
Web
P0
UC-04
Criar modelo de inspeção
Supervisor
Web
P0
UC-05
Publicar versão do modelo
Supervisor
Web
P0
UC-06
Agendar e atribuir inspeção
Supervisor
Web
P0
UC-07
Baixar inspeções atribuídas
Técnico
Mobile
P0
UC-08
Identificar equipamento por QR Code
Técnico
Mobile
P0
UC-09
Iniciar inspeção
Técnico
Mobile
P0
UC-10
Responder checklist
Técnico
Mobile
P0
UC-11
Registrar evidência
Técnico
Mobile
P0
UC-12
Registrar não conformidade
Técnico
Mobile
P0
UC-13
Concluir inspeção offline
Técnico
Mobile
P0
UC-14
Sincronizar alterações
Técnico/Sistema
Mobile/API
P0
UC-15
Acompanhar inspeções
Supervisor
Web
P0
UC-16
Revisar inspeção
Supervisor
Web
P0
UC-17
Aprovar ou reprovar inspeção
Supervisor
Web
P0
UC-18
Consultar histórico
Administrador/Supervisor
Web
P1
UC-19
Consultar indicadores
Supervisor
Web
P1
UC-20
Consultar resultado como cliente
Cliente
Web
P2

6.2 UC-01 — Autenticar usuário
Ator principal: qualquer usuário ativo.
Pré-condições: usuário cadastrado e ativo.
Gatilho: o usuário informa suas credenciais.
Fluxo principal
O usuário informa e-mail e senha.
A aplicação valida o formato dos campos.
A aplicação envia as credenciais à API.
A API valida o usuário e a senha.
A API retorna tokens e informações mínimas do perfil.
A aplicação armazena a sessão de forma apropriada ao canal.
O usuário é direcionado à área autorizada.
Fluxos alternativos
Credenciais inválidas: exibir mensagem sem informar qual campo está incorreto.
Usuário inativo: negar acesso e orientar contato com a administração.
Falha de rede no mobile: permitir somente o acesso offline quando existir uma sessão previamente válida e dados locais autorizados.
Token expirado: tentar renovação conforme contrato da API.
Pós-condições
Sessão autenticada criada; ou
acesso negado sem alteração indevida de dados.
6.3 UC-04 — Criar modelo de inspeção
Ator principal: supervisor.
Pré-condições: usuário autenticado com permissão.
Gatilho: necessidade de padronizar um tipo de inspeção.
Fluxo principal
O supervisor cria um modelo em estado de rascunho.
Informa título, descrição e categoria.
Cria uma ou mais seções.
Adiciona itens às seções.
Define o tipo de resposta de cada item.
Define obrigatoriedade, regras de evidência e ordem.
Salva o rascunho.
Valida a prévia do checklist.
Publica uma versão do modelo.
Fluxos alternativos
Modelo sem itens: publicação bloqueada.
Item sem tipo de resposta: publicação bloqueada.
Modelo já utilizado: alterações estruturais geram nova versão.
Pós-condições
Uma versão imutável do modelo fica disponível para novas inspeções.
6.4 UC-06 — Agendar e atribuir inspeção
Ator principal: supervisor.
Pré-condições: cliente, local, equipamento, técnico e modelo válidos.
Gatilho: necessidade de executar uma inspeção.
Fluxo principal
O supervisor seleciona o modelo publicado.
Seleciona cliente, local e equipamento, quando aplicável.
Define técnico, prioridade e data prevista.
Informa orientações adicionais.
Confirma o agendamento.
A API cria a inspeção e seu snapshot de itens.
A inspeção fica disponível para sincronização pelo técnico.
Fluxos alternativos
Técnico inativo: operação bloqueada.
Modelo sem versão publicada: operação bloqueada.
Equipamento incompatível com o local: operação bloqueada.
Pós-condições
Inspeção criada em estado atribuído.
6.5 UC-07 — Baixar inspeções atribuídas
Ator principal: técnico.
Pré-condições: sessão válida e conectividade.
Gatilho: atualização manual ou automática dos dados.
Fluxo principal
O aplicativo consulta alterações disponíveis para o técnico.
A API retorna inspeções e dados auxiliares autorizados.
O aplicativo grava os dados em SQLite.
O aplicativo atualiza a data da última sincronização.
As inspeções ficam disponíveis offline.
Fluxos alternativos
Falha parcial: manter dados anteriores e registrar o erro.
Inspeção cancelada no servidor: atualizar o estado local sem apagar respostas pendentes de forma silenciosa.
Pós-condições
Base local atualizada ou preservada em caso de falha.
6.6 UC-08 — Identificar equipamento por QR Code
Ator principal: técnico.
Pré-condições: permissão de câmera concedida e equipamento com código cadastrado.
Gatilho: técnico inicia a leitura.
Fluxo principal
O aplicativo solicita ou verifica a permissão da câmera.
O técnico aponta a câmera para o QR Code.
O aplicativo lê o identificador.
O aplicativo procura o equipamento na base local.
Quando necessário e possível, consulta a API.
Exibe os dados do equipamento.
O técnico confirma o vínculo com a inspeção.
Fluxos alternativos
Código desconhecido: informar que o equipamento não foi localizado.
Equipamento diferente do previsto: solicitar confirmação ou bloquear conforme regra da inspeção.
Permissão negada: disponibilizar identificação manual quando permitido.
6.7 UC-09 — Iniciar inspeção
Ator principal: técnico.
Pré-condições: inspeção atribuída ao técnico e disponível localmente.
Gatilho: seleção da ação “Iniciar inspeção”.
Fluxo principal
O aplicativo apresenta os dados principais.
O técnico confirma o início.
O aplicativo registra data e hora do dispositivo.
Solicita a localização, quando prevista.
Altera o estado local para em andamento.
Registra a operação na outbox.
Apresenta o checklist.
Fluxos alternativos
Inspeção cancelada: início bloqueado após atualização do estado.
Localização negada: continuar somente se a política da inspeção permitir.
6.8 UC-10 — Responder checklist
Ator principal: técnico.
Pré-condições: inspeção em andamento.
Gatilho: abertura de uma seção ou item.
Fluxo principal
O aplicativo apresenta as seções e os itens do snapshot.
Renderiza o componente adequado ao tipo de resposta.
O técnico informa a resposta.
O aplicativo valida o valor.
A resposta é salva imediatamente no banco local.
O progresso é atualizado.
A operação pendente é registrada para sincronização.
Fluxos alternativos
Resposta não conforme: exigir observação quando configurado.
Item crítico: exigir evidência quando aplicável.
Valor inválido: impedir o avanço e apresentar orientação.
6.9 UC-11 — Registrar evidência
Ator principal: técnico.
Pré-condições: permissão de câmera ou arquivos e inspeção editável.
Gatilho: ação de adicionar evidência.
Fluxo principal
O técnico escolhe capturar foto ou selecionar imagem.
O aplicativo obtém a imagem.
Exibe uma prévia.
O técnico confirma ou refaz a captura.
O aplicativo associa a evidência à inspeção, resposta ou não conformidade.
O arquivo é armazenado localmente.
A evidência é adicionada à fila de sincronização.
Fluxos alternativos
Arquivo excede o limite: informar e permitir nova captura.
Falha no envio: manter o arquivo local e marcar como pendente.
Exclusão antes da sincronização: remover localmente e cancelar a operação pendente.
6.10 UC-12 — Registrar não conformidade
Ator principal: técnico.
Pré-condições: inspeção em andamento.
Gatilho: identificação de problema ou resposta configurada como não conforme.
Fluxo principal
O técnico seleciona ou confirma a criação da não conformidade.
Informa título, descrição e criticidade.
Adiciona evidências quando necessário.
O aplicativo valida os campos.
Salva o registro localmente.
Relaciona a não conformidade ao item e à inspeção.
Adiciona a operação à outbox.
6.11 UC-13 — Concluir inspeção offline
Ator principal: técnico.
Pré-condições: inspeção em andamento e dados locais disponíveis.
Gatilho: ação de concluir.
Fluxo principal
O aplicativo valida os itens obrigatórios.
Valida observações e evidências exigidas.
Apresenta o resumo.
O técnico confirma a conclusão.
O aplicativo registra data e hora local.
O estado local muda para aguardando sincronização.
As respostas ficam bloqueadas para edição comum.
A operação de conclusão é adicionada à outbox.
Fluxos alternativos
Itens obrigatórios pendentes: conclusão bloqueada e itens destacados.
Evidência obrigatória ausente: conclusão bloqueada.
6.12 UC-14 — Sincronizar alterações
Ator principal: sistema, com acompanhamento do técnico.
Pré-condições: sessão válida, conectividade e operações pendentes.
Gatilho: ação manual, abertura do aplicativo ou evento de conectividade.
Fluxo principal
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
Fluxos alternativos
Token expirado: renovar e repetir de maneira controlada.
Conflito: preservar a alteração local, informar o usuário e aplicar a política definida.
Falha de arquivo: sincronizar dados textuais e manter a evidência pendente, quando permitido.
Reenvio: a API retorna o resultado anterior sem duplicar dados.
6.13 UC-16 — Revisar inspeção
Ator principal: supervisor.
Pré-condições: inspeção enviada e disponível para revisão.
Gatilho: abertura da inspeção na interface administrativa.
Fluxo principal
O supervisor visualiza o resumo.
Consulta as informações do equipamento e do técnico.
Navega pelas seções do checklist.
Analisa respostas, observações, localização e evidências.
Consulta não conformidades.
Registra comentários de revisão quando necessário.
Decide aprovar ou reprovar.
6.14 UC-17 — Aprovar ou reprovar inspeção
Ator principal: supervisor.
Pré-condições: inspeção em revisão.
Gatilho: decisão do supervisor.
Fluxo de aprovação
O supervisor seleciona aprovar.
Confirma a decisão.
A API registra usuário, data e comentário.
A inspeção passa para aprovada.
O conteúdo fica protegido contra alterações comuns.
Fluxo de reprovação
O supervisor seleciona reprovar.
Informa obrigatoriamente o motivo.
Pode indicar itens que exigem correção.
A API registra a revisão.
A inspeção passa para reprovada.
O técnico poderá recebê-la novamente conforme fluxo de correção.

07 - Fluxo Geral
7. Fluxo Geral
7.1 Fluxo de valor ponta a ponta
ADMINISTRAÇÃO Cadastrar usuários, clientes, locais e equipamentos ↓ CONFIGURAÇÃO Criar e publicar modelo de inspeção ↓ PLANEJAMENTO Agendar inspeção e atribuir técnico ↓ DISTRIBUIÇÃO Aplicativo baixa a inspeção e o checklist ↓ EXECUÇÃO Técnico inicia, responde, fotografa e registra ocorrências ↓ OPERAÇÃO OFFLINE Dados são preservados em SQLite e na fila local ↓ SINCRONIZAÇÃO Aplicativo envia operações pendentes e baixa atualizações ↓ REVISÃO Supervisor analisa respostas, evidências e não conformidades ↓ DECISÃO Aprovar ou reprovar com solicitação de correção ↓ ENCERRAMENTO Resultado permanece disponível para consulta e auditoria
​
7.2 Fluxo administrativo
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
7.3 Fluxo do técnico
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
7.4 Estados de negócio da inspeção
O estado de negócio da inspeção não deve ser confundido com o estado de sincronização do dispositivo.
Estado
Descrição
Quem provoca a entrada
RASCUNHO
Inspeção ainda não disponibilizada ao técnico.
Supervisor
ATRIBUÍDA
Inspeção vinculada a um técnico e disponível para sincronização.
Supervisor
EM_ANDAMENTO
Técnico iniciou a execução.
Técnico
ENVIADA
Resultado recebido pelo servidor e disponível para revisão.
Técnico/API
EM_REVISÃO
Supervisor iniciou formalmente a análise.
Supervisor
APROVADA
Resultado aceito e protegido contra edição comum.
Supervisor
REPROVADA
Resultado devolvido com motivo de correção.
Supervisor
CANCELADA
Inspeção interrompida administrativamente.
Supervisor/Administrador

7.5 Estados locais de sincronização
Estado local
Significado
SINCRONIZADO
Não existem alterações locais pendentes.
PENDENTE
Existem operações aguardando envio.
SINCRONIZANDO
O aplicativo está processando a fila.
ERRO
Uma ou mais operações falharam.
CONFLITO
Existe divergência que exige política específica ou intervenção.

7.6 Transições permitidas no MVP
Estado atual
Ação
Próximo estado
RASCUNHO
Atribuir técnico
ATRIBUÍDA
ATRIBUÍDA
Iniciar
EM_ANDAMENTO
ATRIBUÍDA
Cancelar
CANCELADA
EM_ANDAMENTO
Concluir e sincronizar
ENVIADA
EM_ANDAMENTO
Cancelar administrativamente
CANCELADA
ENVIADA
Iniciar revisão
EM_REVISÃO
EM_REVISÃO
Aprovar
APROVADA
EM_REVISÃO
Reprovar
REPROVADA
REPROVADA
Reabrir para correção
EM_ANDAMENTO
REPROVADA
Cancelar
CANCELADA

Quando a inspeção for concluída sem internet, o estado de negócio local poderá representar a conclusão, mas o servidor continuará com o último estado conhecido. A interface deverá exibir “Aguardando sincronização” até a confirmação da API.
7.7 Fluxo offline
Inspeção é baixada enquanto há conexão ↓ Dados são armazenados em SQLite ↓ Técnico perde a conexão ↓ Respostas e evidências são salvas localmente ↓ Cada alteração gera uma operação na outbox ↓ Técnico conclui a inspeção ↓ Aplicativo marca “Aguardando sincronização” ↓ Conexão retorna ↓ Outbox é enviada em ordem ↓ API confirma ou rejeita cada operação ↓ Aplicativo atualiza dados e estado de sincronização
​
7.8 Fluxo de correção
Supervisor reprova a inspeção ↓ Motivo e itens de correção são registrados ↓ Técnico sincroniza a atualização ↓ Aplicativo apresenta a inspeção como “Requer correção” ↓ Técnico altera somente o que está liberado ↓ Nova versão das respostas é enviada ↓ Supervisor realiza nova revisão
​
7.9 Tratamento de exceções relevantes
Aplicativo fechado durante o preenchimento: respostas já confirmadas devem permanecer salvas localmente.
Falha ao enviar uma foto: dados textuais não devem ser descartados; a foto permanecerá pendente.
Inspeção cancelada enquanto o técnico está offline: na próxima sincronização, o sistema deverá preservar alterações locais e informar o cancelamento antes de descartar qualquer dado.
Sessão expirada: o aplicativo deverá tentar renovar a sessão; caso não consiga, manter os dados locais e solicitar nova autenticação.
Operação reenviada: a API deverá reconhecer o identificador idempotente e impedir duplicidade.
Modelo alterado após o agendamento: a inspeção continuará utilizando o snapshot da versão selecionada.

08 - Funcionalidades
8. Funcionalidades
8.1 Classificação de prioridade
Prioridade
Significado
P0
Obrigatória para o MVP e para a demonstração final.
P1
Importante, implementada após a estabilidade do fluxo principal.
P2
Evolução futura ou desafio adicional.

8.2 Funcionalidades do MVP — P0
Autenticação e acesso
login por e-mail e senha;
emissão e renovação de token;
encerramento de sessão;
armazenamento seguro da sessão no mobile;
proteção de rotas no mobile e na web;
autorização por perfil na API;
inativação de usuário.
Cadastros administrativos
usuários;
clientes;
locais de inspeção;
equipamentos;
código QR único por equipamento;
pesquisa, paginação e filtros básicos;
inativação lógica de registros.
Modelos de inspeção
criação de modelo em rascunho;
criação e ordenação de seções;
criação e ordenação de itens;
definição do tipo de resposta;
definição de item obrigatório;
definição de exigência de observação ou evidência;
prévia do checklist;
publicação de versão;
preservação de versões já utilizadas.
Planejamento de inspeções
seleção de modelo publicado;
seleção de cliente, local e equipamento;
definição de técnico responsável;
definição de prioridade e data prevista;
instruções adicionais;
cancelamento com justificativa;
acompanhamento por estado.
Aplicativo do técnico
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
Operação offline e sincronização
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
Revisão administrativa
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
API e plataforma
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
8.3 Funcionalidades importantes — P1
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
8.4 Funcionalidades futuras — P2
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
8.5 Tipos de resposta previstos
Obrigatórios no MVP
texto curto;
texto longo;
número;
verdadeiro ou falso;
conforme ou não conforme;
seleção única;
data;
fotografia ou evidência associada.
Opcionais no MVP ou P1
seleção múltipla;
escala numérica;
horário;
assinatura;
localização como resposta;
QR Code como resposta;
arquivo;
medição com unidade.
8.6 Recorte de escopo recomendado para 16 semanas
Para preservar a qualidade, o projeto deverá priorizar:
um único técnico responsável por inspeção;
um único fluxo de revisão;
tipos de resposta essenciais;
fotografia como principal evidência;
Android como validação mobile;
sincronização baseada em fila e idempotência, sem edição colaborativa simultânea;
dashboard administrativo simples;
portal do cliente fora do MVP.

09 - Regras de Negócio
9. Regras de Negócio
9.1 Usuários e acesso
RN-001. Somente usuários ativos poderão iniciar uma nova sessão.
RN-002. A inativação de um usuário não excluirá seus registros históricos.
RN-003. A API deverá validar o perfil em todas as operações protegidas.
RN-004. O técnico somente poderá consultar integralmente as inspeções atribuídas a ele.
RN-005. O supervisor poderá consultar e revisar inspeções pertencentes ao seu escopo.
RN-006. O administrador poderá gerenciar usuários e cadastros, mas não deverá alterar respostas de inspeção por padrão.
RN-007. Credenciais e tokens não poderão ser gravados em logs.
RN-008. A troca de senha ou o bloqueio do usuário deverá invalidar sessões conforme a política definida pela API.
9.2 Clientes, locais e equipamentos
RN-009. Todo local deverá pertencer a um cliente.
RN-010. Todo equipamento deverá pertencer a um local no MVP.
RN-011. O código QR de um equipamento deverá ser único.
RN-012. Um equipamento inativo não poderá ser utilizado em uma nova inspeção.
RN-013. Registros já utilizados em inspeções deverão ser inativados, não excluídos fisicamente.
RN-014. O local selecionado para a inspeção deverá ser compatível com o equipamento selecionado.
9.3 Modelos de inspeção
RN-015. Todo modelo deverá possuir título, categoria e ao menos uma seção com item válido antes da publicação.
RN-016. Todo item deverá possuir um tipo de resposta.
RN-017. A ordem de seções e itens deverá ser explícita.
RN-018. Um modelo em rascunho poderá ser alterado livremente por usuário autorizado.
RN-019. Uma versão publicada não poderá ser alterada de forma destrutiva.
RN-020. Alterações em um modelo publicado deverão gerar nova versão.
RN-021. Uma inspeção deverá preservar um snapshot dos itens da versão utilizada.
RN-022. A desativação de um modelo não afetará inspeções existentes.
RN-023. Tipos de resposta não suportados pelo aplicativo não poderão ser publicados para uso no MVP.
9.4 Planejamento e atribuição
RN-024. Uma inspeção deverá estar vinculada a uma versão publicada de modelo.
RN-025. Uma inspeção deverá possuir cliente, local, técnico e data prevista.
RN-026. O equipamento poderá ser opcional somente quando o tipo de inspeção for definido para local ou ambiente.
RN-027. Somente técnico ativo poderá receber nova atribuição.
RN-028. Uma inspeção atribuída deverá aparecer para o técnico após sincronização.
RN-029. O cancelamento deverá registrar usuário, data e justificativa.
RN-030. Uma inspeção aprovada não poderá ser cancelada pelo fluxo comum.
RN-031. O MVP permitirá somente um técnico responsável por inspeção.
9.5 Execução
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
9.6 Evidências
RN-045. Toda evidência deverá estar vinculada a uma inspeção e, quando aplicável, a uma resposta ou não conformidade.
RN-046. O sistema aceitará somente formatos e tamanhos permitidos.
RN-047. Uma evidência ainda não sincronizada não poderá ser apagada silenciosamente por limpeza de cache.
RN-048. A exclusão de uma evidência já sincronizada deverá ser auditada e respeitar o estado da inspeção.
RN-049. Evidências de inspeções aprovadas serão somente leitura.
RN-050. O nome original do arquivo não será utilizado como único identificador.
RN-051. Metadados sensíveis desnecessários poderão ser removidos ou ignorados conforme política do produto.
9.7 Não conformidades
RN-052. Toda não conformidade deverá pertencer a uma inspeção.
RN-053. A não conformidade poderá ser associada a um item específico.
RN-054. A criticidade deverá assumir um valor válido: baixa, média, alta ou crítica.
RN-055. Não conformidades críticas deverão exigir descrição e evidência.
RN-056. A exclusão de uma não conformidade após envio deverá ser substituída por alteração de estado ou operação auditável.
RN-057. O tratamento completo da não conformidade após a aprovação pertence a uma versão futura, mas seu registro fará parte do MVP.
9.8 Localização e QR Code
RN-058. O aplicativo deverá solicitar consentimento antes de acessar câmera ou localização.
RN-059. A recusa da permissão deverá produzir orientação e alternativa quando a regra permitir.
RN-060. A localização não será coletada continuamente no MVP.
RN-061. A localização poderá ser registrada no início e na conclusão.
RN-062. O sistema deverá armazenar latitude, longitude, precisão e horário quando disponíveis.
RN-063. A leitura de QR Code não deverá, sozinha, autorizar acesso a dados não permitidos ao usuário.
RN-064. Divergência entre o equipamento previsto e o lido deverá ser informada antes da continuidade.
9.9 Offline e sincronização
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
9.10 Revisão e aprovação
RN-079. Somente supervisor autorizado poderá iniciar a revisão.
RN-080. A reprovação deverá possuir motivo.
RN-081. A aprovação deverá registrar supervisor, data e comentário opcional.
RN-082. Uma inspeção aprovada ficará bloqueada para edição comum.
RN-083. Correções após reprovação deverão preservar histórico das versões anteriores.
RN-084. O supervisor não deverá alterar silenciosamente a resposta fornecida pelo técnico.
RN-085. Ajustes administrativos deverão ser diferenciados de respostas de campo e auditados.
9.11 Auditoria e integridade
RN-086. Alterações críticas deverão registrar usuário, data, ação e entidade.
RN-087. Datas de criação e atualização deverão ser mantidas pelo servidor.
RN-088. Entidades utilizadas em registros históricos não poderão ser excluídas fisicamente pelo fluxo comum.
RN-089. A API deverá rejeitar transições de estado inválidas.
RN-090. A documentação da API deverá refletir os estados, validações e erros implementados.

10 - Modelo de10 - Modelo de Dados
10. Modelo de Dados
10.1 Objetivo do modelo
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
Contexto
Tecnologia
Responsabilidade
Persistência central
PostgreSQL
Fonte oficial dos dados sincronizados, regras de integridade, histórico e auditoria
Persistência local
SQLite
Operação offline, armazenamento das inspeções do técnico, respostas, evidências pendentes e fila de sincronização


10.2 Princípios de modelagem
Identificadores globais
As entidades deverão utilizar identificadores UUID.
Isso permitirá:
criar registros no dispositivo sem depender do servidor;
evitar identificadores locais temporários;
reduzir remapeamentos durante a sincronização;
reenviar operações sem criar registros duplicados;
identificar entidades de forma consistente entre SQLite e PostgreSQL.
Separação entre modelo e execução
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
Versionamento imutável
Uma versão publicada de um modelo não poderá ser alterada de forma destrutiva.
Quando houver mudanças no checklist, uma nova versão deverá ser criada.
Isso garante que inspeções antigas continuem associadas ao conteúdo que estava válido no momento do agendamento.
Snapshot da inspeção
Cada inspeção possuirá uma cópia dos itens da versão utilizada.
Essa cópia será armazenada em InspectionItemSnapshot.
O snapshot preservará:
título da seção;
ordem da seção;
texto do item;
descrição;
tipo de resposta;
obrigatoriedade;
regras de observação;
regras de evidência;
opções de seleção;
ordem do item.
Preservação histórica
Entidades utilizadas por inspeções não deverão ser excluídas fisicamente pelo fluxo comum.
Deverão ser utilizados:
inativação;
exclusão lógica;
versionamento;
snapshots;
eventos de auditoria.
Estado de negócio e sincronização
O estado da inspeção deverá permanecer separado do estado de sincronização do dispositivo.
Exemplo:
Estado de negócio: EM_ANDAMENTO
Estado local: PENDENTE

Isso significa que a inspeção está sendo executada, mas possui alterações locais ainda não enviadas.
Arquivos fora do banco relacional
Fotografias e outros arquivos grandes não serão armazenados diretamente no PostgreSQL.
O banco guardará:
identificador da evidência;
tipo;
tamanho;
formato;
chave do arquivo;
vínculo com a inspeção;
vínculo com a resposta ou não conformidade;
datas de captura e envio.
O arquivo será mantido em armazenamento de objetos ou mecanismo equivalente.
Controle de concorrência
Entidades sujeitas a alterações concorrentes deverão possuir controle de versão otimista.
Exemplo:
version = 3

Uma atualização baseada na versão 2 deverá ser rejeitada ou tratada como conflito caso o servidor já esteja na versão 3.

10.3 Diagrama conceitual textual
USER
 ├── cria ou agenda ── N INSPECTION
 ├── executa ───────── N INSPECTION
 ├── revisa ────────── N INSPECTION_REVIEW
 └── realiza ações ─── N AUDIT_EVENT

CLIENT 1 ── N INSPECTION_SITE
INSPECTION_SITE 1 ── 0..N EQUIPMENT

INSPECTION_TEMPLATE 1 ── N INSPECTION_TEMPLATE_VERSION
INSPECTION_TEMPLATE_VERSION 1 ── N TEMPLATE_SECTION
TEMPLATE_SECTION 1 ── N TEMPLATE_ITEM

INSPECTION_TEMPLATE_VERSION 1 ── N INSPECTION

CLIENT 1 ── N INSPECTION
INSPECTION_SITE 1 ── N INSPECTION
EQUIPMENT 1 ── 0..N INSPECTION
USER 1 ── N INSPECTION

INSPECTION 1 ── N INSPECTION_ITEM_SNAPSHOT
INSPECTION_ITEM_SNAPSHOT 1 ── 0..1 INSPECTION_RESPONSE
INSPECTION_RESPONSE 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N NON_CONFORMITY
INSPECTION_RESPONSE 1 ── 0..N NON_CONFORMITY
NON_CONFORMITY 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N INSPECTION_REVIEW
INSPECTION 1 ── N AUDIT_EVENT


10.4 Como interpretar as cardinalidades
Cardinalidade 1 ── N
Representa um relacionamento de um para muitos.
Exemplo:
CLIENT 1 ── N INSPECTION_SITE

Um cliente pode possuir vários locais de inspeção.
Cada local pertence a um cliente.
Cardinalidade 1 ── 0..N
Representa um relacionamento de um para zero ou muitos.
Exemplo:
INSPECTION_RESPONSE 1 ── 0..N EVIDENCE

Uma resposta pode não possuir evidências ou pode possuir várias evidências.
Cardinalidade 1 ── 0..1
Representa um relacionamento de um para zero ou um.
Exemplo:
INSPECTION_ITEM_SNAPSHOT 1 ── 0..1 INSPECTION_RESPONSE

Um item pode ainda não ter sido respondido ou pode possuir uma única resposta.

10.5 Estrutura organizacional
10.5.1 Client
A entidade Client representa a empresa, instituição ou organização atendida pela operação de inspeções.
Um cliente poderá possuir vários locais de inspeção.
CLIENT
    ├── INSPECTION_SITE
    ├── INSPECTION_SITE
    └── INSPECTION_SITE

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
name
string
Nome de exibição obrigatório
legal_name
string
Razão social opcional no MVP
document
string
Documento opcional e validado
email
string
Opcional
phone
string
Opcional
status
enum
ACTIVE ou INACTIVE
created_at
datetime
Gerado pelo servidor
updated_at
datetime
Gerado pelo servidor
version
integer
Controle otimista

Relacionamentos
CLIENT 1 ── N INSPECTION_SITE
CLIENT 1 ── N INSPECTION

Um cliente inativo continuará relacionado às inspeções históricas, mas não poderá ser selecionado em novos agendamentos.

10.5.2 InspectionSite
A entidade InspectionSite representa uma unidade, fábrica, loja, obra, depósito, prédio, setor ou outra localização pertencente ao cliente.
Exemplo
Cliente: Indústria Alfa
    ├── Unidade Sorocaba
    ├── Unidade Itu
    └── Unidade Campinas

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
client_id
UUID
Cliente proprietário
name
string
Obrigatório
description
string
Opcional
address_line
string
Endereço
city
string
Cidade
state
string
Estado
postal_code
string
CEP
latitude
decimal
Coordenada opcional
longitude
decimal
Coordenada opcional
contact_name
string
Responsável local opcional
contact_phone
string
Opcional
status
enum
ACTIVE ou INACTIVE
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Relacionamentos
CLIENT 1 ── N INSPECTION_SITE
INSPECTION_SITE 1 ── 0..N EQUIPMENT
INSPECTION_SITE 1 ── N INSPECTION

Todo local deverá pertencer a um cliente.

10.5.3 Equipment
A entidade Equipment representa o ativo físico que poderá ser identificado e inspecionado.
Exemplo
Unidade Sorocaba
    ├── Empilhadeira 01
    ├── Gerador 02
    ├── Compressor 03
    └── Extintor 15

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
site_id
UUID
Local ao qual pertence
name
string
Obrigatório
asset_number
string
Número patrimonial opcional
serial_number
string
Número de série opcional
manufacturer
string
Fabricante opcional
model
string
Modelo opcional
description
string
Opcional
qr_code
string
Único
status
enum
ACTIVE, INACTIVE ou DECOMMISSIONED
installed_at
date
Opcional
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Relacionamentos
INSPECTION_SITE 1 ── 0..N EQUIPMENT
EQUIPMENT 1 ── 0..N INSPECTION

No MVP, todo equipamento deverá pertencer a um local.
Uma inspeção poderá não possuir equipamento quando for destinada ao ambiente ou ao local como um todo.

10.6 Usuários e responsabilidades
10.6.1 User
A entidade User representa as pessoas autorizadas a utilizar o FieldOps.
Perfis previstos
ADMIN
SUPERVISOR
TECHNICIAN
CLIENT_VIEWER

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
name
string
Obrigatório
email
string
Obrigatório e único
password_hash
string
Nunca exposto pela API
role
enum
Perfil autorizado
status
enum
ACTIVE, INACTIVE ou BLOCKED
phone
string
Opcional
created_at
datetime
Gerado pelo servidor
updated_at
datetime
Gerado pelo servidor
version
integer
Controle otimista

Relacionamentos principais
USER
 ├── cria ou agenda → INSPECTION
 ├── executa → INSPECTION
 ├── supervisiona → INSPECTION
 ├── revisa → INSPECTION_REVIEW
 └── realiza → AUDIT_EVENT

Uma inspeção poderá possuir referências distintas para:
usuário que criou;
técnico responsável;
supervisor responsável;
usuário que cancelou;
usuário que aprovou ou reprovou.
A inativação de um usuário não excluirá seu histórico.

10.7 Modelos de inspeção

10.7.1 InspectionTemplate
A entidade InspectionTemplate representa a identidade lógica e reutilizável de um modelo de inspeção.
Exemplo:
Checklist de Inspeção de Extintores

Ela não representa diretamente uma versão publicada.
Campos
Campo
Tipo sugerido
Regra
id
UUID
Identidade lógica do modelo
title
string
Obrigatório
description
string
Opcional
category
string
Obrigatório
status
enum
DRAFT, ACTIVE ou INACTIVE
current_version
integer
Última versão publicada
created_by
UUID
Usuário criador
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista do registro

Relacionamento
INSPECTION_TEMPLATE 1 ── N INSPECTION_TEMPLATE_VERSION

Um modelo pode possuir várias versões.

10.7.2 InspectionTemplateVersion
A entidade InspectionTemplateVersion representa uma publicação imutável do modelo.
Exemplo
Checklist de Extintores
    ├── Versão 1
    ├── Versão 2
    └── Versão 3

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave da versão
template_id
UUID
Modelo lógico
version_number
integer
Sequencial por modelo
title_snapshot
string
Título preservado
description_snapshot
string
Descrição preservada
published_by
UUID
Usuário responsável
published_at
datetime
Data de publicação
active_for_new_inspections
boolean
Permite novos agendamentos
created_at
datetime
Auditoria

Relacionamentos
INSPECTION_TEMPLATE 1 ── N INSPECTION_TEMPLATE_VERSION
INSPECTION_TEMPLATE_VERSION 1 ── N TEMPLATE_SECTION
INSPECTION_TEMPLATE_VERSION 1 ── N INSPECTION

Cada inspeção deverá utilizar uma versão específica.
A versão utilizada não poderá ser alterada após a publicação.

10.7.3 TemplateSection
A entidade TemplateSection organiza os itens do checklist em grupos.
Exemplo
Checklist de Empilhadeira
    ├── Identificação
    ├── Condições externas
    ├── Sistema elétrico
    ├── Sistema hidráulico
    └── Resultado final

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
template_version_id
UUID
Versão proprietária
title
string
Obrigatório
description
string
Opcional
display_order
integer
Ordem explícita
created_at
datetime
Auditoria

Relacionamento
INSPECTION_TEMPLATE_VERSION 1 ── N TEMPLATE_SECTION

A seção pertence à versão publicada, e não diretamente ao modelo lógico.

10.7.4 TemplateItem
A entidade TemplateItem representa uma pergunta, verificação, instrução ou medição pertencente a uma seção.
Exemplo
Seção: Sistema elétrico
    ├── A bateria apresenta danos?
    ├── Os cabos estão corretamente isolados?
    ├── As luzes estão funcionando?
    └── A buzina está funcionando?

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
section_id
UUID
Seção proprietária
code
string
Código legível opcional
title
string
Pergunta ou instrução
description
string
Texto de ajuda opcional
response_type
enum
Tipo da resposta
required
boolean
Define obrigatoriedade
observation_required_on_failure
boolean
Exige observação na falha
evidence_required_on_failure
boolean
Exige evidência na falha
options_json
JSON
Alternativas e configurações
display_order
integer
Ordem explícita
created_at
datetime
Auditoria

Tipos de resposta do MVP
TEXT_SHORT
TEXT_LONG
NUMBER
BOOLEAN
CONFORMITY
SINGLE_CHOICE
DATE

Relacionamento
TEMPLATE_SECTION 1 ── N TEMPLATE_ITEM


10.7.5 Exemplo completo de modelo
INSPECTION_TEMPLATE
Checklist de Extintores

    └── INSPECTION_TEMPLATE_VERSION
        Versão 2

            ├── TEMPLATE_SECTION
            │   Identificação
            │       ├── Número do patrimônio
            │       └── Localização
            │
            ├── TEMPLATE_SECTION
            │   Condições físicas
            │       ├── O lacre está intacto?
            │       ├── O manômetro está na faixa verde?
            │       └── Existe corrosão?
            │
            └── TEMPLATE_SECTION
                Evidências
                    └── Fotografar o extintor


10.8 Execução da inspeção
10.8.1 Inspection
A entidade Inspection representa uma execução real de um checklist.
Ela estará relacionada:
a uma versão publicada;
a um cliente;
a um local;
opcionalmente a um equipamento;
a um técnico;
a um supervisor;
a uma data prevista;
a um estado de negócio.
Campos
Campo
Tipo sugerido
Regra
id
Tipo sugerido
Regra
id
UUID
Identificador global
template_version_id
UUID
Versão utilizada
client_id
UUID
Cliente
site_id
UUID
Local
equipment_id
UUID
Opcional conforme o tipo
technician_id
UUID
Técnico responsável
supervisor_id
UUID
Supervisor responsável
created_by
UUID
Usuário que criou ou agendou
title
string
Nome de apresentação
instructions
string
Orientações adicionais
priority
enum
LOW, MEDIUM, HIGH ou CRITICAL
status
enum
Estado de negócio
scheduled_for
datetime
Data prevista
started_at_device
datetime
Horário registrado no dispositivo
started_at_server
datetime
Horário recebido pelo servidor
completed_at_device
datetime
Horário registrado no dispositivo
submitted_at_server
datetime
Horário confirmado pelo servidor
approved_at
datetime
Data de aprovação
canceled_at
datetime
Data do cancelamento
canceled_by
UUID
Usuário que cancelou
canceled_reason
string
Obrigatório no cancelamento
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Estados de negócio
DRAFT
ASSIGNED
IN_PROGRESS
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
CANCELED

Relacionamentos
INSPECTION_TEMPLATE_VERSION 1 ── N INSPECTION
CLIENT 1 ── N INSPECTION
INSPECTION_SITE 1 ── N INSPECTION
EQUIPMENT 1 ── 0..N INSPECTION
USER 1 ── N INSPECTION

Uma inspeção poderá estar relacionada a um equipamento ou somente ao local.

10.8.2 Criação da inspeção
Ao confirmar o agendamento, a API deverá:
validar cliente, local, equipamento, técnico e supervisor;
validar que a versão do modelo está publicada;
criar a inspeção;
copiar as seções e os itens da versão;
criar os registros de InspectionItemSnapshot;
registrar o evento de auditoria;
disponibilizar a inspeção para sincronização pelo técnico.

10.8.3 InspectionItemSnapshot
A entidade InspectionItemSnapshot preserva o conteúdo do checklist utilizado pela inspeção.
Por que o snapshot é necessário
Considere a pergunta original:
O extintor está dentro da validade?

Em uma versão futura, ela pode ser alterada para:
O extintor está dentro da validade indicada no selo?

A inspeção antiga deverá continuar exibindo a pergunta original.
Sem o snapshot, um relatório histórico poderia apresentar um texto diferente daquele que o técnico respondeu.
Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
inspection_id
UUID
Inspeção proprietária
source_template_item_id
UUID
Referência histórica opcional
section_title
string
Texto preservado
section_description
string
Descrição preservada
section_order
integer
Ordem preservada
item_code
string
Código preservado
item_title
string
Texto preservado
item_description
string
Ajuda preservada
response_type
enum
Tipo preservado
required
boolean
Obrigatoriedade preservada
rules_json
JSON
Configurações preservadas
options_json
JSON
Alternativas preservadas
item_order
integer
Ordem preservada
created_at
datetime
Data de criação do snapshot

Relacionamento
INSPECTION 1 ── N INSPECTION_ITEM_SNAPSHOT

Uma inspeção terá um snapshot para cada item do checklist.

10.8.4 InspectionResponse
A entidade InspectionResponse armazena a resposta fornecida para um item do snapshot.
Cardinalidade
INSPECTION_ITEM_SNAPSHOT 1 ── 0..1 INSPECTION_RESPONSE

Um item poderá:
não possuir resposta enquanto estiver pendente;
possuir uma resposta depois de preenchido.
Não deverão existir duas respostas atuais para o mesmo item.
Restrição recomendada
UNIQUE(inspection_item_id)

Campos
Campo
Tipo sugerido
Regra
id
UUID
Gerável no dispositivo
inspection_id
UUID
Inspeção
inspection_item_id
UUID
Item do snapshot
value_text
string
Valor textual
value_number
decimal
Valor numérico
value_boolean
boolean
Valor lógico
value_date
date
Data
value_json
JSON
Seleções ou estruturas adicionais
observation
string
Comentário do técnico
conformity
enum
NOT_APPLICABLE, CONFORMING ou NON_CONFORMING
answered_by
UUID
Técnico
answered_at_device
datetime
Horário do dispositivo
server_received_at
datetime
Horário de recebimento
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Exemplos
Resposta lógica
Pergunta: O lacre está intacto?
Resposta: Sim

Resposta numérica
Pergunta: Qual é a pressão medida?
Resposta: 8,5

Resposta textual
Pergunta: Descreva a irregularidade.
Resposta: Cabo elétrico com isolamento danificado.

10.9 Evidências
10.9.1 Evidence
A entidade Evidence representa um arquivo ou registro utilizado para comprovar uma resposta ou ocorrência.
No MVP, o principal tipo será fotografia.
Possíveis vínculos
Uma evidência poderá estar relacionada:
diretamente à inspeção;
a uma resposta;
a uma não conformidade.
Relacionamentos
INSPECTION 1 ── 0..N EVIDENCE
INSPECTION_RESPONSE 1 ── 0..N EVIDENCE
NON_CONFORMITY 1 ── 0..N EVIDENCE

Uma evidência sempre pertencerá a uma inspeção.
Os vínculos com resposta e não conformidade serão opcionais conforme o contexto.
Campos
Campo
Tipo sugerido
Regra
id
UUID
Gerável no dispositivo
inspection_id
UUID
Obrigatório
response_id
UUID
Opcional
non_conformity_id
UUID
Opcional
type
enum
PHOTO no MVP
storage_key
string
Referência no serviço de arquivos
local_uri
string
Somente no banco local
original_file_name
string
Opcional e não utilizado como identificador
mime_type
string
Formato validado
size_bytes
long
Tamanho do arquivo
checksum
string
Integridade e deduplicação opcional
description
string
Opcional
latitude
decimal
Opcional
longitude
decimal
Opcional
captured_at_device
datetime
Horário da captura
server_received_at
datetime
Recebimento dos metadados
uploaded_at
datetime
Confirmação do arquivo
created_by
UUID
Técnico
created_at
datetime
Auditoria

Exemplo
Pergunta:
A bateria está em boas condições?

Resposta:
Não

Evidências:
    ├── Foto geral da bateria
    └── Foto aproximada dos terminais com corrosão

O arquivo local não poderá ser removido enquanto o servidor não confirmar o upload.

10.10 Não conformidades
10.10.1 NonConformity
A entidade NonConformity representa um problema, desvio ou irregularidade identificada durante a inspeção.
Exemplo
Inspeção da Empilhadeira 01
    ├── Pneu dianteiro desgastado
    ├── Buzina não funciona
    └── Vazamento hidráulico

Campos
Campo
Tipo sugerido
Regra
id
UUID
Gerável no dispositivo
inspection_id
UUID
Obrigatório
inspection_item_id
UUID
Item relacionado opcional
response_id
UUID
Resposta relacionada opcional
title
string
Obrigatório
description
string
Obrigatório
severity
enum
LOW, MEDIUM, HIGH ou CRITICAL
status
enum
OPEN no MVP
created_by
UUID
Técnico
created_at_device
datetime
Data de campo
server_received_at
datetime
Data de recebimento
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Relacionamentos
INSPECTION 1 ── 0..N NON_CONFORMITY
INSPECTION_RESPONSE 1 ── 0..N NON_CONFORMITY
NON_CONFORMITY 1 ── 0..N EVIDENCE

A associação com a resposta permite localizar diretamente:
a pergunta;
a resposta;
a observação;
as evidências;
a não conformidade gerada.
Exemplo completo
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


10.11 Revisão da inspeção
10.11.1 InspectionReview
A entidade InspectionReview registra cada ciclo de revisão executado por um supervisor.
Uma inspeção poderá ser revisada mais de uma vez.
Exemplo
1. Técnico envia a inspeção
2. Supervisor solicita correção
3. Técnico corrige
4. Supervisor revisa novamente
5. Supervisor aprova

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
inspection_id
UUID
Inspeção revisada
reviewer_id
UUID
Supervisor
decision
enum
APPROVED ou REJECTED
reason
string
Obrigatório na reprovação
comments
string
Opcional
reviewed_at
datetime
Data do servidor
review_cycle
integer
Número da rodada
created_at
datetime
Auditoria

Relacionamento
INSPECTION 1 ── 0..N INSPECTION_REVIEW

Exemplo de registros
Ciclo
Responsável
Decisão
1
Supervisor João
REJECTED
2
Supervisor João
APPROVED

Não deverão ser utilizados apenas campos como approved_by para representar todo o processo, pois isso eliminaria o histórico das revisões anteriores.

10.12 Auditoria
10.12.1 AuditEvent
A entidade AuditEvent registra as ações relevantes realizadas no sistema.
Exemplos de eventos
INSPECTION_CREATED
INSPECTION_ASSIGNED
INSPECTION_STARTED
RESPONSE_CREATED
RESPONSE_UPDATED
EVIDENCE_ADDED
EVIDENCE_REMOVED
NON_CONFORMITY_CREATED
INSPECTION_COMPLETED
INSPECTION_SUBMITTED
REVIEW_STARTED
INSPECTION_APPROVED
INSPECTION_REJECTED
INSPECTION_CANCELED

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
inspection_id
UUID
Inspeção relacionada, quando aplicável
actor_id
UUID
Usuário responsável, quando conhecido
action
string
Ação realizada
entity_type
string
Tipo da entidade afetada
entity_id
UUID
Identificador afetado
occurred_at
datetime
Data do servidor
device_occurred_at
datetime
Data do dispositivo, quando aplicável
previous_value_json
JSON
Estado anterior não sensível
new_value_json
JSON
Novo estado não sensível
metadata_json
JSON
Metadados adicionais
request_id
string
Correlação técnica
device_id
string
Dispositivo, quando aplicável

Relacionamento
INSPECTION 1 ── N AUDIT_EVENT

Exemplo de histórico
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

10.13 Estruturas locais do aplicativo mobile
O SQLite deverá armazenar os dados necessários para que o técnico execute as inspeções sem conexão.
10.13.1 Dados centrais replicados localmente
O aplicativo poderá manter representações locais de:
usuário autenticado;
cliente relacionado;
local relacionado;
equipamento relacionado;
inspeções atribuídas;
snapshots dos itens;
respostas;
evidências;
não conformidades;
revisões e solicitações de correção.
A base local não será uma cópia completa do PostgreSQL.
Somente os dados autorizados e necessários ao técnico serão baixados.

10.13.2 Estado local das entidades
Entidades sincronizáveis poderão possuir metadados locais adicionais.
Campo local
Finalidade
local_sync_status
Indicar sincronizado, pendente, erro ou conflito
is_dirty
Informar se existem alterações locais
last_synced_at
Data da última confirmação
base_version
Versão do servidor usada como base
local_updated_at
Última alteração no dispositivo
sync_error
Último erro sanitizado
deleted_locally
Exclusão lógica ainda não confirmada

Esses campos não precisam existir da mesma forma no PostgreSQL.

10.13.3 SyncOperation
A entidade local SyncOperation representa uma operação pendente na outbox.
Cada alteração sincronizável deverá gerar ou atualizar uma operação.
Campos
Campo
Tipo sugerido
Regra
operation_id
UUID
Chave idempotente
entity_type
string
Tipo da entidade
entity_id
UUID
Registro afetado
operation_type
enum
CREATE, UPDATE, DELETE_LOGICAL, TRANSITION ou UPLOAD
base_version
integer
Versão usada como base
payload_json
JSON
Dados necessários
dependency_ids
JSON
Operações que devem ser concluídas antes
status
enum
PENDING, PROCESSING, FAILED, CONFLICT ou COMPLETED
attempt_count
integer
Número de tentativas
last_error
string
Mensagem sanitizada
created_at
datetime
Data local
updated_at
datetime
Última alteração
last_attempt_at
datetime
Última tentativa
completed_at
datetime
Confirmação local

Exemplo de dependência
Operação 1: criar resposta
        ↓
Operação 2: enviar fotografia vinculada à resposta

A operação de upload não deverá ser enviada antes da criação da resposta relacionada.

10.13.4 SyncMetadata
A estrutura SyncMetadata armazena informações gerais da sincronização local.
Campos
Campo
Tipo sugerido
Regra
user_id
UUID
Usuário da base local
device_id
UUID
Identificador da instalação
last_pull_cursor
string
Cursor de alterações do servidor
last_sync_started_at
datetime
Início da última tentativa
last_successful_sync
datetime
Última sincronização completa
last_sync_result
enum
SUCCESS, PARTIAL ou FAILED
pending_operations
integer
Quantidade pendente, quando mantida
schema_version
integer
Versão do banco local

O cursor somente deverá ser atualizado após as alterações recebidas serem gravadas com sucesso no SQLite.

10.14 Fluxo de persistência offline
10.14.1 Download inicial
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

10.14.2 Salvamento de resposta
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
10.14.3 Salvamento de evidência
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
10.14.4 Conclusão offline
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

10.14.5 Envio da outbox
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


10.15 Regras de integridade
10.15.1 Restrições obrigatórias
Deverão existir restrições para garantir:
e-mail de usuário único;
QR Code de equipamento único;
número da versão único dentro do modelo;
ordem de seção coerente dentro da versão;
ordem de item coerente dentro da seção;
no máximo uma resposta atual por item do snapshot;
vínculo válido entre cliente, local e equipamento;
vínculo válido entre inspeção e versão publicada;
vínculo da resposta com item pertencente à mesma inspeção;
vínculo da evidência com a inspeção correta;
vínculo da não conformidade com a inspeção correta;
identificador de operação de sincronização único.
10.15.2 Índices recomendados
User
UNIQUE(email)
INDEX(status)
INDEX(role)

Equipment
UNIQUE(qr_code)
INDEX(site_id)
INDEX(status)
INDEX(asset_number)

Inspection
INDEX(technician_id, status)
INDEX(supervisor_id, status)
INDEX(client_id)
INDEX(site_id)
INDEX(equipment_id)
INDEX(scheduled_for)
INDEX(status, scheduled_for)

InspectionItemSnapshot
INDEX(inspection_id)
INDEX(inspection_id, section_order, item_order)

InspectionResponse
UNIQUE(inspection_item_id)
INDEX(inspection_id)
INDEX(answered_by)

Evidence
INDEX(inspection_id)
INDEX(response_id)
INDEX(non_conformity_id)
INDEX(uploaded_at)

NonConformity
INDEX(inspection_id)
INDEX(severity)
INDEX(status)

AuditEvent
INDEX(entity_type, entity_id)
INDEX(inspection_id)
INDEX(actor_id)
INDEX(occurred_at)
INDEX(request_id)


10.16 Exclusão, inativação e histórico
Exclusão lógica
Deverão ser inativados, em vez de excluídos fisicamente:
usuários;
clientes;
locais;
equipamentos;
modelos de inspeção.
Registros históricos
Não deverão ser excluídos pelo fluxo comum:
versões publicadas;
inspeções;
snapshots;
respostas sincronizadas;
revisões;
eventos de auditoria.
Evidências
A exclusão de uma evidência sincronizada deverá:
validar o estado da inspeção;
validar a permissão do usuário;
registrar auditoria;
remover ou bloquear o acesso ao objeto;
preservar os metadados necessários para rastreabilidade.

10.17 Exemplo completo
Contexto
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
Inspeção #2026-00045

Itens do snapshot
1. O nível de óleo está adequado?
2. Existem vazamentos?
3. A bateria está em boas condições?
4. O gerador iniciou corretamente?

Respostas
1. Sim
2. Não existem vazamentos
3. Não
4. Sim

Evidências da bateria
- Foto geral da bateria
- Foto aproximada dos terminais

Não conformidade
Título:
Corrosão nos terminais da bateria

Descrição:
Foram identificados sinais de corrosão nos terminais.

Gravidade:
HIGH

Status:
OPEN

Revisão
Ciclo: 1
Decisão: APPROVED
Comentário: Inspeção aprovada com não conformidade aberta.

Eventos de auditoria
- Inspeção criada
- Snapshot gerado
- Inspeção atribuída
- Inspeção iniciada
- Respostas registradas
- Evidências adicionadas
- Não conformidade criada
- Inspeção concluída
- Dados sincronizados
- Revisão iniciada
- Inspeção aprovada


10.18 Resumo das entidades
Entidade
Responsabilidade
User
Representar usuários, perfis e responsáveis pelas ações
Client
Representar a organização atendida
InspectionSite
Representar o local onde a inspeção ocorre
Equipment
Representar o ativo físico inspecionado
InspectionTemplate
Representar a identidade lógica do checklist
InspectionTemplateVersion
Representar uma publicação imutável do modelo
TemplateSection
Organizar os itens da versão em grupos
TemplateItem
Definir perguntas, verificações e regras
Inspection
Representar uma execução agendada do checklist
InspectionItemSnapshot
Preservar os itens utilizados na execução
InspectionResponse
Armazenar a resposta do técnico
Evidence
Armazenar metadados de fotografias e arquivos
NonConformity
Registrar problemas encontrados
InspectionReview
Registrar ciclos de revisão e decisões
AuditEvent
Registrar ações e mudanças relevantes
SyncOperation
Representar operações pendentes da outbox
SyncMetadata
Armazenar o estado geral da sincronização local


10.19 Decisões consolidadas do modelo
O PostgreSQL será a fonte oficial após a sincronização.
O SQLite será uma persistência operacional, e não apenas um cache descartável.
Todas as entidades sincronizáveis utilizarão UUID.
O modelo de inspeção possuirá versões publicadas imutáveis.
Seções e itens pertencerão à versão publicada.
Cada inspeção utilizará uma única versão do modelo.
Cada inspeção possuirá snapshots dos itens.
Cada item do snapshot poderá possuir no máximo uma resposta atual.
Uma resposta poderá possuir nenhuma ou várias evidências.
A evidência sempre estará vinculada a uma inspeção.
A não conformidade poderá ser vinculada à resposta que a originou.
Uma inspeção poderá passar por vários ciclos de revisão.
Alterações críticas serão registradas por eventos de auditoria.
O estado de negócio permanecerá separado do estado de sincronização.
Operações offline serão registradas em uma outbox persistente.
Operações de sincronização serão idempotentes.
Arquivos serão sincronizados separadamente dos dados estruturados.
O aplicativo não descartará silenciosamente dados locais pendentes.
Registros históricos serão preservados por versionamento, snapshot, inativação e auditoria.
 Dados
10. Modelo de Dados
10.1 Objetivo do modelo
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
Contexto
Tecnologia
Responsabilidade
Persistência central
PostgreSQL
Fonte oficial dos dados sincronizados, regras de integridade, histórico e auditoria
Persistência local
SQLite
Operação offline, armazenamento das inspeções do técnico, respostas, evidências pendentes e fila de sincronização


10.2 Princípios de modelagem
Identificadores globais
As entidades deverão utilizar identificadores UUID.
Isso permitirá:
criar registros no dispositivo sem depender do servidor;
evitar identificadores locais temporários;
reduzir remapeamentos durante a sincronização;
reenviar operações sem criar registros duplicados;
identificar entidades de forma consistente entre SQLite e PostgreSQL.
Separação entre modelo e execução
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
Versionamento imutável
Uma versão publicada de um modelo não poderá ser alterada de forma destrutiva.
Quando houver mudanças no checklist, uma nova versão deverá ser criada.
Isso garante que inspeções antigas continuem associadas ao conteúdo que estava válido no momento do agendamento.
Snapshot da inspeção
Cada inspeção possuirá uma cópia dos itens da versão utilizada.
Essa cópia será armazenada em InspectionItemSnapshot.
O snapshot preservará:
título da seção;
ordem da seção;
texto do item;
descrição;
tipo de resposta;
obrigatoriedade;
regras de observação;
regras de evidência;
opções de seleção;
ordem do item.
Preservação histórica
Entidades utilizadas por inspeções não deverão ser excluídas fisicamente pelo fluxo comum.
Deverão ser utilizados:
inativação;
exclusão lógica;
versionamento;
snapshots;
eventos de auditoria.
Estado de negócio e sincronização
O estado da inspeção deverá permanecer separado do estado de sincronização do dispositivo.
Exemplo:
Estado de negócio: EM_ANDAMENTO
Estado local: PENDENTE

Isso significa que a inspeção está sendo executada, mas possui alterações locais ainda não enviadas.
Arquivos fora do banco relacional
Fotografias e outros arquivos grandes não serão armazenados diretamente no PostgreSQL.
O banco guardará:
identificador da evidência;
tipo;
tamanho;
formato;
chave do arquivo;
vínculo com a inspeção;
vínculo com a resposta ou não conformidade;
datas de captura e envio.
O arquivo será mantido em armazenamento de objetos ou mecanismo equivalente.
Controle de concorrência
Entidades sujeitas a alterações concorrentes deverão possuir controle de versão otimista.
Exemplo:
version = 3

Uma atualização baseada na versão 2 deverá ser rejeitada ou tratada como conflito caso o servidor já esteja na versão 3.

10.3 Diagrama conceitual textual
USER
 ├── cria ou agenda ── N INSPECTION
 ├── executa ───────── N INSPECTION
 ├── revisa ────────── N INSPECTION_REVIEW
 └── realiza ações ─── N AUDIT_EVENT

CLIENT 1 ── N INSPECTION_SITE
INSPECTION_SITE 1 ── 0..N EQUIPMENT

INSPECTION_TEMPLATE 1 ── N INSPECTION_TEMPLATE_VERSION
INSPECTION_TEMPLATE_VERSION 1 ── N TEMPLATE_SECTION
TEMPLATE_SECTION 1 ── N TEMPLATE_ITEM

INSPECTION_TEMPLATE_VERSION 1 ── N INSPECTION

CLIENT 1 ── N INSPECTION
INSPECTION_SITE 1 ── N INSPECTION
EQUIPMENT 1 ── 0..N INSPECTION
USER 1 ── N INSPECTION

INSPECTION 1 ── N INSPECTION_ITEM_SNAPSHOT
INSPECTION_ITEM_SNAPSHOT 1 ── 0..1 INSPECTION_RESPONSE
INSPECTION_RESPONSE 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N NON_CONFORMITY
INSPECTION_RESPONSE 1 ── 0..N NON_CONFORMITY
NON_CONFORMITY 1 ── 0..N EVIDENCE

INSPECTION 1 ── 0..N INSPECTION_REVIEW
INSPECTION 1 ── N AUDIT_EVENT


10.4 Como interpretar as cardinalidades
Cardinalidade 1 ── N
Representa um relacionamento de um para muitos.
Exemplo:
CLIENT 1 ── N INSPECTION_SITE

Um cliente pode possuir vários locais de inspeção.
Cada local pertence a um cliente.
Cardinalidade 1 ── 0..N
Representa um relacionamento de um para zero ou muitos.
Exemplo:
INSPECTION_RESPONSE 1 ── 0..N EVIDENCE

Uma resposta pode não possuir evidências ou pode possuir várias evidências.
Cardinalidade 1 ── 0..1
Representa um relacionamento de um para zero ou um.
Exemplo:
INSPECTION_ITEM_SNAPSHOT 1 ── 0..1 INSPECTION_RESPONSE

Um item pode ainda não ter sido respondido ou pode possuir uma única resposta.

10.5 Estrutura organizacional
10.5.1 Client
A entidade Client representa a empresa, instituição ou organização atendida pela operação de inspeções.
Um cliente poderá possuir vários locais de inspeção.
CLIENT
    ├── INSPECTION_SITE
    ├── INSPECTION_SITE
    └── INSPECTION_SITE

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
name
string
Nome de exibição obrigatório
legal_name
string
Razão social opcional no MVP
document
string
Documento opcional e validado
email
string
Opcional
phone
string
Opcional
status
enum
ACTIVE ou INACTIVE
created_at
datetime
Gerado pelo servidor
updated_at
datetime
Gerado pelo servidor
version
integer
Controle otimista

Relacionamentos
CLIENT 1 ── N INSPECTION_SITE
CLIENT 1 ── N INSPECTION

Um cliente inativo continuará relacionado às inspeções históricas, mas não poderá ser selecionado em novos agendamentos.

10.5.2 InspectionSite
A entidade InspectionSite representa uma unidade, fábrica, loja, obra, depósito, prédio, setor ou outra localização pertencente ao cliente.
Exemplo
Cliente: Indústria Alfa
    ├── Unidade Sorocaba
    ├── Unidade Itu
    └── Unidade Campinas

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
client_id
UUID
Cliente proprietário
name
string
Obrigatório
description
string
Opcional
address_line
string
Endereço
city
string
Cidade
state
string
Estado
postal_code
string
CEP
latitude
decimal
Coordenada opcional
longitude
decimal
Coordenada opcional
contact_name
string
Responsável local opcional
contact_phone
string
Opcional
status
enum
ACTIVE ou INACTIVE
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Relacionamentos
CLIENT 1 ── N INSPECTION_SITE
INSPECTION_SITE 1 ── 0..N EQUIPMENT
INSPECTION_SITE 1 ── N INSPECTION

Todo local deverá pertencer a um cliente.

10.5.3 Equipment
A entidade Equipment representa o ativo físico que poderá ser identificado e inspecionado.
Exemplo
Unidade Sorocaba
    ├── Empilhadeira 01
    ├── Gerador 02
    ├── Compressor 03
    └── Extintor 15

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
site_id
UUID
Local ao qual pertence
name
string
Obrigatório
asset_number
string
Número patrimonial opcional
serial_number
string
Número de série opcional
manufacturer
string
Fabricante opcional
model
string
Modelo opcional
description
string
Opcional
qr_code
string
Único
status
enum
ACTIVE, INACTIVE ou DECOMMISSIONED
installed_at
date
Opcional
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Relacionamentos
INSPECTION_SITE 1 ── 0..N EQUIPMENT
EQUIPMENT 1 ── 0..N INSPECTION

No MVP, todo equipamento deverá pertencer a um local.
Uma inspeção poderá não possuir equipamento quando for destinada ao ambiente ou ao local como um todo.

10.6 Usuários e responsabilidades
10.6.1 User
A entidade User representa as pessoas autorizadas a utilizar o FieldOps.
Perfis previstos
ADMIN
SUPERVISOR
TECHNICIAN
CLIENT_VIEWER

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
name
string
Obrigatório
email
string
Obrigatório e único
password_hash
string
Nunca exposto pela API
role
enum
Perfil autorizado
status
enum
ACTIVE, INACTIVE ou BLOCKED
phone
string
Opcional
created_at
datetime
Gerado pelo servidor
updated_at
datetime
Gerado pelo servidor
version
integer
Controle otimista

Relacionamentos principais
USER
 ├── cria ou agenda → INSPECTION
 ├── executa → INSPECTION
 ├── supervisiona → INSPECTION
 ├── revisa → INSPECTION_REVIEW
 └── realiza → AUDIT_EVENT

Uma inspeção poderá possuir referências distintas para:
usuário que criou;
técnico responsável;
supervisor responsável;
usuário que cancelou;
usuário que aprovou ou reprovou.
A inativação de um usuário não excluirá seu histórico.

10.7 Modelos de inspeção

10.7.1 InspectionTemplate
A entidade InspectionTemplate representa a identidade lógica e reutilizável de um modelo de inspeção.
Exemplo:
Checklist de Inspeção de Extintores

Ela não representa diretamente uma versão publicada.
Campos
Campo
Tipo sugerido
Regra
id
UUID
Identidade lógica do modelo
title
string
Obrigatório
description
string
Opcional
category
string
Obrigatório
status
enum
DRAFT, ACTIVE ou INACTIVE
current_version
integer
Última versão publicada
created_by
UUID
Usuário criador
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista do registro

Relacionamento
INSPECTION_TEMPLATE 1 ── N INSPECTION_TEMPLATE_VERSION

Um modelo pode possuir várias versões.

10.7.2 InspectionTemplateVersion
A entidade InspectionTemplateVersion representa uma publicação imutável do modelo.
Exemplo
Checklist de Extintores
    ├── Versão 1
    ├── Versão 2
    └── Versão 3

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave da versão
template_id
UUID
Modelo lógico
version_number
integer
Sequencial por modelo
title_snapshot
string
Título preservado
description_snapshot
string
Descrição preservada
published_by
UUID
Usuário responsável
published_at
datetime
Data de publicação
active_for_new_inspections
boolean
Permite novos agendamentos
created_at
datetime
Auditoria

Relacionamentos
INSPECTION_TEMPLATE 1 ── N INSPECTION_TEMPLATE_VERSION
INSPECTION_TEMPLATE_VERSION 1 ── N TEMPLATE_SECTION
INSPECTION_TEMPLATE_VERSION 1 ── N INSPECTION

Cada inspeção deverá utilizar uma versão específica.
A versão utilizada não poderá ser alterada após a publicação.

10.7.3 TemplateSection
A entidade TemplateSection organiza os itens do checklist em grupos.
Exemplo
Checklist de Empilhadeira
    ├── Identificação
    ├── Condições externas
    ├── Sistema elétrico
    ├── Sistema hidráulico
    └── Resultado final

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
template_version_id
UUID
Versão proprietária
title
string
Obrigatório
description
string
Opcional
display_order
integer
Ordem explícita
created_at
datetime
Auditoria

Relacionamento
INSPECTION_TEMPLATE_VERSION 1 ── N TEMPLATE_SECTION

A seção pertence à versão publicada, e não diretamente ao modelo lógico.

10.7.4 TemplateItem
A entidade TemplateItem representa uma pergunta, verificação, instrução ou medição pertencente a uma seção.
Exemplo
Seção: Sistema elétrico
    ├── A bateria apresenta danos?
    ├── Os cabos estão corretamente isolados?
    ├── As luzes estão funcionando?
    └── A buzina está funcionando?

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
section_id
UUID
Seção proprietária
code
string
Código legível opcional
title
string
Pergunta ou instrução
description
string
Texto de ajuda opcional
response_type
enum
Tipo da resposta
required
boolean
Define obrigatoriedade
observation_required_on_failure
boolean
Exige observação na falha
evidence_required_on_failure
boolean
Exige evidência na falha
options_json
JSON
Alternativas e configurações
display_order
integer
Ordem explícita
created_at
datetime
Auditoria

Tipos de resposta do MVP
TEXT_SHORT
TEXT_LONG
NUMBER
BOOLEAN
CONFORMITY
SINGLE_CHOICE
DATE

Relacionamento
TEMPLATE_SECTION 1 ── N TEMPLATE_ITEM


10.7.5 Exemplo completo de modelo
INSPECTION_TEMPLATE
Checklist de Extintores

    └── INSPECTION_TEMPLATE_VERSION
        Versão 2

            ├── TEMPLATE_SECTION
            │   Identificação
            │       ├── Número do patrimônio
            │       └── Localização
            │
            ├── TEMPLATE_SECTION
            │   Condições físicas
            │       ├── O lacre está intacto?
            │       ├── O manômetro está na faixa verde?
            │       └── Existe corrosão?
            │
            └── TEMPLATE_SECTION
                Evidências
                    └── Fotografar o extintor


10.8 Execução da inspeção
10.8.1 Inspection
A entidade Inspection representa uma execução real de um checklist.
Ela estará relacionada:
a uma versão publicada;
a um cliente;
a um local;
opcionalmente a um equipamento;
a um técnico;
a um supervisor;
a uma data prevista;
a um estado de negócio.
Campos
Campo
Tipo sugerido
Regra
id
Tipo sugerido
Regra
id
UUID
Identificador global
template_version_id
UUID
Versão utilizada
client_id
UUID
Cliente
site_id
UUID
Local
equipment_id
UUID
Opcional conforme o tipo
technician_id
UUID
Técnico responsável
supervisor_id
UUID
Supervisor responsável
created_by
UUID
Usuário que criou ou agendou
title
string
Nome de apresentação
instructions
string
Orientações adicionais
priority
enum
LOW, MEDIUM, HIGH ou CRITICAL
status
enum
Estado de negócio
scheduled_for
datetime
Data prevista
started_at_device
datetime
Horário registrado no dispositivo
started_at_server
datetime
Horário recebido pelo servidor
completed_at_device
datetime
Horário registrado no dispositivo
submitted_at_server
datetime
Horário confirmado pelo servidor
approved_at
datetime
Data de aprovação
canceled_at
datetime
Data do cancelamento
canceled_by
UUID
Usuário que cancelou
canceled_reason
string
Obrigatório no cancelamento
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Estados de negócio
DRAFT
ASSIGNED
IN_PROGRESS
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
CANCELED

Relacionamentos
INSPECTION_TEMPLATE_VERSION 1 ── N INSPECTION
CLIENT 1 ── N INSPECTION
INSPECTION_SITE 1 ── N INSPECTION
EQUIPMENT 1 ── 0..N INSPECTION
USER 1 ── N INSPECTION

Uma inspeção poderá estar relacionada a um equipamento ou somente ao local.

10.8.2 Criação da inspeção
Ao confirmar o agendamento, a API deverá:
validar cliente, local, equipamento, técnico e supervisor;
validar que a versão do modelo está publicada;
criar a inspeção;
copiar as seções e os itens da versão;
criar os registros de InspectionItemSnapshot;
registrar o evento de auditoria;
disponibilizar a inspeção para sincronização pelo técnico.

10.8.3 InspectionItemSnapshot
A entidade InspectionItemSnapshot preserva o conteúdo do checklist utilizado pela inspeção.
Por que o snapshot é necessário
Considere a pergunta original:
O extintor está dentro da validade?

Em uma versão futura, ela pode ser alterada para:
O extintor está dentro da validade indicada no selo?

A inspeção antiga deverá continuar exibindo a pergunta original.
Sem o snapshot, um relatório histórico poderia apresentar um texto diferente daquele que o técnico respondeu.
Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
inspection_id
UUID
Inspeção proprietária
source_template_item_id
UUID
Referência histórica opcional
section_title
string
Texto preservado
section_description
string
Descrição preservada
section_order
integer
Ordem preservada
item_code
string
Código preservado
item_title
string
Texto preservado
item_description
string
Ajuda preservada
response_type
enum
Tipo preservado
required
boolean
Obrigatoriedade preservada
rules_json
JSON
Configurações preservadas
options_json
JSON
Alternativas preservadas
item_order
integer
Ordem preservada
created_at
datetime
Data de criação do snapshot

Relacionamento
INSPECTION 1 ── N INSPECTION_ITEM_SNAPSHOT

Uma inspeção terá um snapshot para cada item do checklist.

10.8.4 InspectionResponse
A entidade InspectionResponse armazena a resposta fornecida para um item do snapshot.
Cardinalidade
INSPECTION_ITEM_SNAPSHOT 1 ── 0..1 INSPECTION_RESPONSE

Um item poderá:
não possuir resposta enquanto estiver pendente;
possuir uma resposta depois de preenchido.
Não deverão existir duas respostas atuais para o mesmo item.
Restrição recomendada
UNIQUE(inspection_item_id)

Campos
Campo
Tipo sugerido
Regra
id
UUID
Gerável no dispositivo
inspection_id
UUID
Inspeção
inspection_item_id
UUID
Item do snapshot
value_text
string
Valor textual
value_number
decimal
Valor numérico
value_boolean
boolean
Valor lógico
value_date
date
Data
value_json
JSON
Seleções ou estruturas adicionais
observation
string
Comentário do técnico
conformity
enum
NOT_APPLICABLE, CONFORMING ou NON_CONFORMING
answered_by
UUID
Técnico
answered_at_device
datetime
Horário do dispositivo
server_received_at
datetime
Horário de recebimento
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Exemplos
Resposta lógica
Pergunta: O lacre está intacto?
Resposta: Sim

Resposta numérica
Pergunta: Qual é a pressão medida?
Resposta: 8,5

Resposta textual
Pergunta: Descreva a irregularidade.
Resposta: Cabo elétrico com isolamento danificado.

10.9 Evidências
10.9.1 Evidence
A entidade Evidence representa um arquivo ou registro utilizado para comprovar uma resposta ou ocorrência.
No MVP, o principal tipo será fotografia.
Possíveis vínculos
Uma evidência poderá estar relacionada:
diretamente à inspeção;
a uma resposta;
a uma não conformidade.
Relacionamentos
INSPECTION 1 ── 0..N EVIDENCE
INSPECTION_RESPONSE 1 ── 0..N EVIDENCE
NON_CONFORMITY 1 ── 0..N EVIDENCE

Uma evidência sempre pertencerá a uma inspeção.
Os vínculos com resposta e não conformidade serão opcionais conforme o contexto.
Campos
Campo
Tipo sugerido
Regra
id
UUID
Gerável no dispositivo
inspection_id
UUID
Obrigatório
response_id
UUID
Opcional
non_conformity_id
UUID
Opcional
type
enum
PHOTO no MVP
storage_key
string
Referência no serviço de arquivos
local_uri
string
Somente no banco local
original_file_name
string
Opcional e não utilizado como identificador
mime_type
string
Formato validado
size_bytes
long
Tamanho do arquivo
checksum
string
Integridade e deduplicação opcional
description
string
Opcional
latitude
decimal
Opcional
longitude
decimal
Opcional
captured_at_device
datetime
Horário da captura
server_received_at
datetime
Recebimento dos metadados
uploaded_at
datetime
Confirmação do arquivo
created_by
UUID
Técnico
created_at
datetime
Auditoria

Exemplo
Pergunta:
A bateria está em boas condições?

Resposta:
Não

Evidências:
    ├── Foto geral da bateria
    └── Foto aproximada dos terminais com corrosão

O arquivo local não poderá ser removido enquanto o servidor não confirmar o upload.

10.10 Não conformidades
10.10.1 NonConformity
A entidade NonConformity representa um problema, desvio ou irregularidade identificada durante a inspeção.
Exemplo
Inspeção da Empilhadeira 01
    ├── Pneu dianteiro desgastado
    ├── Buzina não funciona
    └── Vazamento hidráulico

Campos
Campo
Tipo sugerido
Regra
id
UUID
Gerável no dispositivo
inspection_id
UUID
Obrigatório
inspection_item_id
UUID
Item relacionado opcional
response_id
UUID
Resposta relacionada opcional
title
string
Obrigatório
description
string
Obrigatório
severity
enum
LOW, MEDIUM, HIGH ou CRITICAL
status
enum
OPEN no MVP
created_by
UUID
Técnico
created_at_device
datetime
Data de campo
server_received_at
datetime
Data de recebimento
created_at
datetime
Auditoria
updated_at
datetime
Auditoria
version
integer
Controle otimista

Relacionamentos
INSPECTION 1 ── 0..N NON_CONFORMITY
INSPECTION_RESPONSE 1 ── 0..N NON_CONFORMITY
NON_CONFORMITY 1 ── 0..N EVIDENCE

A associação com a resposta permite localizar diretamente:
a pergunta;
a resposta;
a observação;
as evidências;
a não conformidade gerada.
Exemplo completo
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


10.11 Revisão da inspeção
10.11.1 InspectionReview
A entidade InspectionReview registra cada ciclo de revisão executado por um supervisor.
Uma inspeção poderá ser revisada mais de uma vez.
Exemplo
1. Técnico envia a inspeção
2. Supervisor solicita correção
3. Técnico corrige
4. Supervisor revisa novamente
5. Supervisor aprova

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
inspection_id
UUID
Inspeção revisada
reviewer_id
UUID
Supervisor
decision
enum
APPROVED ou REJECTED
reason
string
Obrigatório na reprovação
comments
string
Opcional
reviewed_at
datetime
Data do servidor
review_cycle
integer
Número da rodada
created_at
datetime
Auditoria

Relacionamento
INSPECTION 1 ── 0..N INSPECTION_REVIEW

Exemplo de registros
Ciclo
Responsável
Decisão
1
Supervisor João
REJECTED
2
Supervisor João
APPROVED

Não deverão ser utilizados apenas campos como approved_by para representar todo o processo, pois isso eliminaria o histórico das revisões anteriores.

10.12 Auditoria
10.12.1 AuditEvent
A entidade AuditEvent registra as ações relevantes realizadas no sistema.
Exemplos de eventos
INSPECTION_CREATED
INSPECTION_ASSIGNED
INSPECTION_STARTED
RESPONSE_CREATED
RESPONSE_UPDATED
EVIDENCE_ADDED
EVIDENCE_REMOVED
NON_CONFORMITY_CREATED
INSPECTION_COMPLETED
INSPECTION_SUBMITTED
REVIEW_STARTED
INSPECTION_APPROVED
INSPECTION_REJECTED
INSPECTION_CANCELED

Campos
Campo
Tipo sugerido
Regra
id
UUID
Chave primária
inspection_id
UUID
Inspeção relacionada, quando aplicável
actor_id
UUID
Usuário responsável, quando conhecido
action
string
Ação realizada
entity_type
string
Tipo da entidade afetada
entity_id
UUID
Identificador afetado
occurred_at
datetime
Data do servidor
device_occurred_at
datetime
Data do dispositivo, quando aplicável
previous_value_json
JSON
Estado anterior não sensível
new_value_json
JSON
Novo estado não sensível
metadata_json
JSON
Metadados adicionais
request_id
string
Correlação técnica
device_id
string
Dispositivo, quando aplicável

Relacionamento
INSPECTION 1 ── N AUDIT_EVENT

Exemplo de histórico
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

10.13 Estruturas locais do aplicativo mobile
O SQLite deverá armazenar os dados necessários para que o técnico execute as inspeções sem conexão.
10.13.1 Dados centrais replicados localmente
O aplicativo poderá manter representações locais de:
usuário autenticado;
cliente relacionado;
local relacionado;
equipamento relacionado;
inspeções atribuídas;
snapshots dos itens;
respostas;
evidências;
não conformidades;
revisões e solicitações de correção.
A base local não será uma cópia completa do PostgreSQL.
Somente os dados autorizados e necessários ao técnico serão baixados.

10.13.2 Estado local das entidades
Entidades sincronizáveis poderão possuir metadados locais adicionais.
Campo local
Finalidade
local_sync_status
Indicar sincronizado, pendente, erro ou conflito
is_dirty
Informar se existem alterações locais
last_synced_at
Data da última confirmação
base_version
Versão do servidor usada como base
local_updated_at
Última alteração no dispositivo
sync_error
Último erro sanitizado
deleted_locally
Exclusão lógica ainda não confirmada

Esses campos não precisam existir da mesma forma no PostgreSQL.

10.13.3 SyncOperation
A entidade local SyncOperation representa uma operação pendente na outbox.
Cada alteração sincronizável deverá gerar ou atualizar uma operação.
Campos
Campo
Tipo sugerido
Regra
operation_id
UUID
Chave idempotente
entity_type
string
Tipo da entidade
entity_id
UUID
Registro afetado
operation_type
enum
CREATE, UPDATE, DELETE_LOGICAL, TRANSITION ou UPLOAD
base_version
integer
Versão usada como base
payload_json
JSON
Dados necessários
dependency_ids
JSON
Operações que devem ser concluídas antes
status
enum
PENDING, PROCESSING, FAILED, CONFLICT ou COMPLETED
attempt_count
integer
Número de tentativas
last_error
string
Mensagem sanitizada
created_at
datetime
Data local
updated_at
datetime
Última alteração
last_attempt_at
datetime
Última tentativa
completed_at
datetime
Confirmação local

Exemplo de dependência
Operação 1: criar resposta
        ↓
Operação 2: enviar fotografia vinculada à resposta

A operação de upload não deverá ser enviada antes da criação da resposta relacionada.

10.13.4 SyncMetadata
A estrutura SyncMetadata armazena informações gerais da sincronização local.
Campos
Campo
Tipo sugerido
Regra
user_id
UUID
Usuário da base local
device_id
UUID
Identificador da instalação
last_pull_cursor
string
Cursor de alterações do servidor
last_sync_started_at
datetime
Início da última tentativa
last_successful_sync
datetime
Última sincronização completa
last_sync_result
enum
SUCCESS, PARTIAL ou FAILED
pending_operations
integer
Quantidade pendente, quando mantida
schema_version
integer
Versão do banco local

O cursor somente deverá ser atualizado após as alterações recebidas serem gravadas com sucesso no SQLite.

10.14 Fluxo de persistência offline
10.14.1 Download inicial
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

10.14.2 Salvamento de resposta
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
10.14.3 Salvamento de evidência
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
10.14.4 Conclusão offline
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

10.14.5 Envio da outbox
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


10.15 Regras de integridade
10.15.1 Restrições obrigatórias
Deverão existir restrições para garantir:
e-mail de usuário único;
QR Code de equipamento único;
número da versão único dentro do modelo;
ordem de seção coerente dentro da versão;
ordem de item coerente dentro da seção;
no máximo uma resposta atual por item do snapshot;
vínculo válido entre cliente, local e equipamento;
vínculo válido entre inspeção e versão publicada;
vínculo da resposta com item pertencente à mesma inspeção;
vínculo da evidência com a inspeção correta;
vínculo da não conformidade com a inspeção correta;
identificador de operação de sincronização único.
10.15.2 Índices recomendados
User
UNIQUE(email)
INDEX(status)
INDEX(role)

Equipment
UNIQUE(qr_code)
INDEX(site_id)
INDEX(status)
INDEX(asset_number)

Inspection
INDEX(technician_id, status)
INDEX(supervisor_id, status)
INDEX(client_id)
INDEX(site_id)
INDEX(equipment_id)
INDEX(scheduled_for)
INDEX(status, scheduled_for)

InspectionItemSnapshot
INDEX(inspection_id)
INDEX(inspection_id, section_order, item_order)

InspectionResponse
UNIQUE(inspection_item_id)
INDEX(inspection_id)
INDEX(answered_by)

Evidence
INDEX(inspection_id)
INDEX(response_id)
INDEX(non_conformity_id)
INDEX(uploaded_at)

NonConformity
INDEX(inspection_id)
INDEX(severity)
INDEX(status)

AuditEvent
INDEX(entity_type, entity_id)
INDEX(inspection_id)
INDEX(actor_id)
INDEX(occurred_at)
INDEX(request_id)


10.16 Exclusão, inativação e histórico
Exclusão lógica
Deverão ser inativados, em vez de excluídos fisicamente:
usuários;
clientes;
locais;
equipamentos;
modelos de inspeção.
Registros históricos
Não deverão ser excluídos pelo fluxo comum:
versões publicadas;
inspeções;
snapshots;
respostas sincronizadas;
revisões;
eventos de auditoria.
Evidências
A exclusão de uma evidência sincronizada deverá:
validar o estado da inspeção;
validar a permissão do usuário;
registrar auditoria;
remover ou bloquear o acesso ao objeto;
preservar os metadados necessários para rastreabilidade.

10.17 Exemplo completo
Contexto
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
Inspeção #2026-00045

Itens do snapshot
1. O nível de óleo está adequado?
2. Existem vazamentos?
3. A bateria está em boas condições?
4. O gerador iniciou corretamente?

Respostas
1. Sim
2. Não existem vazamentos
3. Não
4. Sim

Evidências da bateria
- Foto geral da bateria
- Foto aproximada dos terminais

Não conformidade
Título:
Corrosão nos terminais da bateria

Descrição:
Foram identificados sinais de corrosão nos terminais.

Gravidade:
HIGH

Status:
OPEN

Revisão
Ciclo: 1
Decisão: APPROVED
Comentário: Inspeção aprovada com não conformidade aberta.

Eventos de auditoria
- Inspeção criada
- Snapshot gerado
- Inspeção atribuída
- Inspeção iniciada
- Respostas registradas
- Evidências adicionadas
- Não conformidade criada
- Inspeção concluída
- Dados sincronizados
- Revisão iniciada
- Inspeção aprovada


10.18 Resumo das entidades
Entidade
Responsabilidade
User
Representar usuários, perfis e responsáveis pelas ações
Client
Representar a organização atendida
InspectionSite
Representar o local onde a inspeção ocorre
Equipment
Representar o ativo físico inspecionado
InspectionTemplate
Representar a identidade lógica do checklist
InspectionTemplateVersion
Representar uma publicação imutável do modelo
TemplateSection
Organizar os itens da versão em grupos
TemplateItem
Definir perguntas, verificações e regras
Inspection
Representar uma execução agendada do checklist
InspectionItemSnapshot
Preservar os itens utilizados na execução
InspectionResponse
Armazenar a resposta do técnico
Evidence
Armazenar metadados de fotografias e arquivos
NonConformity
Registrar problemas encontrados
InspectionReview
Registrar ciclos de revisão e decisões
AuditEvent
Registrar ações e mudanças relevantes
SyncOperation
Representar operações pendentes da outbox
SyncMetadata
Armazenar o estado geral da sincronização local


10.19 Decisões consolidadas do modelo
O PostgreSQL será a fonte oficial após a sincronização.
O SQLite será uma persistência operacional, e não apenas um cache descartável.
Todas as entidades sincronizáveis utilizarão UUID.
O modelo de inspeção possuirá versões publicadas imutáveis.
Seções e itens pertencerão à versão publicada.
Cada inspeção utilizará uma única versão do modelo.
Cada inspeção possuirá snapshots dos itens.
Cada item do snapshot poderá possuir no máximo uma resposta atual.
Uma resposta poderá possuir nenhuma ou várias evidências.
A evidência sempre estará vinculada a uma inspeção.
A não conformidade poderá ser vinculada à resposta que a originou.
Uma inspeção poderá passar por vários ciclos de revisão.
Alterações críticas serão registradas por eventos de auditoria.
O estado de negócio permanecerá separado do estado de sincronização.
Operações offline serão registradas em uma outbox persistente.
Operações de sincronização serão idempotentes.
Arquivos serão sincronizados separadamente dos dados estruturados.
O aplicativo não descartará silenciosamente dados locais pendentes.
Registros históricos serão preservados por versionamento, snapshot, inativação e auditoria.




11 - Arquitetura
11. Arquitetura
11.1 Visão arquitetural
O FieldOps adotará uma arquitetura distribuída composta por aplicações independentes que compartilham um contrato de API.
┌─────────────────────────────┐ │ Aplicativo Mobile │ │ Expo + React Native │ │ SQLite + Secure Store │ └──────────────┬──────────────┘ │ HTTPS / JSON / Multipart ▼ ┌─────────────────────────────┐ │ API REST │ │ Java + Spring Boot │ │ Segurança + Regras │ └───────┬──────────────┬──────┘ │ │ ▼ ▼ ┌──────────────┐ ┌──────────────────┐ │ PostgreSQL │ │ Armazenamento de │ │ Dados │ │ evidências │ └──────────────┘ └──────────────────┘ ▲ │ HTTPS / JSON ┌───────┴─────────────────────┐ │ Interface Administrativa │ │ Angular + TypeScript │ └─────────────────────────────┘
​
11.2 Princípios arquiteturais
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
11.3 Contextos funcionais
Identidade e acesso
Responsável por usuários, perfis, autenticação, tokens e autorização.
Cadastros
Responsável por clientes, locais e equipamentos.
Modelos de inspeção
Responsável por rascunhos, seções, itens, tipos de resposta e publicação de versões.
Planejamento
Responsável por criação, agendamento, atribuição e cancelamento de inspeções.
Execução de campo
Responsável por início, respostas, evidências, localização, QR Code e conclusão.
Sincronização
Responsável por lotes, idempotência, cursores, conflitos e confirmação de operações.
Revisão
Responsável por análise, aprovação, reprovação e ciclos de correção.
Auditoria e indicadores
Responsável por histórico, métricas e rastreabilidade.
11.4 Arquitetura do aplicativo mobile (Sugestão)
Estrutura sugerida:
src/ ├── app/ # Rotas do Expo Router ├── features/ │ ├── auth/ │ ├── home/ │ ├── inspections/ │ ├── checklist/ │ ├── evidence/ │ ├── scanner/ │ ├── location/ │ └── synchronization/ ├── components/ # Componentes compartilhados ├── design-system/ # Tokens, tema e componentes visuais ├── application/ # Casos de uso e orquestração ├── domain/ # Tipos e regras independentes da interface ├── infrastructure/ │ ├── api/ │ ├── database/ │ ├── repositories/ │ ├── storage/ │ └── sync/ ├── hooks/ ├── schemas/ ├── utils/ └── config/
​
Responsabilidades por camada
Rotas e telas: navegação, composição e estados visuais.
Features: organização por capacidade de negócio.
Aplicação: coordenação de ações como iniciar, salvar, concluir e sincronizar.
Domínio: tipos, estados e validações independentes da plataforma.
Infraestrutura: API, SQLite, armazenamento de arquivos e conectividade.
Design system: consistência visual e acessibilidade.
11.5 Arquitetura da interface administrativa
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
11.6 Arquitetura da API Spring Boot
Estrutura sugerida por domínio ou feature:
com.fieldops ├── auth/ ├── user/ ├── client/ ├── site/ ├── equipment/ ├── template/ ├── inspection/ ├── evidence/ ├── synchronization/ ├── review/ ├── audit/ └── shared/
​
Cada feature poderá conter:
controller/ application/ domain/ repository/ dto/ mapper/ validation/
​
Responsabilidades
Controller: transporte HTTP e conversão de entrada e saída.
Application/Service: orquestração dos casos de uso.
Domain: regras e transições de estado.
Repository: acesso aos dados.
DTO: contrato externo, separado das entidades JPA.
Validation: validações de negócio adicionais.
Mapper: conversão explícita entre camadas.
11.7 Persistência central
PostgreSQL como banco relacional.
Migrações versionadas.
Índices para e-mail, QR Code, estados, técnico e datas.
Restrições de unicidade no banco para regras críticas.
Controle otimista com campo de versão onde necessário.
Exclusão lógica para entidades históricas.
Transações em casos de uso que alteram múltiplas entidades.
11.8 Armazenamento de evidências
O banco armazenará metadados e a chave do objeto.
Em desenvolvimento poderá ser utilizado armazenamento local controlado ou serviço compatível com S3.
Em produção, recomenda-se armazenamento de objetos.
O acesso deverá ocorrer por endpoint autorizado ou URL temporária, evitando exposição pública permanente.
Uploads deverão validar formato, tamanho e vínculo com a inspeção.
11.9 Estratégia offline-first
Dados baixados
O aplicativo armazenará somente os dados necessários ao técnico:
perfil mínimo;
inspeções atribuídas;
cliente e local relacionados;
equipamento relacionado;
snapshot dos itens;
respostas existentes;
revisões e solicitações de correção pertinentes.
Escrita local
Toda alteração de campo será gravada primeiro no SQLite. A interface não dependerá de uma resposta imediata da rede para considerar a alteração salva localmente.
Outbox
Cada alteração sincronizável criará uma operação com:
identificador idempotente;
tipo de entidade;
identificador global;
tipo de operação;
payload;
dependências;
número de tentativas;
estado e erro.
Envio
Operações serão ordenadas por dependência.
Dados estruturados poderão ser enviados antes dos arquivos.
A API retornará resultado individual por operação.
Operações confirmadas sairão da fila ativa.
Falhas permanecerão disponíveis para nova tentativa.
Download de alterações
A API disponibilizará alterações desde um cursor ou instante confiável.
O aplicativo atualizará a base local após concluir o envio ou de forma independente.
O cursor será atualizado somente após persistência local bem-sucedida.
Conflitos
No MVP:
inspeções aprovadas no servidor não aceitarão alterações atrasadas comuns;
versões divergentes gerarão conflito explícito;
a aplicação não descartará silenciosamente o valor local;
casos complexos poderão exigir nova inspeção ou ação administrativa.
11.10 Segurança
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
11.11 Observabilidade
O MVP deverá oferecer:
identificador de correlação por requisição;
logs de autenticação sem conteúdo sensível;
logs de falha de sincronização;
auditoria de transições de estado;
registro de upload com identificador da evidência;
tratamento global de exceções;
mensagens amigáveis na interface e detalhes técnicos controlados no servidor.
11.12 Ambientes
Ambiente
Finalidade
Local
Desenvolvimento individual.
Integração
Integração contínua entre mobile, web e API.
Teste/Demonstração
Avaliação e apresentação.
Produção acadêmica
Opcional, com acesso controlado.

Cada ambiente deverá possuir:
URL própria da API;
configuração de banco;
configuração de armazenamento;
credenciais separadas;
dados de teste adequados;
indicação visual quando necessário.
11.13 CI/CD e qualidade
Pipelines sugeridos:
API
compilação;
testes;
análise estática;
criação de imagem de contêiner;
publicação no ambiente de integração.
Interface administrativa
instalação reproduzível;
lint;
testes;
build;
publicação estática.
Aplicativo mobile
verificação de tipos;
lint;
testes;
validação de configuração;
build de distribuição com EAS no marco final.
11.14 Requisitos não funcionais arquiteturais
ID
Requisito
RNF-001
A aplicação mobile deverá preservar dados pendentes após reinicialização.
RNF-002
A API deverá responder erros em formato padronizado.
RNF-003
Listagens administrativas deverão utilizar paginação.
RNF-004
O aplicativo deverá apresentar estados de carregamento, vazio, erro e offline.
RNF-005
Operações de sincronização deverão ser idempotentes.
RNF-006
A interface mobile deverá ser utilizável em telas Android comuns.
RNF-007
A interface administrativa deverá ser responsiva para notebook e desktop.
RNF-008
O contrato da API deverá ser documentado.
RNF-009
O código deverá passar por análise de tipos e lint.
RNF-010
Dados sensíveis não deverão ser incluídos no repositório.
RNF-011
Alterações críticas deverão ser auditáveis.
RNF-012
Os componentes deverão poder ser executados por instruções documentadas.


12 - API REST
12. API REST
12.1 Convenções gerais
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
12.2 Estrutura de erro sugerida
{ "timestamp": "2026-08-01T14:30:00Z", "status": 422, "code": "INSPECTION_REQUIRED_ITEMS_MISSING", "message": "A inspeção possui itens obrigatórios sem resposta.", "path": "/api/v1/inspections/00000000-0000-0000-0000-000000000000/submit", "requestId": "req-123", "fieldErrors": [ { "field": "responses", "message": "Existem 2 itens obrigatórios pendentes." } ] }
​
12.3 Códigos HTTP esperados
Código
Uso
200
Consulta ou alteração concluída.
201
Recurso criado.
204
Operação concluída sem corpo.
400
Requisição malformada.
401
Sessão ausente ou inválida.
403
Usuário autenticado sem permissão.
404
Recurso não encontrado ou não visível ao usuário.
409
Conflito de estado, versão ou unicidade.
413
Arquivo acima do limite.
415
Formato de arquivo não suportado.
422
Regra de negócio ou validação semântica não atendida.
500
Falha interna não prevista, sem exposição de detalhes sensíveis.

12.4 Autenticação
POST /api/v1/auth/login POST /api/v1/auth/refresh POST /api/v1/auth/logout GET /api/v1/auth/me
​
Exemplo de login
{ "email": "tecnico@fieldops.local", "password": "senha-informada-pelo-usuario" }
​
Exemplo de resposta
{ "accessToken": "token", "refreshToken": "token-de-renovacao", "expiresIn": 900, "user": { "id": "8a50e30d-2a58-4a24-944e-10a9948abf01", "name": "Carlos Técnico", "email": "tecnico@fieldops.local", "role": "TECHNICIAN" } }
​
12.5 Usuários
GET /api/v1/users GET /api/v1/users/{id} POST /api/v1/users PUT /api/v1/users/{id} PATCH /api/v1/users/{id}/status POST /api/v1/users/{id}/reset-password
​
Filtros sugeridos:
name;
email;
role;
status.
12.6 Clientes
GET /api/v1/clients GET /api/v1/clients/{id} POST /api/v1/clients PUT /api/v1/clients/{id} PATCH /api/v1/clients/{id}/status
​
12.7 Locais
GET /api/v1/sites GET /api/v1/sites/{id} GET /api/v1/clients/{clientId}/sites POST /api/v1/sites PUT /api/v1/sites/{id} PATCH /api/v1/sites/{id}/status
​
12.8 Equipamentos
GET /api/v1/equipment GET /api/v1/equipment/{id} GET /api/v1/equipment/by-qr/{qrCode} GET /api/v1/sites/{siteId}/equipment POST /api/v1/equipment PUT /api/v1/equipment/{id} PATCH /api/v1/equipment/{id}/status
​
12.9 Modelos de inspeção
GET /api/v1/inspection-templates GET /api/v1/inspection-templates/{id} POST /api/v1/inspection-templates PUT /api/v1/inspection-templates/{id} POST /api/v1/inspection-templates/{id}/sections PUT /api/v1/inspection-templates/{id}/sections/{sectionId} POST /api/v1/inspection-templates/{id}/sections/{sectionId}/items PUT /api/v1/inspection-templates/{id}/items/{itemId} POST /api/v1/inspection-templates/{id}/publish GET /api/v1/inspection-templates/{id}/versions GET /api/v1/inspection-template-versions/{versionId}
​
Exemplo resumido de item
{ "title": "A proteção do equipamento está íntegra?", "description": "Verifique trincas, ausência de parafusos e partes soltas.", "responseType": "CONFORMITY", "required": true, "observationRequiredOnFailure": true, "evidenceRequiredOnFailure": true, "displayOrder": 3 }
​
12.10 Inspeções
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
Endpoints direcionados ao técnico
GET /api/v1/mobile/inspections GET /api/v1/mobile/inspections/{id}
​
A API deverá filtrar os dados pelo usuário autenticado, sem depender apenas de technicianId informado pelo cliente.
12.11 Respostas
GET /api/v1/inspections/{inspectionId}/responses PUT /api/v1/inspections/{inspectionId}/responses/{responseId} POST /api/v1/inspections/{inspectionId}/responses:batch
​
Exemplo de resposta do checklist
{ "id": "62327a9a-ec19-46a2-89ae-b49086b657f9", "inspectionItemId": "ab18a638-1c45-4a15-a444-b4235506e912", "valueBoolean": false, "conformity": "NON_CONFORMING", "observation": "Proteção lateral apresenta trinca.", "answeredAtDevice": "2026-08-01T10:12:30-03:00", "baseVersion": 0 }
​
12.12 Evidências
POST /api/v1/inspections/{inspectionId}/evidence GET /api/v1/inspections/{inspectionId}/evidence GET /api/v1/evidence/{id} DELETE /api/v1/evidence/{id}
​
Metadados mínimos do upload:
identificador idempotente;
inspeção;
resposta ou não conformidade relacionada;
tipo;
data de captura;
descrição opcional.
12.13 Não conformidades
GET /api/v1/non-conformities GET /api/v1/non-conformities/{id} POST /api/v1/inspections/{inspectionId}/non-conformities PUT /api/v1/non-conformities/{id} PATCH /api/v1/non-conformities/{id}/status
​
12.14 Revisões
GET /api/v1/inspections/{inspectionId}/reviews POST /api/v1/inspections/{inspectionId}/begin-review POST /api/v1/inspections/{inspectionId}/approve POST /api/v1/inspections/{inspectionId}/reject
​
Exemplo de reprovação
{ "reason": "A fotografia do item 4 não permite identificar o número de série.", "itemsToCorrect": [ "ab18a638-1c45-4a15-a444-b4235506e912" ] }
​
12.15 Sincronização
POST /api/v1/mobile/sync/push GET /api/v1/mobile/sync/pull?cursor={cursor} POST /api/v1/mobile/sync
​
O projeto poderá utilizar um endpoint combinado ou endpoints separados. O contrato escolhido deverá ser único e documentado.
Exemplo resumido de lote
{ "deviceId": "b38f54fd-6d7c-4249-b80f-5d0362103f82", "lastPullCursor": "cursor-anterior", "operations": [ { "operationId": "5f30d6de-a4e0-4da8-b1c1-2acbd6f2850e", "entityType": "INSPECTION_RESPONSE", "entityId": "62327a9a-ec19-46a2-89ae-b49086b657f9", "operationType": "UPSERT", "baseVersion": 0, "payload": { "inspectionItemId": "ab18a638-1c45-4a15-a444-b4235506e912", "conformity": "NON_CONFORMING", "observation": "Proteção lateral apresenta trinca." } } ] }
​
Exemplo resumido de resultado
{ "results": [ { "operationId": "5f30d6de-a4e0-4da8-b1c1-2acbd6f2850e", "status": "APPLIED", "entityVersion": 1 } ], "changes": [], "nextCursor": "novo-cursor", "serverTime": "2026-08-01T14:15:00Z" }
​
Estados por operação
APPLIED;
ALREADY_APPLIED;
REJECTED;
CONFLICT;
DEPENDENCY_FAILED.
12.16 Indicadores
GET /api/v1/dashboard/summary GET /api/v1/dashboard/inspections-by-status GET /api/v1/dashboard/non-conformities-by-severity
​
Indicadores são P1, mas um resumo básico poderá entrar no MVP administrativo.
12.17 Contrato entre disciplinas
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
12.18 Compatibilidade e evolução
Mudanças incompatíveis deverão gerar nova versão ou planejamento explícito de migração.
Campos novos opcionais não deverão quebrar clientes existentes.
Valores de enum deverão ser tratados de forma controlada.
O mobile deverá informar sua versão quando necessário para diagnóstico.
A API poderá recusar versões incompatíveis com mensagem clara.


13 - Aplicativo Mobile
13. Aplicativo Mobile
13.1 Objetivo
Oferecer ao técnico uma ferramenta confiável para receber e executar inspeções em campo, com interface simples, recursos nativos e funcionamento offline.
13.2 Usuário principal
Técnico de campo.
Usuários secundários poderão utilizar o aplicativo para testes ou execução excepcional, mas a experiência será projetada para o técnico.
13.3 Mapa de navegação sugerido
app/ ├── _layout.tsx ├── (public)/ │ └── login.tsx └── (protected)/ ├── _layout.tsx ├── (tabs)/ │ ├── index.tsx # Início │ ├── inspections.tsx # Lista │ ├── sync.tsx # Sincronização │ └── profile.tsx # Perfil ├── inspections/ │ ├── [inspectionId]/index.tsx # Detalhes │ ├── [inspectionId]/start.tsx │ ├── [inspectionId]/checklist.tsx │ ├── [inspectionId]/summary.tsx │ └── [inspectionId]/non-conformities.tsx ├── scanner.tsx ├── evidence/ │ ├── capture.tsx │ └── preview.tsx └── sync/ └── details.tsx
​
13.4 Catálogo de telas
Login
e-mail;
senha;
ação entrar;
carregamento;
erro de credenciais;
indicação de indisponibilidade de rede;
informação sobre acesso offline, quando disponível.
Início
saudação e usuário;
inspeções do dia;
inspeções atrasadas;
inspeções em andamento;
pendências de sincronização;
ação rápida para sincronizar;
ação rápida para QR Code.
Lista de inspeções
pesquisa local;
filtros por estado, data e prioridade;
cartões com cliente, local, equipamento, prazo e estado;
indicador offline;
indicador de sincronização;
atualização manual.
Detalhes da inspeção
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
Checklist
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
Captura e evidências
solicitação de permissão;
câmera;
seleção de galeria, quando permitida;
prévia;
refazer;
descrição;
vínculo visível com item;
estado de upload.
Scanner
leitura de QR Code;
indicador de processamento;
equipamento encontrado;
divergência com equipamento previsto;
opção manual quando autorizada.
Resumo e conclusão
total de itens;
itens respondidos;
itens obrigatórios pendentes;
não conformidades;
evidências;
localização;
confirmação de conclusão;
aviso de que o envio poderá permanecer pendente.
Sincronização
última sincronização;
quantidade pendente;
operações com erro;
ação tentar novamente;
status por evidência;
mensagens compreensíveis;
detalhes técnicos limitados para suporte.
Perfil
nome;
e-mail;
perfil;
versão do aplicativo;
identificador do dispositivo quando necessário;
ação sincronizar;
ação sair.
13.5 Componentes dinâmicos do checklist
O aplicativo deverá possuir um mapeamento explícito entre tipo e componente:
TEXT_SHORT → Input de texto TEXT_LONG → Área de texto NUMBER → Input numérico BOOLEAN → Seletor Sim/Não CONFORMITY → Conforme/Não conforme/Não aplicável SINGLE_CHOICE → Seleção única DATE → Seletor de data
​
Tipos desconhecidos não deverão quebrar a tela. O aplicativo deverá indicar incompatibilidade e impedir conclusão quando o item obrigatório não puder ser respondido.
13.6 Estratégia de estado e dados (Tecnologias)
Sugestão de responsabilidades:
TanStack Query: estado de dados remotos, invalidação e consultas online.
SQLite: fonte de dados operacional das inspeções disponíveis offline.
Zustand ou Context: estado pequeno de interface e sessão, evitando duplicar dados de servidor.
React Hook Form: formulários e composição dos tipos de resposta.
Zod ou mecanismo equivalente: validação de dados e contratos no cliente.
Secure Store: dados sensíveis da sessão.
O banco local não deve ser tratado apenas como cache descartável enquanto existirem alterações pendentes.
13.7 Recursos nativos obrigatórios
Câmera
solicitar permissão;
capturar imagem;
apresentar prévia;
refazer;
associar ao item;
manter arquivo pendente.
QR Code
ler código;
localizar equipamento;
validar divergência;
oferecer alternativa conforme regra.
Localização
solicitar permissão;
capturar posição pontual;
registrar precisão e horário;
tratar indisponibilidade;
não coletar continuamente no MVP.
Conectividade
detectar ausência de rede;
não bloquear o preenchimento;
acionar sincronização de forma controlada;
exibir estado atual.
13.8 Experiência offline
O técnico deverá distinguir claramente:
salvo no dispositivo;
aguardando envio;
enviado com sucesso;
falha no envio;
conflito.
A interface não deverá usar apenas mensagens temporárias para essa informação. O estado deverá permanecer visível na lista, no detalhe ou na tela de sincronização.
13.9 Requisitos de usabilidade
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
13.10 Requisitos de desempenho
Listas deverão ser virtualizadas quando necessário.
Imagens deverão ter tamanho e qualidade controlados.
O aplicativo não deverá carregar todas as fotografias em resolução integral simultaneamente.
Consultas locais deverão possuir índices adequados.
Renderizações do checklist deverão evitar atualização de todos os itens a cada digitação.
Sincronização deverá ser executada em lotes controlados.
13.11 Testes mobile prioritários
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
13.12 Escopo mínimo do mobile
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


14 - Interface Administrativa Web
14. Interface Administrativa Web
14.1 Objetivo
Fornecer aos administradores e supervisores uma interface adequada para configurar o sistema, planejar inspeções, acompanhar a operação e revisar resultados, sem necessidade de acesso direto ao banco de dados ou à documentação interativa da API.
14.2 Usuários principais
Administrador;
Supervisor.
O perfil de cliente somente leitura será uma evolução posterior.
14.3 Mapa de navegação sugerido
/login /app ├── /dashboard ├── /users ├── /clients │ └── /:clientId/sites ├── /sites │ └── /:siteId/equipment ├── /equipment ├── /inspection-templates │ ├── /new │ ├── /:templateId/edit │ ├── /:templateId/preview │ └── /:templateId/versions ├── /inspections │ ├── /new │ ├── /:inspectionId │ └── /:inspectionId/review ├── /non-conformities └── /audit
​
14.4 Layout principal
menu lateral ou navegação equivalente;
cabeçalho com usuário e ambiente;
breadcrumbs quando necessários;
área central responsiva;
mensagens globais controladas;
confirmação de ações críticas;
tratamento consistente de carregamento, vazio e erro.
14.5 Dashboard
MVP
total de inspeções por estado;
inspeções atrasadas;
inspeções aguardando revisão;
não conformidades por criticidade;
atalhos para criar inspeção e revisar pendências.
Evoluções
tendências por período;
desempenho por técnico;
tempo médio;
distribuição geográfica;
comparação entre clientes e equipamentos.
14.6 Usuários
Funcionalidades:
listar;
pesquisar;
filtrar por perfil e estado;
cadastrar;
editar dados permitidos;
ativar, inativar ou bloquear;
redefinir acesso por fluxo controlado;
visualizar inspeções relacionadas, quando autorizado.
14.7 Clientes, locais e equipamentos
Clientes
listagem;
cadastro;
edição;
inativação;
acesso aos locais relacionados.
Locais
vínculo com cliente;
endereço;
coordenadas opcionais;
contato local;
equipamentos relacionados.
Equipamentos
identificação;
patrimônio;
número de série;
fabricante e modelo;
QR Code;
situação;
histórico de inspeções, como P1.
14.8 Construtor de modelos de inspeção
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
Decisão de escopo
Arrastar e soltar é desejável, mas não obrigatório. A ordenação poderá ser implementada inicialmente por botões de mover ou campo de ordem.
14.9 Planejamento de inspeções
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
14.10 Acompanhamento
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
14.11 Tela de revisão
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
14.12 Não conformidades
No MVP:
listar por inspeção;
exibir criticidade;
exibir descrição e evidências;
filtrar por criticidade;
consultar item relacionado.
O acompanhamento completo de plano de ação será P2.
14.13 Controle de acesso na interface
Rotas deverão possuir guards.
Menus deverão respeitar o perfil.
Botões não autorizados não deverão ser apresentados.
A API continuará sendo responsável pela decisão final.
Um erro 403 deverá ser tratado de forma clara.
14.14 Integração com a API
Serviços tipados.
Interceptador de autenticação.
Renovação de sessão conforme contrato.
Tratamento central de erros comuns.
Cancelamento ou controle de requisições quando necessário.
Paginação no servidor.
Filtros refletidos em parâmetros de consulta.
Modelos de entrada e saída compatíveis com OpenAPI.
14.15 Estados obrigatórios de interface
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
14.16 Testes prioritários
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
14.17 Escopo mínimo da interface administrativa
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

15 - Backlog do Produto
15. Backlog do Produto
15.1 Estrutura recomendada no Notion (Sugestão)
Criar um banco de dados chamado Product Backlog — FieldOps com as seguintes propriedades:
Propriedade
Tipo no Notion
Finalidade
ID
Texto
Identificador único do item.
Título
Título
Nome curto da história ou tarefa.
Épico
Relação ou seleção
Agrupamento funcional.
História de usuário
Texto longo
Necessidade sob a perspectiva do usuário.
Componente
Seleção múltipla
Mobile, Admin, API, Banco ou Infraestrutura.
Prioridade
Seleção
P0, P1 ou P2.
Sprint
Relação ou seleção
Sprint planejada.
Status
Status
Backlog, Refinamento, Pronto, Em andamento, Em revisão, Concluído ou Bloqueado.
Responsável
Pessoa
Responsável principal.
Dependências
Relação
Itens que precisam ser concluídos antes.
Critérios de aceitação
Texto ou relação
Condições de aprovação.
Pontos
Número
Estimativa relativa.
Evidências
Arquivos/URL
Pull request, vídeo, prints ou relatório.
Disciplina
Seleção múltipla
Expo, Spring Boot, Angular ou Integração.

15.2 Épicos
ID
Épico
Resultado esperado
EP-01
Fundação técnica
Projetos executáveis, padronizados e integráveis.
EP-02
Identidade e acesso
Usuários autenticados e autorizados.
EP-03
Cadastros operacionais
Clientes, locais e equipamentos disponíveis.
EP-04
Modelos de inspeção
Checklists configuráveis e versionados.
EP-05
Planejamento
Inspeções agendadas e atribuídas.
EP-06
Execução de campo
Técnico executa checklist pelo mobile.
EP-07
Recursos nativos e evidências
QR Code, câmera e localização integrados.
EP-08
Offline e sincronização
Operação sem rede e envio confiável.
EP-09
Revisão e decisão
Supervisor revisa, aprova ou reprova.
EP-10
Qualidade e entrega
Testes, documentação, builds e demonstração.

15.3 Backlog priorizado do MVP
EP-01 — Fundação técnica
ID
História de usuário
Componente
Prioridade
Sprint
PBI-001
Como equipe, quero repositórios e convenções definidos para desenvolver os componentes de forma coordenada.
Todos
P0
1
PBI-002
Como desenvolvedor mobile, quero um projeto Expo com TypeScript, rotas e estrutura por features para iniciar o produto.
Mobile
P0
1
PBI-003
Como desenvolvedor web, quero um projeto Angular/React com layout, rotas e estrutura modular para iniciar o painel.
Admin
P0
1
PBI-004
Como desenvolvedor backend, quero uma API Spring Boot conectada ao PostgreSQL e com migrações para iniciar os serviços.
API/Banco
P0
1
PBI-005
Como equipe, quero lint, verificação de tipos e fluxo de pull request para manter um padrão mínimo de qualidade.
Todos
P0
1
PBI-006
Como integrador, quero um contrato inicial OpenAPI e dados simulados para que os frontends possam avançar em paralelo.
API/Integração
P0
1

EP-02 — Identidade e acesso
ID
História de usuário
Componente
Prioridade
Sprint
PBI-007
Como usuário, quero autenticar-me com e-mail e senha para acessar somente os recursos permitidos.
API
P0
2
PBI-008
Como técnico, quero iniciar e encerrar minha sessão no aplicativo.
Mobile
P0
2
PBI-009
Como administrador ou supervisor, quero iniciar e encerrar minha sessão na interface web.
Admin
P0
2
PBI-010
Como sistema, quero renovar a sessão sem solicitar credenciais a todo momento.
Mobile/Admin/API
P0
2
PBI-011
Como administrador, quero cadastrar, editar e inativar usuários.
Admin/API
P0
2
PBI-012
Como responsável por segurança, quero que a API valide o perfil em cada operação.
API
P0
2

EP-03 — Cadastros operacionais
ID
História de usuário
Componente
Prioridade
Sprint
PBI-013
Como supervisor, quero gerenciar clientes para organizar as inspeções por organização atendida.
Admin/API
P0
2
PBI-014
Como supervisor, quero gerenciar locais vinculados a clientes.
Admin/API
P0
2
PBI-015
Como supervisor, quero gerenciar equipamentos vinculados aos locais.
Admin/API
P0
2
PBI-016
Como supervisor, quero atribuir um código QR único ao equipamento.
Admin/API
P0
2
PBI-017
Como usuário administrativo, quero pesquisar, filtrar e paginar os cadastros.
Admin/API
P0
2

EP-04 — Modelos de inspeção
ID
História de usuário
Componente
Prioridade
Sprint
PBI-018
Como supervisor, quero criar um modelo de inspeção em rascunho.
Admin/API
P0
3
PBI-019
Como supervisor, quero criar e ordenar seções do checklist.
Admin/API
P0
3
PBI-020
Como supervisor, quero criar itens com diferentes tipos de resposta.
Admin/API
P0
3
PBI-021
Como supervisor, quero definir itens obrigatórios e regras de evidência.
Admin/API
P0
3
PBI-022
Como supervisor, quero visualizar uma prévia antes de publicar.
Admin
P0
3
PBI-023
Como supervisor, quero publicar uma versão imutável do modelo.
Admin/API
P0
3
PBI-024
Como sistema, quero preservar o snapshot utilizado pela inspeção.
API/Banco
P0
3

EP-05 — Planejamento
ID
História de usuário
Componente
Prioridade
Sprint
PBI-025
Como supervisor, quero agendar uma inspeção a partir de um modelo publicado.
Admin/API
P0
3
PBI-026
Como supervisor, quero selecionar cliente, local e equipamento de forma encadeada.
Admin/API
P0
3
PBI-027
Como supervisor, quero atribuir a inspeção a um técnico ativo.
Admin/API
P0
3
PBI-028
Como supervisor, quero definir prioridade, prazo e instruções.
Admin/API
P0
3
PBI-029
Como supervisor, quero cancelar uma inspeção com justificativa.
Admin/API
P0
3
PBI-030
Como supervisor, quero acompanhar a inspeção em uma listagem com filtros.
Admin/API
P0
4

EP-06 — Execução de campo
ID
História de usuário
Componente
Prioridade
Sprint
PBI-031
Como técnico, quero baixar e visualizar as inspeções atribuídas a mim.
Mobile/API
P0
4
PBI-032
Como técnico, quero filtrar minhas inspeções por estado, data e prioridade.
Mobile
P0
4
PBI-033
Como técnico, quero consultar os detalhes antes de iniciar.
Mobile
P0
4
PBI-034
Como técnico, quero iniciar a inspeção e registrar o horário.
Mobile/API
P0
4
PBI-035
Como técnico, quero visualizar o checklist gerado dinamicamente.
Mobile/API
P0
4
PBI-036
Como técnico, quero responder diferentes tipos de item.
Mobile
P0
4
PBI-037
Como técnico, quero que cada resposta seja salva localmente.
Mobile
P0
4
PBI-038
Como técnico, quero visualizar o progresso e os itens pendentes.
Mobile
P0
4
PBI-039
Como técnico, quero registrar observações em itens.
Mobile/API
P0
4
PBI-040
Como técnico, quero concluir somente quando todas as regras forem atendidas.
Mobile/API
P0
4

EP-07 — Recursos nativos e evidências
ID
História de usuário
Componente
Prioridade
Sprint
PBI-041
Como técnico, quero ler o QR Code para confirmar o equipamento.
Mobile/API
P0
5
PBI-042
Como técnico, quero capturar uma fotografia e visualizar a prévia.
Mobile
P0
5
PBI-043
Como técnico, quero associar a fotografia ao item correto.
Mobile/API
P0
5
PBI-044
Como técnico, quero manter a fotografia pendente quando o upload falhar.
Mobile
P0
5
PBI-045
Como técnico, quero registrar a localização no início e na conclusão.
Mobile/API
P0
5
PBI-046
Como técnico, quero registrar uma não conformidade com criticidade e evidência.
Mobile/API
P0
5
PBI-047
Como supervisor, quero visualizar evidências e não conformidades no acompanhamento.
Admin/API
P0
5

EP-08 — Offline e sincronização
ID
História de usuário
Componente
Prioridade
Sprint
PBI-048
Como técnico, quero acessar inspeções previamente baixadas sem internet.
Mobile
P0
6
PBI-049
Como técnico, quero que respostas permaneçam após fechar o aplicativo.
Mobile
P0
6
PBI-050
Como sistema, quero registrar alterações em uma outbox persistente.
Mobile
P0
6
PBI-051
Como sistema, quero enviar operações em lote e respeitar dependências.
Mobile/API
P0
6
PBI-052
Como sistema, quero impedir duplicidades quando uma operação for reenviada.
API
P0
6
PBI-053
Como sistema, quero baixar alterações utilizando cursor de sincronização.
Mobile/API
P0
6
PBI-054
Como técnico, quero visualizar pendências, falhas e última sincronização.
Mobile
P0
6
PBI-055
Como sistema, quero detectar conflito de versão e preservar os dados para análise.
Mobile/API
P0
6

EP-09 — Revisão e decisão
ID
História de usuário
Componente
Prioridade
Sprint
PBI-056
Como supervisor, quero visualizar inspeções aguardando revisão.
Admin/API
P0
7
PBI-057
Como supervisor, quero revisar respostas por seção e item.
Admin/API
P0
7
PBI-058
Como supervisor, quero ampliar e relacionar fotografias aos itens.
Admin/API
P0
7
PBI-059
Como supervisor, quero iniciar formalmente uma revisão.
Admin/API
P0
7
PBI-060
Como supervisor, quero aprovar uma inspeção.
Admin/API
P0
7
PBI-061
Como supervisor, quero reprovar uma inspeção informando o motivo.
Admin/API
P0
7
PBI-062
Como técnico, quero receber a inspeção reprovada com instruções de correção.
Mobile/API
P0
7
PBI-063
Como responsável por auditoria, quero registrar as mudanças de estado.
API/Banco
P0
7

EP-10 — Qualidade e entrega
ID
História de usuário
Componente
Prioridade
Sprint
PBI-064
Como usuário, quero mensagens compreensíveis para carregamento, vazio, erro e offline.
Mobile/Admin
P0
7
PBI-065
Como equipe, quero testes automatizados dos fluxos críticos.
Todos
P0
7
PBI-066
Como equipe, quero dados de demonstração reproduzíveis.
API/Banco
P0
8
PBI-067
Como avaliador, quero executar os projetos a partir do README.
Todos
P0
8
PBI-068
Como técnico, quero instalar uma build Android de demonstração.
Mobile
P0
8
PBI-069
Como usuário administrativo, quero acessar uma versão publicada do painel.
Admin
P0
8
PBI-070
Como equipe, quero uma API publicada ou executável por contêiner para demonstração.
API/Infra
P0
8
PBI-071
Como avaliador, quero consultar o OpenAPI e os principais diagramas.
API/Documentação
P0
8
PBI-072
Como equipe, quero demonstrar o fluxo ponta a ponta com dados reais de teste.
Todos
P0
8

15.4 Itens P1 sugeridos
ID
História resumida
Componente
PBI-073
Dashboard com indicadores por estado e criticidade.
Admin/API
PBI-074
Notificações locais de prazo.
Mobile
PBI-075
Notificações push de nova atribuição.
Mobile/API
PBI-076
Assinatura desenhada.
Mobile/API
PBI-077
Relatório PDF básico.
API/Admin
PBI-078
Histórico detalhado de respostas.
Admin/API
PBI-079
Comentários de revisão por item.
Admin/API
PBI-080
Biometria para reabertura local.
Mobile
PBI-081
Tema escuro.
Mobile/Admin
PBI-082
Exportação CSV.
Admin/API

15.5 Política de refinamento
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

16 - Roadmap
16. Roadmap
16.1 Premissa acadêmica
O planejamento considera 16 semanas efetivas de aula, embora o calendário institucional possua 20 semanas. As demais semanas poderão ser comprometidas por avaliações, palestras, feriados, eventos e atividades institucionais e não deverão ser utilizadas como dependência para concluir o MVP.
Na disciplina de Expo, cada semana terá:
2 aulas de 50 minutos para conteúdo e demonstração;
3 aulas de 50 minutos para desenvolvimento orientado do projeto.
Carga efetiva da disciplina:
32 aulas de conteúdo;
48 aulas de projeto;
80 aulas de 50 minutos.
16.2 Rotina semanal da disciplina de Expo
Aula
Finalidade
Aula 1
Conceitos, arquitetura, decisões e exemplos.
Aula 2
Demonstração prática guiada e exercício controlado.
Aula 3
Refinamento da história, critérios de aceitação e preparação da integração.
Aula 4
Desenvolvimento da funcionalidade no FieldOps.
Aula 5
Integração, testes, revisão de código e demonstração parcial.

16.3 Organização em oito sprints
Cada sprint terá duas semanas:
4 aulas de conteúdo Expo;
6 aulas de projeto Expo;
entregas correspondentes no backend e na interface administrativa;
incremento demonstrável ao final.
16.4 Roadmap integrado
Sprint
Semanas
Conteúdo principal de Expo
Entrega mobile
Entrega administrativa
Entrega backend
Incremento demonstrável
1
1–2
Arquitetura, TypeScript, Expo Router, componentes e qualidade
Projeto base, rotas protegidas simuladas, design system e dados mockados
Projeto Angular, layout, rotas e telas iniciais
API base, PostgreSQL, migrações e OpenAPI inicial
Três aplicações executáveis com contrato inicial
2
3–4
Consumo de API, autenticação, sessão segura e tratamento de erros
Login real, sessão, logout e tela inicial
Login, usuários e cadastros básicos
JWT, autorização, usuários, clientes, locais e equipamentos
Usuários autenticados e cadastros disponíveis
3
5–6
Dados remotos, cache, listas, filtros e estados de interface
Lista e detalhes de inspeções inicialmente mockados e depois integrados
Construtor de modelos e agendamento
Modelos versionados, snapshot, inspeções e atribuição
Supervisor cria e atribui uma inspeção
4
7–8
React Hook Form, validação e formulários dinâmicos
Início, checklist, respostas, observações e progresso
Acompanhamento das inspeções
Consulta mobile, respostas, transições e validações
Técnico executa uma inspeção online
5
9–10
Câmera, imagens, permissões, QR Code e localização
Evidências, leitura do equipamento, GPS e não conformidade
Visualização de evidências e ocorrências
Upload, QR Code, localização e não conformidades
Inspeção online com recursos nativos
6
11–12
SQLite, conectividade, repositórios locais, outbox e sincronização
Download, operação offline, fila, tela de sincronização
Visualização do estado recebido
Push/pull, idempotência, cursor e conflitos básicos
Inspeção concluída offline e sincronizada
7
13–14
Testes, performance, acessibilidade e tratamento de falhas
Correção, robustez, testes e estados de erro
Revisão, aprovação, reprovação e histórico
Revisão, auditoria e testes de integração
Ciclo completo com reprovação e correção
8
15–16
EAS, ambientes, versionamento e distribuição
Build Android, documentação e ajustes finais
Build e publicação web
Contêiner, ambiente de demonstração e OpenAPI final
Produto integrado apresentado ponta a ponta

16.5 Detalhamento por semana
Semana 1 — Fundação e diagnóstico
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
Semana 2 — Navegação e base visual
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
Semana 3 — Comunicação com API
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
Semana 4 — Autenticação e sessão
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
Semana 5 — Dados remotos e cache
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
Semana 6 — Listas, filtros e detalhes
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
Semana 7 — Formulários e validação
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
Semana 8 — Checklist dinâmico
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
Semana 9 — Câmera e arquivos
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
Semana 10 — QR Code e localização
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
Semana 11 — SQLite e repositórios locais
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
Semana 12 — Outbox e sincronização
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
Semana 13 — Testes e falhas
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
Semana 14 — Performance e acessibilidade
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
Semana 15 — Build e ambientes
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
Semana 16 — Integração e apresentação
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
16.6 Marcos obrigatórios
Marco
Final da semana
Evidência
M1 — Fundação
2
Aplicações base e navegação simulada.
M2 — Autenticação
4
Login integrado nos dois frontends.
M3 — Planejamento
6
Modelo e inspeção criados pela web.
M4 — Execução online
8
Checklist dinâmico enviado à API.
M5 — Recursos nativos
10
Foto, QR Code e localização.
M6 — Offline
12
Inspeção concluída sem rede e sincronizada.
M7 — Revisão
14
Aprovação ou reprovação com histórico.
M8 — Release
16
Build, painel e API demonstrados.

16.7 Gestão de risco do cronograma
Caso exista atraso, a redução de escopo deverá seguir esta ordem:
remover dashboard avançado;
limitar tipos de resposta aos essenciais;
manter apenas fotografia capturada, sem galeria;
simplificar o construtor de modelos sem arrastar e soltar;
limitar o conflito à detecção e bloqueio;
adiar notificações, PDF e assinatura;
manter obrigatoriamente autenticação, planejamento, checklist, foto, offline, sincronização e revisão.


17 - Critérios de Aceitação
17. Critérios de Aceitação
17.1 Critérios gerais do produto
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
17.2 AC-AUTH — Autenticação
Cenário: login válido
Dado que o usuário está ativo
E informa e-mail e senha válidos
Quando solicita o acesso
Então a API deve criar uma sessão válida
E retornar o perfil autorizado
E a aplicação deve direcioná-lo à área protegida.
Cenário: credenciais inválidas
Dado que as credenciais não são válidas
Quando o usuário tenta entrar
Então o acesso deve ser negado
E a mensagem não deve revelar se o e-mail existe.
Cenário: usuário inativo
Dado que o usuário está inativo
Quando tenta entrar
Então a API deve negar a sessão
E a aplicação deve apresentar orientação compreensível.
Cenário: token expirado
Dado que o token de acesso expirou
E o token de renovação ainda é válido
Quando a aplicação realiza uma operação protegida
Então a sessão deve ser renovada de forma controlada
E a operação original poderá ser repetida uma única vez.
Cenário: logout
Dado que o usuário está autenticado
Quando encerra a sessão
Então os dados sensíveis da sessão devem ser removidos
E as rotas protegidas não devem permanecer acessíveis.
17.3 AC-USERS — Usuários e perfis
O administrador consegue cadastrar usuário com nome, e-mail, perfil e situação.
O e-mail não pode ser duplicado.
O perfil deve aceitar somente valores previstos.
Um usuário inativo não consegue iniciar nova sessão.
A inativação não remove inspeções ou auditoria associadas.
Um técnico não consegue acessar endpoints administrativos.
Um supervisor não consegue gerenciar usuários quando essa permissão não estiver atribuída.
17.4 AC-MASTER — Clientes, locais e equipamentos
Cliente
Nome é obrigatório.
Registro pode ser pesquisado e filtrado.
Cliente inativo não pode ser utilizado em nova inspeção.
Local
Todo local deve possuir cliente.
A interface deve filtrar locais pelo cliente selecionado.
Local inativo não pode receber nova inspeção.
Equipamento
Todo equipamento deve possuir local no MVP.
QR Code deve ser único.
A seleção administrativa deve mostrar somente equipamentos do local escolhido.
Equipamento inativo não pode ser utilizado em nova inspeção.
O técnico consegue consultar os dados mínimos do equipamento relacionado à inspeção.
17.5 AC-TEMPLATE — Modelo de inspeção
Cenário: criar rascunho
Dado que o supervisor possui permissão
Quando cria um modelo
Então o modelo deve permanecer em rascunho
E poderá receber seções e itens.
Cenário: publicar modelo válido
Dado que o modelo possui título
E ao menos uma seção
E ao menos um item válido
Quando o supervisor publica o modelo
Então uma versão numerada deve ser criada
E a versão deve ficar disponível para novas inspeções.
Cenário: publicação inválida
Dado que existe item sem tipo de resposta
Ou o modelo não possui itens
Quando o supervisor tenta publicar
Então a operação deve ser bloqueada
E as pendências devem ser apresentadas.
Cenário: alterar modelo já utilizado
Dado que uma versão publicada já foi utilizada
Quando o supervisor altera a estrutura
Então uma nova versão deve ser criada
E inspeções existentes devem manter o snapshot anterior.
17.6 AC-SCHEDULING — Agendamento e atribuição
O supervisor deve selecionar uma versão publicada.
Cliente, local, técnico e data prevista são obrigatórios.
O equipamento é obrigatório quando o modelo exigir inspeção de equipamento.
O local deve pertencer ao cliente.
O equipamento deve pertencer ao local.
O técnico deve estar ativo.
Após a confirmação, a inspeção deve possuir snapshot dos itens.
A inspeção deve ficar visível ao técnico após sincronização.
O cancelamento deve exigir justificativa e registrar auditoria.
17.7 AC-MOBILE-LIST — Lista e detalhes no mobile
O técnico visualiza somente inspeções autorizadas.
A lista apresenta estado, prioridade, data, cliente e local.
A interface diferencia atrasada, em andamento e pendente de sincronização.
Filtros não devem apagar os dados locais.
A ausência de inspeções deve apresentar estado vazio, não erro.
A falha de atualização não deve remover os dados anteriormente armazenados.
O detalhe deve funcionar offline para inspeções baixadas.
17.8 AC-START — Início da inspeção
Cenário: iniciar inspeção atribuída
Dado que a inspeção está atribuída ao técnico
Quando o técnico confirma o início
Então a data e hora do dispositivo devem ser registradas
E a inspeção deve passar a em andamento localmente
E uma operação deve ser criada na outbox.
Cenário: inspeção não autorizada
Dado que a inspeção pertence a outro técnico
Quando o usuário tenta iniciá-la
Então a API deve negar a operação.
Cenário: localização negada
Dado que a localização foi solicitada
E o usuário negou a permissão
Quando a regra permitir continuidade
Então a inspeção poderá iniciar
E a ausência da localização deverá ser registrada ou informada.
17.9 AC-CHECKLIST — Checklist dinâmico
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
17.10 AC-EVIDENCE — Evidências
Cenário: capturar fotografia
Dado que a permissão da câmera foi concedida
Quando o técnico captura uma fotografia
Então a aplicação deve apresentar uma prévia
E permitir confirmar ou refazer
E associar a imagem ao item correto.
Cenário: trabalhar offline
Dado que não existe conectividade
Quando o técnico confirma a fotografia
Então o arquivo deve permanecer no dispositivo
E um upload pendente deve ser criado
E a evidência deve continuar visível.
Cenário: falha de upload
Dado que o servidor não confirmou o arquivo
Quando a sincronização termina parcialmente
Então a evidência deve permanecer pendente
E os demais dados confirmados não devem ser revertidos
E o técnico deve poder tentar novamente.
Critérios adicionais
Formato e tamanho devem ser validados.
Evidência deve possuir identificador próprio.
Evidência sincronizada deve aparecer na interface administrativa.
Evidência de inspeção aprovada deve ser somente leitura.
17.11 AC-QR — QR Code
A câmera deve solicitar permissão antes do uso.
O código deve ser lido uma única vez por ciclo de confirmação.
O equipamento deve ser procurado primeiro nos dados autorizados.
Equipamento não localizado deve produzir mensagem clara.
Divergência com o equipamento previsto deve exigir confirmação ou bloquear conforme regra.
A leitura não pode permitir acesso a equipamento fora do escopo do usuário.
Quando autorizado, deve existir identificação manual alternativa.
17.12 AC-LOCATION — Localização
A aplicação deve solicitar consentimento.
A coleta deve ser pontual, não contínua.
Latitude, longitude, precisão e horário devem ser armazenados quando disponíveis.
Falha de localização não deve encerrar o aplicativo.
A ausência deve ser apresentada quando a localização for obrigatória.
Os dados sincronizados devem estar visíveis na revisão.
17.13 AC-NONCONFORMITY — Não conformidades
Título, descrição e criticidade devem ser validados.
O registro deve estar relacionado à inspeção.
O item relacionado deve ser preservado quando informado.
Criticidade crítica deve exigir evidência.
O registro deve funcionar offline.
A não conformidade sincronizada deve aparecer na revisão administrativa.
A exclusão após envio deve respeitar a regra de auditoria.
17.14 AC-COMPLETE — Conclusão
Cenário: inspeção válida
Dado que todos os itens obrigatórios estão respondidos
E observações e evidências exigidas foram registradas
Quando o técnico confirma a conclusão
Então o aplicativo deve registrar o horário
E bloquear edição comum
E criar a operação de conclusão.
Cenário: inspeção incompleta
Dado que existe item obrigatório pendente
Quando o técnico tenta concluir
Então a operação deve ser bloqueada
E a aplicação deve indicar os itens pendentes.
Cenário: conclusão offline
Dado que não existe conectividade
Quando a inspeção válida é concluída
Então ela deve ficar marcada como aguardando sincronização
E os dados devem permanecer no dispositivo.
17.15 AC-SYNC — Sincronização
Cenário: envio bem-sucedido
Dado que existem operações pendentes
E existe conectividade
Quando a sincronização é executada
Então as operações devem ser enviadas na ordem correta
E as confirmações devem ser persistidas localmente
E a quantidade pendente deve ser atualizada.
Cenário: reenvio da mesma operação
Dado que uma operação já foi aplicada
Quando o aplicativo a envia novamente com o mesmo identificador
Então a API deve responder como já processada ou equivalente
E não deve criar duplicidade.
Cenário: falha parcial
Dado que um lote possui várias operações
Quando uma delas falha
Então o resultado individual deve ser retornado
E operações confirmadas devem permanecer confirmadas
E a falha deve continuar pendente.
Cenário: conflito
Dado que a versão do servidor é diferente da versão-base
Quando a alteração é enviada
Então a API deve retornar conflito
E a aplicação deve preservar a alteração local
E apresentar estado de conflito.
Critérios adicionais
O cursor somente deve avançar após persistência local.
A tela deve mostrar última sincronização.
Sair e entrar no aplicativo não pode apagar a outbox.
Arquivos pendentes devem ter estado individual.
17.16 AC-ADMIN-MONITOR — Acompanhamento administrativo
A listagem deve usar paginação.
Deve permitir filtros por estado, técnico, cliente, prioridade e período.
Inspeções atrasadas devem ser identificadas.
Dados de carregamento, vazio e erro devem ser tratados.
A visualização deve respeitar o perfil.
A atualização de estado após sincronização deve aparecer sem necessidade de manipulação direta do banco.
17.17 AC-REVIEW — Revisão, aprovação e reprovação
Cenário: iniciar revisão
Dado que a inspeção foi enviada
Quando o supervisor inicia a revisão
Então o estado deve mudar para em revisão
E a ação deve ser auditada.
Cenário: aprovar
Dado que a inspeção está em revisão
Quando o supervisor confirma a aprovação
Então o estado deve mudar para aprovada
E o revisor e o horário devem ser registrados
E as respostas devem ficar protegidas contra edição comum.
Cenário: reprovar
Dado que a inspeção está em revisão
Quando o supervisor tenta reprovar sem motivo
Então a ação deve ser bloqueada.
Dado que um motivo válido foi informado
Quando o supervisor confirma
Então o estado deve mudar para reprovada
E o técnico deve receber a informação na próxima sincronização.
17.18 AC-SECURITY — Segurança e autorização
Endpoints protegidos rejeitam requisições sem sessão válida.
Um técnico não consulta inspeções de outro técnico por alteração manual de URL.
Um usuário sem perfil administrativo não gerencia cadastros.
Arquivos não são disponibilizados publicamente sem controle.
Senhas e tokens não aparecem em logs.
Respostas de erro não apresentam stack trace ao cliente.
Segredos não são versionados.
A interface não é utilizada como única barreira de autorização.
17.19 AC-RELEASE — Aceitação da versão final
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

18 - Definição de Pronto - Definition of Done
18. Definição de Pronto — Definition of Done
18.1 DoD de história de usuário
Uma história somente poderá ser marcada como Concluída quando:
Requisitos
A história possui critérios de aceitação claros.
As regras de negócio relacionadas foram verificadas.
Dependências foram resolvidas ou explicitamente aceitas.
O comportamento de erro foi definido.
Código
O código está no repositório correto.
A implementação foi realizada em branch apropriada.
Existe pull request ou processo equivalente de revisão.
O código passa no lint.
O código passa na verificação de tipos.
Não existem segredos ou credenciais no repositório.
Não existem logs sensíveis.
Não existem erros ou warnings relevantes ignorados sem justificativa.
Testes
Os critérios de aceitação foram testados.
Casos principais e ao menos uma exceção relevante foram verificados.
Testes automatizados foram adicionados quando a regra for crítica ou repetível.
Regressões visíveis foram verificadas.
Interface
Estado de carregamento foi tratado.
Estado vazio foi tratado quando aplicável.
Estado de erro foi tratado.
A ação em processamento evita envio acidental duplicado.
Mensagens são compreensíveis.
A interface respeita as permissões.
Acessibilidade básica foi verificada.
Integração
O contrato da API está implementado ou atualizado.
DTOs de entrada e saída estão coerentes.
Erros esperados são tratados.
A autorização foi validada no backend.
A funcionalidade foi testada no ambiente de integração quando aplicável.
Documentação e evidência
README ou documentação relacionada foi atualizada.
OpenAPI foi atualizado quando necessário.
A história possui evidência de funcionamento.
Limitações conhecidas foram registradas.
18.2 DoD específico do mobile
Além do DoD geral:
A funcionalidade foi testada em dispositivo ou emulador Android.
O comportamento sem conectividade foi considerado.
Alterações locais relevantes persistem após reinicialização.
Permissões negadas são tratadas.
Dados sensíveis utilizam armazenamento adequado.
Rotas protegidas não ficam acessíveis sem sessão.
A funcionalidade não provoca perda de operações pendentes.
O estado de sincronização é apresentado quando relevante.
18.3 DoD específico da interface administrativa
Além do DoD geral:
A rota possui proteção compatível.
A tela usa paginação quando lista dados potencialmente numerosos.
Filtros são coerentes com os parâmetros da API.
Formulários possuem validação visual e no servidor.
A tela não permite ação crítica sem confirmação.
Erros 401, 403, 404, 409 e 422 são tratados de forma adequada.
A interface foi testada em resolução comum de notebook.
18.4 DoD específico da API
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
18.5 DoD da sprint
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
18.6 DoD do MVP
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
18.7 Definição de defeitos por severidade
Severidade
Definição
Conduta
Crítico
Perda de dados, falha de segurança, impossibilidade de executar o fluxo principal ou duplicidade grave.
Bloqueia a entrega.
Alto
Funcionalidade P0 indisponível sem alternativa aceitável.
Deve ser corrigido antes da release.
Médio
Problema com alternativa conhecida, sem perda de dados.
Pode ser aceito com registro e plano.
Baixo
Problema visual ou melhoria não essencial.
Pode permanecer no backlog.



19 - Critérios de Avaliação
19. Critérios de Avaliação
19.1 Princípios da avaliação
A avaliação deverá considerar tanto o produto entregue quanto a aprendizagem individual. A existência de uma funcionalidade pronta não será suficiente quando o estudante não conseguir explicar as decisões, o fluxo de dados e sua contribuição.
Princípios:
avaliação incremental, não concentrada apenas na última semana;
equilíbrio entre funcionamento, qualidade e compreensão;
evidências por commits, pull requests, testes e demonstrações;
integração real entre as aplicações;
distinção entre nota da equipe e desempenho individual;
valorização da confiabilidade, não apenas da quantidade de telas.
19.2 Rubrica integrada do produto — 100 pontos
Dimensão
Pontos
Evidências esperadas
Visão, requisitos e aderência ao escopo
5
Backlog coerente, histórias e regras atendidas.
Arquitetura e organização
10
Separação de responsabilidades, estrutura e decisões documentadas.
Aplicativo mobile
20
Navegação, checklist, estados, persistência e experiência de campo.
Recursos nativos
10
Câmera, QR Code, localização e permissões.
Offline e sincronização
15
SQLite, outbox, idempotência, falhas e estado visível.
Interface administrativa
10
Cadastros, modelos, planejamento, acompanhamento e revisão.
API, regras e modelo de dados
15
Segurança, validações, endpoints, persistência e documentação.
Testes, segurança e qualidade
7
Testes críticos, lint, tratamento de erros e ausência de segredos.
Documentação e processo
4
README, OpenAPI, backlog, PRs e evidências.
Demonstração e defesa técnica
4
Fluxo ponta a ponta e explicação individual.
Total
100



19.3 Rubrica para a disciplina de Expo — 100 pontos
Considerando que a disciplina possui 2 aulas semanais de conteúdo e 3 de projeto:
Dimensão
Pontos
Critérios
Avaliações individuais de conteúdo
25
TypeScript, navegação, dados, formulários, recursos nativos, SQLite e sincronização.
Fundação e arquitetura mobile
10
Estrutura, rotas, componentes, tipos e organização.
Integração, sessão e dados remotos
10
API, autenticação, erros, cache e listas.
Checklist dinâmico
15
Renderização, validação, progresso e persistência.
Recursos nativos
15
Câmera, QR Code, localização e permissões.
Offline e sincronização
15
SQLite, outbox, idempotência no cliente e recuperação de falhas.
Testes, acessibilidade e performance
5
Casos críticos, qualidade de uso e otimização.
Build, documentação e defesa
5
Build Android, README e explicação da contribuição.
Total
100



19.4 Rubrica para Java/Spring Boot — 100 pontos
Dimensão
Pontos
Modelagem do domínio e banco
15
API REST e DTOs
15
Autenticação e autorização
15
Regras de negócio e transições
15
Modelos versionados e snapshots
10
Sincronização e idempotência
10
Upload, evidências e auditoria
5
Testes automatizados
8
OpenAPI, execução e documentação
5
Defesa individual
2
Total
100

19.5 Rubrica para a interface administrativa — 100 pontos
Dimensão
Pontos
Arquitetura Angular e organização
10
Autenticação, guards e autorização visual
10
Cadastros e formulários
15
Construtor de modelos
20
Planejamento e acompanhamento
15
Revisão, aprovação e reprovação
15
Estados de interface, acessibilidade e responsividade
5
Testes e qualidade
5
Build, documentação e defesa
5
Total
100

19.6 Avaliação por marcos
Marco
Peso sugerido no projeto
Critério principal
M1 — Fundação
5%
Projetos executáveis e organizados.
M2 — Autenticação
10%
Sessão integrada e autorização.
M3 — Planejamento
10%
Modelo e inspeção criados pela web.
M4 — Execução online
15%
Checklist dinâmico e respostas.
M5 — Recursos nativos
15%
Foto, QR Code e localização.
M6 — Offline
20%
Persistência e sincronização confiável.
M7 — Revisão
10%
Aprovação, reprovação e correção.
M8 — Release
15%
Integração final, build, documentação e defesa.
Total
100%



19.7 Componente individual
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
19.8 Evidências obrigatórias por equipe
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
19.9 Penalidades técnicas sugeridas
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
19.10 Bônus ou diferenciais
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


20 - Anexo A - Checklist executivo do projeto
Anexo A — Checklist executivo do projeto
Produto
Visão e escopo compreendidos pela equipe.
Personas e perfis definidos.
MVP separado das funcionalidades futuras.
Backlog priorizado.
Dependências entre disciplinas identificadas.
Mobile
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
Administrativo
Login e guards.
Usuários.
Clientes, locais e equipamentos.
Modelos e versões.
Agendamento e atribuição.
Acompanhamento.
Revisão.
Aprovação e reprovação.
Build web.
Backend
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
Entrega
Fluxo ponta a ponta testado.
Dados de demonstração.
READMEs atualizados.
Limitações registradas.
Evidências de participação.
Apresentação preparada.


20 - Anexo B - Decisões de escopo consolidadas
Anexo B — Decisões de escopo consolidadas
O produto possui três aplicações: mobile, administrativa web e API REST.
A interface administrativa faz parte do MVP e não será substituída pelo Swagger.
O mobile é prioritariamente Android.
O aplicativo deverá operar offline após baixar uma inspeção.
O SQLite é persistência operacional, não cache descartável.
A sincronização utilizará operações idempotentes.
O modelo de inspeção será versionado.
Cada inspeção preservará um snapshot dos itens.
O MVP terá um técnico responsável por inspeção.
O portal do cliente ficará fora do MVP.
Fotografias serão a evidência principal.
QR Code e localização serão recursos obrigatórios do projeto mobile.
A coleta de localização será pontual.
A revisão será realizada pela interface administrativa.
As 16 semanas efetivas são o limite para planejamento do MVP.
As semanas institucionais restantes não serão consideradas reserva de desenvolvimento.
A avaliação combinará produto da equipe e domínio individual.


21 - Anexo C - Exemplo de Ficha de Inspeção
Ficha de Inspeção de Equipamento
1. Identificação da inspeção
Campo
Informação
Código da inspeção
INS-2026-00045
Tipo de inspeção
Inspeção preventiva mensal
Status
Em andamento
Data da inspeção
03/08/2026
Horário de início
09:15
Horário de término
10:05
Inspetor responsável
Carlos Henrique Silva
Empresa responsável
FieldOps Serviços Técnicos
Ordem de serviço
OS-2026-0187

2. Template aplicado
Campo
Informação
Nome do template
Inspeção Preventiva de Compressor de Ar
Código do template
TPL-COMP-PREV
Versão aplicada
3.0
Identificador da versão
TPL-COMP-PREV-V3
Data de publicação
15/07/2026
Status da versão
Publicada
Tipo de equipamento associado
Compressor de ar
Total de seções
4
Total de itens
12

A inspeção permanece vinculada à versão 3.0, mesmo que uma nova versão do template seja publicada posteriormente.
3. Dados do cliente
Campo
Informação
Cliente
Indústria Modelo Ltda.
CNPJ
12.345.678/0001-90
Unidade
Unidade Sorocaba
Responsável local
Ana Paula Ferreira
Telefone
(15) 99999-9999
E-mail
ana.ferreira@empresa.com.br

4. Local da inspeção
Campo
Informação
Local
Galpão de Produção 02
Setor
Linha de Montagem
Endereço
Avenida Industrial, 1000 – Sorocaba/SP
Ponto de referência
Próximo ao quadro elétrico principal
Coordenadas
-23.5015, -47.4526

5. Equipamento inspecionado
Campo
Informação
Equipamento
Compressor de ar
Tipo de equipamento
Compressor de ar
Código interno
COMP-004
Fabricante
Atlas Modelo
Modelo
XPTO 500
Número de série
SN-458796
Ano de fabricação
2021
Data da última manutenção
10/05/2026
Horímetro
3.845 horas
Situação operacional
Em funcionamento

6. Checklist de inspeção
6.1 Condições gerais
Item 1 — Identificação do equipamento
Campo
Informação
Código do item no template
COMP-GER-001
Snapshot do item
SNAP-INS-00045-001
Tipo de resposta
Seleção única
Resposta obrigatória
Sim
Evidência obrigatória
Sim

Pergunta: A placa de identificação está presente, legível e fixada corretamente?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: Placa presente e com todas as informações legíveis.
Evidência registrada: EVD-001 — Fotografia da placa de identificação.
Item 2 — Limpeza e conservação
Campo
Informação
Código do item no template
COMP-GER-002
Snapshot do item
SNAP-INS-00045-002
Tipo de resposta
Seleção única
Resposta obrigatória
Sim
Evidência em caso de não conformidade
Obrigatória

Pergunta: O equipamento apresenta condições adequadas de limpeza e conservação?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: Foi identificado acúmulo de óleo e poeira próximo à base do equipamento.
Classificação da não conformidade: Leve.
Evidência registrada: EVD-002 — Fotografia da região com acúmulo de resíduos.
Item 3 — Estrutura externa
Campo
Informação
Código do item no template
COMP-GER-003
Snapshot do item
SNAP-INS-00045-003
Tipo de resposta
Seleção única
Resposta obrigatória
Sim

Pergunta: A estrutura externa está livre de trincas, deformações ou corrosão?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: Não foram identificados danos estruturais aparentes.
6.2 Segurança
Item 4 — Proteções mecânicas
Campo
Informação
Código do item no template
COMP-SEG-001
Snapshot do item
SNAP-INS-00045-004
Tipo de resposta
Seleção única
Resposta obrigatória
Sim

Pergunta: As proteções das partes móveis estão instaladas e fixadas corretamente?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: Todas as proteções estavam instaladas e sem folgas.
Item 5 — Sinalização de segurança
Campo
Informação
Código do item no template
COMP-SEG-002
Snapshot do item
SNAP-INS-00045-005
Tipo de resposta
Seleção única
Resposta obrigatória
Sim
Evidência em caso de não conformidade
Obrigatória

Pergunta: As etiquetas e sinalizações de advertência estão visíveis e legíveis?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: A etiqueta de risco elétrico está parcialmente apagada.
Classificação da não conformidade: Moderada.
Ação recomendada: Substituir a etiqueta de advertência.
Evidência registrada: EVD-003 — Fotografia da etiqueta danificada.
Item 6 — Botão de emergência
Campo
Informação
Código do item no template
COMP-SEG-003
Snapshot do item
SNAP-INS-00045-006
Tipo de resposta
Seleção única com teste
Resposta obrigatória
Sim
Teste obrigatório
Sim

Pergunta: O botão de parada de emergência está acessível e funcionando corretamente?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Teste realizado: Acionamento do botão durante operação controlada.
Resultado: O equipamento foi desligado imediatamente.
6.3 Sistema elétrico
Item 7 — Cabos e conexões
Campo
Informação
Código do item no template
COMP-ELE-001
Snapshot do item
SNAP-INS-00045-007
Tipo de resposta
Seleção única
Resposta obrigatória
Sim
Evidência em caso de não conformidade
Obrigatória
Gera bloqueio operacional
Sim

Pergunta: Os cabos elétricos estão íntegros, organizados e sem condutores expostos?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: Um cabo de alimentação apresenta desgaste na cobertura externa.
Classificação da não conformidade: Crítica.
Ação imediata: Isolar o equipamento até a substituição do cabo.
Evidência registrada: EVD-004 — Fotografia do cabo elétrico.
Item 8 — Painel elétrico
Campo
Informação
Código do item no template
COMP-ELE-002
Snapshot do item
SNAP-INS-00045-008
Tipo de resposta
Seleção única
Resposta obrigatória
Sim

Pergunta: O painel elétrico está fechado, identificado e sem sinais de aquecimento?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: Painel em condições normais, sem sinais visíveis de superaquecimento.
Item 9 — Aterramento
Campo
Informação
Código do item no template
COMP-ELE-003
Snapshot do item
SNAP-INS-00045-009
Tipo de resposta
Medição numérica
Unidade
Ω
Resposta obrigatória
Sim
Valor mínimo
0 Ω
Valor máximo
10 Ω

Pergunta: Qual é a resistência medida no sistema de aterramento?
Valor medido: 4,2 Ω.
Limite estabelecido: Até 10 Ω.
Resultado calculado: Conforme.
6.4 Funcionamento
Item 10 — Ruídos e vibrações
Campo
Informação
Código do item no template
COMP-FUN-001
Snapshot do item
SNAP-INS-00045-010
Tipo de resposta
Seleção única
Resposta obrigatória
Sim
Evidência em caso de não conformidade
Obrigatória

Pergunta: O equipamento opera sem ruídos ou vibrações anormais?
Conforme
Não conforme
Não aplicável
Não foi possível verificar
Observação: Foi observado aumento de vibração durante o funcionamento em carga máxima.
Classificação da não conformidade: Moderada.
Ação recomendada: Verificar alinhamento, rolamentos e elementos de fixação.
Evidência registrada: EVD-005 — Vídeo do equipamento em funcionamento.
Item 11 — Pressão de operação
Campo
Informação
Código do item no template
COMP-FUN-002
Snapshot do item
SNAP-INS-00045-011
Tipo de resposta
Medição numérica
Unidade
bar
Resposta obrigatória
Sim
Valor mínimo
7 bar
Valor máximo
8 bar

Pergunta: Qual é a pressão de operação do equipamento?
Valor medido: 7,8 bar.
Faixa permitida: Entre 7 e 8 bar.
Resultado calculado: Conforme.
Item 12 — Temperatura de operação
Campo
Informação
Código do item no template
COMP-FUN-003
Snapshot do item
SNAP-INS-00045-012
Tipo de resposta
Medição numérica
Unidade
°C
Resposta obrigatória
Sim
Valor máximo
85 °C

Pergunta: Qual é a temperatura do equipamento durante a operação?
Valor medido: 72 °C.
Limite permitido: Até 85 °C.
Resultado calculado: Conforme.
7. Não conformidades identificadas
NC-001 — Acúmulo de óleo e resíduos
Campo
Informação
Item relacionado
Item 2 — Limpeza e conservação
Código do item
COMP-GER-002
Snapshot relacionado
SNAP-INS-00045-002
Severidade
Leve
Descrição
Acúmulo de óleo e poeira na base do equipamento
Risco associado
Queda, contaminação e dificuldade de identificação de vazamentos
Ação corretiva
Limpar a área e verificar a existência de vazamento
Responsável
Equipe de manutenção
Prazo
05/08/2026
Status
Aberta

NC-002 — Etiqueta de segurança danificada
Campo
Informação
Item relacionado
Item 5 — Sinalização de segurança
Código do item
COMP-SEG-002
Snapshot relacionado
SNAP-INS-00045-005
Severidade
Moderada
Descrição
Etiqueta de risco elétrico parcialmente ilegível
Risco associado
Falha na comunicação do risco aos operadores
Ação corretiva
Substituir a etiqueta
Responsável
Técnico de segurança
Prazo
07/08/2026
Status
Aberta

NC-003 — Cabo elétrico danificado
Campo
Informação
Item relacionado
Item 7 — Cabos e conexões
Código do item
COMP-ELE-001
Snapshot relacionado
SNAP-INS-00045-007
Severidade
Crítica
Descrição
Desgaste na cobertura externa do cabo de alimentação
Risco associado
Choque elétrico, curto-circuito ou incêndio
Ação imediata
Interromper o uso do equipamento
Ação corretiva
Substituir o cabo e realizar novo teste elétrico
Responsável
Manutenção elétrica
Prazo
Imediato
Status
Em tratamento

NC-004 — Vibração acima do padrão
Campo
Informação
Item relacionado
Item 10 — Ruídos e vibrações
Código do item
COMP-FUN-001
Snapshot relacionado
SNAP-INS-00045-010
Severidade
Moderada
Descrição
Vibração anormal durante operação em carga máxima
Risco associado
Desgaste prematuro ou falha mecânica
Ação corretiva
Verificar rolamentos, alinhamento e fixação
Responsável
Manutenção mecânica
Prazo
06/08/2026
Status
Aberta

8. Evidências registradas
Evidência
Item relacionado
Tipo
Descrição
EVD-001
COMP-GER-001
Fotografia
Placa de identificação do equipamento
EVD-002
COMP-GER-002
Fotografia
Acúmulo de óleo próximo à base
EVD-003
COMP-SEG-002
Fotografia
Etiqueta de risco elétrico danificada
EVD-004
COMP-ELE-001
Fotografia
Cabo elétrico com desgaste
EVD-005
COMP-FUN-001
Vídeo
Vibração durante operação em carga máxima
EVD-006
COMP-ELE-003
Documento
Relatório de medição do aterramento

9. Resultado da inspeção
Resumo
Resultado
Quantidade
Itens conformes
8
Itens não conformes
4
Itens não aplicáveis
0
Itens não verificados
0
Total de itens
12

Percentual de conformidade: 66,7%
Classificação final
Aprovado
Aprovado com restrições
Reprovado
Inspeção incompleta
Parecer do inspetor
O equipamento apresenta condições gerais satisfatórias, porém foi identificada uma não conformidade crítica relacionada ao cabo de alimentação.
O equipamento deve permanecer fora de operação até que o cabo seja substituído e uma nova verificação elétrica seja realizada.
Também deverão ser corrigidas as não conformidades relacionadas à sinalização de segurança, à limpeza da base e à vibração durante a operação.
10. Rastreabilidade do template
Campo
Informação
Template aplicado
Inspeção Preventiva de Compressor de Ar
Código do template
TPL-COMP-PREV
Versão aplicada
3.0
Identificador da versão
TPL-COMP-PREV-V3
Quantidade de itens copiados
12
Data de criação dos snapshots
03/08/2026 às 09:15
Alterações posteriores permitidas
Não
Integridade dos snapshots
Validada

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
11. Próximas ações
Ação
Responsável
Prazo
Status
Substituir o cabo de alimentação
Manutenção elétrica
Imediato
Pendente
Realizar nova inspeção elétrica
Inspetor responsável
Após o reparo
Pendente
Substituir a etiqueta de advertência
Técnico de segurança
07/08/2026
Pendente
Limpar a base do equipamento
Manutenção
05/08/2026
Pendente
Verificar vibração e alinhamento
Manutenção mecânica
06/08/2026
Pendente

12. Assinaturas
Inspetor
Nome: Carlos Henrique Silva
Data: 03/08/2026
Assinatura: ______________________________________
Responsável pelo local
Nome: Ana Paula Ferreira
Data: 03/08/2026
Assinatura: ______________________________________
Revisor da inspeção
Nome: ___________________________________________
Data: //________
Decisão:
Aprovada
Devolvida para correção
Necessita de nova inspeção
Comentários do revisor:
22 Anexo D - Diagrama de Classe


