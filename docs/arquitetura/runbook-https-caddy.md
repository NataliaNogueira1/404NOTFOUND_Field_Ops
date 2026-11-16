# Runbook — HTTPS na EC2 com Caddy (#312)

> Substitui o CloudFront previsto na decisão #1 de `docs/arquitetura/arquitetura-aws.md`.
> Cenário: **AWS Academy Learner Lab**, `us-east-1`. Nenhum segredo vai para o git.

## Por que não CloudFront

O console do Learner Lab (`voclabs`) negou `cloudfront:CreateDistribution` por falta de política IAM,
e a `LabRole` da EC2 também recebeu `AccessDenied` em `cloudfront:ListDistributions`. As duas roles
disponíveis estão bloqueadas, então não há como criar a distribuição. Os pontos de HTTPS e domínio
estável continuam obrigatórios (`docs/referencias/notion.md`, seção 11.10: "Todo tráfego externo
deverá utilizar HTTPS em ambientes publicados"; o Android também bloqueia HTTP em builds de release).
A alternativa foi aprovada pela gestão em 16/11/2026.

## Como funciona

| Peça | Função |
|---|---|
| Elastic IP da `fieldops-api` | Endereço fixo (#312 pré-requisito). Não o libere nem o desassocie |
| Nome `<ip-com-hifens>.sslip.io` | Aponta para o Elastic IP sem cadastro e sem conta. Ex.: o IP `A.B.C.D` vira `A-B-C-D.sslip.io` |
| Contêiner `fieldops-proxy` (Caddy) | Obtém e renova o certificado do Let's Encrypt sozinho (desafio HTTP-01) e serve tudo em um domínio HTTPS |
| `infra/aws/ec2/Caddyfile` | `/api/*` e `/actuator/health` vão para a API em `127.0.0.1:8080`; o resto vem do site estático do S3 (#311), com fallback de SPA |
| `fieldops-boot` (#315) | Sobe e mantém o proxy a cada boot quando `FIELDOPS_DOMAIN` está definido |

O Web Admin e a API ficam no **mesmo domínio**, então o build mantém `VITE_API_URL` vazio e não há CORS entre
eles. Com o proxy ativo, a API só escuta em `127.0.0.1`: a porta 8080 deixa de ser acessível pela internet.

Não use DuckDNS: a rede da empresa derruba esse domínio. Se o `sslip.io` também for bloqueado, veja a seção 5.

## 1. Antes de mexer na EC2: testar o nome na rede da empresa

No PowerShell, **na rede onde a demonstração será feita** (troque pelo seu IP, com hifens):

```powershell
nslookup A-B-C-D.sslip.io
curl.exe -s -o NUL -w "api: %{http_code}`n" http://A-B-C-D.sslip.io:8080/actuator/health
```

Esperado: o `nslookup` devolve o Elastic IP e o `curl.exe` retorna `api: 200` (a porta 8080 ainda está aberta
neste momento). Se o nome não resolver ou a conexão cair, a rede bloqueia o `sslip.io`: use a seção 5.

## 2. Security Group

Console > EC2 > Security Groups > `fieldops-ec2-sg` > **Editar regras de entrada**:

| Tipo | Porta | Origem | Para quê |
|---|---|---|---|
| HTTP | 80 | `0.0.0.0/0` | Desafio do Let's Encrypt e redirecionamento para HTTPS |
| HTTPS | 443 | `0.0.0.0/0` | Tráfego do Web Admin e da API |

Mantenha a regra da 8080 por enquanto; ela é removida na seção 4, depois de validar.

## 3. Instalar e ativar na EC2

Conecte pelo EC2 Instance Connect (`ec2-user`). Digite os comandos à mão se a colagem trouxer `[200~`.

```bash
cd /opt/fieldops/repo
sudo git fetch origin
sudo git checkout feat/312-https-caddy
sudo bash -n infra/aws/ec2/fieldops-boot.sh && sudo bash -n infra/aws/ec2/user-data.sh && echo SINTAXE-OK
sudo FIELDOPS_GIT_REF=feat/312-https-caddy FIELDOPS_DOMAIN=A-B-C-D.sslip.io bash infra/aws/ec2/user-data.sh
sudo tail -f /var/log/fieldops-boot.log
```

Troque `A-B-C-D` pelo Elastic IP. Esperado no log, em ordem: `container is outdated (image or env file changed)`
(a API passa a publicar só em loopback), `starting the HTTPS proxy for ...`, `API healthy (UP)` e
`HTTPS proxy healthy: https://...`, depois `boot done`. A primeira emissão do certificado leva de 10 a 60 segundos.
Se aparecer `WARNING: https://... did not answer`, veja a seção 6.

## 4. Validar os critérios da #312

No PowerShell do seu computador (troque o domínio):

```powershell
$d = 'https://A-B-C-D.sslip.io'
curl.exe -sS -o NUL -w "site: %{http_code} %{content_type}`n" "$d/"
curl.exe -sS -o NUL -w "rota profunda: %{http_code} %{content_type}`n" "$d/app/inspections/1/review"
curl.exe -sS "$d/actuator/health"
curl.exe -sS -i "$d/api/v1/inspection-evidences/1/download-url" | Select-String "HTTP/|Cache|WWW"
```

| Critério | Como provar | Esperado |
|---|---|---|
| Web Admin abre em HTTPS sem aviso de certificado | Abra `$d` no navegador | Cadeado fechado e tela de login. Sem aviso |
| Fallback de SPA | `curl` na rota profunda | `200 text/html` (diferente do `404` do S3 puro) |
| `/api/v1/...` chega na API | `curl` sem token em uma rota protegida | Resposta `401` ou `403` em JSON da API, e não HTML |
| `Authorization` é repassado | Entre pelo Web Admin como supervisor e abra uma inspeção | A tela carrega os dados (sem o header, a API devolveria `401`) |
| Domínio estável | Interrompa e inicie a EC2, sem abrir terminal | O mesmo `$d` volta a responder em alguns minutos |

Depois de validar, **remova a regra da 8080** do `fieldops-ec2-sg`. A API continua alcançável por
`$d/api/...` e o health, por `$d/actuator/health`. O `fieldops-boot` verifica a API em `localhost`, então
não é afetado.

## 5. Se o `sslip.io` for bloqueado pela rede

Troque só o nome; o restante não muda. Alternativas, da menos para a mais trabalhosa:

1. `A-B-C-D.nip.io`: o mesmo serviço, com outro domínio. Troque `FIELDOPS_DOMAIN` e rode a seção 3 de novo.
2. Um subdomínio do FreeDNS (afraid.org), que exige cadastro. Aponte o registro `A` para o Elastic IP.
3. Um domínio próprio barato com registro `A` para o Elastic IP.

Nomes `*.amazonaws.com` (como o DNS público da EC2) **não** recebem certificado do Let's Encrypt.

## 6. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `WARNING: https://... did not answer` no log do boot | Portas 80/443 fechadas no Security Group, nome sem resolver, ou limite de emissão do Let's Encrypt. Veja `docker logs fieldops-proxy` |
| Navegador mostra aviso de certificado | O certificado ainda não foi emitido ou o Caddy usou um certificado temporário. Espere 1 minuto e recarregue |
| Erro `too many certificates` | Limite do Let's Encrypt para o domínio compartilhado. O Caddy tenta o ZeroSSL; se persistir, use a alternativa 2 ou 3 da seção 5 |
| `502 Bad Gateway` em `/` | O endpoint do site do S3 não responde. Confira o bucket do #311 |
| `502` em `/api/...` | A API não está de pé: `docker ps` e `sudo tail /var/log/fieldops-boot.log` |
| `curl` direto no IP:8080 falha depois da ativação | Esperado: a API agora só escuta em loopback |

## 7. Voltar ao modo sem HTTPS

Remova a linha `FIELDOPS_DOMAIN=` de `/etc/fieldops/boot.conf` e rode `sudo systemctl restart fieldops-boot`.
O proxy é removido e a API volta a publicar a porta 8080 (reabra a regra no Security Group).

## 8. Critérios de aceite da #312 (adaptados)

- [ ] Web Admin abre em `https://<nome>.sslip.io` sem aviso de certificado.
- [ ] Chamadas `https://<nome>.sslip.io/api/v1/...` chegam na API (EC2).
- [ ] O header `Authorization` é repassado para a API.
- [ ] Domínio estável confirmado (não muda ao reiniciar a EC2).

Os quatro estão pendentes de validação na EC2 (seção 4).
