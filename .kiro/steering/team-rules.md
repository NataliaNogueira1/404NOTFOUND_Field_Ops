---
inclusion: always
---

# Regras de Trabalho da Equipe — 404 Not Found (FieldOps)

> Este arquivo é lido automaticamente antes de cada interação. Siga estas regras
> em toda tarefa, a menos que o usuário instrua o contrário na conversa.

## 1. Idioma

- **Sempre responda em português (pt-BR).** Vale para mensagens de chat, explicações,
  descrições de PR e qualquer comunicação com a equipe.
- Exceção: mensagens de commit são sempre em **inglês** (ver seção Commits).

## 2. Ordem de precedência das decisões

Ao decidir o que fazer, siga esta hierarquia (do mais forte para o mais fraco):

1. **O que o usuário pede na conversa** — tem prioridade máxima e se sobrepõe a tudo.
2. **As instruções do professor** — documento #[[file:docs/notion.md]] (versão Markdown
   do PDF original, contendo visão geral, objetivos, personas, perfis, casos de uso e
   fluxos do trabalho). É a fonte de requisitos e regras do trabalho; **só perde para o
   que o usuário diz na conversa**. Sempre considere esse documento ao planejar/decidir.
   - **Observação importante (stack do frontend web):** o documento do professor cita
     "Angular/React" (e há arquivos de steering antigos que falam em Angular), mas o
     **frontend web NÃO usa Angular**. A stack real é **React + Vite + TypeScript**
     (React Router, Tailwind CSS), como confirmado no código em `frontend/`
     (`frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/main.tsx`) e em
     `docs/convencoes-frontend-web.md`. Ao implementar/decidir sobre o web, **sempre use
     React + Vite** e ignore qualquer instrução de Angular; se necessário, avise que
     isso diverge do documento do professor.
3. **O Kanban / issues do projeto** — a fonte de verdade das tarefas planejadas.
4. **O código e as pastas existentes** — padrões, convenções e estado atual do repo.

Se o usuário pedir algo que conflita com as instruções do professor ou com o Kanban,
siga o usuário e, se relevante, avise que aquilo diverge do documento do professor
e/ou do board.

## 3. Antes de tomar decisões (checklist obrigatório)

Antes de começar qualquer tarefa que envolva mudança de código ou planejamento:

1. **Leia o contexto do projeto, se ainda não estiver no contexto (OBRIGATÓRIO).**
   É obrigatório conhecer o contexto do projeto antes de qualquer decisão. Se o
   conteúdo abaixo ainda não estiver carregado na conversa atual, **leia-o antes de
   prosseguir**:
   - #[[file:.kiro/steering/project-context.md]]
   - Consulte também os demais arquivos de steering conforme a necessidade da tarefa
     (ex.: `architecture.md`, `data-model.md`, `business-rules.md`,
     `coding-standards.md`).
   Se já estiver no contexto, não precisa reler.
2. **Consulte o Kanban** do projeto:
   https://github.com/users/NataliaNogueira1/projects/2/views/1
   - Entenda a issue/tarefa relacionada, seu status e critérios de aceite.
   - Se a tarefa não existir no board, siga o pedido do usuário mesmo assim.
3. **Leia o código e as pastas relevantes** disponíveis no repositório antes de
   propor ou escrever qualquer coisa. Nunca proponha mudanças em código que você
   não leu.
4. **Consulte o cronograma e a análise de sprint** (ver seção 3.1).
5. Só então planeje e execute.

### 3.1. Cronograma e análise de sprint (obrigatório ao criar funcionalidade)

Documentos de referência (sempre considerar quando o usuário for **criar/implementar
uma funcionalidade**):

- Cronograma do projeto: #[[file:docs/cronograma.md]]
- Análise da Sprint 1 (backend + web): #[[file:docs/analise-sprint1-back-web.md]]

Ao criar ou implementar uma funcionalidade, faça **antes** estas duas verificações:

