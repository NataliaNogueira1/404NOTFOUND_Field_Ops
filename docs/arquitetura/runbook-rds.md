# Runbook — RDS PostgreSQL privado (#305)

> Complementa `docs/arquitetura/arquitetura-aws.md` (decisão #5: RDS privado).
> Cenário: **AWS Academy Learner Lab** (role `LabRole` fixa, sessão reseta a cada ~4h).
> Este runbook é executado **manualmente no console AWS**. Nenhum segredo vai para o git.

## Resultado esperado

| Item | Valor |
|---|---|
| Engine | PostgreSQL 16 |
| Classe | `db.t3.micro` |
| Disponibilidade | Single-AZ (sem Multi-AZ) |
| Acesso público | `Publicly accessible = No` |
| Porta 5432 | liberada **somente** para o Security Group da EC2 |
| Banco / usuário | `fieldops` / `fieldops` (senha forte, fora do git) |

## 0. Validar cedo (risco da decisão #5)

Antes de qualquer coisa, confirme que o Learner Lab permite criar um **DB subnet group**:

1. Console > **RDS** > **Subnet groups** > **Create DB subnet group**.
2. Se o botão estiver bloqueado ou der erro de permissão, **pare e avise a equipe**: isso
   muda a decisão #5 (ex.: usar o subnet group default da VPC).

## 1. Security Groups (ordem importa)

Crie primeiro o SG da EC2, para o RDS poder referenciá-lo.

**SG da EC2** — `fieldops-ec2-sg` (VPC default):

| Tipo | Porta | Origem | Motivo |
|---|---|---|---|
| SSH | 22 | `18.206.107.24/29` (faixa do EC2 Instance Connect em `us-east-1`) | Administração pelo console |
| Custom TCP | 8080 | `0.0.0.0/0` por enquanto | Será restrito ao CloudFront na #312 |

> **Divergência da prática:** conectar pelo botão "Conectar" do console (EC2 Instance
> Connect) exige a regra de SSH para a faixa acima, e não para o seu IP. Se a regra for só
> para o seu IP, o console não consegue abrir a sessão.
>
> Ambos os SGs precisam de regra de saída "Todo o tráfego" `0.0.0.0/0`.

**SG do RDS** — `fieldops-rds-sg` (mesma VPC):

| Tipo | Porta | Origem |
|---|---|---|
| PostgreSQL | 5432 | **Security Group** `fieldops-ec2-sg` (não use IP nem `0.0.0.0/0`) |

## 2. DB subnet group

1. RDS > Subnet groups > Create.
2. Nome: `fieldops-db-subnet-group`; VPC default.
3. Selecione subnets de **pelo menos 2 AZs** (exigência do RDS, mesmo em Single-AZ).

## 3. Criar a instância

RDS > **Create database** > **Standard create**:

| Campo | Valor |
|---|---|
| Engine | PostgreSQL, versão **16.x** |
| Template | **Free tier** ou **Dev/Test** |
| Availability | **Single-AZ** (sem standby) |
| DB instance identifier | `fieldops-db` |
| Master username | `fieldops` |
| Credentials | **Self managed**; **senha forte**, guardada só no `.env` da EC2 |
| Instance class | `db.t3.micro` |
| Storage | gp3, 20 GiB, sem autoscaling |
| VPC / Subnet group | default / `fieldops-db-subnet-group` |
| **Public access** | **No** |
| VPC security group | `fieldops-rds-sg` (remova o `default`) |
| Initial database name | `fieldops` |
| Backup retention | 0 ou 1 dia (economia de créditos) |
| Encryption | padrão |
| Enhanced monitoring / Performance Insights | desligados |

> **Divergência da prática:** o console pode vir com "Gerenciada no AWS Secrets Manager"
> selecionado. Nesse modo a senha gira a cada 7 dias e quebra o `.env` da EC2. Escolha
> **Autogerenciada** e defina a senha. Se já criou assim, ajuste em **Modificar >
> Gerenciamento de credenciais** com aplicação imediata.

Aguarde o status **Available** (5 a 10 min) e copie o **Endpoint** (host).

## 4. Variáveis para a API (`.env` da EC2 — fora do git)

Use os nomes lidos por `api/.env.example`. Valores entre `<>` são placeholders:

```
DB_HOST=<endpoint-do-rds>.rds.amazonaws.com
DB_PORT=5432
DB_NAME=fieldops
DB_USER=fieldops
DB_PASSWORD=<senha-definida-no-passo-3>
```

> Nunca commitar o `.env`. Nunca colar a senha em issue, PR ou chat.

## 5. Validação

A partir da **EC2** (depois da #306), com o cliente `psql`:

```bash
sudo dnf install -y postgresql16
psql "host=$DB_HOST port=5432 dbname=fieldops user=fieldops sslmode=require" -c "select version();"
```

Esperado: retorna `PostgreSQL 16.x`.

Prova de que está privado (do seu computador):

```powershell
Test-NetConnection <endpoint-do-rds> -Port 5432
```

Esperado: `TcpTestSucceeded : False`. O endpoint resolve para um IP privado da VPC
(`172.31.x.x`) e a conexão expira (o RDS não é acessível pela internet).
Em Linux/macOS, use `nc -vz <endpoint-do-rds> 5432`.

## 6. Critérios de aceite da #305

- [x] Instância `fieldops-db` Available, PostgreSQL 16, `db.t3.micro`, Single-AZ.
- [x] `Publicly accessible = No`.
- [x] 5432 liberada só para o SG da EC2.
- [x] DB subnet group criado.
- [x] Conexão a partir da EC2 funcionando (`PostgreSQL 16.15`, 29 migrations aplicadas).
- [x] Nenhuma senha no repositório.

## 7. Reset do Learner Lab (~4h)

O Lab pode parar os recursos. Ao reiniciar: confirme que o RDS voltou a **Available** antes
de subir a API. Se o endpoint mudar, atualize `DB_HOST` no `.env` da EC2.
Para economizar créditos, **pare** (Stop temporarily) a instância ao fim da sessão.
