# Convenções do Frontend Web

## Stack

O frontend web atual usa React + Vite + TypeScript, com React Router, Tailwind CSS e componentes locais em `frontend/src/components`.

O frontend web usa React + TypeScript + Vite, com `vite.config.ts`, `@vitejs/plugin-react` e scripts Vite em `frontend/package.json`.

## Branches

- `main`: base estável.
- `develop`: integração da sprint, quando utilizada pelo time.
- `feature/pbi-xxx-descricao`: novas funcionalidades.
- `fix/pbi-xxx-descricao`: correções relacionadas a PBI.
- `chore/descricao`: manutenção, documentação, CI e ajustes sem regra de negócio.

## Commits

Use mensagens curtas e objetivas, preferencialmente no formato:

```text
tipo: resumo da mudança
```

Tipos sugeridos: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`.

## Fluxo de PR

Antes de abrir PR, executar em `frontend/`:

```bash
npm run lint
npm test
npm run build
```

O PR deve descrever:

- PBI/issue relacionada;
- telas ou fluxos alterados;
- validações executadas;
- limitações mockadas, quando existirem.

## Organização principal

- `src/routes`: árvore de rotas e guards mockados.
- `src/layouts`: layouts Admin/Supervisor, Técnico e Auth.
- `src/pages`: páginas por módulo de negócio.
- `src/components`: UI, layout, badges, feedback, tabelas e formulários reutilizáveis.
- `src/mocks`: dados mockados do domínio.
- `src/state`: stores locais em memória para protótipo.
- `src/auth`: sessão mockada e regras simples de perfil.
- `src/types`: tipos e enums compartilhados do domínio.
