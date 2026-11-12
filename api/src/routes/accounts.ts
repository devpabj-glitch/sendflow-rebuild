// Rotas de contas (contrato Fatia 2 §§3–4 + Fatia 7 §§4–5): CRUD escopado por
// tenant + conexão por QR via Evolution 2.3.7 (connect/qr/disconnect).
// org_id vem EXCLUSIVAMENTE da sessão (requireAuth) — nunca do body/query.
// CTA-03: criar/editar conta NÃO cria sessão/credencial/conexão nem ID externo;
// connectionStatus/phone NUNCA aceitos em entrada (400); o vínculo de
// instância (evolution_instance_name) só nasce no primeiro connect (F7 §0.1.1).
// SEM DELETE nesta fatia (decisão D5 do coordenador — proposta futura).
// Mutações exigem Content-Type application/json (D6 — lib/contentType.ts).
// Honestidade DIR-04 (F7-D3): mutação de status/phone SOMENTE por evidência
// (resposta do provedor no mesmo request — aqui — ou webhook). Falha do
// provedor → 502/503 SEM mutar nada (adaptador injetado; ZERO fetch aqui).
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from "fastify";
import type { AppContext } from "../app.js";
import type { EvolutionInstanceSummary } from "../providers/evolution/types.js";
import { isEvolutionError } from "../providers/evolution/types.js";
import { jidLocalPart } from "../providers/evolution/instance.js";
import { makeRequireAuth } from "../middleware/requireAuth.js";
import { requireJsonContentType } from "../lib/contentType.js";
import { applyConnectionEvidence } from "../lib/connectionEvidence.js";
import {
  accountConnected,
  evolutionInstanceTaken,
  evolutionNotConnected,
  evolutionNotConfigured,
  evolutionUnavailable,
  tenantForbidden,
  validationError,
  AppError,
} from "../lib/errors.js";

// Defaults técnicos provisórios (DEC-12 aberta — contrato §3.3/§10).
const NAME_MAX = 120;
const TYPE_MAX = 60;
const SEARCH_MAX = 120;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACCOUNT_COLUMNS =
  "id, name, type, is_spy, connection_status, phone, created_at, updated_at";

// Schemas só garantem forma/tipos; regras de trim/comprimento pós-trim são
// aplicadas no handler (400 VALIDATION_ERROR com details.fields, §3.3).
const createAccountSchema = {
  body: {
    type: "object",
    required: ["name"],
    additionalProperties: false, // org_id/connectionStatus/phone/id → 400 (§3.3)
    properties: {
      name: { type: "string", minLength: 1 },
      type: { type: "string", minLength: 1 },
      isSpy: { type: "boolean" },
    },
  },
} as const;

const patchAccountSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1 },
      type: { type: "string", minLength: 1 },
      isSpy: { type: "boolean" },
    },
  },
} as const;

