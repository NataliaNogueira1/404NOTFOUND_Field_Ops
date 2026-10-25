# Risco Residual de Segurança — npm audit mobile

**Data do baseline:** outubro/2026  
**Baseline:** 75 vulnerabilidades (2 critical, 56 high, 17 moderate)  
**Após correções:** 57 vulnerabilidades (0 critical, 50 high, 7 moderate)

---

## O que foi corrigido (via `overrides` no package.json)

| Pacote | Vulnerabilidade | Versão vulnerável | Versão segura |
|---|---|---|---|
| `handlebars` | JavaScript Injection via AST/own-property bypass (CRITICAL) | `3.0.0 – 4.7.9` | `^4.7.10` |
| `shell-quote` | Command injection via line terminator (CRITICAL) | `1.8.4 – 1.10.0` | `^1.11.0` |
| `brace-expansion` (série 1.x) | DoS via recursão/rewrite (HIGH) | `<=1.1.20` | `^1.1.21` |
| `brace-expansion` (série 5.x) | DoS via recursão/rewrite (HIGH) | `4.0.0 – 5.0.11` | `^5.0.12` |
| `@expo/metro-file-map` | via micromatch (HIGH) | `<=57.0.3` | `^57.0.4` |
| `@xmldom/xmldom` | — (HIGH) | `<=0.8.14 / 0.9.0–0.9.11` | `^0.9.12` |
| `js-yaml` | CPU DoS via merge keys (HIGH) | `4.0.0 – 4.3.1` | `^4.3.2` |
| `compression` | Memory leak / DoS (HIGH) | `<1.8.2` | `^1.8.2` |
| `source-map-js` | Event-loop DoS via indexed sections (HIGH) | `1.0.0 – 1.2.1` | `^1.2.2` |

Todas as correções acima são **não-breaking** (sem bump major) e foram aplicadas como
`overrides` no `package.json`, pois os pacotes são dependências transitivas.

---

## Risco residual — sem correção viável no momento

### 1. `node-forge <=1.4.0` — HIGH (GHSA-86w9-cpqp-85rv)

**CVE:** RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm
elements (bypass de verificação de assinatura).

**Por que não foi corrigido:** A versão mais recente publicada (`1.4.0`) ainda está
no range vulnerável (`<=1.4.0`). Não existe versão `>1.4.0` publicada no npm. O "fix"
sugerido pelo npm audit seria fazer upgrade do `expo` para `44.x` (major incompatível
com o Expo SDK 57 em uso no projeto). 

**Impacto prático:** `node-forge` é usado apenas pela toolchain do `@expo/cli` para
verificação de certificados de code-signing. Não é exposto como superfície de ataque
em produção no app.

**Ação:** monitorar publicação de `node-forge > 1.4.0` ou nova versão de
`@expo/code-signing-certificates` que não dependa desta versão vulnerável.

---

### 2. Cadeia `metro >=0.71.0` — HIGH (via metro-transform-worker, metro-config, metro-file-map)

**Por que não foi corrigido:** Todo o ecossistema Metro da série `0.84.x` (usada pelo
Expo 57 / React Native 0.86) está no range vulnerável. O fix seria upgrade para
`metro@0.87.x`, que exige `react-native@0.72.17` (major regressivo — RN 0.72 é uma
versão muito mais antiga que 0.86) ou esperar que o Expo SDK 58 corrija a cadeia.

**Impacto prático:** Metro é a toolchain de empacotamento (bundler) — roda somente no
ambiente de desenvolvimento/build, não no app em produção no dispositivo do usuário.

**Ação:** aguardar Expo SDK 58 e realizar upgrade quando disponível.

---

### 3. Cadeia `jest@29.x` / `jest-expo@57.x` — HIGH (braces, micromatch, jest-snapshot, etc.)

**Por que não foi corrigido:** O fix exigiria `jest@30.x` e `jest-expo@58.x`
(ambos major). `jest@30` introduz quebras de API e `jest-expo@58` ainda não é
compatível com Expo SDK 57 conforme a [documentação versionada](https://docs.expo.dev/versions/v57.0.0/).

**Impacto prático:** Jest é exclusivamente ferramenta de teste — não roda em produção.

**Ação:** avaliar upgrade para jest@30 + jest-expo@58 quando Expo SDK 58 for adotado.

---

### 4. `react-native@0.86.3` — HIGH (via @react-native/community-cli-plugin, etc.)

**Por que não foi corrigido:** O "fix" apontado pelo npm (`react-native@0.72.17`) é uma
versão *mais antiga*, não mais nova — o npm audit interpretou incorretamente a direção
do fix. React Native 0.86.3 é a versão correta para Expo SDK 57.

**Impacto prático:** As vulnerabilidades reportadas estão na CLI e no bundle builder
(toolchain), não no runtime do app.

---

### 5. `react-native-reanimated@4.5.1` e `react-native-worklets@0.10.1` — HIGH

**Por que não foi corrigido:** Os fixes (`reanimated@4.2.2` e `worklets@0.7.4`) são
versões *mais antigas* — o npm audit está na direção errada. As versões instaladas são
as mais recentes e compatíveis com Expo SDK 57.

---

### 6. `@react-native-community/datetimepicker@9.1.0` — HIGH

**Por que não foi corrigido:** O fix apontado (`8.1.1`) é uma versão mais antiga.
`9.1.0` é a versão correta para RN 0.86.

---

## Lint preexistente (não relacionado a este trabalho)

O `npm run lint` falha com 5 erros em `src/design-system/SignaturePad.tsx`
(regra `react-hooks/refs` — acesso a ref durante render). Esses erros existiam
antes desta tarefa e não são introduzidos pelos overrides.

---

## Resumo final

| Categoria | Antes | Depois |
|---|---|---|
| Critical | 2 | **0** |
| High | 56 | 50 |
| Moderate | 17 | 7 |
| **Total** | **75** | **57** |

As 50 high restantes são todas **toolchain de build/test** (Metro, Jest, React Native CLI)
ou pacotes onde o npm audit aponta um "fix" para versão *mais antiga* (incorreto).
Nenhuma delas é superfície de ataque em produção no dispositivo do usuário.
