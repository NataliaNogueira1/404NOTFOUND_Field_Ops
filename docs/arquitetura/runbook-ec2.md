# Runbook — EC2 com Docker para a API (#306) e LabRole (#307)

> Complementa `docs/arquitetura/arquitetura-aws.md` (decisões #3, #7 e #8) e
> `docs/arquitetura/runbook-rds.md`.
> Cenário: **AWS Academy Learner Lab** (role `LabRole` fixa, sessão reseta a cada ~4h).
> Executado **manualmente no console AWS**. Nenhum segredo vai para o git, para issues ou
> para o chat. Nada de chaves AWS no `.env`.

## Resultado esperado

| Item | Valor |
|---|---|
| Nome | `fieldops-api` |
| AMI / tipo | Amazon Linux 2023 / `t3.micro` (1 GB de RAM) |
| Disco | 20 GiB gp3 |
| Security Group | `fieldops-ec2-sg` |
| Instance profile (#307) | `LabInstanceProfile` (role `LabRole`) |
| Container | `fieldops-api`, porta 8080, perfil Spring `demo` |
| Banco | RDS privado (`runbook-rds.md`) |

## 1. Criar a instância (#306)

1. EC2 > **Launch instance**. Nome `fieldops-api`, AMI **Amazon Linux 2023**, tipo `t3.micro`.
2. Key pair: pode ser dispensado, porque o acesso é pelo EC2 Instance Connect.
3. Rede: VPC default, sub-rede pública, **IP público habilitado**, SG `fieldops-ec2-sg`.
4. Armazenamento: 20 GiB gp3.
5. Em **Detalhes avançados > Perfil de instância do IAM**, selecione `LabInstanceProfile`
   (isso já cobre a #307; veja a seção 6).

O SG precisa de: SSH 22 para `18.206.107.24/29` (Instance Connect), TCP 8080 e saída
"Todo o tráfego".

## 2. Conectar

EC2 > Instâncias > `fieldops-api` > **Conectar** > **EC2 Instance Connect**, usuário
`ec2-user`.

> Dica: ao colar comandos no terminal do navegador, o início da linha pode ganhar
> `[200~` ou `~`. Se der "command not found", digite o comando à mão. Nunca cole
> marcadores como `<senha>`: os sinais `<` e `>` fazem parte do texto colado.

## 3. Swap (1 GB de RAM não basta para o build)

O swap **se perde** no reinício do Lab se não estiver no `/etc/fstab`.

```bash
# Criar uma única vez
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile

# Persistir e ativar
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo swapon -a
swapon --show
free -h
```

Esperado: `/swapfile` com 2G e `Swap: 2.0Gi`. Se o arquivo já existir, pule o `dd` e o
`mkswap`.

## 4. Ferramentas

```bash
sudo dnf install -y docker git postgresql16
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Feche a sessão e conecte de novo. Depois:

```bash
docker ps
```

Esperado: só o cabeçalho da tabela, sem "permission denied".

Teste o RDS (pede a senha):

```bash
psql "host=<endpoint-do-rds> port=5432 dbname=fieldops user=fieldops sslmode=require" -c "select version();"
```

Esperado: `PostgreSQL 16.x`. Timeout indica regra errada no `fieldops-rds-sg`.

## 5. Subir a API

```bash
git clone https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops.git
cd 404NOTFOUND_Field_Ops/api
git branch --show-current          # esperado: develop
ls src/main/resources              # esperado: application-demo.yml presente
```

Crie o `.env` **sem exibir a senha nem o segredo**. O bloco abaixo pede a senha em modo
silencioso e gera o `JWT_SECRET` sem imprimi-lo:

```bash
read -s -p "Senha do banco: " DBPW; echo
JWT=$(openssl rand -base64 48 | tr -d '\n')
cat > .env <<EOF
DB_HOST=<endpoint-do-rds>
DB_PORT=5432
DB_NAME=fieldops
DB_USER=fieldops
DB_PASSWORD=$DBPW
JWT_SECRET=$JWT
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:8081,http://localhost:5173
SPRING_PROFILES_ACTIVE=demo
EOF
chmod 600 .env
unset DBPW JWT
cut -d= -f1 .env                   # esperado: 8 nomes, sem linhas extras
```

`CORS_ALLOWED_ORIGINS` é uma lista separada por vírgula, **sem espaços** e **nunca `*`**
(a API usa `allowCredentials(true)`). Lido em `api/src/main/resources/application.yml`.
O valor definitivo (domínio do CloudFront) entra na #313.

Build e execução:

```bash
docker build -t fieldops-api .
docker run -d --name fieldops-api --restart unless-stopped -p 8080:8080 --env-file .env fieldops-api
docker logs --tail 40 fieldops-api
```

Esperado nos logs: Flyway aplica as migrations (29, schema na versão 30), o seed `demo`
roda e aparece `Started FieldOpsApiApplication`. O boot leva cerca de 20 s.

## 6. LabRole como instance profile (#307)

O Learner Lab não permite criar roles novos. Use o `LabInstanceProfile`, que carrega o
`LabRole`. O SDK da AWS obtém a credencial pelo metadata da instância, então **nenhuma
chave AWS vai no `.env`**.

- Se não foi anexado na criação: EC2 > `fieldops-api` > **Ações > Segurança > Modificar
  função do IAM** > `LabInstanceProfile` > **Atualizar função do IAM**.

Validação na EC2 (IMDSv2), sem expor os valores da credencial:

```bash
TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

Esperado: `LabRole`. A resposta não termina com quebra de linha, então o nome fica colado
no prompt. Vazio ou 404 significa que o instance profile não está anexado.

> Nunca rode `.../security-credentials/LabRole`: isso imprime `AccessKeyId`,
> `SecretAccessKey` e `Token`.

## 7. Validação

| Teste | Comando | Esperado |
|---|---|---|
| Health na EC2 | `curl localhost:8080/actuator/health` | `{"status":"UP"}` |
| Health de fora | `curl.exe http://<ip-publico>:8080/actuator/health` (PowerShell) | `{"status":"UP"}` |
| RDS privado | `Test-NetConnection <endpoint-do-rds> -Port 5432` | `TcpTestSucceeded : False` |
| LabRole | comandos da seção 6 | `LabRole` |

No PowerShell, `curl` é alias de `Invoke-WebRequest` e esconde o corpo. Use `curl.exe`.

## 8. Critérios de aceite

**#306**
- [x] Instância `fieldops-api` rodando, `t3.micro`, com Docker.
- [x] API em container, `--restart unless-stopped`, perfil `demo`.
- [x] `/actuator/health` retorna `UP` dentro e fora da EC2.
- [x] API conecta ao RDS privado e aplica as migrations.
- [x] Nenhum segredo no repositório.

**#307**
- [x] `LabInstanceProfile` anexado à EC2.
- [x] Metadata retorna `LabRole`.
- [x] Nenhuma chave AWS no `.env`.
- [ ] Upload ao S3 com a role (depende da #308 e da #309).

## 9. Reset do Learner Lab (~4h) e economia

Ao voltar, o IP público muda. Confira, nesta ordem:

1. RDS **Disponível**.
2. `free -h` mostra o swap. Se não mostrar, rode `sudo swapon -a`.
3. `docker ps` lista `fieldops-api`. Se não listar, rode `docker start fieldops-api`.
4. Atualize onde o IP é usado (o CloudFront da #312 elimina essa dependência).

Ao fim da sessão, **pare** a EC2 e o RDS (Stop temporarily) para poupar créditos. A
automação do boot fica na #315.
