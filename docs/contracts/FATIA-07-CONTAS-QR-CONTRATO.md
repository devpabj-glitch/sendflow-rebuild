# CONTRATO TÉCNICO — FATIA 7: CONTAS QR (conexão por QR code via Evolution API 2.3.7, estado real e webhook de entrada)

> **Status:** CONTRATO EMENDADO pela implementação — incorpora o **parecer A4 (FAVORÁVEL COM RESSALVAS)**: R1 (função única de redação, §0.1.8/§6.1), R2 (409 no GET /qr de conta sem instância, §4.1), R3 (UNIQUE→envelope + redação de "colisão impossível", D2/§2.1.2/§4.5), R5 (nota de numeração F7-D*, §0). R4/R6/R7: apenas registro (polling/copy honesta do `banida` são da A2; replay/readiness ficam para fatias c–f).
> **Fatos validados em PRODUÇÃO contra a Evolution 2.3.7 real** (probe do orquestrador, 12/11 — precedem qualquer inferência do clone): (1) `POST /instance/create` exige `"integration":"WHATSAPP-BAILEYS"`; (2) **NÃO EXISTE `webhook/set` na 2.3.7** — webhook por instância só no create, campo `webhook`; (3) create 201 = `{instance:{instanceName,instanceId,integration,status:"connecting"}, hash, webhook}` (`hash` = token por instância; **descartado** — não persistimos); (4) `GET /instance/connect/:name` → 200 **flat** `{pairingCode, code, base64}` com `base64` JÁ data URL pronta; (5) entrega de webhook com retry Axios confirmada (retry observado inclusive em 404); (6) `DELETE /instance/delete/:name` → 200 (usado para limpar os probes; a fatia NÃO expõe delete — D10/D5 mantidas).
> **Repositório:** sendflow-rebuild. **Branch:** `a1/contas-qr` (base `main` 1683559). **Autor:** A1 Backend. **Data:** 12/11/2026.
> **Variáveis só por nome:** nenhum segredo, token, senha, chave ou valor de variável aparece neste documento.
> **Fontes:** `docs/contracts/FATIA-02-CONTAS-CONTRATO.md` (herança de contas; D5 sem DELETE; D6 Content-Type; CTA-03), `docs/contracts/FATIA-06-PROJETOS-CONTRATO.md` (formato/estilo e padrões de teste), `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md` (§5.5 envelope, §7 migrações, §10 envs, §11 testes/gates, §13 deploy), `DEV/HANDOFF.md` (sessão 12/11: decisão D19, infra Evolution operacional), `docs/continuidade/05-MAPA-FUNCOES-182.md` (§INT + D19 12/11) e `07-STATUS-ATUAL.md`, `api/src/routes/accounts.ts` (código vigente da F2), **referência oficial OFFLINE da Evolution 2.3.7** em `C:/Users/ccpru/AppData/Local/Temp/opencode/evo/evolution-api` (`src/api/routes/instance.router.ts`, `src/api/controllers/instance.controller.ts`, `src/api/integrations/event/webhook/webhook.controller.ts`, `src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts`) — consultada sem rede e sem copiar código (D9).

---

## 0. Decisões do orquestrador — FIXAS, registram e vinculam esta fatia (12/11/2026)

Estas decisões (**D1–D10**) vieram do orquestrador com o pedido do contrato e **não são renegociáveis nesta fatia**; a numeração "D" destas é interna ao §0 (ver colisão documental da "D19 do dono" em §10).

> **R5 (parecer A4) — nota PERMANENTE de numeração:** para desambiguar da numeração global de decisões do dono, as decisões internas **D1..D10 deste §0 leem-se como "F7-D1..F7-D10"** em qualquer referência cruzada fora deste documento (ex.: F7-D3 = honestidade de estado; distinta da D19/D20/D21 da F6 e da D19 do dono de 12/11).

- **D1 — Provedor = Evolution API 2.3.7 self-hosted no Railway** (decisão do dono **D19 de 12/11/2026**, registrada em `05-MAPA-FUNCOES-182.md` §INT e `07-STATUS-ATUAL.md`): projeto Railway "grupos", serviço `evolution`, URL pública `https://evolution-production-34a7691a.up.railway.app` e interna `http://evolution.railway.internal:8080` (mesmo ambiente da `api`). **2.4.x proibido** (RC e exige licença). Infra já OPERACIONAL (smoke: `/` 200, `fetchInstances` 200 com apikey, 401 sem).
- **D2 — Vinculação 1:1 conta↔instância Evolution.** `instanceName` **determinístico**: `g-` + 8 primeiros hex do UUID da conta (ex.: conta `3fa85f64-…` → `g-3fa85f64`). **O prefixo de 32 bits NÃO garante unicidade por si; a coluna UNIQUE protege** (colisão de prefixo entre contas distintas → violação 23505 → `409 EVOLUTION_INSTANCE_TAKEN` no envelope padrão, nunca 500 cru — emenda R3 do parecer A4). A conta ganha colunas `evolution_instance_name` (**UNIQUE**), `phone`, `phone_jid` (§2).
- **D3 — `connection_status` passa a aceitar** `nao_conectada` (inicial) · `aguardando_qr` · `conectada` · `desconectada` · `banida`. Status muda **SOMENTE** a partir de resposta/webhook da Evolution (honestidade DIR-04). **Falha de chamada ao provedor → `502 EVOLUTION_UNAVAILABLE` SEM mutar status.**
- **D4 — Mapeamento de eventos:** `CONNECTION_UPDATE` com state `open` → `conectada` (+`phone`/`phone_jid` quando houver); `close` → `desconectada`; `close` com status 401/403 → `banida`. `QRCODE_UPDATED` → `aguardando_qr`. **QR NÃO persiste em banco** — o front busca em `GET /qr` (§4).
- **D5 — Endpoints novos** (todos com sessão, tenant por org_id da sessão): `POST /api/v1/accounts/:id/connect` (cria instância se não existir — **webhook por instância configurado no próprio create** (fato 2 do probe: não existe `webhook/set` na 2.3.7); chama connect; `200 {account, qrDataUrl}` — `qrDataUrl` = data URL pronta para `<img>`); `GET /api/v1/accounts/:id/qr` (`200 {qrDataUrl, connectionStatus}`; `409 ACCOUNT_CONNECTED` se já conectada; **`409 EVOLUTION_NOT_CONNECTED` se a conta nunca teve instância** — emenda R2 do parecer A4, sem chamar o provedor); `POST /api/v1/accounts/:id/disconnect` (logout na Evolution; `200 {account}`). Conta conectada → connect devolve `409 ACCOUNT_CONNECTED`. Account existente (GET/PATCH/lista) passa a expor `phone` e o `connectionStatus` **real**.
- **D6 — Webhook de entrada `POST /api/v1/webhooks/evolution` SEM sessão** — autentica pelo header `x-grupos-evo-secret` (valor = env `EVOLUTION_WEBHOOK_SECRET`; falta/erro → `401 EVOLUTION_WEBHOOK_SECRET_INVÁLIDO`). Resolve tenant pelo instanceName→conta (org_id da conta). Instância desconhecida → `204` com evento logado. Erro interno → `500`, mas **prefira `200` após validação** para não gerar storm de retry da Evolution (§5.4).
- **D7 — Migração 008 (+down):** colunas de D2; CHECK novo de D3 (down **normaliza** status fora do conjunto antigo para `'nao_conectada'` ANTES de estreitar o CHECK); tabela `integration_events` (id uuid, org_id, account_id nullable, event_type text, payload jsonb, received_at) para auditoria de **todos** os webhooks recebidos (§2).
- **D8 — Adaptador `api/src/providers/evolution/`** (client com `fetch`+apikey injetáveis; módulo de instância: create/connect/fetchInstances/logout/delete — **`setWebhook` NÃO existe na 2.3.7** (fato 2 do probe) e ficou de fora; o webhook por instância nasce no `create`; tipos puros; **função ÚNICA de redação** `redact.ts` — emenda R1; **ZERO fetch direto nas rotas**; rotas dependem do adaptador via injeção, para testes sem rede). Envs novas (só nomes no `.env.example`): `EVOLUTION_BASE_URL` (default `http://evolution.railway.internal:8080`), `EVOLUTION_API_KEY` (obrigatória para connect em produção; **vazia = provider desabilitado** e endpoints de conexão devolvem `503 EVOLUTION_NOT_CONFIGURED` com status intacto), `EVOLUTION_WEBHOOK_URL` (URL pública completa do endpoint D6, usada no `webhook` do create da instância), `EVOLUTION_WEBHOOK_SECRET`.
- **D9 — Referência oficial da Evolution 2.3.7 disponível OFFLINE** no clone `C:/Users/ccpru/AppData/Local/Temp/opencode/evo/evolution-api` (rotas: `src/api/routes/instance.router.ts`, DTOs em `src/api/dto/instance.dto.ts`, eventos em `src/api/integrations/`) — consulte lá, **NÃO use rede e NÃO copie código**.
- **D10 — Sem DELETE de conta** (D5 da Fatia 2 mantida); **disconnect ≠ excluir instância** (logout apenas; excluir instância Evolution fica para fatia futura).

