
# Runbook — Web Admin no S3 como site estático (#311)

> Complementa `docs/arquitetura/arquitetura-aws.md` (o Web Admin é servido do S3 atrás do CloudFront, #312).
> Cenário: **AWS Academy Learner Lab**, região `us-east-1`.
> A publicação foi realizada pelo console AWS; nenhum segredo deve ser enviado ao git.

## Decisão

| Tema | Escolha | Motivo |
|---|---|---|
| Hospedagem | **S3 static website** (endpoint de website, leitura pública) | O `dist/` contém apenas código público (as variáveis `VITE_*` são públicas) e permite testar a aplicação antes do CloudFront |
| Fallback de SPA | Documento de erro = `index.html` | Rotas como `/app/inspections/1/review` não existem como objetos no S3 |
| Bucket | `fieldops-web-404nf` | Separado do bucket de evidências (`fieldops-evidencias-404nf`, que continua privado) |

Alternativa mais restrita, prevista para a #312: bucket privado com acesso somente pelo CloudFront (OAC) e resposta de erro 403/404 → `/index.html` com status 200. Não foi adotada nesta etapa porque exigiria o CloudFront para qualquer teste.

### Limitações até a #312

- Em rota profunda recarregada, o S3 devolve o `index.html` com **status HTTP 404**. A página abre normalmente porque o corpo da resposta contém o `index.html`, mas o status HTTP só será 200 com a configuração de resposta de erro personalizada do CloudFront.
- O build usa `VITE_API_URL` vazio (`frontend/.env.production`): as chamadas vão para `/api/...` no **mesmo domínio**. No endpoint do S3, a tela de login abre, mas a autenticação não funciona. Ela passa a funcionar quando o CloudFront encaminhar `/api/*` para a EC2.
- O endpoint de website do S3 utiliza HTTP. HTTPS e domínio estável dependem do CloudFront.

## 1. Criar o bucket

Console > **S3 > Criar bucket**:

1. Nome `fieldops-web-404nf`, região `us-east-1`. Se o nome já estiver em uso, troque o sufixo e utilize o mesmo nome no script (`-Bucket`).
2. Propriedade de objetos: ACLs desabilitadas.
3. **Bloquear todo o acesso público**: desmarque e confirme o aviso. (Somente neste bucket.)
4. Versionamento desativado. Criptografia padrão SSE-S3.

> Atenção: este bucket contém somente arquivos públicos do frontend. Não utilize essa configuração no bucket de evidências ou em buckets que contenham dados sensíveis.

## 2. Hospedagem de site estático

Bucket > **Propriedades** > **Hospedagem de site estático** > **Editar**:

- Ativar. Tipo: **Hospedar um site estático**.
- Documento de índice: `index.html`.
- Documento de erro: `index.html`.

Anote o **endpoint do site**:

`http://fieldops-web-404nf.s3-website-us-east-1.amazonaws.com`

O endpoint utiliza HTTP, não HTTPS.

## 3. Política de leitura pública

Bucket > **Permissões** > **Política do bucket** > **Editar**:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadWebAdmin",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::fieldops-web-404nf/*"
  }]
}
```

Só `GetObject`: o bucket não permite listar nem gravar para o público.

## 4. Publicar o `dist/`

### Opção A: script (recomendado)

O script `infra/aws/web/deploy-web.ps1` é **exclusivo para Windows PowerShell** e requer a **AWS CLI** instalada e configurada. Ele foi escrito e testado no Windows PowerShell 5.1; não foi testado no PowerShell em Linux ou macOS. Em outros sistemas, ou sem a AWS CLI, use a **Opção B (console)**.

1. Instale a [AWS CLI](https://aws.amazon.com/cli/).
2. No Learner Lab, abra **AWS Details > AWS CLI > Show** e obtenha as credenciais temporárias.
3. Configure as credenciais AWS localmente. No Windows, o arquivo normalmente fica em:

   `C:\Users\<usuario>\.aws\credentials`

   Exemplo:

   ```ini
   [default]
   aws_access_key_id = SUA_ACCESS_KEY
   aws_secret_access_key = SUA_SECRET_KEY
   aws_session_token = SEU_SESSION_TOKEN
   ```

   Configure a região padrão:

   ```powershell
   aws configure set region us-east-1
   ```

   As credenciais do Learner Lab são temporárias e expiram quando a sessão termina. Nunca as coloque no repositório.

4. Na raiz do repositório, simule a publicação:

   ```powershell
   .\infra\aws\web\deploy-web.ps1 -WhatIf
   ```

   O script executa o build (caso `-SkipBuild` não seja utilizado), mostra o destino, os uploads e os objetos que seriam excluídos, sem modificar o bucket.

5. Para publicar:

   ```powershell
   .\infra\aws\web\deploy-web.ps1
   ```

   O script apresenta o plano de publicação e solicita confirmação antes de realizar alterações.

   Para pular a confirmação, utilize `-Force` somente após verificar o bucket de destino e o plano de exclusões.

   Para publicar utilizando uma build existente:

   ```powershell
   .\infra\aws\web\deploy-web.ps1 -Bucket fieldops-web-404nf -SkipBuild
   ```

O script envia os assets JavaScript e CSS com seus respectivos tipos MIME explícitos, utiliza cache de 1 ano para os assets e `no-cache` para `index.html`, e verifica o MIME de todos os arquivos JS e CSS publicados.

O comando de sincronização utiliza `--delete`, removendo objetos que não existem mais na build, inclusive `.js` e `.css` antigos. Por isso, revise o destino e o plano de exclusões antes de confirmar a publicação. O nome do bucket é validado antes de qualquer chamada à AWS.

**Como o script foi testado:** em 15/11/2026, no Windows PowerShell 5.1, com um `aws` de teste que apenas registra as chamadas. O teste confirmou que `-WhatIf` não faz nenhum envio nem exclusão, que um nome de bucket inválido é rejeitado sem chamar a AWS, que `-Force` executa a simulação, o `sync --delete` completo, o reenvio de `.js` e `.css` com tipo explícito e o `index.html`, nessa ordem, e que a checagem de MIME leu os 58 arquivos `.js` e `.css` publicados. O envio real com a AWS CLI e o bucket **ainda não foi executado**: a publicação inicial foi feita pelo console.

### Opção B: console AWS

Esta alternativa pode ser utilizada em ambientes sem PowerShell ou AWS CLI.

1. Em `frontend/`, execute:

   ```bash
   npm run build
   ```

2. No console AWS, abra o bucket `fieldops-web-404nf` e clique em **Carregar**.
3. Envie o **conteúdo** da pasta `frontend/dist/` (os arquivos e a pasta `assets/`, não a pasta `dist` em si).
4. Confirme que `index.html` ficou na raiz do bucket.
5. Se houver arquivos antigos que não pertencem à build atual, remova-os manualmente após verificar que não são necessários.

## 5. Validar

No PowerShell, substitua o endpoint se o bucket tiver outro nome:

```powershell
$site = 'http://fieldops-web-404nf.s3-website-us-east-1.amazonaws.com'

