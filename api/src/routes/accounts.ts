// Rotas de contas (contrato Fatia 2 §§3–4): CRUD escopado por tenant.
// org_id vem EXCLUSIVAMENTE da sessão (requireAuth) — nunca do body/query.
// CTA-03: criar/editar conta NÃO cria sessão/credencial/conexão nem ID externo;
// connectionStatus nunca é aceito em entrada e nasce 'nao_conectada' (CHECK).
// SEM DELETE nesta fatia (decisão D5 do coordenador — proposta futura).
// Mutações exigem Content-Type application/json (D6 — lib/contentType.ts).
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { AppContext } from "../app.js";
import { makeRequireAuth } from "../middleware/requireAuth.js";
import { requireJsonContentType } from "../lib/contentType.js";
import { tenantForbidden, validationError } from "../lib/errors.js";

// Defaults técnicos provisórios (DEC-12 aberta — contrato §3.3/§10).
const NAME_MAX = 120;
const TYPE_MAX = 60;
const SEARCH_MAX = 120;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACCOUNT_COLUMNS =
  "id, name, type, is_spy, connection_status, created_at, updated_at";

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
  created_at: Date | string;
  updated_at: Date | string;
};

interface AccountResource {
  id: string;
  name: string;
  type: string;
  isSpy: boolean;
  connectionStatus: string;
  createdAt: string;
  updatedAt: string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

// Recurso flat (contrato §3.1): SEM qualquer ID externo, telefone, número ou
// credencial (CTA-03). camelCase; timestamps ISO-8601 UTC.
function toResource(row: AccountRow): AccountResource {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    isSpy: row.is_spy === true,
    connectionStatus: String(row.connection_status),
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
  };
}