### 0.1 Decisões técnicas REGISTRADAS por A1 (não são "D" do dono; A4 deve validar; nenhuma DEC do PM é decidida aqui)

1. **`evolution_instance_name` nasce NULL e só é gravada no primeiro `connect` bem-sucedido** (criação da instância no provedor). Preserva o CTA-03 da F2: **criar/editar conta continua sem criar ID externo** — o nome é determinístico, mas o vínculo só se materializa quando a instância de fato existe. POST/PATCH de accounts seguem rejeitando `evolutionInstanceName`/`phone`/`connectionStatus` como campos desconhecidos (400).
2. **`phone`/`phone_jid` são o último estado conhecido, nunca inventado:** preenchidos somente por resposta/webhook da Evolution (`phone` = parte local do JID do dono, ex.: `5511999999999`; `phone_jid` = JID completo, ex.: `5511999999999@s.whatsapp.net`). Persistem após `desconectada`/`banida` (último número conectado conhecido) e não são limpos nesta fatia.
3. **Respostas do provedor TAMBÉM contam como evidência de estado** (não só webhook): resposta de `connect` contendo QR → `aguardando_qr` (se não `conectada`); resposta de `fetchInstances`/`connect` com state `open` → `conectada` (+phone quando houver); sucesso do `logout` → `desconectada`; instância ausente no `fetchInstances` durante `disconnect` → `desconectada` (a conexão não existe mais no provedor). Isto é a leitura estrita de D3: **toda mutação de status tem origem em resposta ou webhook da Evolution** — nunca em suposição local.
4. **`disconnect` exige conta `conectada`**; senão `409 EVOLUTION_NOT_CONNECTED` (código novo, §4.5). A Evolution rejeita logout de instância não-conectada (400 "is not connected"); antecipar o 409 evita chamada inútil e mantém o erro no nosso envelope. Falha de chamada no logout → `502 EVOLUTION_UNAVAILABLE` sem mutar status.
5. **`POST /connect` aceita re-chamada** em `nao_conectada`/`aguardando_qr`/`desconectada`/`banida` (gera QR novo; a Evolution revalida a sessão e o webhook pode voltar a reportar `banida`). Somente `conectada` → `409 ACCOUNT_CONNECTED` (D5). Instância já existente no provedor **não** é recriada (fetchInstances decide; §6.3).
6. **`QRCODE_UPDATED` de limite de QR** (a Evolution envia `{message: "QR code limit reached…", statusCode…}` ao atingir `QRCODE_LIMIT`, configurado em 30 na infra) **não muda status** — apenas audita em `integration_events`; o usuário chama `connect` de novo para gerar sessão de QR nova. Registrado; sem estado intermediário extra (não inventar "expirado").
7. **`qrDataUrl: string | null`** nas respostas de connect/qr: a geração do QR na Evolution é assíncrona; na primeira chamada o QR pode ainda não existir. `null` é honesto (ainda não gerado) e o front resolve no polling de `GET /qr` (§12). Nenhuma rota "espera" (blocking) por ele.
8. **Redação obrigatória do campo `apikey` do payload de webhook por FUNÇÃO ÚNICA (emenda R1 do parecer A4):** a Evolution 2.3.7 **inclui a própria apikey global no corpo de todo webhook** (observado na referência offline e confirmado em produção). **Um único módulo** — `providers/evolution/redact.ts`, `redactEvolutionWebhookPayload()` — é usado em **TODOS** os call sites que tocam payload de webhook: persistência em `integration_events`, logs e mensagens de erro. `integration_events.payload` grava o payload com `apikey` removido e **`qrcode.{base64, code, pairingCode}` anulados** (o QR não persiste em nenhuma forma — nem a imagem ~13KB nem o token de pareamento "2@…" — D4; emenda da implementação); logs idem (ENG-09). `destination`/`server_url`/`sender` não são segredos e permanecem. O teste T8 captura stdout/stderr com valor-marker sintético no campo `apikey` (e no `qrcode.code`) e prova que ele não aparece em lugar nenhum.
9. **Eventos fora de {`CONNECTION_UPDATE`, `QRCODE_UPDATED`}** que chegarem ao webhook: auditados em `integration_events` e respondidos `200`, **sem** mudar nada (o `webhook` do create da instância pede só os 2 eventos — §6.3 — mas a deriva de configuração não pode virar 500/storm).
10. **Sem rate limit novo** (herança F2 §5): endpoints autenticados org-scoped; o webhook autentica por secret de alta entropia (recomendação ≥32 chars em §13). Declarado; revisar se o tráfego real pedir.
11. **GET /qr de conta SEM instância Evolution (nunca conectada, `evolution_instance_name` NULL) → `409 EVOLUTION_NOT_CONNECTED` SEM chamar o provedor** (emenda R2 do parecer A4 — simétrico ao `409 ACCOUNT_CONNECTED` e ao 409 do disconnect): sem instância não há QR a buscar; a resposta é honesta e não gera chamada inútil ao provedor. Reutiliza o código de §0.1.4 (sem código novo — §4.5).

---

## 1. IDs do PM — cobertos e pulados

| ID | Requisito (síntese do mapa) | Situação | Base / motivo |
|---|---|---|---|
| **GRP-CTA-06** | Conectar número via fluxo do provedor (destravado p/ Evolution 2.3.7 pela D19). | **A CONTRATAR (backend)** | `POST /accounts/:id/connect` + `GET /accounts/:id/qr` + `POST /accounts/:id/disconnect` (D5). Fluxo = **QR code** (sem pairing code; sem Embedded Signup — INT-01 SUBSTITUÍDO). |
| **GRP-CTA-02** (resto) | Indicador de status da conta **vem de estado real**; sem integração = "não conectada", nunca "online" falso. | **A CONTRATAR (parcial final)** | `connection_status` com os 5 estados de D3, mutável somente por evidência do provedor (D3). Avatar segue fora de escopo (F2 §1). |
| **GRP-CTA-05** | Alerta "Desconectadas nas últimas 24h" (só eventos reais). | **PULADO (substrato entregue)** | Esta fatia cria o evento real (`integration_events` + `desconectada`), mas **janela/agregação/exibição** do alerta não têm amarra contratada — decisão futura (§10). |
| **GRP-INT-01** (SUBSTITUÍDO) | Caminho de integração = QR Evolution (D19). | **PARCIAL nesta fatia** | Aqui entra a **conexão** (instância, QR, estado, webhook de conexão). Envio de mensagens, grupos e demais capacidades da instância ficam para as fatias (c)–(f) do plano D19. |
| **GRP-WHE-01** (substrato) | Webhooks de entrada (Evolution destravou). | **SUBSTRATO desta fatia** | Endpoint `POST /api/v1/webhooks/evolution` + `integration_events` cobrem **apenas eventos de conexão/QR**; webhooks de mensagem/anti-spam/métricas = fatias futuras. |

