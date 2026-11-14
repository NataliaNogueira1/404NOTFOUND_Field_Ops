# Progresso AWS — #305 (RDS), #306 (EC2) e #307 (LabRole)

> Arquivo de continuidade para retomar em outro computador.
> Última atualização: 13/11/2026. Região: `us-east-1` (Norte da Virgínia).
> **Nunca registrar aqui:** senha do banco, `JWT_SECRET`, arquivo `.pem`, chaves AWS.
> Runbook de referência: `docs/arquitetura/runbook-rds.md` e `docs/arquitetura/arquitetura-aws.md`.

## Onde parei

**Fase 5 — preparação da EC2.** O swap está criado e ativo. Falta instalar as ferramentas
(Docker, git, psql) e testar a conexão com o RDS.

## Ordem das fases

| Fase | O que é | Situação |
|---|---|---|
| 0 | Iniciar o Learner Lab e conferir a região | Feito |
| 1 | DB subnet group `fieldops-db-subnet-group` | Feito (VPC default, 3 sub-redes em 3 zonas) |
| 2 | Security Groups `fieldops-ec2-sg` e `fieldops-rds-sg` | Feito (conferir pendências abaixo) |
| 3 | RDS `fieldops-db` (PostgreSQL 16.15, `db.t3.micro`, Single-AZ, privado) | Criado (conferir pendências abaixo) |
| 4 | EC2 `fieldops-api` (`t3.micro`, Amazon Linux 2023, 20 GiB gp3, `fieldops-ec2-sg`) | Criada e acessível pelo EC2 Instance Connect |
| 5 | Preparar a EC2 (swap, Docker, git, psql, teste do RDS) | **Em andamento** |
| 6 | Subir a API com Docker (perfil `demo`) | Pendente |
| 7 | Validar (health, RDS privado, metadata do LabRole) | Pendente |

## Dados do ambiente (sem segredos)

- RDS endpoint (`DB_HOST`): `fieldops-db.c5cm6usmijco.us-east-1.rds.amazonaws.com`
- Banco / usuário: `fieldops` / `fieldops`
- Porta: `5432`
- EC2: nome `fieldops-api`. O IP público muda a cada reinício do Learner Lab, então
  consulte no console.
- Regra extra no `fieldops-ec2-sg`: SSH (22) para a faixa do EC2 Instance Connect
  `18.206.107.24/29`, necessária para conectar pelo console.

## O que já foi feito na EC2

- Swap de 2 GiB criado em `/swapfile` e ativo. Se aparecer
  `Text file busy` ou `swapon failed: Device or resource busy` ao repetir os comandos,
  é normal: o swap já está em uso. **Não repetir.**

## O que falta fazer

### Pendências de conferência (console AWS)

- [ ] RDS com status **Disponível**.
- [ ] Nome do banco inicial = `fieldops` (aba Configuração do RDS). Se estiver vazio,
      criar com `create database fieldops;` pelo `psql` na EC2.
- [ ] Gerenciamento de credenciais do RDS. Se ficou no Secrets Manager, a senha gira a
      cada 7 dias e quebra o `.env`. Passar para **Autogerenciada** em Modificar e
      definir uma senha própria.
- [ ] RDS: **Acessível publicamente = Não** e só o `fieldops-rds-sg` como grupo de segurança.
- [ ] `fieldops-rds-sg`: entrada PostgreSQL 5432 com origem no **SG** `fieldops-ec2-sg`.
- [ ] `fieldops-ec2-sg` e `fieldops-rds-sg`: regra de saída "Todo o tráfego" `0.0.0.0/0`.
- [ ] EC2: confirmar em Ações > Segurança > Modificar função do IAM que o
      **`LabInstanceProfile`** está anexado. Isso resolve a #307. Se não estiver,
      anexar por ali.

### Na EC2 (Instance Connect, usuário `ec2-user`)

1. Confirmar o swap e torná-lo persistente (uma única vez):
   ```bash
   swapon --show
   free -h
   grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
2. Instalar as ferramentas e sair/entrar na sessão para o grupo `docker` valer:
   ```bash
   sudo dnf install -y docker git postgresql16
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user
   docker ps
   ```
3. Testar o RDS (pede a senha na hora):
   ```bash
   psql "host=fieldops-db.c5cm6usmijco.us-east-1.rds.amazonaws.com port=5432 dbname=fieldops user=fieldops sslmode=require" -c "select version();"
   ```
   Esperado: `PostgreSQL 16.x`.
4. Clonar o repositório e entrar em `api/`:
   ```bash
   git clone https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops.git
   cd 404NOTFOUND_Field_Ops/api
   ```
5. Criar o `.env` na EC2 (fora do git) com: `DB_HOST`, `DB_PORT=5432`, `DB_NAME=fieldops`,
   `DB_USER=fieldops`, `DB_PASSWORD`, `JWT_SECRET` (mínimo 32 bytes aleatórios),
   `CORS_ALLOWED_ORIGINS` e `SPRING_PROFILES_ACTIVE=demo`. **Sem chaves AWS.**
6. Build e execução:
   ```bash
   docker build -t fieldops-api .
   docker run -d --name fieldops-api --restart unless-stopped -p 8080:8080 --env-file .env fieldops-api
   docker logs -f fieldops-api
   ```
7. Validar:
   - Na EC2: `curl localhost:8080/actuator/health` retorna `{"status":"UP"}`.
   - No computador: `curl http://<ip-publico>:8080/actuator/health` retorna o mesmo `UP`.
   - RDS privado, no computador: `Test-NetConnection <endpoint-do-rds> -Port 5432` deve falhar.
8. Validar o LabRole (#307), sem copiar os valores da credencial:
   ```bash
   TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
   curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/
   ```
   Esperado: aparece o nome do role (`LabRole`).

### Depois da AWS

- [ ] Atualizar `runbook-rds.md` com o que divergiu na prática (Secrets Manager, regra do
      Instance Connect).
- [ ] Criar o runbook da EC2 (#306) e a seção do LabRole (#307).
- [ ] Criar/vincular as issues no board (#305, #306, #307) e abrir o PR para `develop`.
- [ ] Ao fim da sessão do Learner Lab: parar o RDS e a EC2 para economizar créditos.

## Dependências entre as issues

`#305 (RDS)` → `#306 (EC2)` → `#307 (LabRole)`. O upload e o presigned URL no S3 também
dependem de `#308` (bucket) e `#309` (`S3EvidenceStorage`), que **não** fazem parte deste
trabalho.

## Observações do Learner Lab

- O aviso "Acesso negado" em `ec2:DescribeCapacityReservations` no painel do EC2 é
  inofensivo; não afeta a criação de instâncias.
- O Lab reinicia a cada ~4h. Ao voltar, confirme que o RDS está **Disponível** e atualize
  o IP público da EC2 onde for usado.
