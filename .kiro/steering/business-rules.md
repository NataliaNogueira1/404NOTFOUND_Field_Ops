---
inclusion: manual
---

# FieldOps — Regras de Negócio

## Usuários e Acesso (RN-001 a RN-008)

- RN-001: Somente usuários ativos podem iniciar sessão
- RN-002: Inativação não exclui registros históricos
- RN-003: API valida perfil em todas as operações protegidas
- RN-004: Técnico só consulta inspeções atribuídas a ele
- RN-005: Supervisor consulta/revisa inspeções do seu escopo
- RN-006: Admin gerencia usuários/cadastros, mas não altera respostas de inspeção
- RN-007: Credenciais e tokens nunca em logs
- RN-008: Troca de senha/bloqueio invalida sessões

## Clientes, Locais e Equipamentos (RN-009 a RN-014)

- RN-009: Todo local pertence a um cliente
- RN-010: Todo equipamento pertence a um local (MVP)
- RN-011: QR Code do equipamento é único
- RN-012: Equipamento inativo não pode ser usado em nova inspeção
- RN-013: Registros já usados são inativados, não excluídos
- RN-014: Local da inspeção deve ser compatível com o equipamento

## Modelos de Inspeção (RN-015 a RN-023)

- RN-015: Modelo precisa de título, categoria e ao menos uma seção com item válido antes da publicação
- RN-016: Todo item precisa de tipo de resposta
- RN-017: Ordem de seções e itens é explícita
- RN-018: Rascunho pode ser alterado livremente
- RN-019: Versão publicada não pode ser alterada destrutivamente
- RN-020: Alterações em modelo publicado geram nova versão
- RN-021: Inspeção preserva snapshot dos itens da versão usada
- RN-022: Desativação do modelo não afeta inspeções existentes
- RN-023: Tipos não suportados pelo app não podem ser publicados no MVP

## Planejamento e Atribuição (RN-024 a RN-031)

- RN-024: Inspeção vinculada a versão publicada
- RN-025: Inspeção precisa de cliente, local, técnico e data prevista
- RN-026: Equipamento opcional quando inspeção for de local/ambiente
- RN-027: Somente técnico ativo recebe atribuição
- RN-028: Inspeção atribuída aparece após sincronização
- RN-029: Cancelamento registra usuário, data e justificativa
- RN-030: Inspeção aprovada não pode ser cancelada pelo fluxo comum
- RN-031: MVP = um técnico por inspeção

## Execução (RN-032 a RN-044)

- RN-032: Somente inspeções atribuídas podem ser iniciadas
- RN-033: Somente o técnico responsável pode iniciar/responder
- RN-034: Início registra data dispositivo + data servidor
- RN-035: Resposta vinculada a item do snapshot
- RN-036: Respostas validadas conforme tipo
- RN-037: Itens obrigatórios respondidos antes da conclusão
- RN-038: Resposta não conforme exige observação (quando configurado)
- RN-039: Item crítico não conforme exige evidência (quando configurado)
- RN-040: Progresso = itens respondidos / itens aplicáveis
- RN-041: App salva localmente cada alteração confirmada
- RN-042: Conclusão registra momento dispositivo + momento servidor
- RN-043: Após conclusão local, respostas bloqueadas até reprovação
- RN-044: Inspeção enviada deve ser revisada antes da aprovação

## Evidências (RN-045 a RN-051)

- RN-045: Evidência vinculada a inspeção + opcionalmente resposta ou NC
- RN-046: Somente formatos e tamanhos permitidos
- RN-047: Evidência não sincronizada não pode ser apagada por limpeza de cache
- RN-048: Exclusão de evidência sincronizada é auditada
- RN-049: Evidências de inspeções aprovadas são somente leitura
- RN-050: Nome original não é identificador único
- RN-051: Metadados sensíveis podem ser removidos

## Não Conformidades (RN-052 a RN-057)

- RN-052: NC pertence a uma inspeção
- RN-053: NC pode ser associada a item específico
- RN-054: Criticidade: LOW, MEDIUM, HIGH, CRITICAL
- RN-055: NC crítica exige descrição e evidência
- RN-056: Exclusão após envio = alteração de estado auditável
- RN-057: Tratamento completo de NC é futuro, registro no MVP

## Localização e QR Code (RN-058 a RN-064)

- RN-058: Consentimento antes de câmera/localização
- RN-059: Recusa produz orientação e alternativa
- RN-060: Localização não coletada continuamente (MVP)
- RN-061: Localização registrada no início e na conclusão
- RN-062: Armazena lat, lon, precisão e horário
- RN-063: QR Code não autoriza acesso a dados não permitidos
- RN-064: Divergência equipamento previsto vs lido deve ser informada

## Offline e Sincronização (RN-065 a RN-078)

- RN-065: Inspeções baixadas acessíveis sem conexão
- RN-066: Dados não sincronizados sobrevivem ao fechamento do app
- RN-067: Cada operação tem UUID idempotente
- RN-068: Reenvio não cria duplicidade
- RN-069: Operações processadas respeitando dependências
- RN-070: Falha em uma operação não apaga outras pendentes
- RN-071: App exibe quantidade de operações pendentes
- RN-072: App informa data/resultado da última sincronização
- RN-073: Servidor é fonte oficial após confirmação
- RN-074: App preserva data de execução do dispositivo + data do servidor
- RN-075: Conflitos detectados por versão/data
- RN-076: Dados aprovados no servidor prevalecem (MVP)
- RN-077: Inspeção cancelada no servidor não descarta dados locais sem aviso
- RN-078: Arquivos sincronizados separadamente dos dados estruturados

## Revisão e Aprovação (RN-079 a RN-085)

- RN-079: Somente supervisor autorizado inicia revisão
- RN-080: Reprovação exige motivo
- RN-081: Aprovação registra supervisor, data e comentário opcional
- RN-082: Inspeção aprovada bloqueada para edição comum
- RN-083: Correções após reprovação preservam histórico
- RN-084: Supervisor não altera silenciosamente respostas do técnico
- RN-085: Ajustes administrativos diferenciados e auditados

## Auditoria e Integridade (RN-086 a RN-090)

- RN-086: Alterações críticas registram usuário, data, ação e entidade
- RN-087: Datas de criação/atualização mantidas pelo servidor
- RN-088: Entidades históricas não excluídas fisicamente
- RN-089: API rejeita transições de estado inválidas
- RN-090: Documentação reflete estados, validações e erros