1. **Confira se a funcionalidade está no cronograma** (`docs/cronograma.md`):
   - Se **não estiver** listada (nenhum PBI/tarefa correspondente), **avise o usuário**
     de forma clara que aquilo não consta no cronograma, e siga adiante conforme o
     pedido dele (o usuário tem prioridade — ver seção 2).
   - Se estiver, siga o PBI/tarefa correspondente.
2. **Confira o status na análise de sprint** (`docs/analise-sprint1-back-web.md`):
   - Se a funcionalidade estiver **marcada como concluída** (veredicto ✅ Concluído),
     **dobre as revisões**: leia o código já existente com atenção redobrada antes de
     mexer, confirme se a mudança pedida realmente falta ou se já está feita, e
     **avise o usuário** de que aquele item já consta como concluído — para evitar
     retrabalho ou quebrar algo que já funciona.
   - Se estiver parcial (🟡) ou não feito (❌), siga o fluxo normal de implementação.

Sempre relate ao usuário, em português, o que encontrou nesses documentos (consta ou
não no cronograma; qual o status na análise) antes de começar a implementação.

## 4. Branches

- **Nunca faça mudanças diretamente na `develop`** (nem na `main`/`master`).
- Para qualquer tarefa, **abra uma branch nova** a partir da `develop` (ou da base
  correta indicada pelo usuário).
- Nome de branch descritivo, em inglês, no padrão `tipo/descricao-curta`, por exemplo:
  - `feat/order-payment-status`
  - `fix/login-bcrypt-hash`
  - `docs/update-architecture`
- Se você perceber que está na `develop`, crie e mude para uma branch antes de
  qualquer commit.

## 5. Commits

### 5.0. REGRA PRINCIPAL: faça o MÁXIMO de commits possível

- Prefira commits **pequenos, atômicos e coesos** — **um propósito por commit** — em
  vez de um único commit grande.
- **Divida o trabalho** por camada, por arquivo lógico, por passo concluído ou por tipo
  de mudança. Se uma alteração pode ser separada em dois commits que fazem sentido
  sozinhos, faça dois commits.
- Só agrupe no mesmo commit o que for realmente indivisível (mudanças que quebram se
  separadas).

### 5.1. Padrão e formato

- Padrão de commits: **iuricode / Padrões de Commits**
  https://github.com/iuricode/padroes-de-commits
- Este padrão vale para **todo o repositório** (frontend/web-admin, backend/api, mobile)
  e **prevalece sobre qualquer outra instrução de commit em conflito** (ex.: seções de
  commit em arquivos `AGENTS.md`/`CLAUDE.md` de subprojetos e a menção a Conventional
  Commits em `coding-standards.md`).
- Mensagens de commit **sempre em inglês**.
- **O emoji é OBRIGATÓRIO** e vem no **início** da mensagem, seguido do tipo.
- Formato: `<emoji> tipo: descrição no imperativo`.
  Tipos mais usados: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `raw`, `cleanup`, `remove`.
  - Exemplos:
    - `✨ feat: add payment status endpoint`
    - `🐛 fix: reject $2b$ bcrypt hashes on login`
    - `📝 docs: update architecture diagram`
    - `✅ test: add coverage for order stage flow`

### Emoji por tipo (tabela oficial iuricode)

| Tipo | Emoji | Código |
|------|-------|--------|
| `feat` | ✨ | `:sparkles:` |
| `fix` | 🐛 | `:bug:` |
| `docs` | 📝 | `:memo:` |
| `test` | ✅ | `:white_check_mark:` |
| `refactor` | ♻️ | `:recycle:` |
| `perf` | ⚡ | `:zap:` |
| `style` | 🎨 | `:art:` |
| `build` | 📦 | `:package:` |
| `ci` | 👷 | `:construction_worker:` |
| `chore` | 🔧 | `:wrench:` |
| `raw` | 🗃️ | `:card_file_box:` |
| `cleanup` | 🧹 | `:broom:` |
| `remove` | 🔥 | `:fire:` |
| Acessibilidade | ♿ | `:wheelchair:` |
| Primeiro commit | 🎉 | `:tada:` |
| Segurança | 🔒️ | `:lock:` |
| Deploy | 🚀 | `:rocket:` |
| Revertendo mudanças | 💥 | `:boom:` |