**Fora de escopo declarado (não construir, mesmo que "pareça fácil"):** envio de mensagens e qualquer operação de WhatsApp além de conectar/desconectar/ler estado; grupos reais; eventos `MESSAGES_*`/`CONTACTS_*`/`GROUPS_*` (audit-and-ignore no webhook, §5); **excluir instância Evolution** (D10 — fatia futura); **DELETE de conta** (D5 da F2 mantida); pairing code (só QR); busca de contas por telefone (busca continua só por nome — F2 §3.2); avatar real; alerta 24h (CTA-05, §10); migração de dados legados do localStorage; sincronização periódica automática além de connect/qr/webhook; rate limit novo; painel/observabilidade de webhooks.

---

## 2. Modelo de dados — migração `008_accounts_evolution`

Arquivos: `api/src/db/migrations/008_accounts_evolution.up.sql` + `008_accounts_evolution.down.sql` (comentários SQL em **ASCII puro** — lição WIN1252, Fundação §16.8). Convenções herdadas: UUID com `gen_random_uuid()`, `timestamptz` UTC, `updated_at` mantido pela aplicação, runner transacional com checksum.

```sql
-- 008_accounts_evolution.up.sql
-- D7: colunas de vinculo Evolution + CHECK novo de D3 + auditoria de webhooks.

-- DROP dual-name (emenda pos-probe 12/11): o PostgreSQL real nomeia o CHECK
-- inline da 004 como accounts_connection_status_check; o pg-mem chama-o
-- accounts_constraint_1 (probe offline confirmou - ver 2.1.1). Um dos dois
-- e sempre no-op por IF EXISTS.
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_connection_status_check;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_constraint_1;
ALTER TABLE accounts ADD CONSTRAINT accounts_connection_status_check
  CHECK (connection_status IN ('nao_conectada','aguardando_qr','conectada','desconectada','banida'));

-- D2: nome deterministico 'g-' + 8 primeiros hex do uuid da conta; gravado
-- apenas no primeiro connect (criacao real da instancia). UNIQUE global:
-- o namespace de instancias da Evolution e global; o prefixo de 32 bits NAO
-- garante unicidade por si - a UNIQUE protege (colisao 23505 -> 409 de
-- envelope na API, ver 2.1.2). Multiplos NULLs sao validos no PostgreSQL
-- (contas nunca conectadas).
ALTER TABLE accounts ADD COLUMN evolution_instance_name text NULL UNIQUE;
ALTER TABLE accounts ADD COLUMN phone text NULL;
ALTER TABLE accounts ADD COLUMN phone_jid text NULL;

-- D7: auditoria de TODOS os webhooks recebidos (inclusive instancia
-- desconhecida: org_id/account_id NULL). payload jsonb SEM o campo apikey
-- e COM qrcode.base64 anulada (redacao obrigatoria - ver contrato 5.3).
CREATE TABLE integration_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  account_id  uuid NULL REFERENCES accounts (id) ON DELETE RESTRICT,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX integration_events_org_received_idx ON integration_events (org_id, received_at);

-- 008_accounts_evolution.down.sql
-- REVERSIVEL NO SCHEMA, NAO NOS DADOS (ver 8): perde auditoria, status real,
-- phone e vinculo de instancia. Normaliza ANTES de estreitar o CHECK (D7).
-- DROP do pkey antes do DROP TABLE: limpa CONSTRAINT FANTASMA do pg-mem
-- (padrao 004-007); no PostgreSQL real e no-op.
DROP INDEX IF EXISTS integration_events_org_received_idx;
ALTER TABLE integration_events DROP CONSTRAINT IF EXISTS integration_events_pkey;
DROP TABLE IF EXISTS integration_events;

UPDATE accounts SET connection_status = 'nao_conectada'
 WHERE connection_status <> 'nao_conectada';
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_connection_status_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_connection_status_check
  CHECK (connection_status IN ('nao_conectada'));

ALTER TABLE accounts DROP COLUMN IF EXISTS evolution_instance_name;
ALTER TABLE accounts DROP COLUMN IF EXISTS phone;
ALTER TABLE accounts DROP COLUMN IF EXISTS phone_jid;
```

### 2.1 Decisões técnicas do modelo

1. **CHECK trocado por DROP+ADD com nome explícito** (`accounts_connection_status_check`, nome default do PostgreSQL para o CHECK inline da 004): o `IF EXISTS` protege o up se o nome divergir; **se o nome divergir e o DROP silenciosamente não rodar, o CHECK antigo estreito faz os testes falharem imediatamente** (inserção de `aguardando_qr` recusada) — falha alta e visível, não silenciosa (risco declarado §9.6). **Achado do probe offline (12/11, emenda da implementação):** o pg-mem **enforce** CHECK e nomeia o inline da 004 como `accounts_constraint_1` — por isso o up/down fazem **DROP dual-name** (`accounts_connection_status_check` para o PG real e `accounts_constraint_1` para o pg-mem; o que não existe é no-op por `IF EXISTS`). Verificado: após o up, os 5 valores passam e valor inválido é recusado nos DOIS motores; após o down, o CHECK estreito volta a recusar.
2. **`evolution_instance_name text NULL UNIQUE` (global, não por org):** o namespace de instâncias da Evolution é global e o prefixo de 32 bits **não** garante ausência de colisão entre orgs por si só — a restrição materializa no banco o resolutor do webhook (instanceName → **uma** conta → org_id) e **protege contra colisão de prefixo**: violação (23505, confirmado com `code` no pg-mem e no PG real) é mapeada pela API para **`409 EVOLUTION_INSTANCE_TAKEN` no envelope padrão** — nunca 500 cru (emenda R3 do parecer A4). PostgreSQL aceita múltiplos NULL (contas nunca conectadas).
3. **`integration_events` aceita org_id/account_id NULL** para auditar eventos de instância desconhecida (D6: "204 com evento logado") sem violar FK. `account_id` sem índice próprio nesta fatia (volume inicial desprezível; `org_id+received_at` sustenta a consulta futura do CTA-05). **Sem retenção/limpeza nesta fatia** — pendência §10.
4. **`payload jsonb NOT NULL` sempre redigido pela FUNÇÃO ÚNICA** (`providers/evolution/redact.ts` — emenda R1): o payload cru contém a apikey global da Evolution; gravar/logar sem redação seria vazamento de segredo (ENG-09). Redação = **remover o campo `apikey`** (em qualquer profundidade) e **anular `qrcode.{base64, code, pairingCode}`** (o QR não persiste em nenhuma forma, D4) antes de serializar — em TODO call site (persistência, logs, mensagens de erro).

---

## 3. Recursos e estados

### 3.1 Forma do recurso account (JSON camelCase; resposta flat — F2 §3.1 mantida, +2 campos de leitura)

```json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "isSpy": false,
  "connectionStatus": "nao_conectada",
  "phone": null,
  "createdAt": "ISO-8601 UTC (ex.: 2026-11-12T12:00:00.000Z)",
  "updatedAt": "ISO-8601 UTC"
}
```

- `connectionStatus`: **sempre real** (D3) — um dos 5 valores de §3.2; nunca aceito em entrada (POST/PATCH de accounts seguem `additionalProperties: false`; `connectionStatus`/`phone`/`evolutionInstanceName` no body → `400 VALIDATION_ERROR`).
- `phone`: `string | null` — último número conectado conhecido (§0.1.2); deriva de resposta/webhook da Evolution; `null` até a primeira conexão.
- **`evolutionInstanceName` NÃO é exposto no recurso** (ID externo/infraestrutura; CTA-03/F2 seguem — o front não precisa dele para nada).
- Shape vale para POST create, GET lista (`items[]`), GET/:id, PATCH e para o `account` embutido nas respostas de connect/disconnect.

### 3.2 Estados de conexão — semântica, origem e transições permitidas

