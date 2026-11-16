# Runbook — Boot automático da EC2 e reset do Learner Lab (#315)

> Complementa `docs/arquitetura/arquitetura-aws.md` (decisão #7), `runbook-ec2.md` (#306/#307)
> e `runbook-rds.md` (#305).
> Cenário: **AWS Academy Learner Lab** (sessão reseta a cada ~4h, créditos limitados).
> Os arquivos de automação ficam em `infra/aws/ec2/`. Nenhum segredo vai para o git nem para o
> user-data (o user-data aparece no console e no metadata da instância).

## Como funciona

| Peça | Função |
|---|---|
| `infra/aws/ec2/user-data.sh` | Instala Docker e git, clona o repositório em `/opt/fieldops/repo`, instala o script e a unit systemd. Serve como user-data de uma EC2 nova e roda à mão na EC2 atual. Idempotente |
| `infra/aws/ec2/fieldops-boot.sh` | Instalado em `/usr/local/bin/fieldops-boot`. A cada boot: ativa o swap (e o grava no `/etc/fstab`), garante o Docker, o clone, a imagem e o container, e espera o `/actuator/health` ficar `UP` |
| `infra/aws/ec2/fieldops-boot.service` | Unit systemd (`oneshot`) que executa o script a cada boot, depois do Docker e da rede |
| `/opt/fieldops/.env` | Segredos da API (banco, `JWT_SECRET`, storage S3). Criado uma vez, fora do git, permissão 600 |
| `/etc/fieldops/boot.conf` | Opções sem segredo, como `FIELDOPS_GIT_REF` (branch da aplicação) |

O Flyway e o seed do perfil `demo` rodam dentro da própria API ao subir, então não há passo
separado: banco vazio recebe as migrations e o seed; banco já populado só valida e ignora o seed.

O script recria o container quando a imagem ou o `.env` mudaram e mantém o que já está certo.
Logs: `/var/log/fieldops-boot.log` (boot) e `/var/log/fieldops-user-data.log` (instalação).

## 1. Instalar na EC2 atual (uma vez)

Conecte pelo EC2 Instance Connect (`ec2-user`). Digite os comandos à mão se a colagem trouxer `[200~`.

1. Mova o `.env` para o local definitivo, sem exibi-lo:
   ```bash
   sudo mkdir -p /opt/fieldops
   sudo cp ~/404NOTFOUND_Field_Ops/api/.env /opt/fieldops/.env
   sudo chown root:root /opt/fieldops/.env
   sudo chmod 600 /opt/fieldops/.env
   sudo cut -d= -f1 /opt/fieldops/.env
   ```
   Esperado: os nomes das variáveis, sem a linha `>` nem valores.
2. Atualize o repositório atual para ler o script e instale:
   ```bash
   cd ~/404NOTFOUND_Field_Ops
   git fetch origin
   git checkout feat/315-ec2-boot-automation
   sudo FIELDOPS_GIT_REF=feat/315-ec2-boot-automation bash infra/aws/ec2/user-data.sh
   ```
   `FIELDOPS_GIT_REF` é a branch da aplicação **e** dos scripts. Enquanto as #309, #310 e #315 não
   estiverem na `develop`, use a branch que contém tudo. Depois do merge, troque para `develop`
   (seção 5).
3. Acompanhe:
   ```bash
   sudo tail -f /var/log/fieldops-boot.log
   ```
   Esperado, ao final: `API healthy (UP)` e `boot done`. Saia com `Ctrl+C`.

Se o log mostrar `ERROR: /opt/fieldops/.env not found`, volte ao passo 1.

## 2. Criar uma EC2 nova com o user-data

1. EC2 > **Launch instance** como no `runbook-ec2.md` (Amazon Linux 2023, `t3.micro`, 20 GiB,
   `fieldops-ec2-sg`, `LabInstanceProfile`).
2. Em **Detalhes avançados > Dados do usuário**, cole o conteúdo de `infra/aws/ec2/user-data.sh`
   (para fixar a branch, acrescente `export FIELDOPS_GIT_REF=<branch>` logo abaixo do `set -Eeuo pipefail`).
3. Depois que a instância iniciar, crie o `.env` (o user-data não cria segredos):
   ```bash
   sudo mkdir -p /opt/fieldops
   read -s -p "Senha do banco: " DBPW; echo
   JWT=$(openssl rand -base64 48 | tr -d '\n')
   sudo tee /opt/fieldops/.env > /dev/null <<EOF
   DB_HOST=<endpoint-do-rds>
   DB_PORT=5432
   DB_NAME=fieldops
   DB_USER=fieldops
   DB_PASSWORD=$DBPW
   JWT_SECRET=$JWT
   CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:8081,http://localhost:5173
   SPRING_PROFILES_ACTIVE=demo
   EVIDENCE_STORAGE_TYPE=s3
   EVIDENCE_S3_BUCKET=fieldops-evidencias-404nf
   AWS_REGION=us-east-1
   EOF
   sudo chmod 600 /opt/fieldops/.env
   unset DBPW JWT
   sudo systemctl restart fieldops-boot
   ```
   Troque `<endpoint-do-rds>`. O heredoc deve ter as linhas sem recuo. Não cole segredos no chat.

## 3. Rotina de uma sessão: subir, demonstrar, desligar

**Subir**
1. Inicie o Learner Lab e espere a bolinha ficar verde.
2. RDS > `fieldops-db`: se estiver parado, **Iniciar** e espere **Disponível**.
3. EC2 > `fieldops-api`: se estiver parada, **Iniciar instância**. Anote o novo IP público
   (ele muda a cada parada, a menos que haja um Elastic IP; veja a seção 6).
4. Aguarde 2 a 4 minutos. Não é preciso abrir terminal: a unit sobe a API sozinha.

**Verificar**
```bash
curl http://<ip-publico>:8080/actuator/health
```
Esperado: `{"status":"UP"}`. No PowerShell use `curl.exe`.

Com o HTTPS ativo (`FIELDOPS_DOMAIN` em `/etc/fieldops/boot.conf`, veja `runbook-https-caddy.md`), a API não
escuta mais na 8080 pela internet. Verifique por `https://<nome>.sslip.io/actuator/health`. Se não responder, conecte na EC2 e rode:
```bash
sudo systemctl status fieldops-boot --no-pager
sudo tail -n 40 /var/log/fieldops-boot.log
docker ps
```

**Demonstrar**: use a API ou o Web Admin normalmente.

**Desligar** (nesta ordem, para poupar créditos)
1. EC2 > `fieldops-api` > **Estado da instância > Interromper** (não terminar).
2. RDS > `fieldops-db` > **Ações > Interromper temporariamente**.
3. Encerre o Learner Lab.

Interromper preserva o disco (swap, imagem Docker e `.env`). **Terminar** apaga tudo e exige a seção 2.

## 4. Verificar o boot automático (critérios de aceite)

1. `sudo systemctl is-enabled fieldops-boot` retorna `enabled`.
2. **Reinício:** `sudo reboot`, ou **Interromper e Iniciar** pelo console. Sem abrir terminal, o
   health volta a `UP` em alguns minutos.
3. `sudo grep -E "swap|container|healthy|boot done" /var/log/fieldops-boot.log | tail -n 8` mostra o
   swap ativo, `container already running` (ou `starting existing container`) e `API healthy (UP)`.
4. Flyway e seed: `docker logs fieldops-api 2>&1 | grep -E "Flyway|Demo seed"`. Em banco já populado
   aparecem as migrations validadas e `Demo seed already present`.

## 5. Atualizar a versão da aplicação

```bash
sudo FIELDOPS_GIT_REF=develop bash /opt/fieldops/repo/infra/aws/ec2/user-data.sh
sudo fieldops-boot --update
```
O primeiro comando troca a branch configurada e reinstala os scripts; o segundo atualiza o clone,
reconstrói a imagem se o commit mudou e recria o container. Sem `--update`, o boot nunca reconstrói
uma imagem que já existe (previsível durante a demonstração).

## 6. Pontos de atenção

- **IP público muda a cada parada.** O CloudFront (#312) precisa de uma origem estável. Avalie
  associar um **Elastic IP** à `fieldops-api` (EC2 > Elastic IPs). Confirme se o Learner Lab permite a
  alocação. Um Elastic IP sem instância em execução pode consumir créditos, então libere-o ao fim do projeto.
- **RDS parado volta sozinho após 7 dias**: a AWS reinicia instâncias RDS paradas por esse prazo.
- **Primeira subida demora.** Com a imagem ausente, o build leva vários minutos; o `TimeoutStartSec`
  da unit é de 30 minutos e o log mostra o andamento.
- **`.env` alterado** é detectado pelo hash: `sudo systemctl restart fieldops-boot` recria o container.
- **Branch como referência.** `FIELDOPS_GIT_REF` deve ser uma branch; tags não aceitam o fast-forward do `--update`.

## 7. Critérios de aceite da #315

- [x] `user-data` sobe a API automaticamente após (re)iniciar a EC2 — validado em 16/11/2026: depois de
      interromper e iniciar a instância, a unit `fieldops-boot` rodou sozinha (`active (exited)`, status 0).
- [ ] Flyway + seed `demo` repopulam o dado sozinhos — validado em parte: a primeira subida (#306) aplicou
      29 migrations e o seed em banco vazio, e o boot automático confirmou a idempotência
      (`Demo seed already present`). A repopulação de um banco vazio pelo boot automático não foi exercitada.
- [x] `GET /actuator/health` fica `UP` sem intervenção manual — validado em 16/11/2026 (`{"status":"UP"}`
      de fora da EC2, sem abrir terminal depois de iniciar a instância).
- [x] Runbook escrito e validado em uma sessão real — instalação (seção 1) e parada/início da EC2
      (seção 4) validados em 16/11/2026. A parada do RDS (seção 3) não foi exercitada.
- [ ] Confirmar que o domínio estável do CloudFront mantém o APK entre sessões — depende da #312 e da #314.

### Evidência da validação (16/11/2026)

- Instalação: `swap already active`, `container is outdated ... recreating`, `API healthy (UP)`, `boot done`
  (cerca de 27 s até o health `UP`, com a imagem existente reaproveitada).
- Depois de interromper e iniciar a EC2: `swap already active` (o `/etc/fstab` manteve o swap),
  `container already running`, `API healthy (UP)`, `boot done`. O Docker já havia reiniciado o container
  pela política `unless-stopped`; o `fieldops-boot` confirmou a imagem e o `.env`, e esperou o health.
- `systemctl is-enabled fieldops-boot` retornou `enabled` e a unit ficou `active (exited)`.