curl.exe -s -o NUL -w "raiz: %{http_code} %{content_type}`n" "$site/"
curl.exe -s -o NUL -w "rota profunda: %{http_code} %{content_type}`n" "$site/app/inspections/1/review"
```

Esperado:

```text
raiz: 200 text/html
rota profunda: 404 text/html
```

Na rota profunda, o corpo da resposta contém `index.html`, conforme a configuração de fallback. O status HTTP 404 é uma limitação conhecida do endpoint S3 e será corrigido com o CloudFront (#312).

### Validação no navegador

1. Abra o endpoint do site. A tela de login do FieldOps deve aparecer.
2. Abra diretamente `<endpoint>/app/inspections` ou pressione `F5` em uma rota interna. A aplicação deve renderizar, sem apresentar a página branca de erro do S3.
3. No DevTools, aba Network, os arquivos `.js` e `.css` de `/assets/` devem retornar `200` com `Content-Type` correspondente a JavaScript ou CSS.
4. A autenticação não funciona pelo endpoint S3. As requisições `/api/*` ainda não são encaminhadas para a EC2.

## 6. Critérios de aceite da #311

- [x] Bucket S3 criado e configurado para hospedagem estática.
- [x] `dist/` publicado — 60 arquivos (1,1 MB) em `fieldops-web-404nf`, validado em 15/11/2026 (horário de Brasília).
- [x] Página inicial acessível pelo endpoint S3, retornando HTTP 200.
- [x] Fallback da SPA configurado com `index.html` como documento de erro.
- [x] Aplicação renderiza em rotas profundas. O endpoint S3 retorna HTTP 404 com corpo `index.html`; o status HTTP 200 será configurado no CloudFront (#312).
- [x] Web Admin abre pela URL do S3 (`curl`: raiz `200 text/html`, rota profunda `404 text/html`; tela de login renderizada).
- [ ] Web Admin abre pelo CloudFront — depende da #312.
- [ ] Login funcional — depende do encaminhamento de `/api/*` para a EC2 pelo CloudFront (#312).
- [ ] HTTPS e DNS estável — dependem da configuração do CloudFront (#312).

## 7. Atualizar o site

Rode o script novamente ou refaça o upload pelo console.

O `--delete` remove assets antigos que não existem mais na build. Antes de executar, revise o bucket de destino e as exclusões previstas.

Quando houver CloudFront, será necessário invalidar o cache de `index.html` após a publicação, conforme a configuração da #312.
