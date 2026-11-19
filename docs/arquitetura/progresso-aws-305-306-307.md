# Progresso AWS — #305 (RDS), #306 (EC2) e #307 (LabRole)

> Arquivo de continuidade para retomar em outro computador.
> Última atualização: 14/11/2026. Região: `us-east-1` (Norte da Virgínia).
> **Nunca registrar aqui:** senha do banco, `JWT_SECRET`, arquivo `.pem`, chaves AWS, IP público da EC2, endpoint real do RDS (expõe o identificador da conta).
> Runbooks de referência: `runbook-rds.md`, `runbook-ec2.md` e `arquitetura-aws.md`.

## Situação

**Fases 0 a 7 concluídas.** #305, #306 e #307 estão funcionando e validadas na prática.
Falta apenas o trabalho de repositório e board (ver "Pendências").

## Fases

| Fase | O que é | Situação |
|---|---|---|
| 0 | Iniciar o Learner Lab e conferir a região | Feito |
| 1 | DB subnet group `fieldops-db-subnet-group` | Feito |
| 2 | Security Groups `fieldops-ec2-sg` e `fieldops-rds-sg` | Feito |
| 3 | RDS `fieldops-db` (PostgreSQL 16.15, `db.t3.micro`, Single-AZ, privado) | Feito |
| 4 | EC2 `fieldops-api` (`t3.micro`, Amazon Linux 2023, 20 GiB gp3) | Feito |
| 5 | Preparar a EC2 (swap, Docker, git, psql, teste do RDS) | Feito |
| 6 | Subir a API com Docker (perfil `demo`) | Feito |
| 7 | Validar (health, RDS privado, metadata do LabRole) | Feito |

## Evidências de validação (14/11/2026)

| Validação | Resultado |
|---|---|
| `psql` da EC2 no RDS (`sslmode=require`) | `PostgreSQL 16.15` |
| Flyway no boot da API | 29 migrations aplicadas, schema na versão 30 |
| Seed `demo` | cliente, site, equipamento, template e 9 inspeções |
| `curl localhost:8080/actuator/health` (na EC2) | `{"status":"UP"}` |
| `curl.exe http://<ip-publico>:8080/actuator/health` (de fora) | `{"status":"UP"}` |
| `Test-NetConnection <endpoint-rds> -Port 5432` (de fora) | `TcpTestSucceeded : False` (RDS privado) |
| Metadata IMDSv2 `iam/security-credentials/` | `LabRole` |

## Dados do ambiente (sem segredos)

- RDS endpoint (`DB_HOST`): `<endpoint-do-rds>` (copie do console: RDS > Databases > `fieldops-db` > Connectivity & security; não registrar o valor real aqui)
- Banco / usuário: `fieldops` / `fieldops`. Porta `5432`.
- Credencial do RDS: **autogerenciada** (senha própria, só no `.env` da EC2).
- EC2: nome `fieldops-api`. O IP público muda a cada reinício do Lab; consulte no console.
- `fieldops-ec2-sg`: SSH 22 para `18.206.107.24/29` (EC2 Instance Connect) e TCP 8080.
- Container: `fieldops-api`, `--restart unless-stopped`, `--env-file .env`.

## Pendências

- [x] Atualizar `runbook-rds.md` com o que divergiu na prática.
- [x] Criar `runbook-ec2.md` (#306) com a seção do LabRole (#307).
- [ ] Mover #305, #306 e #307 para **In review** no board, após o aceite do time.
- [ ] Abrir PR para `develop` (`Closes #305`, `Closes #306`, `Closes #307`).
- [ ] Ao fim de cada sessão do Lab: parar a EC2 e o RDS para poupar créditos.

## Dependências entre as issues

`#305 (RDS)` → `#306 (EC2)` → `#307 (LabRole)`. Em seguida vêm `#308` (bucket S3),
`#309` (`S3EvidenceStorage`), `#310` (presigned URL), `#311` (Web no S3), `#312`
(CloudFront), `#313` (segredos e CORS), `#314` (APK), `#315` (user-data) e `#316`
(12 testes). Veja a lista completa no board.

## Observações do Learner Lab

- O aviso "Acesso negado" em `ec2:DescribeCapacityReservations` é inofensivo.
- O Lab reinicia a cada ~4h. Ao voltar, confirme que o RDS está **Disponível**, que o
  swap está ativo (`free -h`) e que o container subiu (`docker ps`).