| Valor | Significado honesto | Origem da mutação (única) | Cor/rótulo sugeridos à A2 (§12) |
|---|---|---|---|
| `nao_conectada` | Nunca conectada ou sem qualquer evidência de provedor | Estado inicial (default da coluna); **nenhuma rota/webhook escreve este valor** — só o down da migração e a criação da conta | cinza — "Não conectada" |
| `aguardando_qr` | Provedor gerou QR; ninguém leu ainda | `QRCODE_UPDATED` (webhook) **ou** resposta de connect/qr contendo QR (§0.1.3) | amarelo — "Aguardando leitura do QR" |
| `conectada` | Sessão aberta no provedor (número autenticado via QR) | `CONNECTION_UPDATE` state `open` **ou** resposta do provedor com state `open` (+phone/phone_jid quando houver) | verde — "Conectada" |
| `desconectada` | Sessão caiu ou logout feito | `CONNECTION_UPDATE` `close` (sem 401/403) **ou** sucesso do logout / instância ausente no disconnect (§0.1.3) | laranja/vermelho — "Desconectada" |
| `banida` | Provedor reportou 401/403 (sessão morta/número banido) | `CONNECTION_UPDATE` `close` com status 401/403 (D4) | vermelho — "Banida" |

**Máquina de estados (informativa):** qualquer estado → `aguardando_qr`/`conectada`/`desconectada`/`banida` conforme evidência do provedor; `nao_conectada` é alcançável apenas por criação (e pelo down da 008). `updated_at` anda em toda mutação de status/phone (aplicação). **QR code nunca é gravado** em nenhuma tabela (D4; teste T8).

---

## 4. Endpoints autenticados (sessão obrigatória; prefixo `/api/v1`; tenant por org_id da sessão)

Rotas novas em `api/src/routes/accounts.ts` (extensão declarada) — herdam `requireAuth` (401 `AUTH_UNAUTHENTICATED` sem sessão), guard de Content-Type `application/json` em TODA mutação (D6/F2 §3.5, `preParsing`), envelope de erro único (Fundação §5.5), 404 `TENANT_FORBIDDEN` genérico byte a byte para :id alheio/inexistente e 400 para :id malformado (F2 §4 — idêntico, nada redefine).

### 4.1 Tabela de endpoints novos

| Método/rota | Entrada | Sucesso | Efeitos e regras |
|---|---|---|---|
| `POST /api/v1/accounts/:id/connect` | sem body (CT json exigido) | `200 {account, qrDataUrl}` | **Algoritmo:** (1) conta da org por :id (senão 404/400 como F2); (2) `connectionStatus='conectada'` → `409 ACCOUNT_CONNECTED`; (3) provider desabilitado (`EVOLUTION_API_KEY` vazia) → `503 EVOLUTION_NOT_CONFIGURED` **sem mutar nada**; (4) instanceName determinístico (D2); se a instância não existe (fetchInstances) → **cria** (integration `WHATSAPP-BAILEYS`, `qrcode:true` e **webhook por instância no próprio create** — URL/env + secret header + eventos CONNECTION_UPDATE/QRCODE_UPDATED, §6.3; NÃO existe `webhook/set` na 2.3.7 — fato 2 do probe), gravando `evolution_instance_name` na conta (§0.1.1; colisão 23505 → `409 EVOLUTION_INSTANCE_TAKEN`, §2.1.2/R3); (5) chama connect e devolve o QR; (6) muta status conforme evidência da resposta (§0.1.3). Falha de chamada ao provedor → `502 EVOLUTION_UNAVAILABLE` sem mutar status (D3). Re-chamada em não-conectada re-executa e gera QR novo (§0.1.5). |
| `GET /api/v1/accounts/:id/qr` | — | `200 {qrDataUrl, connectionStatus}` | Conta da org; `conectada` → `409 ACCOUNT_CONNECTED` (D5); **conta SEM instância (`evolution_instance_name` NULL, nunca conectada) → `409 EVOLUTION_NOT_CONNECTED` SEM chamar o provedor (emenda R2)**; provider desabilitado → `503 EVOLUTION_NOT_CONFIGURED`. Com instância: pede o QR **vigente** ao provedor (adaptador connect — devolve o QR corrente sem recriar sessão); QR ainda não gerado → `qrDataUrl: null` (§0.1.7). Resposta com QR conta como evidência → `aguardando_qr` (se não `conectada`). Falha do provedor → `502 EVOLUTION_UNAVAILABLE` (status intacto). **Sem persistência de QR.** |
| `POST /api/v1/accounts/:id/disconnect` | sem body (CT json exigido) | `200 {account}` | Requer `connectionStatus='conectada'`; senão `409 EVOLUTION_NOT_CONNECTED` (§0.1.4). Logout na Evolution (adaptador); sucesso → `desconectada`; instância ausente no provedor → `desconectada` (§0.1.3); falha de chamada → `502 EVOLUTION_UNAVAILABLE` sem mutar status. **NÃO exclui a instância** (D10). `phone`/`phone_jid` permanecem (§0.1.2). |

### 4.2 Mudanças em endpoints existentes de accounts (declaradas)

| Endpoint | Mudança |
|---|---|
| `GET /api/v1/accounts` (lista) e `GET /api/v1/accounts/:id` | Recurso passa a incluir `phone` (§3.1) e `connectionStatus` real. Nenhuma query param nova. |
| `POST /api/v1/accounts` / `PATCH /api/v1/accounts/:id` | **Comportamento inalterado** (CTA-03 preservado, §0.1.1): continuam sem criar vínculo/ID externo; body desconhecido (`phone`, `connectionStatus`, `evolutionInstanceName`) segue → 400. Respostas incluem os campos novos de leitura. |

### 4.3 Validações (herdadas + novas)

| Campo/param | Regra | Erro |
|---|---|---|
| `:id` (todas as rotas novas) | UUID (regex produto F2); malformado → 400; bem-formado alheio/inexistente → 404 genérico | `400 VALIDATION_ERROR` / `404 TENANT_FORBIDDEN` |
| body de connect/disconnect | **ausente/vazio** (rota sem schema de body; nada é lido); CT ≠ `application/json` (ou header ausente) → 400 fields `content-type` (guard D6 uniforme) | `400 VALIDATION_ERROR` |
| `org_id`/status/phone em qualquer entrada | nunca confiados (não são parâmetros destas rotas) | — |

### 4.4 Honestidade do estado (D3 — regra central, testada em T5/T9)

Nenhuma rota escreve `connection_status` por decisão própria: **toda escrita carrega a evidência** (resposta do provedor no mesmo request, ou webhook processado). Falha de rede/tempo/5xx da Evolution → `502 EVOLUTION_UNAVAILABLE` **e nenhuma coluna muda** (oráculo SQL no teste). Provider desabilitado → `503 EVOLUTION_NOT_CONFIGURED` idem. Este é o cumprimento literal de DIR-04 para CTA-02/06.

### 4.5 Códigos de erro NOVOS (envelope Fundação §5.5; literatura para A4/A2)

| Código | HTTP | Quando | Corpo |
|---|---|---|---|
| `ACCOUNT_CONNECTED` | 409 | connect ou GET /qr em conta já `conectada` (D5) | envelope, mensagem fixa genérica |
| `EVOLUTION_NOT_CONNECTED` | 409 | disconnect em conta não-`conectada` (§0.1.4) **ou GET /qr em conta sem instância Evolution** (emenda R2 — sem chamar o provedor) | idem |
| `EVOLUTION_INSTANCE_TAKEN` | 409 | violação da UNIQUE de `evolution_instance_name` (colisão de prefixo 32 bits entre contas — §2.1.2, emenda R3) | idem |
| `EVOLUTION_UNAVAILABLE` | 502 | falha de chamada ao provedor (rede/timeout/5xx/401 da Evolution contra a apikey) — **status intacto** | idem |
| `EVOLUTION_NOT_CONFIGURED` | 503 | `EVOLUTION_API_KEY` vazia (provider desabilitado, D8) — **status intacto** | idem |
| `EVOLUTION_WEBHOOK_SECRET_INVÁLIDO` | 401 | webhook sem/errado `x-grupos-evo-secret` (D6; nome literal com acento — a A2 compara a string exata) | idem |

Nenhum código existente muda. `INTERNAL_ERROR` permanece o catch-all.

---

## 5. Webhook de entrada — `POST /api/v1/webhooks/evolution` (SEM sessão; D6)

Rota nova em `api/src/routes/webhooks/evolution.ts` (registro em `app.ts` declarado). **Sem `requireAuth`** — chamada servidor-a-servidor pela Evolution. CORS inalterado (a rota não é consumida por browser; origens exatas seguem).

