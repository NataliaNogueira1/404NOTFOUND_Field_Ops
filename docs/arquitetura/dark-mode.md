# Tema claro/escuro (PBI-091) — guia rápido

Esta issue cria **apenas a infraestrutura** de tema (tokens, provider, persistência
e alternância). As telas **não** foram migradas — isso será feito nas próximas issues.
O tema claro continua idêntico ao anterior.

Preferências: `"claro"` | `"escuro"` | `"sistema"` (padrão: `"sistema"`).

---

## WEB (React + Vite + Tailwind v4)

- Os tokens de cor são **CSS custom properties** definidas em `frontend/src/index.css`.
  O bloco `@theme` tem os valores do tema claro; o bloco `.dark` **redefine os mesmos
  tokens** para o escuro.
- A classe `dark` é aplicada no `<html>` pelo `ThemeProvider`
  (`frontend/src/theme/ThemeProvider.tsx`).

**Como uma tela deve consumir:**
- Use as **classes semânticas** já existentes: `bg-app-bg`, `bg-surface`, `text-text`,
  `text-muted`, `border-border`, `bg-success`/`text-success-dark`, `warning`, `danger`.
  Elas trocam de valor automaticamente no dark, sem alterar o componente.
- **Não** adicione cores hardcoded novas (ex.: `bg-[#fff]`, `text-white` fixo) para
  superfícies/texto. Se precisar de uma variação pontual só do dark, use `dark:...`.
- Para ler/alterar a preferência: `const { theme, setTheme, effectiveTheme } = useTheme()`.
- Controle pronto de alternância: `<ThemeToggle />` (`frontend/src/theme/ThemeToggle.tsx`).

---

## MOBILE (Expo + React Native)

- Tokens em `mobile/src/config/themes.ts`: `lightColors` (= `Colors` atual) e
  `darkColors` (mesmas chaves, valores escuros).
- `ThemeProvider` + `useTheme()` em `mobile/src/features/theme`. `"sistema"` usa
  `useColorScheme()`.
- Persistência via `mobile/src/infrastructure/storage/themeStorage.ts`
  (SecureStore no native, localStorage no web) — mesma estratégia do `tokenStorage`.

**Como uma tela deve consumir (nas próximas issues):**
- Obtenha as cores ativas pelo hook:
  ```tsx
  const { colors, effectiveTheme, theme, setTheme } = useTheme()
  // use colors.surface, colors.text, colors.border, colors.background, ...
  ```
- **Não** defina cores diretamente no componente nem importe `Colors` estático quando
  a tela precisar reagir ao tema — use `colors` do `useTheme()`.
- As chaves de `colors` são as mesmas de `Colors`, então a migração é só trocar a fonte.
