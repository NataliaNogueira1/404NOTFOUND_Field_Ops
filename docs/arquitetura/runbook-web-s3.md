# Runbook — Web Admin no S3 como site estático (#311)

> Complementa `docs/arquitetura/arquitetura-aws.md` (o Web Admin é servido do S3 atrás do CloudFront, #312).
> Cenário: **AWS Academy Learner Lab**, região `us-east-1`. Executado no console AWS; nenhum segredo vai para o git.

## Decisão

| Tema | Escolha | Motivo |
|---|---|---|
| Hospedagem | **S3 static website** (endpoint de website, leitura pública) | O `dist/` é só código público (as variáveis `VITE_*` já são públicas) e dá para testar sozinho, antes do CloudFront |
| Fallback de SPA | Documento de erro = `index.html` | Rotas como `/app/inspections/1/review` não existem como objeto no S3 |
| Bucket | `fieldops-web-404nf` | Separado do bucket de evidências (`fieldops-evidencias-404nf`, que continua 100% privado) |

Alternativa mais restrita, para a #312: bucket privado com acesso só do CloudFront (OAC) e resposta de erro 403/404 → `/index.html` com status 200. Não foi adotada aqui porque exigiria o CloudFront para qualquer teste.

**Limitações até a #312**
- Em rota profunda recarregada, o S3 devolve o `index.html` com **status HTTP 404**. A página abre normalmente, mas o status só vira `200` com a resposta de erro personalizada do CloudFront.
- O build usa `VITE_API_URL` vazio (`frontend/.env.production`): as chamadas vão para `/api/...` no **mesmo domínio**. No endpoint do S3 a tela de login abre, mas o login não funciona. Ele passa a funcionar quando o CloudFront encaminhar `/api/*` para a EC2.

## 1. Criar o bucket

Console > **S3 > Criar bucket**:

1. Nome `fieldops-web-404nf`, região `us-east-1`. Se o nome já estiver em uso, troque o sufixo e use o mesmo nome no script (`-Bucket`).
2. Propriedade de objetos: ACLs desabilitadas.
3. **Bloquear todo o acesso público**: **desmarque** e confirme o aviso. (Só neste bucket.)
4. Versionamento desativado. Criptografia padrão SSE-S3.

## 2. Hospedagem de site estático

Bucket > **Propriedades** > **Hospedagem de site estático** > **Editar**:

- Ativar. Tipo: **Hospedar um site estático**.
- Documento de índice: `index.html`.
- Documento de erro: `index.html`.

Anote o **endpoint do site**: `http://fieldops-web-404nf.s3-website-us-east-1.amazonaws.com`.

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

**Opção A: script (recomendado)**

1. Instale o [AWS CLI](https://aws.amazon.com/cli/) e, no Learner Lab, abra **AWS Details > AWS CLI: Show**. Cole as três linhas em `~/.aws/credentials` (`C:\Users\<voce>\.aws\credentials`), no perfil `[default]`. Elas expiram quando a sessão acaba, e **nunca** vão para o repositório.
2. Na raiz do repositório:
   ```powershell
   .\infra\aws\web\deploy-web.ps1
   ```
   O script faz o build, envia os arquivos com cache de 1 ano para os assets com hash e `no-cache` para o `index.html`, e avisa se um `.js` foi enviado com tipo MIME errado.

**Opção B: console**

1. Em `frontend/`, rode `npm run build`.
2. No bucket, **Carregar** o **conteúdo** da pasta `dist/` (os arquivos e a pasta `assets/`, não a pasta `dist` em si).
3. Confirme que `index.html` ficou na raiz do bucket.

## 5. Validar

No PowerShell (troque o endpoint se o bucket tiver outro nome):

```powershell
$site = 'http://fieldops-web-404nf.s3-website-us-east-1.amazonaws.com'
curl.exe -s -o NUL -w "raiz: %{http_code} %{content_type}`n" "$site/"
curl.exe -s -o NUL -w "rota profunda: %{http_code} %{content_type}`n" "$site/app/inspections/1/review"
```

Esperado: `raiz: 200 text/html` e `rota profunda: 404 text/html` (corpo = `index.html`, veja as limitações).

No navegador:

1. Abra o endpoint do site. A tela de login do FieldOps deve aparecer.
2. Abra diretamente `<endpoint>/app/inspections` (ou pressione `F5` em uma rota interna). A página do FieldOps carrega, sem tela de erro do S3 ("404 Not Found" em página branca).
3. No DevTools, aba Network, os arquivos `.js` e `.css` de `/assets/` devem ser `200` com `Content-Type` de JavaScript/CSS.

## 6. Critérios de aceite da #311

- [x] Bucket S3 com o `dist/` publicado — 60 arquivos (1,1 MB) em `fieldops-web-404nf`, validado em 16/11/2026.
- [x] SPA funciona: `F5` em `/login` reabre o app. O documento chega com status `404` do S3 e corpo `index.html`
      (o erro `Failed to load resource ... 404` no console é essa requisição); o `200` limpo vem com o CloudFront (#312).
- [x] Web Admin abre pela URL do S3 (`curl`: raiz `200 text/html`, rota profunda `404 text/html`; tela de login renderizada).
- [ ] Web Admin abre pelo CloudFront — depende da #312. O login só funciona depois dele (`/api/*` no mesmo domínio).

## 7. Atualizar o site

Rode o script de novo (ou refaça o upload). `--delete` remove os assets antigos. Quando houver CloudFront, será preciso invalidar o cache do `index.html` (#312).
