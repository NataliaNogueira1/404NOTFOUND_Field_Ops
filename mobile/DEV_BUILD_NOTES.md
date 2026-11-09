# Development build — lembrete de setup (PBI-084 / notificações locais)

> **IMPORTANTE:** este arquivo é apenas um lembrete temporário para testar o PR
> em outra máquina via Kiro. **Não deve ir para o merge do PR** — remova antes de
> finalizar a revisão.

As notificações locais do PBI-084 (`src/infrastructure/notifications/localNotifications.ts`)
**não funcionam no Expo Go** (o Expo Go removeu o agendamento local no SDK 53).
É obrigatório usar um **development build** (`expo-dev-client`).

## Contexto do teste anterior

Um development build já foi gerado com sucesso na conta Expo `ianlucasss`:

- APK: https://expo.dev/artifacts/eas/1Ej1TZzpIOVxUXTyXbm_p6LgS7Oo8V6C6PMCOf3LrNQ.apk
- Build: https://expo.dev/accounts/ianlucasss/projects/mobile/builds/4c44c299-ab58-42e8-a605-f60ae98f5a80

Se o APK acima ainda estiver válido, basta instalá-lo no celular — não precisa rebuildar.

## Para rodar/rebuildar em OUTRA máquina (passo a passo)

Pré-requisitos: Node 22+ (o `.nvmrc` pede 22), Java 21, conta Expo logada.

1. Checkout da branch do PR:
   ```
   gh pr checkout 269
   ```

2. Instalar dependências do mobile (a partir de `mobile/`):
   ```
   npm install --ignore-scripts
   ```
   > `--ignore-scripts` evita a falha de compilação nativa do `better-sqlite3`
   > (devDependency de teste; não afeta o app nem o build EAS).

3. Instalar o `expo-dev-client` (OBRIGATÓRIO para development build):
   ```
   npx expo install expo-dev-client
   ```

4. **AJUSTAR O projectId DO EAS** — este é o ponto que muda por conta/máquina:
   - O `app.json` versionado aponta para o projeto EAS do dono original
     (`extra.eas.projectId = 8a5d0a59-8154-47ca-9a13-dbe79a2ff850`).
   - Se a sua conta Expo NÃO tiver acesso a esse projeto, o build falha com
     `Entity Not Authorized ... AppEntity[8a5d0a59-...]`.
   - Solução: remover o campo `extra.eas.projectId` do `app.json` e rodar:
     ```
     eas init --force
     ```
     Isso cria/vincula um projeto EAS na SUA conta e reescreve o `projectId`.
   - **Essa alteração do `app.json` é só local para o build — NÃO commitar no PR.**

5. Disparar o development build (Android, perfil `development` já existe em `eas.json`):
   ```
   eas build --profile development --platform android
   ```
   O perfil `development` tem `developmentClient: true` e gera APK. A keystore é
   criada automaticamente pelo EAS.

6. Instalar o APK no celular e iniciar o Metro para conectar:
   ```
   npx expo start --dev-client
   ```
   (celular e PC na mesma Wi-Fi; use `--tunnel` se a rede bloquear).

## Como validar o PBI-084 no app

Na tela de **Perfil**:
- Botão **"Enviar notificação de teste (5s)"** → dispara uma notificação local em
  ~5s (valida permissão + canal Android `inspections` + exibição).
- **Toggle de notificações** → pede permissão ao ativar; cancela os lembretes
  agendados ao desativar.
- Lembretes reais: inspeções `ASSIGNED`/`IN_PROGRESS` com prazo futuro agendam
  2 notificações (dia do prazo no horário da inspeção ou 08:00; e 17:00 da véspera).
  Status terminais (SUBMITTED, APPROVED, etc.) não agendam.

## Credenciais de seed (API em profile `dev`/`demo`, usuários dev habilitados)

| Papel | Email | Senha |
|---|---|---|
| Técnico (inspetor) | `technician@fieldops.local` | `fieldops-technician-dev` |
| Supervisor | `supervisor@fieldops.local` | `fieldops-supervisor-dev` |
| Admin | `admin@fieldops.local` | `fieldops-admin-dev` |

> Esses usuários só existem quando a API roda com o profile `dev`/`demo` e
> `FIELDOPS_DEV_USERS_ENABLED=true`. Confirme também para qual API o app está
> apontando (base URL no `.env`/config do mobile).
