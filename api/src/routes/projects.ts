// Rotas de projetos (Fatia 6 - PRJ; contrato docs/contracts/FATIA-06-PROJETOS-
// CONTRATO.md com D19/D20/D21 RATIFICADAS na §0.1; parecer A4 ADERENTE).
// Recurso PLANO /api/v1/projects (pasta de cliente, GRP-PRJ-01..04): id
// globalmente único - aninhar não adiciona capacidade (precedente F2/F3/F5).
// counts COMPUTADOS NA LEITURA (PRJ-03), NUNCA armazenados e NUNCA aceitos em
// body: releaseCount = releases vinculadas; accountCount = COUNT DISTINCT de
// contas via release_accounts das releases do projeto (derivação INDIRETA -
// ENT-13/FLX-10, contrato §4.2: a mesma conta em 2 releases do mesmo projeto
// conta 1x); webhookCount = 0 LITERAL sem query (módulo WHE inexistente -
// estado honesto DIR-04; vira COUNT real na fatia do módulo).
// DELETE (D19): vazio → 204 sem corpo (repetição → 404 genérico byte a byte,
// padrão D16); ≥1 release vinculada → 409 PROJECT_NOT_EMPTY corpo FIXO sem
// contagem (D21), linha intacta (T4); não-vazio PENDENTE DEC-16; massa FORA
// (D10). FK releases.project_uuid ON DELETE RESTRICT (D20) =
// defesa-de-profundidade: corrida entre o COUNT e o DELETE → FK (23503 no
// banco real / mensagem FK no pg-mem) → 409, nunca 500 (§9.3/T13).
// org_id vem EXCLUSIVAMENTE da sessão (requireAuth) - nunca do body/query;
// UPDATE/DELETE carregam a org no PRÓPRIO predicado (§5).
// Mutações (POST/PATCH/DELETE) exigem Content-Type application/json (D6 -
// lib/contentType.ts); DELETE sem corpo passa pelo guard por uniformidade
// (contrato §3.4). SEM unique de nome (D11 estendida), SEM KPIs/período
// (PRJ-02 pulado, DEC-14), SEM tela (backend-only, PM regra 1).
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { AppContext } from "../app.js";
import type { DbClient } from "../lib/db.js";
import { makeRequireAuth } from "../middleware/requireAuth.js";
import { requireJsonContentType } from "../lib/contentType.js";
import { isProjectFkViolation } from "../lib/fk.js";
import { projectNotEmpty, tenantForbidden, validationError } from "../lib/errors.js";

// Defaults técnicos provisórios (DEC-12 aberta — contrato §3.4/D-PEND-4).
const NAME_MAX = 120;
const SEARCH_MAX = 120;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROJECT_COLUMNS = "id, name, created_at, updated_at";

// Schemas só garantem forma/tipos; trim/comprimento pós-trim são aplicados no
// handler (400 VALIDATION_ERROR com details.fields — §3.4).
// additionalProperties:false → org_id/id/releaseCount/accountCount/webhookCount/
// createdAt/updatedAt → 400 (nunca aceitos: counts são derivados de leitura).
const createProjectSchema = {
  body: {
    type: "object",
    required: ["name"],
    additionalProperties: false,
    properties: {
      name: { type: "string" },
    },
  },
} as const;

const patchProjectSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string" },
    },
  },
} as const;