### 5.1 Autenticação e ordem de checagens

1. **Header `x-grupos-evo-secret`** comparado ao env `EVOLUTION_WEBHOOK_SECRET` (comparação em tempo constante). Ausente/errado, **ou env vazia/não configurada** (toda requisição é inválida) → `401 EVOLUTION_WEBHOOK_SECRET_INVÁLIDO`. Nota (corrigida pelo fato 5 do probe em produção): o retry da Evolution **foi observado inclusive para 404** — a alegação original de "400/401/403/404/422 não-retryáveis" **não deve ser presumida**; por isso a política de resposta é `200 {}` pós-validação e `401/400` apenas ANTES de qualquer efeito (sem storm — ver §5.4/§9.4).
2. **Content-Type `application/json`** (guard D6 uniforme; a Evolution sempre posta JSON) → senão `400 VALIDATION_ERROR` (também não-retryável).
3. **Schema mínimo do body:** `{event: string, instance: string, …}` — `event` e `instance` obrigatórios/string (o payload real traz `destination`, `date_time`, `sender`, `server_url`, `apikey` e `data`; campos extras são **aceitos**, nunca rejeitados); violação → `400 VALIDATION_ERROR`.

### 5.2 Resolução de tenant e processamento (D4/D6)

1. Resolve a conta por `evolution_instance_name = body.instance` (UNIQUE global, §2.1.2) → `org_id` da conta. **Nada do body é confiado para tenant** (ENG-02).
2. **Instância desconhecida:** grava `integration_events` (org/account NULL, `event_type='UNKNOWN_INSTANCE'`, payload redigido) e responde **`204` sem corpo** (evento logado, D6).
3. **Instância conhecida:** grava `integration_events` (org_id/account_id da conta, `event_type=event`, payload redigido) e aplica o mapeamento D4 (tabela §5.3) mutando `connection_status`/`phone`/`phone_jid`/`updated_at` na conta — **write only com evidência**.
4. Responde **`200` com corpo `{}`** após validação (D6: preferir 200; erros internos de processamento pós-validação são logados + auditados e **não** viram resposta de erro; falha catastrófica pode virar `500` — a Evolution retry até 10× com backoff exponencial 5s→300s, declarado §9.4).

### 5.3 Mapeamento de eventos (D4; shapes observados na referência OFFLINE 2.3.7 — D9)

Envelope que a Evolution POSTa (webhook local por instância): `{event, instance, data, destination, date_time, sender, server_url, apikey}` — **`apikey` é a chave global da Evolution e DEVE ser redigida** (§0.1.8) antes de logar/persistir.

| Evento | `data` (forma esperada — lida defensivamente) | Efeito no estado |
|---|---|---|
| `CONNECTION_UPDATE` | `{instance, state: 'open'\|'close'\|'connecting'\|'refused', statusReason?: number, wuid?: string, profileName?, profilePictureUrl?}` | `open` → `conectada` (+ `phone_jid = wuid`, `phone` = parte local do JID sem sufixo, quando `wuid` presente); `close` → `desconectada`; `close` com `statusReason` **401 ou 403** → `banida`; `connecting`/outros → sem mudança (audit only). Campos ausentes/inesperados não quebram o processamento (leitura defensiva, `unknown` + guards). |
| `QRCODE_UPDATED` | `{qrcode: {instance, pairingCode, code, base64}}` (base64 = data URL pronta) **ou** `{message: "QR code limit reached…", statusCode}` | Com `qrcode.base64` → `aguardando_qr` (**QR NÃO persiste** — D4). Com `message` de limite → **sem mudança de status** (§0.1.6). Ambos auditados. |
| qualquer outro | — | audit only + `200` (§0.1.9) |

### 5.4 Políticas de resposta (resumo; justificativa D6)

| Caso | Status |
|---|---|
| Secret ausente/inválido | `401 EVOLUTION_WEBHOOK_SECRET_INVÁLIDO` (emitido ANTES de qualquer efeito; retry presumível — ver nota §5.1) |
| Body não-JSON / sem `event`/`instance` string | `400 VALIDATION_ERROR` (idem: antes de qualquer efeito) |
| Instância desconhecida (auditada) | `204` sem corpo |
| Processado (auditado; com ou sem mudança de estado) | `200` corpo `{}` |
| Falha catastrófica pós-validação | `500 INTERNAL_ERROR` (aceito; Evolution retry — evitar por design: gravar auditoria/estado em caminho com try/catch que loga e segue) |

---

## 6. Adaptador de provedor — `api/src/providers/evolution/` (D8)

### 6.1 Layout e regra de dependência

```
api/src/providers/evolution/
  client.ts    # HTTP fino: fetch injetável (fetchImpl, baseUrl, apikey), timeouts, erros tipados
  instance.ts  # modulo de instancia: create / connect / fetchInstances / logout / delete
               # (setWebhook NAO EXISTE na 2.3.7 - fato 2 do probe; webhook nasce no create)
  redact.ts    # FUNCAO UNICA de redacao do payload de webhook (emenda R1): remove
               # `apikey` (qualquer profundidade) e anula `qrcode.base64`; usada em
               # TODOS os call sites (persistencia, logs, mensagens de erro)
  types.ts     # tipos puros (request/response da Evolution 2.3.7 mapeados p/ tipos nossos)
```

- **ZERO `fetch` direto nas rotas/handlers** (D8): rotas recebem o adaptador **por injeção** (`AppContext` ganha `evolution: EvolutionProvider | null` — `null` quando desabilitado por env), e os testes injetam um **provider falso sem rede** (§7 T2). O client é o único ponto com rede; `fetchImpl` injetável permite teste unitário do client também sem rede.
- Erros do adaptador são **tipos nossos** (`EvolutionUnavailableError`, `EvolutionAuthError` etc. em `types.ts`) — as rotas traduzem para `EVOLUTION_UNAVAILABLE`/502; **nunca** deixam vazar corpo/URL/chave da Evolution para a resposta (mensagem fixa genérica; detalhes só em log sem segredos).
- `delete` fica **presente no módulo** (D8 lista) mas **sem consumidor nesta fatia** (D10) — deletar instância é fatia futura.

### 6.2 Rotas da Evolution 2.3.7 usadas (fonte: referência offline D9 + **fatos 1–4 validados em produção** — não copiar código)

| Operação (módulo `instance.ts`) | Rota Evolution 2.3.7 | Observações (referência + probe) |
|---|---|---|
| create | `POST /instance/create` | body `{instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS', webhook: {enabled:true, url: EVOLUTION_WEBHOOK_URL, byEvents:false, events:['CONNECTION_UPDATE','QRCODE_UPDATED'], base64:false, headers:{'x-grupos-evo-secret': EVOLUTION_WEBHOOK_SECRET}}}` (o campo `webhook` é a ÚNICA forma de configurar webhook por instância na 2.3.7 — fato 2; header custom validado em produção). 201 com `{instance:{instanceName, instanceId, integration, status:'connecting'}, hash, webhook}` (fato 3) — o adaptador lê apenas `instance.{instanceName, instanceId, status}` e **descarta `hash`** (token por instância; nunca persistido). Sem `"integration":"WHATSAPP-BAILEYS"` → 400 "Invalid integration" (fato 1). Se já existir → erro 400/409 (o fluxo pergunta antes com fetchInstances; create nunca é chamado "por cima"). |
| connect | `GET /instance/connect/:instanceName` | devolve o QR corrente. **Fato 4 (produção): 200 flat `{pairingCode:null, code:"2@…", base64:"data:image/png;base64,…"}` (~13 KB) — `base64` JÁ é data URL pronta para `<img>`.** Na referência: state `open` devolve `{instance:{instanceName, state}}` (connectionState); `close` reconecta e devolve o QR. O adaptador normaliza defensivamente os 3 shapes (flat QR / `{instance:{state}}` / `{qrcode:{base64}}`) para `{state, qrDataUrl \| null}`. |
| fetchInstances | `GET /instance/fetchInstances` (query `instanceName`) | header `apikey` global; array com `connectionStatus`/`ownerJid`/`number`… — o adaptador lê **apenas** o que o contrato usa e **descarta `token`/`hash`** (nunca persistidos). Vazio (ou 404 da referência) = instância inexistente. |
| logout | `DELETE /instance/logout/:instanceName` | 200 `{status:'SUCCESS'…}`; 400 se não conectada (antecipado pelo 409 nosso, §0.1.4). |
| delete | `DELETE /instance/delete/:instanceName` | 200 (fato 6); **sem consumidor nesta fatia** (D10). |

