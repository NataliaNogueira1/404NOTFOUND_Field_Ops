# FieldOps Frontend

Web frontend of the FieldOps platform.

- React 19 · TypeScript · Vite
- React Router · React Hook Form · Zod
- Tailwind CSS · Lucide React · Recharts
- Vitest · Testing Library · ESLint

## Architecture

- Keep the dependency flow explicit: **page/component → hook/state → API service → HTTP client**.
- Pages coordinate route-level state and compose components. They do not implement HTTP details.
- API modules under `src/api/` own endpoints, request/response contracts, and backend-to-frontend mapping.
- The shared HTTP client owns base URL, authentication headers, response parsing, and transport errors.
- Reusable visual behavior belongs in `src/components/`; domain-specific UI stays close to its page.
- Shared state must have a clear owner. Prefer local state, then a focused hook, and use a global store only when multiple routes genuinely share the state.
- Never import mocks into an API module or use mock persistence for a feature backed by a real endpoint.

## Components and SOLID

- Give each component one reason to change. Split data orchestration, domain behavior, and presentation when they evolve independently.
- Prefer composition and small typed props over large components with mode flags.
- Extract repeated behavior into focused hooks; do not hide simple one-off logic in generic helpers.
- Depend on project-owned API functions and types rather than calling third-party clients throughout the UI.
- Keep route components readable. Extract a section when it has its own state, validation, or meaningful interaction contract.
- Avoid premature abstractions. Generalize only after a stable repeated pattern exists.

## TypeScript

- Keep strict TypeScript enabled and resolve type errors instead of suppressing them.
- Do not use `any`, unchecked casts, non-null assertions, or `@ts-ignore` without a documented integration constraint.
- Model backend payloads separately from UI/domain models when IDs, nullable values, enums, or naming differ.
- Normalize backend responses at the API boundary so components receive predictable values.
- Use discriminated unions and enums for finite states. Avoid magic strings spread across components.
- Type component props, hooks, API inputs, API responses, and reusable functions explicitly.

## React

- Use function components and hooks.
- Keep render functions pure. Do not set state during render.
- Use effects only to synchronize with external systems or subscriptions. Derive values during render or with `useMemo` when computation is material.
- Include every reactive dependency in effect and callback dependency lists.
- Use controlled inputs for modal and form drafts unless a form library owns their state.
- Use stable backend IDs as list keys. Never use an array index when items can be reordered or removed.
- Represent loading, empty, error, success, and disabled states explicitly.
- For optimistic updates, preserve the prior state and restore it when persistence fails.

## Routing and authorization

- Declare application routes in `src/routes/AppRoutes.tsx` and lazy-load route-level pages.
- Keep navigation paths centralized or constructed consistently from route parameters.
- Route guards enforce authentication and profile access; hiding a button is not authorization.
- The backend remains the source of truth for permissions and business rules.

## Forms and validation

- Use React Hook Form with Zod for non-trivial forms. Small controlled forms may use local state when clearer.
- Validate required fields and basic shape before sending requests, while preserving backend validation as authoritative.
- Display field errors beside their controls and request-level errors in an element with `role="alert"`.
- Trim user-entered text at the API boundary or immediately before submission.
- Disable submission while invalid or pending, and prevent duplicate requests.

## API and errors

- All HTTP calls go through `src/api/client.ts` and a domain API module.
- Do not call `fetch` directly from pages or components.
- Keep endpoint paths, HTTP methods, and payload mapping inside API modules.
- Treat nullable and optional backend fields deliberately; do not leak `null` into controls expecting strings.
- Show actionable Portuguese messages to users. Never expose stack traces, secrets, tokens, or raw server internals.
- Handle rejected requests and roll back optimistic UI changes when necessary.

## UI, accessibility, and content

- Reuse the existing design-system components and Tailwind tokens before adding new variants.
- Keep all code identifiers and technical contracts in English.
- Product copy shown in the UI is Portuguese and should follow the vocabulary already used by the product.
- Every interactive control must have an accessible name. Icon-only buttons require `aria-label`.
- Associate labels and errors with inputs, preserve keyboard navigation, and use semantic HTML landmarks and headings.
- Modals use `role="dialog"`, expose a title, support an obvious close action, and return focus sensibly.
- Do not encode meaning by color alone. Preserve visible focus styles and sufficient contrast.
- Build responsive layouts from the smallest viewport upward and avoid fixed dimensions unless the design requires them.

## Code style

- Components and types use `PascalCase`; functions, variables, props, and hooks use `camelCase`; hooks start with `use`.
- Use specific names. Avoid generic names such as `data`, `handler`, `manager`, `util`, and `helper`.
- Prefer guard clauses and shallow control flow. Keep functions focused and extract complex conditions with domain names.
- Do not duplicate request mapping, validation, or UI patterns.
- Keep existing comments during refactors. Comments explain why, not what.
- Follow the repository ESLint and TypeScript configuration; do not hand-disable rules to bypass design problems.

## Tests (TDD)

- Follow **Red → Green → Refactor**. Add a failing behavioral test before production code.
- Every new user interaction, route behavior, API mapping, and bug fix gets a regression test.
- Page/component tests use Testing Library and assert what a user can see or do, not component internals.
- Prefer accessible queries such as `getByRole`, `getByLabelText`, and `findByText`.
- Mock the HTTP boundary with `fetch` or the narrow API dependency. Never call real services in unit tests.
- Cover success, validation, error, empty, and authorization states in proportion to risk.
- Tests must be fast, independent, repeatable, self-validating, and timely.

## Performance

- Lazy-load route-level pages and large optional features.
- Avoid unnecessary effects, duplicated server state, and broad context providers that rerender the application.
- Use memoization only when measurement or component behavior justifies it.
- Keep bundle growth intentional; prefer existing dependencies and browser APIs.
- Provide stable dimensions for media and charts to minimize layout shifts.

## Security

- Never store, log, or expose passwords, refresh tokens, access tokens, or secrets in source code.
- Environment-exposed frontend variables are public by definition; only use `VITE_*` for non-secret configuration.
- Do not render untrusted HTML. If unavoidable, sanitize it behind a project-owned component and test it.
- Do not rely on frontend validation or authorization for business security.

## Commands

```sh
npm install       # install pinned dependencies from package-lock.json
npm run dev       # start the Vite development server
npm run test      # run the Vitest suite
npm run lint      # run ESLint
npm run build     # type-check and create the production bundle
npm run preview   # serve the production bundle locally
```

Before committing, run `npm run lint`, `npm run test`, and `npm run build`. All must pass.

## Where things go

```text
src/
  api/          # HTTP client, domain endpoints, and transport mapping
  auth/         # session and route authentication
  components/   # reusable UI grouped by responsibility
  hooks/        # reusable stateful behavior
  layouts/      # route shells and page chrome
  mocks/        # development/test fixtures only
  pages/        # route-level domain screens
  routes/       # route definitions and guards
  services/     # non-HTTP infrastructure integrations
  state/        # intentionally shared application state
  test/         # global test setup
  types/        # shared domain types
  utils/        # small pure cross-domain functions
```

- Keep a rule in the narrowest domain that owns it.
- Move code to a shared folder only when multiple domains consume the same stable abstraction.
- Keep tests beside the source as `*.test.ts` or `*.test.tsx`.

## Commits

- Use Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`).
- Write the subject in English, imperative mood, under 72 characters, with no trailing period.
- Keep one logical change per commit and explain what and why in the body when useful.
- Never commit `dist/`, environment files, editor files, or generated artifacts.
- Do not add AI attribution or `Co-Authored-By` trailers.
- Never push automatically; push only when explicitly requested.