// type alias (não interface): sem assinatura de índice implícita, o cast de
// Record<string, unknown> das rows falharia no tsc (padrão accounts/groups).
type ProjectRow = {
  id: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

interface ProjectResource {
  id: string;
  name: string;
  releaseCount: number; // computado (§4.1) — somente leitura
  accountCount: number; // computado DISTINCT (§4.2) — somente leitura
  webhookCount: number; // constante 0 (§4.3) — módulo WHE inexistente
  createdAt: string;
  updatedAt: string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

// Recurso flat (contrato §3.1): camelCase; counts SEMPRE presentes e
// computados; timestamps ISO-8601 UTC; webhookCount literal 0 (sem query).
function toResource(row: ProjectRow, releaseCount: number, accountCount: number): ProjectResource {
  return {
    id: String(row.id),
    name: String(row.name),
    releaseCount,
    accountCount,
    webhookCount: 0,
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
 * LIKE/ILIKE no PostgreSQL real (padrão F2 §3.2, ressalva pg-mem §9.1).
 */
function escapeLikePattern(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Parâmetro de paginação: inteiro em faixa; ausente usa o default (§3.4). */
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

// ------------------------------------------------------------- counts (§4)

/** Predicado tenant uniforme (§4.1/§5): a FK já garante mesma-org; o org_id
 *  no predicado é defesa-de-profundidade e sustenta o isolamento PRJ-04. */
async function releaseCountOf(client: DbClient, orgId: string, projectId: string): Promise<number> {
  const res = await client.query(
    "SELECT count(*)::int AS c FROM releases WHERE project_uuid = $1 AND org_id = $2",
    [projectId, orgId],
  );
  return Number((res.rows[0] as { c?: number } | undefined)?.c ?? 0);
}

/** §4.2: conta ÚNICA por projeto (DISTINCT) via releases do projeto. */
async function accountCountOf(client: DbClient, orgId: string, projectId: string): Promise<number> {
  const res = await client.query(
    `SELECT count(DISTINCT ra.account_id)::int AS c
       FROM release_accounts ra JOIN releases r ON r.id = ra.release_id
      WHERE r.project_uuid = $1 AND r.org_id = $2`,
    [projectId, orgId],
  );
  return Number((res.rows[0] as { c?: number } | undefined)?.c ?? 0);
}

/**
 * Mapa id→releaseCount da PÁGINA (§4.4): 1 query agrupada — IN com
 * placeholders explícitos (mesmo mecanismo testado de accountIds, F3; o
 * pg-mem não casa `= ANY($1::uuid[])` após o caminho DDL da 007 — probe
 * registrado em DEV/VERIFY.md). Projetos sem releases ficam 0 (seed).
 */
async function releaseCountMap(
  client: DbClient,
  orgId: string,
  projectIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>(projectIds.map((id) => [id, 0]));
  if (projectIds.length === 0) return map;
  const params: unknown[] = [];
  const placeholders = projectIds
    .map((id) => {
      params.push(id);
      return `$${params.length}`;
    })
    .join(", ");
  params.push(orgId);
  const res = await client.query(
    `SELECT project_uuid, count(*)::int AS c FROM releases
      WHERE project_uuid IN (${placeholders}) AND org_id = $${params.length}
      GROUP BY project_uuid`,
    params,
  );
  for (const row of res.rows as { project_uuid: unknown; c: unknown }[]) {
    map.set(String(row.project_uuid), Number(row.c));
  }
  return map;
}

/** Mapa id→accountCount DISTINCT da página (§4.4): 2ª query agrupada. */
async function accountCountMap(
  client: DbClient,
  orgId: string,
  projectIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>(projectIds.map((id) => [id, 0]));
  if (projectIds.length === 0) return map;
  const params: unknown[] = [];
  const placeholders = projectIds
    .map((id) => {
      params.push(id);
      return `$${params.length}`;
    })
    .join(", ");
  params.push(orgId);
  const res = await client.query(
    `SELECT r.project_uuid AS project_uuid, count(DISTINCT ra.account_id)::int AS c
       FROM release_accounts ra JOIN releases r ON r.id = ra.release_id
      WHERE r.project_uuid IN (${placeholders}) AND r.org_id = $${params.length}
      GROUP BY r.project_uuid`,
    params,
  );
  for (const row of res.rows as { project_uuid: unknown; c: unknown }[]) {
    map.set(String(row.project_uuid), Number(row.c));
  }
  return map;
}

export function projectsRoutes(ctx: AppContext): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    const requireAuth = makeRequireAuth({ db: ctx.db, clock: ctx.clock });

    // Corpo ausente com Content-Type application/json (contrato §3.5/T11):
    // parser escopado a ESTAS rotas pela encapsulação do plugin (padrão
    // F3/F5) — corpo vazio → undefined; malformado → 400 VALIDATION_ERROR.
    app.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      (_request, body, done) => {
        if (body === "" || body === undefined) {
          done(null, undefined);
          return;
        }
        try {
          done(null, JSON.parse(body as string));
        } catch {
          const err = new Error("JSON inválido.") as Error & { statusCode: number };
          err.statusCode = 400;
          done(err, undefined);
        }
      },
    );

    // ------------------------------------------------------------- POST create
    app.post(
      "/api/v1/projects",
      // D6: guard de content-type em preParsing (padrão F2 herdado).
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: createProjectSchema },
      async (request, reply) => {
        const orgId = request.user!.orgId; // EXCLUSIVAMENTE da sessão (ENG-02)
        // Corpo ausente (parser escopado) OU null literal → 400, nunca 500
        // no cast (precedente F3/F5).
        if (request.body == null) throw validationError({ fields: ["body"] });
        const body = request.body as { name: string };

        const name = assertTrimmedLength(body.name, "name", NAME_MAX);
        const now = ctx.clock.now();

        // Statement único atômico. Counts NASCEM 0 literalmente (§3.2): nenhuma
        // release pode referenciar projeto inexistente (FK D20) — sem queries.
        // Nenhum outro efeito (DIR-04/DIR-06; análogo CTA-03; teste T1).
        const res = await ctx.db.query(
          `INSERT INTO projects (org_id, name, created_at, updated_at)
           VALUES ($1, $2, $3, $3)
           RETURNING ${PROJECT_COLUMNS}`,
          [orgId, name, now],
        );
        const row = res.rows[0] as ProjectRow;
        return reply.code(201).send(toResource(row, 0, 0));
      },
    );

    // -------------------------------------------------------------- GET list
    app.get("/api/v1/projects", { preValidation: requireAuth }, async (request, reply) => {
      const orgId = request.user!.orgId;
      const query = request.query as Record<string, unknown>;

      // search: opcional; trim; vazio ⇒ sem filtro; ≤120 pós-trim (§3.4).
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
        // Substring CI em lower(name) + ILIKE + termo em caixa baixa —
        // determinístico nos dois motores; curingas escapados (F2 §3.2).
        params.push(`%${escapeLikePattern(search.toLowerCase())}%`);
        where += ` AND lower(name) ILIKE $${params.length}`;
      }

      // Padrão F2 §9.1: COUNT + SELECT da página + counts agrupados no MESMO
      // snapshot (BEGIN ISOLATION LEVEL REPEATABLE READ em cliente fixo).
      // Custo constante por página (2 queries agrupadas — §4.4), zero N+1.
      const client = await ctx.db.connect();
      let total: number;
      let items: ProjectRow[];
      let relMap: Map<string, number>;
      let accMap: Map<string, number>;
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        try {
          const countRes = await client.query(
            `SELECT count(*)::int AS total FROM projects WHERE ${where}`,
            params,
          );
          const itemsRes = await client.query(
            `SELECT ${PROJECT_COLUMNS}
               FROM projects
              WHERE ${where}
              ORDER BY created_at DESC, id DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, pageSize, (page - 1) * pageSize],
          );
          items = itemsRes.rows as ProjectRow[];
          const pageIds = items.map((row) => String(row.id));
          relMap = await releaseCountMap(client, orgId, pageIds);
          accMap = await accountCountMap(client, orgId, pageIds);
          await client.query("COMMIT");
          total = Number((countRes.rows[0] as { total?: number } | undefined)?.total ?? 0);
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw err;
        }
      } finally {
        client.release();
      }

      return reply.code(200).send({
        items: items.map((row) => toResource(row, relMap.get(String(row.id)) ?? 0, accMap.get(String(row.id)) ?? 0)),
        total,
        page,
        pageSize,
      });
    });

    // ----------------------------------------------------------- GET by id
    app.get("/api/v1/projects/:id", { preValidation: requireAuth }, async (request, reply) => {
      const id = String((request.params as Record<string, unknown>).id ?? "");
      if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

      // Linha + counts no mesmo snapshot (par coerente — padrão F2).
      const client = await ctx.db.connect();
      let row: ProjectRow;
      let releaseCount: number;
      let accountCount: number;
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        try {
          const res = await client.query(
            `SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1 AND org_id = $2`,
            [id, request.user!.orgId],
          );
          const found = res.rows[0] as ProjectRow | undefined;
          if (!found) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§5)
          row = found;
          releaseCount = await releaseCountOf(client, request.user!.orgId, id);
          accountCount = await accountCountOf(client, request.user!.orgId, id);
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw err;
        }
      } finally {
        client.release();
      }
      return reply.code(200).send(toResource(row, releaseCount, accountCount));
    });

    // --------------------------------------------------------------- PATCH
    app.patch(
      "/api/v1/projects/:id",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: patchProjectSchema },
      async (request, reply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });
        if (request.body == null) throw validationError({ fields: ["body"] });
        const body = request.body as { name?: string };
        if (body.name === undefined) throw validationError({ fields: ["body"] }); // ≥1 campo

        // Edita SOMENTE name local (GRP-PRJ-01 "Editar"); org no PRÓPRIO
        // predicado (§5 — nunca "busca e altera" em dois passos).
        const name = assertTrimmedLength(body.name, "name", NAME_MAX);
        const orgId = request.user!.orgId;

        const client = await ctx.db.connect();
        let row: ProjectRow;
        let releaseCount: number;
        let accountCount: number;
        try {
          await client.query("BEGIN");
          try {
            const res = await client.query(
              `UPDATE projects SET name = $3, updated_at = $4
                WHERE id = $1 AND org_id = $2
                RETURNING ${PROJECT_COLUMNS}`,
              [id, orgId, name, ctx.clock.now()],
            );
            const found = res.rows[0] as ProjectRow | undefined;
            if (!found) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§5)
            row = found;
            // Counts no MESMO snapshot da resposta (shape uniforme §3.1).
            releaseCount = await releaseCountOf(client, orgId, id);
            accountCount = await accountCountOf(client, orgId, id);
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
          }
        } finally {
          client.release();
        }
        return reply.code(200).send(toResource(row, releaseCount, accountCount));
      },
    );

    // ------------------------------------------------------ DELETE (D19)
    // D19 RATIFICADA (§0.1): exclusão SÓ de projeto VAZIO. Dentro da
    // transação: COUNT de releases vinculadas (org no predicado); 0 → hard
    // delete da linha → 204 sem corpo; ≥1 → 409 PROJECT_NOT_EMPTY corpo
    // genérico FIXO (D21) e NENHUMA coluna muda (nem updated_at — oráculo
    // T4b); delete de não-vazio PENDENTE DEC-16; massa FORA sempre (D10).
    // Repetição/alheio (vazio ou NÃO-VAZIO — o COUNT é org-scoped, o 409 só é
    // alcançável dentro da própria org) → 404 genérico byte a byte (§5).
    // FK RESTRICT (D20) = defesa-de-profundidade da corrida §9.3 (T13).
    // Guard D6 por uniformidade (§3.4) — DELETE também exige media type json.
    app.delete(
      "/api/v1/projects/:id",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      async (request, reply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });
        const orgId = request.user!.orgId;

        const client = await ctx.db.connect();
        let rowCount = 0;
        try {
          try {
            await client.query("BEGIN");
            // Gate primário (§9.2): estado vazio avaliado POR CHAMADA (T4c).
            const countRes = await client.query(
              "SELECT count(*)::int AS n FROM releases WHERE project_uuid = $1 AND org_id = $2",
              [id, orgId],
            );
            const linked = Number((countRes.rows[0] as { n?: number } | undefined)?.n ?? 0);
            if (linked > 0) throw projectNotEmpty(); // rollback no catch; nada muda
            const res = await client.query("DELETE FROM projects WHERE id = $1 AND org_id = $2", [
              id,
              orgId,
            ]);
            rowCount = res.rowCount ?? 0;
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            // Corrida §9.3/T13: release vinculada ENTRE o COUNT e o DELETE →
            // FK RESTRICT (23503 no banco real; mensagem FK no pg-mem) →
            // mesmo 409 do gate primário, nunca 500.
            if (isProjectFkViolation(err)) throw projectNotEmpty();
            throw err;
          }
        } finally {
          client.release();
        }
        if (rowCount === 0) throw tenantForbidden(); // inexistente ≡ alheio (§5)
        return reply.code(204).send(); // sem corpo
      },
    );
  };
}