### 6.3 Variáveis de ambiente (nomes → uso; valores NUNCA no repo — só nomes no `api/.env.example`)

| Nome | Uso |
|---|---|
| `EVOLUTION_BASE_URL` | Base do adaptador. Default `http://evolution.railway.internal:8080` (rede interna Railway — D1/D8). Em dev local apontar para a URL pública do serviço `evolution` (a interna não é alcançável fora do Railway). |
| `EVOLUTION_API_KEY` | Apikey global da Evolution (header `apikey`). **Vazia = provider desabilitado** → endpoints de conexão `503 EVOLUTION_NOT_CONFIGURED`, status intacto (D8). Obrigatória para connect em produção (fail-soft no boot, erro claro no request). |
| `EVOLUTION_WEBHOOK_URL` | URL **pública completa** do endpoint D6 (ex.: `https://<api-publica>/api/v1/webhooks/evolution`) — usada no campo `webhook` do **create** de cada instância (não existe `webhook/set` na 2.3.7 — fato 2). |
| `EVOLUTION_WEBHOOK_SECRET` | Segredo do header `x-grupos-evo-secret` (autentica o webhook D6 e é configurado na instância no create, em `webhook.headers`). Recomendação: ≥32 chars aleatórios (§13). |

Mapeamento de envs em `config.ts` (nomes lidos igual às existentes); `AppContext` recebe o provider já construído (ou `null`). Nenhuma outra env muda.

---

## 7. Testes dirigidos (suíte offline pg-mem; fixtures 2 tenants; herda helpers F1/F2)

Arquivos: `api/test/accountsConnection.test.ts`, `api/test/evolutionWebhook.test.ts`, `api/test/evolutionAdapter.test.ts` (+ ajustes DECLARADOS em `accounts.test.ts` e `migrations.test.ts` — T13). Todos via `fastify.inject()`, sem porta/rede/Docker; **adaptador falso injetado** (nenhum teste toca rede — D8); dados 100% sintéticos; org A + dono A e org B + dono B com os dois cookies.

| # | Caso | Esperado |
|---|---|---|
| T1 | **Connect feliz (CTA-06):** conta nova → POST connect → `200` com shape `{account, qrDataUrl}` (account com `phone:null`, `connectionStatus:'aguardando_qr'`); oráculo SQL: `evolution_instance_name = 'g-'+hex8(id)` gravado, status `aguardando_qr`; **colisão forçada da UNIQUE** (fixture com outra conta já usando o prefixo) → `409 EVOLUTION_INSTANCE_TAKEN` (R3); conta já conectada → connect `409 ACCOUNT_CONNECTED`; conta com instância já existente (fetchInstances acha) → **sem** create novo, connect reutiliza. (O corpo do create com `integration:'WHATSAPP-BAILEYS'` + `webhook` completo — URL/envs/secret/eventos — é provado no T2 contra o client unitário, único ponto que o constrói — fato 2.) | conformidade exata de shape/status |
| T2 | **Adaptador sem rede (D8):** provider falso injetado em todos os testes de rota; teste unitário do client com `fetchImpl` falso: mapeia respostas 2.3.7 (create — incluindo body com `integration:'WHATSAPP-BAILEYS'`, `qrcode:true` e `webhook` completo; connect nos 3 shapes; fetchInstances; logout; delete) para os tipos nossos; `hash`/`token` descartados; 404 do fetchInstances → `[]`; erro de rede/timeout/5xx → `EvolutionUnavailableError`; 401 → `EvolutionAuthError`; **grep-ável: nenhuma rota importa/chama fetch** (assert de estrutura no teste). | zero rede; erros tipados |
| T3 | **GET /qr:** conta `aguardando_qr` → `200 {qrDataUrl, connectionStatus}` (data URL sintética do falso); QR ainda não gerado → `qrDataUrl:null`; conta `conectada` → `409 ACCOUNT_CONNECTED`; **conta sem instância (nunca conectada) → `409 EVOLUTION_NOT_CONNECTED` SEM chamada ao provedor (R2 — oráculo: nenhuma chamada registrada no falso)**; **oráculo: nenhuma tabela guarda QR** (nem accounts nem integration_events contêm `data:image`); falha do provedor → `502 EVOLUTION_UNAVAILABLE` **e status anterior preservado** (oráculo). | QR efêmero; honestidade |
| T4 | **Disconnect (D10):** conta `conectada` → POST disconnect `200 {account}` com `connectionStatus:'desconectada'`, `phone`/`phone_jid` **preservados** (oráculo), adaptador recebeu **logout e NÃO delete**; conta não-conectada → `409 EVOLUTION_NOT_CONNECTED`; instância ausente no fetchInstances do disconnect → `desconectada` (200); falha do provedor → `502` sem mutação. | logout ≠ excluir |
| T5 | **Honestidade DIR-04 (D3 dirigido):** para TODA rota de conexão com provider em falha (connect/qr/disconnect) e provider desabilitado (`EVOLUTION_API_KEY` vazia → `503 EVOLUTION_NOT_CONFIGURED`): snapshot SQL antes/depois — `connection_status`/`phone`/`phone_jid`/`evolution_instance_name` **idênticos**; nenhuma mutação sem evidência. | estado nunca inventado |
| T6 | **Webhook secret (D6):** POST /api/v1/webhooks/evolution sem header → `401 EVOLUTION_WEBHOOK_SECRET_INVÁLIDO`; secret errado → 401; secret certo → processa; env vazia → 401; body não-JSON → `400` (guard CT); body sem `event`/`instance` → `400`; **401/404/400 não processam nada** (oráculo: integration_events inalterada). | auth do webhook |
| T7 | **Webhook estado real (D4):** CONNECTION_UPDATE `open` com wuid → conta `conectada`, `phone`/`phone_jid` corretos (oráculo), evento auditado com org/account; `close` → `desconectada`; `close` com statusReason 401 e 403 → `banida`; QRCODE_UPDATED com base64 → `aguardando_qr` **e QR não persiste**; QRCODE_UPDATED de limite → status inalterado + auditado; evento desconhecido (ex.: `MESSAGES_UPSERT`) → `200` audit only; respostas: `200 {}` processado, `204` instância desconhecida (audit com org NULL). | mapeamento literal |
| T8 | **Redação (ENG-09, emenda R1):** payload de webhook com `apikey` **valor-marker sintético** no corpo → linha em `integration_events` **sem** `apikey` (oráculo SQL: campo ausente no jsonb) e **sem** `qrcode.base64` (sem `data:image`); **stdout/stderr capturados durante o teste não contêm o marker** (nenhum log/log de erro vazia a chave); a resposta também não contém o marker. | segredo não vaza |
| T9 | **Isolamento tenant via instanceName (TEN-01):** instância `g-hex8(idA)` resolve SEMPRE para a conta A/org A: webhook da instância de A não altera NENHUMA conta de B (snapshot); connect/qr/disconnect de B apontando :id de A → `404 TENANT_FORBIDDEN` byte a byte igual ao de UUID inexistente; `:id` malformado → 400; segunda conta na org A com QR próprio → instâncias distintas (determinismo D2). | instância ≡ conta ≡ org |
| T10 | **Recurso atualizado:** GET lista/`:id`/POST/PATCH de accounts expõem `phone` e `connectionStatus` reais (fixture com conta conectada); POST/PATCH com `phone`/`connectionStatus`/`evolutionInstanceName` no body → `400` (CTA-03 segue); criar conta **não** grava `evolution_instance_name` (NULL — §0.1.1) nem cria instância (adaptador falso não recebeu create). | CTA-03 preservado |
| T11 | **Migração (MIG-01):** up → status (8 aplicadas) → up idempotente → **down (008):** contas com status reais são normalizadas para `nao_conectada` ANTES do CHECK estreito (o down roda sem erro com dados nos 5 estados — fixture), colunas `evolution_instance_name`/`phone`/`phone_jid` ausentes, `integration_events` ausente, demais 7 migrações intactas → up re-aplica (UNIQUE aceita múltiplos NULL). | reversível no schema |
| T12 | **Content-Type guard (D6 herdado):** connect e disconnect com `text/plain`/`application/x-www-form-urlencoded`/sem header → `400 VALIDATION_ERROR` fields `content-type`; `application/json; charset=utf-8` aceito; webhook com `text/plain` → 400. | guard uniforme |
| T13 | **Regressão (REG-01) — inventário nominal:** suíte integral vigente (**98 casos em 9 arquivos** no fechamento da F6: accounts, auth, groups, health, migrations, projects, ratelimit, releases, tenant) roda sem regressão junto com os arquivos novos; gates §11 após o último diff. **Ajustes DECLARados (consequência direta da fatia, não regressão):** (i) `migrations.test.ts`: 7→8 migrações (down-1 passa a reverter 008); (ii) `accounts.test.ts`: conjunto de tabelas do T5-análogo 9→10 incluindo `integration_events`; recursos esperados ganham `phone` (asserts de shape atualizados). | sem regressão; ajustes listados |
| T14 | **Envelope de erro padrão:** todos os erros novos (ACCOUNT_CONNECTED, EVOLUTION_NOT_CONNECTED, EVOLUTION_UNAVAILABLE, EVOLUTION_NOT_CONFIGURED, EVOLUTION_INSTANCE_TAKEN, EVOLUTION_WEBHOOK_SECRET_INVÁLIDO) respondem `{error:{code,message}}` da Fundação §5.5; mensagens fixas genéricas; sem detalhe de rede/URL/chave. | envelope em 100% dos erros |

