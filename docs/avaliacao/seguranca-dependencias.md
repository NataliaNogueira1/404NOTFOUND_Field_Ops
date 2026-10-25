# Segurança de dependências — FieldOps

> **TEMPLATE PARA PREENCHER.** Registra o resultado **atual** de auditoria de
> dependências (`npm audit`) do Web e do Mobile, com data, para responder às issues
> [#259](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/259) (mobile)
> e [#260](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/260) (web)
> com um **número verificável e datado**, em vez do snapshot antigo que a auditoria do
> professor marcou como "sujeito a mudança".
>
> A auditoria da equipe em [`known-limitations.md`](known-limitations.md) já observa que
> **não se deve repetir snapshots antigos como achado presente** — este documento existe
> justamente para manter o número sempre atual.

Data da última execução: _preencher_ · Executor: _preencher_.

---

## 1. Como gerar os números

Rodar na raiz de cada módulo e **colar a saída resumida** (sem listar segredos):

```powershell
# Web
cd frontend
npm audit
npm audit --json > ..\docs\avaliacao\evidencias\npm-audit-web.json   # opcional, para anexar

# Mobile
cd mobile
npm audit
npm audit --json > ..\docs\avaliacao\evidencias\npm-audit-mobile.json # opcional
```

Para tentar correção automática segura (revisar antes de commitar):

```powershell
npm audit fix            # correções compatíveis
npm audit fix --force    # CUIDADO: pode subir major e quebrar build — só com teste depois
```

> Depois de qualquer `audit fix`, rode `npm run build` e `npm run test` do módulo e
> registre em [`test-results.md`](test-results.md).

---

## 2. Resultado atual

### 2.1. Web (`frontend/`) — issue #260 (OPEN)

| Severidade | Qtd | Observação |
|---|---|---|
| Crítica | | |
| Alta | | |
| Moderada | | |
| Baixa | | |
| **Total** | | |

- Comando executado: `cd frontend; npm audit`
- Data/hora: _preencher_
- Build após correções: ⬜ `npm run build` · ⬜ `npm run test`
- Pacotes com correção pendente (sem fix disponível): _preencher_

### 2.2. Mobile (`mobile/`) — issue #259 (CLOSED)

| Severidade | Qtd | Observação |
|---|---|---|
| Crítica | | |
| Alta | | |
| Moderada | | |
| Baixa | | |
| **Total** | | |

- Comando executado: `cd mobile; npm audit`
- Data/hora: _preencher_
- Build após correções: ⬜ `npm run build:apk` (quando houver EAS) · ⬜ `npm run test`
- Pacotes com correção pendente (sem fix disponível): _preencher_

> Observação: a issue #259 está **fechada**. Se o `npm audit` atual ainda acusar
> vulnerabilidades relevantes, reabrir a issue ou abrir uma nova — fechar a issue não
> corrige a dependência.

---

## 3. Decisões e vulnerabilidades aceitas

> Para cada vulnerabilidade **sem fix** ou cujo fix quebra o build, registrar a decisão
> consciente (por que foi aceita, impacto, plano). Não deixar "em branco" itens de
> severidade alta/crítica sem justificativa.

| Pacote | Severidade | Tem fix? | Decisão | Justificativa |
|---|---|---|---|---|
| | | | | |

---

## 4. Boas práticas já adotadas (verificar e marcar)

- [ ] Nenhum segredo versionado (`.env` ignorado; confirmado via `git check-ignore`).
- [ ] `JWT_SECRET` e `DB_*` fora do código (env/Parameter Store).
- [ ] Dependências novas pinadas em versão fixa.
- [ ] `npm audit` rodado antes de cada entrega/apresentação.

---

## 5. Referências

- [Limitações conhecidas](known-limitations.md) (seção de dívidas/dependências)
- [Registro de testes](test-results.md)
- [Resposta à auditoria da IA](resposta-auditoria-ia.md)
- Issues: [#259 (mobile)](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/259) · [#260 (web)](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/260)