> Referência: [iuricode/padroes-de-commits](https://github.com/iuricode/padroes-de-commits).
> Se o tipo não estiver na tabela, use o emoji correspondente da tabela oficial do iuricode.

- Só faça commit quando o usuário pedir ou quando fizer sentido dentro do fluxo
  acordado; siga as regras de segurança de git (stage de arquivos específicos,
  nada de `push --force`, nada de alterar config de git).
- **Nunca faça push automaticamente** — o usuário decide quando e para onde fazer push.
- **Nunca adicione `Co-Authored-By`** — os commits são exclusivamente do autor.

## 6. Pull Requests

- PRs sempre a partir da branch de trabalho para a `develop` (ou base indicada),
  nunca commits diretos na base.
- Título de PR curto (até ~70 caracteres), em inglês.
- Descrição do PR **em português**, com resumo das mudanças, o que foi testado e
  pendências/bloqueios, quando houver.

## 7. Convenções de código

- Respeite os padrões, bibliotecas e a estrutura já usados no projeto (ver os demais
  arquivos de steering, como `coding-standards.md`, `architecture.md` e
  `project-context.md`). Não introduza novas dependências ou padrões sem necessidade.
- Rode build/testes relevantes após mudanças, quando possível, antes de dar a tarefa
  como concluída.

## 8. Segurança e dados sensíveis

As regras técnicas de segurança do projeto ficam em `coding-standards.md` (seção
Segurança), `business-rules.md` (RN-007, RN-008) e `project-context.md`. Além delas,
valem os alertas abaixo em toda interação:

- **Avise antes de subir dados que não deveriam ir para o repositório.** Se o usuário
  pedir para commitar, adicionar ou "subir" arquivos que provavelmente contêm segredos
  ou dados sensíveis, **pare e avise o usuário** antes de prosseguir. Exemplos:
  - Arquivos de segredo: `.env`, `*.pem`, `*.key`, chaves de API, `credentials.*`,
    arquivos de keystore/`.jks`.
  - Credenciais/segredos embutidos no código ou em migrations (senhas, tokens,
    connection strings com senha, chaves JWT).
  - Dados pessoais reais / PII de clientes, técnicos ou inspeções (e-mails, documentos,
    fotos de evidência com pessoas), especialmente em dumps, seeds ou fixtures.
- Ao detectar um desses casos, explique **o que** seria exposto e **por que** é risco,
  e sugira alternativa (usar `.env.example` com placeholders, `.gitignore`, variáveis
  de ambiente, dados fictícios em seed/teste). Só prossiga se o usuário confirmar de
  forma explícita.
- **Nunca** faça commit de `.env`, chaves ou credenciais por conta própria. Prefira
  adicionar ao `.gitignore` e usar placeholders.
- Ao stagear para commit, **prefira arquivos específicos** (nunca `git add .` cego) e
  confira se nenhum arquivo sensível entrou junto.
- **Nunca** exponha valores de segredos nas respostas do chat (referencie pela chave,
  não pelo valor) e **nunca** coloque credenciais ou tokens em logs (RN-007).
- Não envie código, segredos ou dados do projeto para serviços externos sem o usuário
  pedir explicitamente.

## 9. Comunicação

- Seja direto e claro. Se algo estiver ambíguo entre usuário e Kanban, aponte o
  conflito e siga o usuário.
- Ao concluir, informe em português o que foi feito, em quais branches/commits, e o
  que ficou pendente.

## 10. Tutorial de teste ao final (quando houver mudança)

Ao **final de tudo**, depois de aplicar/entregar qualquer mudança (código, config,
arquivos, docs, commits), inclua sempre um **passo a passo de como testar/verificar** o
que foi feito.

> **Quando NÃO incluir:** se o pedido foi apenas **analisar, pesquisar, explicar,
> revisar ou ler** algo — ou seja, **sem aplicar nenhuma mudança** — **não** adicione o
> tutorial de teste. Nesses casos, apenas responda ao que foi pedido.

Regras do tutorial (quando aplicável):

- Escreva em **português**, como um tutorial numerado, fácil de seguir.
- Traga os **comandos exatos** (com o diretório certo) e o **resultado esperado** de
  cada passo, para o usuário confirmar que deu certo.
- Cubra o que for aplicável ao que mudou, por exemplo:
  - **Código:** como rodar build/lint/testes (ex.: `npm run lint`, `npm test`,
    `./mvnw test`, `npx jest`), e como validar manualmente na tela/endpoint.
  - **UI:** o que abrir no navegador, o que clicar, e como checar acessibilidade
    (teclado, `jest-axe`).
  - **Config/docs/steering:** como confirmar que o arquivo existe, foi carregado e
    surte efeito (ex.: iniciar uma nova conversa e checar o comportamento).
  - **Git:** como conferir branch, commits e push (`git log`, `git status`).
- Se algo **não pôde ser testado** por você (falta de ambiente, credenciais, etc.),
  diga isso explicitamente e explique como o usuário pode testar por conta própria.

## 11. Após os testes: issue e Pull Request

Este fluxo só se aplica **depois** de entregar uma mudança e apresentar o tutorial de
teste (seção 10), e **somente quando o usuário confirmar que deu certo**. Se o usuário
não confirmou (ou disse que falhou), não mova nada — ajude a corrigir primeiro.

### 11.1. Quando o usuário confirma que deu certo

1. **Mova a issue correspondente para "In review"** no board do projeto
   (https://github.com/users/NataliaNogueira1/projects/2/views/1).
   - Se não tiver acesso para mover, informe o usuário e explique como mover
     manualmente (ou o comando `gh` equivalente).
2. **Forneça instruções de como abrir o Pull Request**, em português, incluindo:
   - Conferir a branch atual e o push (`git status`, `git log --oneline -5`,
     `git push -u origin <branch>`).
   - Comando para abrir o PR (ex.: `gh pr create --base develop --head <branch>`),
     lembrando: base `develop`, título curto em inglês (≤70 chars), descrição em
     português (resumo, o que foi testado, pendências) e referência à issue
     (ex.: `Closes #<numero>`).

### 11.2. Se a issue não existir

- **Sempre reforce a importância de ter uma issue para QUALQUER mudança.** Toda vez que
  uma mudança for feita (código, config, docs, etc.) e não houver issue correspondente,
  lembre o usuário de que criar a issue mantém o board como fonte de verdade, dá
  rastreabilidade (issue ↔ commit ↔ PR) e evita retrabalho. Deixe claro que **é rápido**
  e que você pode criar na hora — basta o usuário aceitar.
- **Sempre se ofereça para criar a issue.** Ao criar (após o usuário aceitar), a issue
  nova deve conter:
  - **Descrição detalhada** do que é a tarefa.
  - **Critérios de validação** (aceite).
  - **Atribuição** (assignee).
  - **Labels**.
  - **Prioridade**.
  - **Size** (estimativa/tamanho).

### 11.3. Fluxo para issue de tarefa recém-concluída

Se a issue está sendo criada para uma tarefa que **acabou de ser concluída**, percorra
todas as colunas do board na ordem, para manter o histórico coerente:

1. Criar na coluna **Backlog**.
2. Mover para **Ready**.
3. Mover para **In progress**.
4. **Comentar na issue** informando qual **commit** comprova a conclusão
   (ex.: hash + mensagem do commit).
5. Mover para **Done**.

> Observação: mover cards de projeto e criar/comentar issues normalmente é feito via
> GitHub CLI (`gh issue create`, `gh issue comment`, `gh project item-edit`) ou pela
> interface web. Se você não conseguir executar por falta de acesso/credenciais,
> **diga isso claramente** e forneça os comandos exatos para o usuário rodar.
