---
inclusion: manual
---

# FieldOps — Critérios de Aceitação e Definition of Done

## Critérios Gerais do Produto

O incremento é aceito quando:
- Funcionalidade atende às regras de negócio
- Perfil correto executa a ação
- Perfis não autorizados são bloqueados pela API
- Estados de carregamento, vazio, erro e sucesso tratados
- Dados persistem no componente adequado
- Erros não causam perda silenciosa de dados
- Contrato da API atualizado
- Fluxo integrado quando depende de mais de uma aplicação
- Evidências de teste disponíveis

## AC-AUTH — Autenticação

- Login válido → sessão criada, perfil retornado, redirecionamento
- Credenciais inválidas → acesso negado, sem revelar se e-mail existe
- Usuário inativo → sessão negada com orientação
- Token expirado → renovação automática controlada
- Logout → dados sensíveis removidos, rotas protegidas inacessíveis

## AC-TEMPLATE — Modelo de Inspeção

- Criar rascunho → modelo editável com seções e itens
- Publicar válido → versão numerada imutável criada
- Publicação inválida → bloqueada com pendências listadas
- Alterar modelo já utilizado → nova versão, inspeções antigas mantêm snapshot

## AC-CHECKLIST — Checklist Dinâmico

- Itens na ordem do snapshot
- Componente corresponde ao tipo de resposta
- Valores inválidos bloqueados com mensagem
- Resposta confirmada salva em SQLite
- Fechar/reabrir app preserva respostas
- Progresso recalculado corretamente
- Obrigatórios pendentes identificáveis
- Tipo desconhecido → estado controlado (sem crash)

## AC-EVIDENCE — Evidências

- Captura com permissão → prévia → confirmar/refazer → associar ao item
- Offline → arquivo no dispositivo + upload pendente
- Falha de upload → evidência pendente, dados confirmados não revertidos
- Formato e tamanho validados
- Evidência aprovada = somente leitura

## AC-SYNC — Sincronização

- Envio bem-sucedido → operações na ordem, confirmações persistidas
- Reenvio → ALREADY_APPLIED, sem duplicidade
- Falha parcial → resultado individual, confirmadas mantidas
- Conflito → preserva local, exibe estado de conflito
- Cursor avança somente após persistência local
- Sair/entrar no app não apaga outbox

## AC-REVIEW — Revisão

- Iniciar revisão → estado muda para EM_REVISÃO + auditoria
- Aprovar → APROVADA, registra revisor/horário, protege respostas
- Reprovar sem motivo → bloqueado
- Reprovar com motivo → REPROVADA, técnico recebe na próxima sync

## AC-RELEASE — Versão Final (Demonstração)

Sem edição manual do banco, demonstrar:
1. Login administrativo
2. Cadastro/seleção de cliente, local, equipamento
3. Criação/seleção de modelo publicado
4. Agendamento e atribuição
5. Login do técnico
6. Download da inspeção
7. Início
8. Resposta do checklist
9. Foto
10. QR Code
11. Localização
12. Perda simulada de conectividade
13. Conclusão offline
14. Retorno da conectividade
15. Sincronização sem duplicidade
16. Visualização administrativa
17. Aprovação ou reprovação
18. Atualização no aplicativo
19. Consulta do histórico mínimo

---

## Definition of Done — História de Usuário

### Requisitos
- [ ] Critérios de aceitação claros
- [ ] Regras de negócio verificadas
- [ ] Dependências resolvidas
- [ ] Comportamento de erro definido

### Código
- [ ] No repositório correto, em branch apropriada
- [ ] Pull request com revisão
- [ ] Passa lint e verificação de tipos
- [ ] Sem segredos no repositório
- [ ] Sem logs sensíveis

### Testes
- [ ] Critérios de aceitação testados
- [ ] Ao menos uma exceção verificada
- [ ] Testes automatizados para regras críticas

### Interface
- [ ] Estado de carregamento tratado
- [ ] Estado vazio tratado
- [ ] Estado de erro tratado
- [ ] Processamento evita envio duplicado
- [ ] Mensagens compreensíveis
- [ ] Respeita permissões

### Integração
- [ ] Contrato API implementado/atualizado
- [ ] DTOs coerentes
- [ ] Erros tratados
- [ ] Autorização validada no backend

### Documentação
- [ ] README atualizado
- [ ] OpenAPI atualizado (quando necessário)
- [ ] Evidência de funcionamento

## DoD Específico Mobile
- [ ] Testado em Android (dispositivo ou emulador)
- [ ] Comportamento offline considerado
- [ ] Alterações persistem após reinicialização
- [ ] Permissões negadas tratadas
- [ ] Dados sensíveis em Secure Store
- [ ] Não provoca perda de operações pendentes

## DoD Específico Web Admin
- [ ] Rota com guard
- [ ] Paginação em listas
- [ ] Validação visual e servidor
- [ ] Ação crítica com confirmação
- [ ] Erros 401/403/404/409/422 tratados
- [ ] Testado em resolução de notebook

## DoD Específico API
- [ ] Endpoint no OpenAPI
- [ ] DTO separado da entidade JPA
- [ ] Validação de entrada
- [ ] Autorização implementada
- [ ] Regra de negócio testada
- [ ] Erro padronizado
- [ ] Migração incluída (quando necessário)
- [ ] Operação sync testada para repetição
