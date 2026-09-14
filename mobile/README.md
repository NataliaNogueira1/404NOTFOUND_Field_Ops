# FieldOps Mobile

Aplicativo dos técnicos de campo da plataforma FieldOps. Permite baixar as inspeções atribuídas, executar checklists dinâmicos, registrar evidências e não conformidades, e trabalhar offline com sincronização ao reconectar.

- **Expo SDK 57** · React Native · TypeScript (strict)
- **Expo Router** (rotas baseadas em arquivos, `typedRoutes`)
- **SQLite** (`expo-sqlite`) para persistência local e modo offline
- **Secure Store** (`expo-secure-store`) para tokens de sessão
- Câmera/galeria (`expo-camera`, `expo-image-picker`) para evidências
- Conectividade via `@react-native-community/netinfo`

> Este módulo faz parte de um monorepo. A API (`api/`) e o painel web (`frontend/`) têm seus próprios READMEs.

---

## Pré-requisitos

- **Node.js 20+** e **npm**
- **Expo CLI** — usada via `npx expo` (não precisa instalar global)
- Um destes alvos de execução:
  - **Android**: emulador (Android Studio) ou dispositivo físico com o app **Expo Go**
  - **iOS**: Simulator (macOS) ou dispositivo físico com **Expo Go**
- A **API FieldOps** rodando e acessível (ver `api/README.md`)

---

## Configuração

1. Instale as dependências (versões fixadas pelo `package-lock.json`):

   ```sh
   npm install
   ```

2. Crie o arquivo de ambiente a partir do exemplo:

   ```sh
   cp .env.example .env
   ```

3. Ajuste `EXPO_PUBLIC_API_URL` conforme o alvo de execução. O valor precisa apontar para a API a partir do dispositivo/emulador:

   | Alvo | Valor sugerido |
   |------|----------------|
   | Emulador Android | `http://10.0.2.2:8085` |
   | iOS Simulator | `http://localhost:8085` |
   | Dispositivo físico (mesma rede) | `http://<IP_DA_MAQUINA>:8085` |

   > Variáveis com prefixo `EXPO_PUBLIC_` são embutidas no bundle e ficam públicas. Use apenas para configuração não sensível.

---

## Executando

```sh
npm start          # inicia o Metro bundler (menu interativo do Expo)
npm run android    # abre no emulador/dispositivo Android
npm run ios        # abre no iOS Simulator (apenas macOS)
npm run web        # abre a versão web (React Native Web)
```

Com o Metro rodando (`npm start`), leia o QR Code com o **Expo Go** no dispositivo físico ou pressione `a`/`i` para abrir no emulador/simulador.

### Qualidade

```sh
npm run lint       # ESLint (flat config, TypeScript + react-hooks)
npm run lint:fix   # ESLint corrigindo o que for automático
```

---

## Estrutura do projeto

Rotas por arquivo em `app/` (Expo Router) e código de domínio em `src/`, organizado por feature/infraestrutura.

```text
mobile/
  app/                       # Rotas (Expo Router)
    _layout.tsx              # AuthGate: protege rotas e restaura sessão
    (public)/                # Rotas públicas (ex.: login)
    (protected)/             # Rotas autenticadas
      (tabs)/                # Navegação por abas (inspeções, sync, perfil)
      inspections/[id]/      # Detalhes, início, checklist e resumo da inspeção
      evidence.tsx           # Captura/anexo de evidências
      scanner.tsx            # Leitor de QR Code
  src/
    components/              # Componentes de tela (ex.: ChecklistItemCard)
    config/                  # Tokens de tema (cores, espaçamento, tipografia)
    design-system/           # Componentes base: Button, TextInput, Card, Badge
    features/                # Contextos e lógica por feature (ex.: fieldops)
    hooks/                   # Hooks reutilizáveis (ex.: useDebouncedSave)
    infrastructure/
      api/                   # Cliente HTTP + interceptor de refresh
      connectivity/          # Contexto de conectividade (NetInfo)
      database/              # SQLite: migrations e repositórios
      media/                 # Captura de imagem
      storage/               # Secure Store (tokens)
      sync/                  # Outbox e serviço de sincronização
  assets/                    # Ícones e imagens
  app.json                   # Configuração do Expo
```

### Aliases de importação

Configurados em `tsconfig.json`. Prefira-os a caminhos relativos longos:

```ts
import { Button } from '@/design-system';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { Colors } from '@/config/theme';
```

---

## Offline e sincronização

- Todas as telas leem do **SQLite**, então funcionam sem rede após o primeiro download.
- Alterações locais (respostas, evidências, transições de estado) são enfileiradas em uma **outbox** (`sync_queue`) e enviadas quando há conexão.
- Um banner de "modo offline" é exibido quando o dispositivo está sem rede.

---

## Convenções

### Commits

Seguimos **[Conventional Commits](https://www.conventionalcommits.org/)**, no mesmo padrão da API e do web admin.

- Prefixos: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Assunto em **inglês**, modo imperativo ("add", não "added"), até 72 caracteres, sem ponto final.
- Uma mudança lógica por commit; explique **o quê** e **o porquê** no corpo quando útil.
- Não adicione atribuição de IA nem trailer `Co-Authored-By`.

Exemplos:

```text
feat: add GPS capture on inspection start
fix: search inspections by client name instead of id
docs: add mobile run instructions
```

### Branches

- Crie uma branch a partir de `develop`.
- Nomeie por tipo e escopo curto: `feat/<escopo>`, `fix/<escopo>`, `docs/<escopo>`.
  - Ex.: `feat/inspection-location`, `docs/mobile-readme-conventions`.

### Pull Requests

- Abra o PR contra `develop`. Não faça push direto em `main`/`develop`.
- Referencie o PBI/issue relacionado (ex.: "Closes #12").
- Descreva o que mudou, como foi testado e o que ficou de fora.
- Antes de abrir o PR, rode `npm run lint` (e os testes, quando existirem) e garanta que passam.
- Nunca faça `git push` automático; só faça push quando solicitado.

---

## Notas

- O código-fonte (identificadores, tipos, contratos) fica em **inglês**; textos de UI ficam em **português**.
- Expo mudou entre versões: consulte a documentação da **v57** em <https://docs.expo.dev/versions/v57.0.0/> antes de alterar dependências ou APIs nativas.
