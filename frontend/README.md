# FieldOps Web

Painel administrativo da plataforma FieldOps, usado por administradores e supervisores. Cobre o cadastro de clientes, locais, equipamentos e usuários, a criação e versionamento de modelos de inspeção, o agendamento/atribuição de inspeções e o acompanhamento e revisão dos resultados.

- **React 19** · TypeScript (strict) · **Vite**
- **React Router** · **React Hook Form** · **Zod**
- **Tailwind CSS** · **Lucide React** · **Recharts**
- **Vitest** · **Testing Library** · **ESLint**

> Este módulo faz parte de um monorepo. A API (`api/`) e o aplicativo mobile (`mobile/`) têm seus próprios READMEs.

---

## Pré-requisitos

- **Node.js 20+** e **npm**
- A **API FieldOps** rodando e acessível (ver `api/README.md`)

---

## Configuração

1. Instale as dependências (fixadas pelo `package-lock.json`):

   ```sh
   npm install
   ```

2. Crie o arquivo de ambiente a partir do exemplo:

   ```sh
   cp .env.example .env
   ```

3. Ajuste `VITE_API_URL` para a URL base da API (padrão `http://localhost:8080`):

   ```sh
   VITE_API_URL=http://localhost:8080
   ```

   > Variáveis com prefixo `VITE_` são embutidas no bundle e ficam públicas. Use apenas para configuração não sensível.

---

## Executando

```sh
npm run dev        # inicia o servidor de desenvolvimento (Vite)
npm run build      # type-check (tsc -b) + build de produção
npm run preview    # serve o bundle de produção localmente
```

O servidor de desenvolvimento sobe em `http://localhost:5173` por padrão.

### Qualidade

```sh
npm run lint       # ESLint
npm run test       # Vitest (Testing Library)
```

Antes de commitar, rode `npm run lint`, `npm run test` e `npm run build` — todos devem passar.

---

## Estrutura do projeto

O fluxo de dependência é explícito: **página/componente → hook/estado → serviço de API → cliente HTTP**. Páginas coordenam estado de rota e compõem componentes; os detalhes de HTTP ficam nos módulos de API.

```text
frontend/
  src/
    api/          # Cliente HTTP, endpoints por domínio e mapeamento de payloads
    auth/         # Sessão e autenticação de rota
    components/   # UI reutilizável agrupada por responsabilidade
    hooks/        # Comportamento com estado reutilizável
    layouts/      # Shells de rota e chrome de página
    mocks/        # Fixtures de desenvolvimento/teste apenas
    pages/        # Telas de domínio por rota
    routes/       # Definições de rota e guards (AppRoutes.tsx)
    services/     # Integrações de infraestrutura que não são HTTP
    state/        # Estado de aplicação intencionalmente compartilhado
    test/         # Setup global de testes
    types/        # Tipos de domínio compartilhados
    utils/        # Funções puras pequenas entre domínios
  index.html
  vite.config.ts
```

### Camadas e regras principais

- Todas as chamadas HTTP passam por `src/api/client.ts` e um módulo de API por domínio. Páginas e componentes **não** chamam `fetch` diretamente.
- Rotas são declaradas em `src/routes/AppRoutes.tsx` e as páginas de rota são carregadas via lazy load.
- Guards de rota impõem autenticação e acesso por perfil — esconder um botão não é autorização; o backend continua sendo a fonte de verdade das permissões.
- Não importe mocks em um módulo de API nem use persistência mock para uma feature já suportada por endpoint real.

---

## Convenções

### Commits

Seguimos **[Conventional Commits](https://www.conventionalcommits.org/)**, no mesmo padrão da API e do mobile.

- Prefixos: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`.
- Assunto em **inglês**, modo imperativo ("add", não "added"), até 72 caracteres, sem ponto final.
- Uma mudança lógica por commit; explique **o quê** e **o porquê** no corpo quando útil.
- Não commite `dist/`, arquivos de ambiente ou artefatos gerados.
- Não adicione atribuição de IA nem trailer `Co-Authored-By`.

Exemplos:

```text
feat: wire refresh-token interceptor into live session
fix: keep equipment optional on new inspection form
docs: add frontend run instructions
```

### Branches

- Crie uma branch a partir de `develop`.
- Nomeie por tipo e escopo curto: `feat/<escopo>`, `fix/<escopo>`, `docs/<escopo>`.
  - Ex.: `feat/inspection-review`, `docs/frontend-readme-conventions`.

### Pull Requests

- Abra o PR contra `develop`. Não faça push direto em `main`/`develop`.
- Referencie o PBI/issue relacionado (ex.: "Closes #13").
- Descreva o que mudou, como foi testado e o que ficou de fora.
- Garanta que `npm run lint`, `npm run test` e `npm run build` passam antes de abrir o PR.
- Nunca faça `git push` automático; só faça push quando solicitado.

---

## Notas

- O código-fonte (identificadores, tipos, contratos) fica em **inglês**; textos de UI ficam em **português**, seguindo o vocabulário já usado no produto.
- Reaproveite os componentes de design system e os tokens do Tailwind antes de criar novas variantes.
- O guia completo de convenções do módulo está em [`AGENTS.md`](./AGENTS.md).
