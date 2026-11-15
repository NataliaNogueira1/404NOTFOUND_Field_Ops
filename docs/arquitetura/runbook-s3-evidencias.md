# Runbook — Bucket S3 privado para evidências (#308)

> Complementa `docs/arquitetura/arquitetura-aws.md` (decisões #4 e #6).
> Cenário: **AWS Academy Learner Lab** (role `LabRole` fixa, sessão reseta a cada ~4h).
> Executado **manualmente no console AWS**. Nenhum segredo vai para o git.

## Por que existe

O `FileSystemEvidenceStorage` grava em disco efêmero da EC2, e as fotos se perdem no
reset do Lab. O bucket S3 mantém as evidências fora da instância. Este runbook cobre
só o bucket. O código vem na #309 (`S3EvidenceStorage`) e a exibição por presigned URL
na #310.

## Resultado esperado

| Item | Valor |
|---|---|
| Nome | `fieldops-evidencias-404nf` |
| Região | `us-east-1` |
| Block Public Access | Ativado nas 4 opções |
| ACLs | Desabilitadas (propriedade de objetos imposta ao proprietário) |
| Criptografia | SSE-S3 (padrão) |
| Bloqueio de objeto (Object Lock) | Desativado |
| Versionamento | Opcional |
| Acesso | Somente via `LabRole` (instance profile da EC2) |

## 1. Criar o bucket

Console > **S3 > Criar bucket**:

1. Tipo: uso geral. Nome: `fieldops-evidencias-404nf`. Região: `us-east-1`.
2. Propriedade de objetos: **ACLs desabilitadas**.
3. **Bloquear todo o acesso público**: marcado, com as 4 opções ativas.
4. Versionamento: opcional. Ative se quiser recuperar objetos sobrescritos.
5. Criptografia padrão: **SSE-S3**.
6. Em configurações avançadas, deixe o **Bloqueio de objeto** desativado. Ativá-lo travaria
   a exclusão dos objetos e forçaria o versionamento, sem necessidade neste projeto.

O nome do bucket é único no mundo todo. Se `404nf` já estiver em uso, troque o sufixo e
atualize a variável `S3_BUCKET` da #313.

## 2. Política de acesso

Com o Block Public Access ligado e **sem política pública**, o bucket é inacessível a
qualquer pessoa anônima. O `LabRole` acessa o S3 pelas permissões da própria conta.

Para registrar o acesso de forma explícita, a política do bucket pode permitir o role
(troque `<ID-DA-CONTA>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowLabRoleEvidence",
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::<ID-DA-CONTA>:role/LabRole" },
    "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::fieldops-evidencias-404nf",
      "arn:aws:s3:::fieldops-evidencias-404nf/*"
    ]
  }]
}
```

> Não use um `Deny` para "todos menos o LabRole". Isso bloquearia também o acesso do
> usuário do Learner Lab pelo console, que usa outra role.

## 3. Validação (na EC2, via Instance Connect)

```bash
BUCKET=fieldops-evidencias-404nf
aws sts get-caller-identity
```

Esperado: o `Arn` termina com `assumed-role/LabRole/<id-da-instancia>`.

| Teste | Comando | Esperado |
|---|---|---|
| PutObject | `echo "teste evidencia" > /tmp/teste.txt; aws s3 cp /tmp/teste.txt s3://$BUCKET/testes/teste.txt` | `upload: ... to s3://fieldops-evidencias-404nf/testes/teste.txt` |
| GetObject | `aws s3 cp s3://$BUCKET/testes/teste.txt /tmp/volta.txt; cat /tmp/volta.txt` | `download: ...` e o texto `teste evidencia` |
| Acesso anônimo | `curl -i https://$BUCKET.s3.us-east-1.amazonaws.com/testes/teste.txt` | `HTTP/1.1 403 Forbidden` com `AccessDenied` |

Limpeza:

```bash
aws s3 rm s3://$BUCKET/testes/teste.txt
rm /tmp/teste.txt /tmp/volta.txt
```

Com o versionamento ativo, o `rm` só cria um marcador de exclusão.

## 4. Critérios de aceite da #308

- [x] Bucket S3 criado e privado (Block Public Access ativado, sem política pública).
- [x] A EC2, via `LabRole`, faz `PutObject` e `GetObject`.
- [x] Acesso anônimo ao objeto retorna `403 AccessDenied`.

Validado em 14/11/2026.

## 5. Notas para as próximas tasks

- **#309 (`S3EvidenceStorage`):** o SDK usa a credencial do instance profile. Não
  coloque chaves AWS no `.env`. O nome do bucket deve vir por variável de ambiente.
- **#310 (presigned URL):** se o Web Admin carregar as fotos com `fetch`, o bucket
  precisa de configuração de CORS. Com `<img src>` não precisa.
- **#313:** acrescente o nome do bucket e a região às variáveis da API na EC2.

## 6. Reset do Learner Lab (~4h)

O bucket e os objetos permanecem após o reset. Os recursos de computação (EC2) é que
precisam voltar. Ao reiniciar o Lab, confirme que o bucket continua listado em
**S3 > Buckets**.