**Smoke E2E (orquestrador, ambiente autorizado — E2E-01):** health 200 → login → criar conta → connect (instância criada na Evolution real + webhook configurado) → ler QR no modal → dono lê no WhatsApp → webhook `CONNECTION_UPDATE open` → conta `conectada` com phone → GET /qr → `409` → disconnect → `desconectada` → auditoria em `integration_events` conferida por SQL. **O QR só pode ser lido pelo dono** (pendência 2 do HANDOFF 12/11).

---

## 8. Plano de rollback

- `008_accounts_evolution.down.sql` **normaliza status → dropa CHECK largo → recria CHECK estreito → dropa as 3 colunas → dropa `integration_events`**. **ALERTA DE DONO — perdas irreversíveis:** auditoria de webhooks (tabela inteira), status real, `phone`/`phone_jid` e o vínculo conta↔instância (a instância **continua existindo na Evolution** — órfã lá; a fatia futura de exclusão de instância D10 cuida disso). **Sempre** dump antes; preferir **correção para frente** (migração nova) conforme Fundação §7; `down` só com ordem do orquestrador, congelamento de deploys e verificação `status` + healthcheck + smoke após.
- **Acoplamento código×schema (novo, idem F6 §8):** reverter o **código** sem o down deixa colunas/tabela órfãs inócuaas (código velho não as lê) — seguro. Reverter a **migração** sem reverter o código quebra connect/qr/disconnect/webhook (coluna ausente → 500) — **sempre em par**.
- Rollback do *provedor* é independente: `EVOLUTION_API_KEY` vazia desabilita os endpoints de conexão (503) e deixa o resto do produto intacto (D8) — botão de desligar rápido sem tocar banco.

---

## 9. Riscos e limitações declaradas

1. **A `api` fala com a Evolution pela rede interna (`*.railway.internal`) e com TLS auto-detectado pelo pool HTTP do adaptador** — em dev local a interna não resolve: apontar `EVOLUTION_BASE_URL` para a URL pública (§6.3). Falha de conectividade vira `502 EVOLUTION_UNAVAILABLE` com status intacto (honesto, D3).
2. **Webhook é a fonte primária de estado; se ele não chegar (segredo errado, URL errada, rede), o estado pode ficar defasado até o próximo connect/qr/disconnect** (que re-sincronizam por resposta do provedor, §0.1.3). Não há polling automático do provedor nesta fatia (fora de escopo §1); declarado como comportamento aceito.
3. **O payload de webhook carrega a apikey global da Evolution** (observado na referência offline): redação obrigatória antes de logar/persistir (§0.1.8/T8). Risco residual: qualquer log de request body cru no caminho do webhook vaza a chave — o logger da Fundação não loga corpo (ENG-09) e o teste T8 fixa o comportamento.
4. **Retry da Evolution:** 500 gera retentativas (Axios com backoff) — e o **fato 5 do probe confirmou retry inclusive para 404**, logo a lista de status "não-retryáveis" da referência não deve ser presumida. Por isso o contrato responde `200 {}` pós-validação e trata falha interna por log+auditoria (§5.4); 401 do secret e 400 de body são emitidos ANTES de qualquer efeito colateral (auditável), de modo que um eventual retry apenas repita uma checagem pura.
5. **QR transitório e grande** (data URL PNG em cada resposta de connect/qr; `QRCODE_LIMIT=30` regenerações por sessão na infra): aceitável para o fluxo modal+paging 3s (§12); não persistir é decisão D4 (sem coluna binária, sem PII de QR em repouso).
6. **pg-mem × CHECK/FK/jsonb:** o DROP do CHECK por nome default pode divergir no pg-mem — mitigado por design (§2.1.1: falha alta e imediata nos testes se o CHECK estreito sobreviver); FKs e jsonb já exercitados nas fatias 3–6 (23503 mapeado; jsonb é novo em escrita — se o pg-mem divergir na serialização, o teste T8/T7 revela e o smoke real no deploy confirma).
7. **Pin 2.3.7 (D1):** rotas/shapes foram lidos da referência 2.3.7 (ex.: `fetchInstances`, não `/instance/list` do 1.x); upgrade para 2.4.x está **proibido** pelo dono — qualquer revalidação de rota volta ao contrato.
8. **`phone` persiste após desconexão** (§0.1.2): é o último número conhecido, não um estado vivo — a A2 deve exibi-lo como informação (não como "conectado agora"); `connectionStatus` é a verdade.
9. **Sem limpeza de `integration_events`:** cresce a cada webhook (inclui QRCODE_UPDATED frequentes durante conexão) — retenção/TTL é decisão futura (§10); volume inicial desprezível.
10. **Colisão documental "D19"** (§10, risco documental apenas): o contrato da F6 (§0.1, 09/11) registra as ratificações do dono como "D19/D20/D21" enquanto o mapa/status/HANDOFF (12/11) registram **D19 = Evolution QR**. Nenhum código depende desses rótulos; reconciliação de numeração é pendência documental para o orquestrador.

---

## 10. Pendências que dependem de decisão/fatia futura (nenhuma DEC do PM é decidida aqui)

| Item | Situação |
|---|---|
| **Excluir instância Evolution** | Fatia futura (D10): disconnect não exclui; instâncias acumulam no serviço `evolution` (e no volume `/evolution/instances`). Quando ordenado, decidir semântica (delete na Evolution + limpeza do vínculo + DELETE de conta é outra pendência — D5 da F2). |
| **CTA-05 (alerta 24h)** | Substrato entregue (`integration_events` + `desconectada` real); **janela/agregação/exibição** = decisão do dono → fatia futura. |
| **Retenção/TTL de `integration_events`** | Sem limpeza nesta fatia (§9.9); política de retenção = decisão futura (migração/job). |
| **Colisão de numeração D19/D20/D21 (F6 §0.1 × mapa 12/11)** | Reconciliação **documental** pelo orquestrador (§9.10); nada bloqueia. |
| **DELETE de conta / DEC-02 / DEC-12 / DEC-14 / DEC-16** | Seguem como na F2/F6 (abertas; esta fatia não decide nenhuma). |
| **Busca de contas por telefone** | Não criada (busca continua só por `name` — F2 §3.2); se o dono pedir, é query nova + decisão de índice. |
| **Rate limit específico de connect/qr** | Nenhum nesta fatia (§0.1.10); se o polling real pesar, entra como env nomeada em fatia futura. |
| **Reconciliação de status por fetchInstances em lista** | A lista NÃO consulta a Evolution por conta (custo N chamadas); estado vem do banco, atualizado por webhook/connect/qr. Sincronização em lote = decisão futura se defasagem incomodar. |

