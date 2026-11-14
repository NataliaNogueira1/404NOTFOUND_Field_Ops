# Risco Residual de Segurança — npm audit mobile

**Data desta revisão:** novembro/2026 (após upgrade para o Expo SDK 58)
**Resultado atual:** 31 vulnerabilidades (0 critical, 0 high, 30 moderate, 1 low)

Histórico, para referência:

| Marco | Critical | High | Moderate | Low | Total |
|---|:--:|:--:|:--:|:--:|:--:|
| Baseline (SDK 57, out/2026) | 2 | 56 | 17 | 0 | 75 |
| Após overrides (SDK 57) | 0 | 50 | 7 | 0 | 57 |
| **Após upgrade SDK 58 (nov/2026)** | **0** | **0** | **30** | **1** | **31** |

O upgrade para o **Expo SDK 58** (React Native 0.88, jest 30, jest-expo 58) eliminou
**todas as vulnerabilidades critical e high** que, na análise anterior, dependiam
justamente dessa atualização para serem corrigidas (cadeias Metro, Jest e React Native).
As 31 restantes são todas de **toolchain de build/test**, sem superfície de ataque no
runtime do app em produção.

---

## O que foi corrigido pelo upgrade do SDK 58

As ressalvas da análise anterior (SDK 57) que foram **resolvidas** pelo upgrade:

| Item anterior | Situação no SDK 58 |
|---|---|
| Cadeia `metro` (série 0.84.x) — HIGH | Resolvida: o Metro do SDK 58 saiu do range vulnerável |
| Cadeia `jest@29.x` / `jest-expo@57.x` — HIGH | Resolvida: jest 30 + jest-expo 58 adotados |
| `react-native@0.86.3` — HIGH | Resolvida: RN 0.88 no SDK 58 |
| `react-native-reanimated@4.5.1` / `worklets@0.10.1` — HIGH | Resolvidas: reanimated 4.7 / worklets 0.13 |
| `@react-native-community/datetimepicker@9.1.0` — HIGH | Atualizado para 9.2.1 (versão do SDK 58) |

Os `overrides` não-breaking aplicados anteriormente no `package.json` (`handlebars`,
`shell-quote`, `brace-expansion`, `@xmldom/xmldom`, `js-yaml`, `compression`,
`source-map-js`) permanecem válidos. O override de `@expo/metro-file-map` foi
atualizado de `^57.0.4` para `^58.0.0`, acompanhando o SDK.

---

## Risco residual — sem correção não-breaking no momento

As 31 vulnerabilidades restantes são **moderate/low**, todas em dependências de
desenvolvimento (bundler, test runner e lint). O `npm audit fix` sem `--force` não as
resolve porque os fixes exigem bumps major da toolchain do Expo/Jest, que desalinhariam
as versões fixadas pelo SDK 58.

### 1. `glob` / `minimatch` (moderate) — via jest, @expo/cli, @typescript-eslint

**Causa:** DoS por amplificação em `glob`/`minimatch` em versões usadas pela toolchain
de teste (jest 30, jest-expo), pelo `@expo/cli` e pelo `@typescript-eslint`.

**Por que não foi corrigido:** o fix exige `--force` com bumps major (ex.: eslint 9.x
em outra linha, ou versões de jest/expo fora do alinhamento do SDK 58).

**Impacto prático:** roda apenas em build/test; não compõe o bundle de produção.

### 2. `deepmerge` (moderate) — via jest-config/jest-cli

**Impacto prático:** dependência transitiva do Jest; ambiente de teste apenas.

### 3. `uuid` (moderate) — via `@expo/ngrok` — **sem fix disponível**

**Por que não foi corrigido:** `@expo/ngrok` é usado apenas para tunelamento em
desenvolvimento (`expo start --tunnel`). Não há versão corrigida publicada e o pacote
não compõe o app de produção.

### 4. `low` (1) — dependência transitiva da toolchain

**Impacto prático:** severidade baixa, restrita ao ambiente de desenvolvimento.

---

## Decisão

As 31 vulnerabilidades remanescentes são **aceitas conscientemente** porque:

- Nenhuma é **critical** ou **high**.
- Todas são **toolchain de build/test** (Metro, Jest, `@expo/cli`, `@expo/ngrok`,
  `@typescript-eslint`), sem superfície de ataque no runtime do app no dispositivo.
- Os fixes exigem `--force` com bumps major que quebrariam o alinhamento de versões do
  Expo SDK 58.

**Ação de acompanhamento:** reavaliar a cada atualização de patch do SDK 58 e nas
próximas versões do Expo, aplicando correções não-breaking quando disponíveis.