// type alias (não interface): sem assinatura de índice implícita, o cast de
// Record<string, unknown> das rows falharia no tsc (padrão já usado no auth.ts).
type AccountRow = {
  id: string;
  name: string;
  type: string;
  is_spy: boolean;
  connection_status: string;
  phone: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

/** Fatia 7: row de trabalho das rotas de conexão (inclui o vínculo interno). */
type AccountConnectionRow = AccountRow & { evolution_instance_name: string | null };

interface AccountResource {
  id: string;
  name: string;
  type: string;
  isSpy: boolean;
  connectionStatus: string;
  /** Último número conectado conhecido (F7 §0.1.2) — null até a 1ª conexão. */
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

// Recurso flat (contrato §3.1): SEM qualquer ID externo/instância, credencial
// ou campo de entrada de conexão (CTA-03). `phone` é LEITURA (evidência do
// provedor, F7 §0.1.2). camelCase; timestamps ISO-8601 UTC.
function toResource(row: AccountRow): AccountResource {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    isSpy: row.is_spy === true,
    connectionStatus: String(row.connection_status),
    phone: row.phone === null || row.phone === undefined ? null : String(row.phone),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

/** 1..max pós-trim; 0 (vazio/só espaços) é inválido. */
function assertTrimmedLength(value: string, field: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) {
    throw validationError({ fields: [field] });
  }
  return trimmed;
}

/**
 * Escapa os curingas do LIKE com a barra invertida — o escape DEFAULT do
 * LIKE/ILIKE no PostgreSQL real (contrato §3.2: '%'/'_'/'\' do termo são
 * literais, não sintaxe de usuário). O termo escapado viaja SEMPRE por
 * parâmetro. Nota pg-mem: sem a cláusula ESCAPE (que o pg-mem não parseia);
 * para termos sem curingas o comportamento é idêntico nos dois motores
 * (ressalva declarada no contrato §9.1).
 */
function escapeLikePattern(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Parâmetro de paginação: inteiro em faixa; ausente usa o default (§3.3). */
function parseIntParam(
  raw: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined) return fallback;
  if (Array.isArray(raw) || typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw validationError({ fields: [field] });
  }
  const value = Number(raw);
  if (value < min || value > max) throw validationError({ fields: [field] });
  return value;
}

// ---------------------------------------------------------------------------
// Fatia 7 — conexão por QR (Evolution 2.3.7). Regra central (F7-D3): mutação
// de status/phone SOMENTE com evidência do provedor; falha → 502/503 sem
// escrever nada. Adaptador chega SEMPRE por ctx.evolution (injetado).
// ---------------------------------------------------------------------------

/** F7-D2: 'g-' + 8 primeiros hex do uuid da conta (determinístico). */
function evolutionInstanceNameOf(accountId: string): string {
  return `g-${accountId.slice(0, 8)}`;
}

/** Evidência de estado colhida de resposta do provedor (§0.1.3). */
type ConnectionEvidence = import("../lib/connectionEvidence.js").ConnectionEvidence;

/** Evidência a partir de um resumo de fetchInstances (state open + ownerJid). */
function evidenceOfInstanceSummary(summary: EvolutionInstanceSummary): ConnectionEvidence | null {
  if (summary.state !== "open") return null;
  return {
    status: "conectada",
    phoneJid: summary.ownerJid,
    phone: summary.ownerJid ? jidLocalPart(summary.ownerJid) : undefined,
  };
}

/** Evidência a partir da resposta normalizada do connect (§0.1.3/§0.1.7). */
function evidenceOfConnectResult(result: {
  state: string;
  qrDataUrl: string | null;
}): ConnectionEvidence | null {
  if (result.state === "open") return { status: "conectada" };
  if (result.qrDataUrl !== null) return { status: "aguardando_qr" };
  return null; // sem QR e sem open: nenhuma evidência — não muta
}

/**
 * Mescla duas evidências (connect + fetchInstances): status do connect tem
 * precedência; phone/phoneJid vêm de quem os tiver (o connect "open" da 2.3.7
 * NÃO traz ownerJid — o fetchInstances logo antes traz, §0.1.2).
 */
function mergeEvidence(
  primary: ConnectionEvidence | null,
  secondary: ConnectionEvidence | null,
): ConnectionEvidence | null {
  if (primary === null) return secondary;
  if (secondary === null) return primary;
  return {
    status: primary.status,
    phoneJid: primary.phoneJid ?? secondary.phoneJid,
    phone: primary.phone ?? secondary.phone,
  };
}

/**
 * Traduz erro do adaptador para o envelope (502 EVOLUTION_UNAVAILABLE),
 * logando o motivo SEM segredos (mensagens do adaptador já são genéricas).
 * AppError (409/403 do fluxo) passa direto.
 */
async function providerFailure(request: FastifyRequest, err: unknown): Promise<never> {
  if (err instanceof AppError) throw err;
  if (isEvolutionError(err)) {
    const typed = err as Error;
    request.log.warn(
      { errName: typed.name, message: typed.message },
      "chamada ao provedor evolution falhou (estado da conta intacto)",
    );
    throw evolutionUnavailable();
  }
  request.log.error({ err }, "erro inesperado ao chamar provedor evolution");
  throw evolutionUnavailable();
}

/** Violação da UNIQUE de evolution_instance_name (23505 — R3; pg-mem também via mensagem). */
function isInstanceNameUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (e?.code === "23505") return true;
  return /unique constraint/i.test(String(e?.message ?? ""));
}

const CONNECTION_ACCOUNT_COLUMNS = `${ACCOUNT_COLUMNS}, evolution_instance_name`;

/** Carrega a conta da org da sessão por :id (400 malformado / 404 genérico — F2 §4). */
async function loadAccountForConnection(
  ctx: AppContext,
  request: FastifyRequest,
  orgId: string,
): Promise<AccountConnectionRow> {
  const id = String((request.params as Record<string, unknown>).id ?? "");
  if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });
  const res = await ctx.db.query(
    `SELECT ${CONNECTION_ACCOUNT_COLUMNS} FROM accounts WHERE id = $1 AND org_id = $2`,
    [id, orgId],
  );
  const row = res.rows[0] as AccountConnectionRow | undefined;
  if (!row) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§4)
  return row;
}