**Nenhuma pendência nova criada que bloqueie a implementação.**

---

## 11. Gates (definição de pronto; REG-01 herdado da Fundação §11)

Após o **último diff** da fatia, em `/api`, com inventário nominal antes/depois e exit codes registrados (DEV/VERIFY.md):

1. `npm run typecheck` — 0 erros.
2. `npm test` — suíte integral (98 vigentes + novos T1–T14) **100% verde, sem skip**.
3. `npm run build` — ok (tsc + copy-migrations).
4. `npm audit --omit=dev` — alvo 0. Sem lint (herda F1 §11 — adiado).
5. **Critérios específicos da fatia (checklist de aceite):** (a) nenhuma mutação de `connection_status`/`phone` fora de resposta/webhook da Evolution (T5, oráculo); (b) zero `fetch` em rotas (T2/estrutura); (c) webhook sempre autenticado por secret (T6) e com auditoria redigida (T8); (d) QR em nenhum banco (T3); (e) `disconnect` nunca chama delete de instância (T4); (f) envelope único em 100% dos erros novos (T14); (g) migração 008 reversível com normalização prévia (T11); (h) tenant via instanceName sem vazamento cruzado (T9).
6. Verificação A3 (orquestrador) + smoke E2E §7 com QR lido pelo dono; atualização de `docs/continuidade/05/07` (CTA-02 final, CTA-06, INT-01 parcial, WHE-01 substrato) **fica com o orquestrador**, não com A1.

---

## 12. Contrato para a A2 (front — tela de Contas; shapes literais)

**Regra de ouro (DIR-04): NUNCA estado otimista.** Status/phone exibidos vêm **sempre** da última resposta do servidor; nada de "conectando…" local simulado, nada de trocar cor antes do 200/409 chegar. Erro de rede → mantém o estado anterior + mensagem.

### 12.1 Shapes literais das respostas novas

```jsonc
// POST /api/v1/accounts/:id/connect -> 200
{
  "account": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Principal",
    "type": "WhatsApp",
    "isSpy": false,
    "connectionStatus": "aguardando_qr",   // um dos 5 de 12.2
    "phone": null,
    "createdAt": "2026-11-12T12:00:00.000Z",
    "updatedAt": "2026-11-12T12:01:00.000Z"
  },
  "qrDataUrl": "data:image/png;base64,iVBORw0KGgo..."  // ou null se o QR ainda nao foi gerado
}

// GET /api/v1/accounts/:id/qr -> 200   (409 ACCOUNT_CONNECTED se conectada)
{ "qrDataUrl": "data:image/png;base64,iVBORw0KGgo...", "connectionStatus": "aguardando_qr" }

// POST /api/v1/accounts/:id/disconnect -> 200   (409 EVOLUTION_NOT_CONNECTED se nao conectada)
{ "account": { /* mesmo shape de account, connectionStatus: "desconectada", phone preservado */ } }

// erros: envelope padrao, ex.:
{ "error": { "code": "ACCOUNT_CONNECTED", "message": "..." } }
```

### 12.2 Estados — rótulos e cores honestos (fonte: `connectionStatus` do servidor)

| `connectionStatus` | Rótulo | Cor sugerida | Ação na linha/card |
|---|---|---|---|
| `nao_conectada` | Não conectada | cinza | botão "Conectar" (abre modal QR) |
| `aguardando_qr` | Aguardando leitura do QR | amarelo | modal aberto/pendente de leitura |
| `conectada` | Conectada | verde | botão "Desconectar" (com confirmação) |
| `desconectada` | Desconectada | laranja | "Conectar" de novo disponível |
| `banida` | Banida | vermelho | "Conectar" disponível (nova tentativa); aviso honesto de que o provedor reportou banimento |

`phone` (string|null) pode ser exibido ao lado do nome quando presente (informação do último número conectado — não indica "online agora").

### 12.3 Fluxo do modal QR (polling)

1. "Conectar" → `POST /accounts/:id/connect`. Em `200`: abre modal com `<img src={qrDataUrl}>` (se `qrDataUrl === null`, mostra "gerando QR…" e segue o polling). Em `409 ACCOUNT_CONNECTED`: refresh da conta (já conectada). Em `502/503`: mensagem de erro honesta (provedor indisponível/não configurado), **estado intacto**, sem retry automático agressivo.
2. Modal aberto → **polling `GET /api/v1/accounts/:id` a cada 3000 ms** até `connectionStatus === "conectada"` (fecha modal + sucesso + refresh da lista) **ou** erro definitivo. Em paralelo/atualização da imagem: `GET /accounts/:id/qr` no mesmo ciclo (3000 ms) — `200` troca o `qrDataUrl` (QR regenera sozinho), `409 ACCOUNT_CONNECTED` = conectou (fecha como sucesso), `qrDataUrl:null` mantém "gerando…". `banida` vinda do polling → fecha modal com aviso honesto.
3. Fechar o modal **não** cancela nada no servidor (o QR expira sozinho na Evolution; `QRCODE_LIMIT=30`).
4. "Desconectar" (só em `conectada`): **confirmação explícita** (destrutivo — tira o número da sessão); `POST /disconnect`; `200` → atualiza a account pelo corpo da resposta; `409/502` → mensagem do envelope, estado anterior mantido.
5. Sem cache local de status/phone (não persistir `connectionStatus` em localStorage); abas/filtros por status só quando houver dado real.

---

## 13. Deploy (Railway, projeto "grupos" — plano DOCUMENTAL; nenhuma etapa é autorização)

1. **Procfile INALTERADO** (`web: NODE_ENV=production node dist/db/migrate.js up && node dist/index.js`): a **migração 008 sobe na inicialização** (idempotente, single-replica, exclusão pela UNIQUE de `migrations`) — mesma ordem da Fundação §13; sem passo manual de banco.
2. **Variáveis NOVAS da `api` (por NOME; valores só no painel/env do orquestrador, nunca no repo):** `EVOLUTION_BASE_URL` (default interno já cobre produção — pode ficar indefinida), `EVOLUTION_API_KEY` (**obrigatória em produção para connect**; é a `AUTHENTICATION_API_KEY` do serviço `evolution` — referência por nome, mesmo valor), `EVOLUTION_WEBHOOK_URL` (URL pública completa da API + `/api/v1/webhooks/evolution`), `EVOLUTION_WEBHOOK_SECRET` (gerar aleatória ≥32 chars; aplicar **também** na configuração do webhook das instâncias — o adaptador envia no campo `webhook` do create; e nunca logar). `.env.example` do `/api` recebe os 4 nomes com valores vazios.
3. **Ordem:** migração 008 (no boot) → healthcheck `GET /api/v1/health` 200 (revision = SHA) → smoke autenticado §7 → **teste real de QR exige o dono lendo o código no WhatsApp dele** (pendência 2 do HANDOFF 12/11 — agendar com o dono). Evolution já operacional (D1) — nada a provisionar lá além do que existe.
4. **Kill-switch documental:** esvaziar `EVOLUTION_API_KEY` desabilita conexões (503 `EVOLUTION_NOT_CONFIGURED`) sem tocar banco/rotas existentes (§8) — primeiro recurso em incidente de provedor.
5. **REL-01:** deployment SUCCESS + healthcheck com revision do commit + smoke §7; `docs/continuidade/05/07` atualizados pelo orquestrador com CTA-02 (final), CTA-06, INT-01 (parcial) e WHE-01 (substrato).
6. **Rollback:** redeploy do deployment anterior (código) — se exigir schema, §8 (dump → down 008 → verificação; perdas declaradas lá).

---

**Data:** 12/11/2026 · **Autor:** A1 Backend · **Branch:** `a1/contas-qr` (base `main` 1683559) · **Status:** CONTRATO — aguardando parecer A4 e liberação do orquestrador para implementar.