/** Aplica UMA evidência do provedor (helper compartilhado — lib/connectionEvidence.ts). */
function applyEvidence(ctx: AppContext, accountId: string, evidence: ConnectionEvidence): Promise<void> {
  return applyConnectionEvidence({ db: ctx.db, clock: ctx.clock }, accountId, evidence);
}

export function accountsRoutes(ctx: AppContext): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    const requireAuth = makeRequireAuth({ db: ctx.db, clock: ctx.clock });

    // ------------------------------------------------------------- POST create
    app.post(
      "/api/v1/accounts",
      // Achado #2: guard de content-type em preParsing (antes do parser do
      // Fastify — nunca 415). requireAuth segue em preValidation; para media
      // type não-json o 400 do guard precede o 401 (precedência que o 415 do
      // parser já tinha de fato); com json válido, 401 continua primeiro.
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: createAccountSchema },
      async (request, reply) => {
        const orgId = request.user!.orgId; // EXCLUSIVAMENTE da sessão (ENG-02)
        const body = request.body as { name: string; type?: string; isSpy?: boolean };

        const name = assertTrimmedLength(body.name, "name", NAME_MAX);
        const type = assertTrimmedLength(body.type ?? "WhatsApp", "type", TYPE_MAX);
        const isSpy = body.isSpy ?? false; // default false (§3.3)
        const now = ctx.clock.now();

        const res = await ctx.db.query(
          `INSERT INTO accounts (org_id, name, type, is_spy, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $5)
           RETURNING ${ACCOUNT_COLUMNS}`,
          [orgId, name, type, isSpy, now],
        );
        return reply.code(201).send(toResource(res.rows[0] as AccountRow));
      },
    );

    // -------------------------------------------------------------- GET list
    app.get("/api/v1/accounts", { preValidation: requireAuth }, async (request, reply) => {
      const orgId = request.user!.orgId;
      const query = request.query as Record<string, unknown>;

      // search: opcional; trim; vazio ⇒ sem filtro; ≤120 pós-trim (§3.3).
      let search: string | undefined;
      const rawSearch = query.search;
      if (rawSearch !== undefined) {
        if (Array.isArray(rawSearch) || typeof rawSearch !== "string") {
          throw validationError({ fields: ["search"] });
        }
        const trimmed = rawSearch.trim();
        if (trimmed.length > SEARCH_MAX) throw validationError({ fields: ["search"] });
        if (trimmed.length > 0) search = trimmed;
      }

      const page = parseIntParam(query.page, "page", 1, 1, Number.MAX_SAFE_INTEGER);
      const pageSize = parseIntParam(query.pageSize, "pageSize", PAGE_SIZE_DEFAULT, PAGE_SIZE_MIN, PAGE_SIZE_MAX);

      const params: unknown[] = [orgId];
      let where = "org_id = $1";
      if (search !== undefined) {
        params.push(`%${escapeLikePattern(search)}%`);
        where += ` AND name ILIKE $${params.length}`;
      }

      // Achado #1 (code-review Fatia 2): COUNT e SELECT agora rodam em UMA
      // transação de leitura — cliente dedicado (connect) + BEGIN ISOLATION
      // LEVEL REPEATABLE READ — para que as duas queries vejam o MESMO
      // snapshot (sem corrida COUNT×SELECT com paginação incoerente).
      // Caminho declarado (funciona em pg-mem E PG real): a window function
      // `count(*) OVER()` faria tudo em uma query, mas o pg-mem não parseia a
      // cláusula OVER ("not implemented in pg-mem yet" — limitação registrada
      // no contrato §9.1 e em DEV/VERIFY.md); `SET TRANSACTION` em sentença
      // separada também não parseia no pg-mem. Em pool real, BEGIN/COMMIT só
      // são seguros em cliente FIXO: queries soltas no pool podem trocar de
      // conexão no meio da transação (o padrão connect/BEGIN já usado no
      // register do auth.ts).
      const client = await ctx.db.connect();
      let total: number;
      let items: Record<string, unknown>[];
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        try {
          const countRes = await client.query(
            `SELECT count(*)::int AS total FROM accounts WHERE ${where}`,
            params,
          );
          const itemsRes = await client.query(
            `SELECT ${ACCOUNT_COLUMNS}
               FROM accounts
              WHERE ${where}
              ORDER BY created_at DESC, id DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, pageSize, (page - 1) * pageSize],
          );
          await client.query("COMMIT");
          // count(*) sempre devolve 1 linha; defesa extra: sem linha → 0.
          total = Number((countRes.rows[0] as { total?: number } | undefined)?.total ?? 0);
          items = itemsRes.rows;
        } catch (err) {
          // Aborta a transação sem mascarar o erro original.
          await client.query("ROLLBACK").catch(() => undefined);
          throw err;
        }
      } finally {
        client.release();
      }

      return reply.code(200).send({
        items: items.map((row) => toResource(row as AccountRow)),
        total,
        page,
        pageSize,
      });
    });

    // ----------------------------------------------------------- GET by id
    app.get("/api/v1/accounts/:id", { preValidation: requireAuth }, async (request, reply) => {
      const id = String((request.params as Record<string, unknown>).id ?? "");
      if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

      const res = await ctx.db.query(
        `SELECT ${ACCOUNT_COLUMNS} FROM accounts WHERE id = $1 AND org_id = $2`,
        [id, request.user!.orgId],
      );
      const row = res.rows[0] as AccountRow | undefined;
      if (!row) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§4)
      return reply.code(200).send(toResource(row));
    });

    // --------------------------------------------------------------- PATCH
    app.patch(
      "/api/v1/accounts/:id",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: patchAccountSchema },
      async (request, reply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

        const body = request.body as { name?: string; type?: string; isSpy?: boolean };
        const sets: string[] = [];
        const params: unknown[] = [id, request.user!.orgId];
        const push = (column: string, value: unknown): void => {
          params.push(value);
          sets.push(`${column} = $${params.length}`);
        };

        // Validações idênticas ao POST (§3.2); só campos fornecidos.
        if (body.name !== undefined) push("name", assertTrimmedLength(body.name, "name", NAME_MAX));
        if (body.type !== undefined) push("type", assertTrimmedLength(body.type, "type", TYPE_MAX));
        if (body.isSpy !== undefined) push("is_spy", body.isSpy);
        if (sets.length === 0) throw validationError({ fields: ["body"] }); // ≥1 campo
        push("updated_at", ctx.clock.now());

        const res = await ctx.db.query(
          `UPDATE accounts SET ${sets.join(", ")}
            WHERE id = $1 AND org_id = $2
            RETURNING ${ACCOUNT_COLUMNS}`,
          params,
        );
        const row = res.rows[0] as AccountRow | undefined;
        if (!row) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§4)
        return reply.code(200).send(toResource(row));
      },
    );

    // ---------------------------------------------- Fatia 7: POST :id/connect
    // F7-D5: cria a instância (se não existir; webhook por instância nasce no
    // próprio create — fato 2 do probe) e devolve o QR. Sem body (CT json
    // exigido). Falha do provedor → 502 SEM mutar (D3).
    app.post(
      "/api/v1/accounts/:id/connect",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      async (request, reply) => {
        const orgId = request.user!.orgId;
        const account = await loadAccountForConnection(ctx, request, orgId);

        // (2) já conectada → 409 (ordem do contrato §4.1).
        if (account.connection_status === "conectada") throw accountConnected();
        // (3) provider desabilitado → 503 SEM mutar nada (D8).
        const provider = ctx.evolution;
        if (!provider) throw evolutionNotConfigured();

        const accountId = String(account.id);
        const instanceName =
          account.evolution_instance_name ?? evolutionInstanceNameOf(accountId);

        // (4) instância existe? fetchInstances decide (create nunca "por cima").
        let existing: EvolutionInstanceSummary | undefined;
        try {
          const instances = await provider.fetchInstances(instanceName);
          existing = instances.find((i) => i.instanceName === instanceName);
        } catch (err) {
          throw await providerFailure(request, err);
        }

        if (!existing) {
          try {
            await provider.createInstance(instanceName);
          } catch (err) {
            throw await providerFailure(request, err);
          }
        }

        // Primeiro connect bem-sucedido materializa o vínculo (§0.1.1) — tanto
        // quando a instância acabou de ser criada quanto quando JÁ existia no
        // provedor (reutilização); colisão do prefixo 32 bits → 23505 → 409 de
        // envelope (R3/§2.1.2).
        if (account.evolution_instance_name === null) {
          try {
            await ctx.db.query(
              `UPDATE accounts
                  SET evolution_instance_name = $3, updated_at = $4
                WHERE id = $1 AND org_id = $2 AND evolution_instance_name IS NULL`,
              [accountId, orgId, instanceName, ctx.clock.now()],
            );
          } catch (err) {
            if (isInstanceNameUniqueViolation(err)) throw evolutionInstanceTaken();
            throw err;
          }
        }

        // (5) connect devolve o QR vigente; (6) resposta = evidência (§0.1.3).
        let connectResult: { state: string; qrDataUrl: string | null };
        try {
          connectResult = await provider.connect(instanceName);
        } catch (err) {
          throw await providerFailure(request, err);
        }
        // (6) resposta do provedor = evidência (§0.1.3), mesclada com a do
        // fetchInstances (ownerJid quando a sessão já está open, §0.1.2).
        const evidence = mergeEvidence(
          evidenceOfConnectResult(connectResult),
          existing ? evidenceOfInstanceSummary(existing) : null,
        );
        if (evidence) await applyEvidence(ctx, accountId, evidence);

        const fresh = await ctx.db.query(
          `SELECT ${ACCOUNT_COLUMNS} FROM accounts WHERE id = $1`,
          [accountId],
        );
        return reply.code(200).send({
          account: toResource(fresh.rows[0] as AccountRow),
          qrDataUrl: connectResult.qrDataUrl, // data URL pronta ou null (§0.1.7)
        });
      },
    );

    // -------------------------------------------------- Fatia 7: GET :id/qr
    // QR VIGENTE do provedor (não recria sessão); nunca persiste QR (D4).
    app.get("/api/v1/accounts/:id/qr", { preValidation: requireAuth }, async (request, reply) => {
      const orgId = request.user!.orgId;
      const account = await loadAccountForConnection(ctx, request, orgId);

      if (account.connection_status === "conectada") throw accountConnected();
      // R2 (parecer A4): conta SEM instância (nunca conectada) → 409 sem
      // chamar o provedor — não há QR a buscar.
      if (account.evolution_instance_name === null) throw evolutionNotConnected();
      const provider = ctx.evolution;
      if (!provider) throw evolutionNotConfigured();

      const accountId = String(account.id);
      let connectResult: { state: string; qrDataUrl: string | null };
      try {
        connectResult = await provider.connect(account.evolution_instance_name);
      } catch (err) {
        throw await providerFailure(request, err);
      }
      const evidence = evidenceOfConnectResult(connectResult);
      if (evidence) await applyEvidence(ctx, accountId, evidence);

      const fresh = await ctx.db.query(
        "SELECT connection_status FROM accounts WHERE id = $1",
        [accountId],
      );
      return reply.code(200).send({
        qrDataUrl: connectResult.qrDataUrl,
        connectionStatus: String((fresh.rows[0] as { connection_status: string }).connection_status),
      });
    });

    // -------------------------------------------- Fatia 7: POST :id/disconnect
    // Logout na Evolution (D10: NÃO exclui a instância); phone permanece (§0.1.2).
    app.post(
      "/api/v1/accounts/:id/disconnect",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      async (request, reply) => {
        const orgId = request.user!.orgId;
        const account = await loadAccountForConnection(ctx, request, orgId);

        // §0.1.4: disconnect exige conectada (409 antecipa o 400 da Evolution).
        if (account.connection_status !== "conectada") throw evolutionNotConnected();
        if (account.evolution_instance_name === null) throw evolutionNotConnected(); // defensivo
        const provider = ctx.evolution;
        if (!provider) throw evolutionNotConfigured();

        const accountId = String(account.id);
        const instanceName = account.evolution_instance_name;
        try {
          const instances = await provider.fetchInstances(instanceName);
          const existing = instances.find((i) => i.instanceName === instanceName);
          if (existing) {
            await provider.logout(instanceName); // logout ≠ delete (D10)
          }
          // Instância ausente no provedor → a conexão não existe mais:
          // desconectada sem logout (§0.1.3).
        } catch (err) {
          throw await providerFailure(request, err);
        }

        // Sucesso do logout (ou ausência da instância) = evidência.
        await applyEvidence(ctx, accountId, { status: "desconectada" });

        const fresh = await ctx.db.query(
          `SELECT ${ACCOUNT_COLUMNS} FROM accounts WHERE id = $1`,
          [accountId],
        );
        return reply.code(200).send({ account: toResource(fresh.rows[0] as AccountRow) });
      },
    );
  };
}
