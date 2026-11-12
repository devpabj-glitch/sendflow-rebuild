// Rotas de releases (Fatia 3, contrato emendado pela DECISAO D13 do dono -
// ordem direta, precedencia maxima): seguir exatamente a API original
// SendFlow (sendapi). Endpoints POST/GET /api/v1/releases (releases, NAO
// campaigns). Tipos EXATOS: 'WhatsRelease' | 'WhatsList' | 'WhatsViralCampaign'
// - PROIBIDO inventar "Aleatorio"/aleatorio (D13).
// org_id vem EXCLUSIVAMENTE da sessao (requireAuth) - nunca do body/query.
// archived: boolean default false; NUNCA aceito em body - muda so pelas
// acoes idempotentes POST /:id/archive e /:id/unarchive (D12+D13).
// accountIds: tabela de juncao release_accounts; validacao = TODOS existem E
// pertencem a MESMA org (mensagem generica, nao revela quais); duplicatas
// deduplicadas (semantica de conjunto); gravadas NA MESMA transacao.
// projectId: uuid NULL com FK real (Fatia 6 PRJ, D20 - pendencia da D13
// paga): POST/PATCH validam existe E pertence a MESMA org (mensagem generica,
// padrao accountIds); null limpa; resposta devolve uuid|null (contrato §0.2/§3.3).
// Mutações exigem Content-Type application/json (D6 - lib/contentType.ts).
// SEM DELETE (D5), SEM arquivar em massa (D10), SEM unique no nome (D11),
// SEM algoritmo de distribuicao (DEC-03 semantica aberta).
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { AppContext } from "../app.js";
import type { DbClient } from "../lib/db.js";
import { makeRequireAuth } from "../middleware/requireAuth.js";
import { requireJsonContentType } from "../lib/contentType.js";
import { isProjectFkViolation } from "../lib/fk.js";
import { tenantForbidden, validationError } from "../lib/errors.js";

// Defaults técnicos provisórios (DEC-12 aberta — contrato §3.3).
const NAME_MAX = 120;
const SEARCH_MAX = 120;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// D13: enum fechado com os 3 tipos EXATOS da API original (sendapi).
const RELEASE_TYPES = new Set(["WhatsRelease", "WhatsList", "WhatsViralCampaign"]);

const RELEASE_COLUMNS = "id, name, type, project_uuid, archived, created_at, updated_at";

// Schemas só garantem forma/tipos; regras de trim/comprimento pós-trim e o
// enum de type são aplicados no handler (400 VALIDATION_ERROR com
// details.fields — §3.3). additionalProperties:false → org_id/id/archived/
// status/accountId(singular) → 400.
const createReleaseSchema = {
  body: {
    type: "object",
    required: ["name", "type"], // type obrigatório no POST (D13: sem default)
    additionalProperties: false,
    properties: {
      name: { type: "string" },
      type: { type: "string" },
      // null explícito aceito para LIMPAR o projectId (§3.3).
      projectId: { type: ["string", "null"] },
      accountIds: { type: "array", items: { type: "string" } },
    },
  },
} as const;

const patchReleaseSchema = {
  body: {
    type: "object",
    additionalProperties: false, // archived NUNCA em body (D12/D13) → 400
    properties: {
      name: { type: "string" },
      type: { type: "string" },
      projectId: { type: ["string", "null"] },
      accountIds: { type: "array", items: { type: "string" } },
    },
  },
} as const;

type ReleaseRow = {
  id: string;
  name: string;
  type: string;
  project_uuid: string | null;
  archived: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

interface ReleaseResource {
  id: string;
  name: string;
  type: string;
  projectId: string | null;
  archived: boolean;
  accountIds: string[];
  createdAt: string;
  updatedAt: string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

// Recurso flat (contrato §3.1): camelCase; accountIds em ordem lexicográfica
// (determinística entre POST/PATCH/GET); timestamps ISO-8601 UTC.
function toResource(row: ReleaseRow, accountIds: string[]): ReleaseResource {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    projectId: row.project_uuid === null ? null : String(row.project_uuid),
    archived: row.archived === true,
    accountIds: [...accountIds].sort(),
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

/** D13: enum fechado — ausência cai no schema (required); valor fora do
 * conjunto oficial da sendapi → 400 fields ["type"]. */
function assertReleaseType(value: string): string {
  if (!RELEASE_TYPES.has(value)) throw validationError({ fields: ["type"] });
  return value;
}

/**
 * projectId (Fatia 6 PRJ §0.2 — pendência da D13 paga): o CHAMADOR decide o
 * que "ausente" significa (POST: ausente = null; PATCH: ausente = não mexe);
 * null explícito LIMPA (grava NULL); string = UUID (case-insensitive →
 * canônico minúsculo, padrão pós-auditoria F3 achado 1) que deve EXISTIR em
 * projects E pertencer à MESMA org da sessão → senão 400 fields ["projectId"]
 * GENÉRICO (existência vs. org alheia indistinguíveis — padrão accountIds).
 * Roda DENTRO da transação do chamador (mesmo snapshot do INSERT/UPDATE).
 */
async function validateProjectId(
  client: DbClient,
  orgId: string,
  raw: string | null,
): Promise<string | null> {
  if (raw === null) return null;
  if (!UUID_PATTERN.test(raw)) throw validationError({ fields: ["projectId"] });
  const canonical = raw.toLowerCase();
  const res = await client.query("SELECT id FROM projects WHERE id = $1 AND org_id = $2", [
    canonical,
    orgId,
  ]);
  if (res.rows.length === 0) throw validationError({ fields: ["projectId"] }); // mensagem genérica
  return canonical;
}

/**
 * Escapa os curingas do LIKE com a barra invertida — o escape DEFAULT do
 * LIKE/ILIKE no PostgreSQL real (padrão F2 §3.2, ressalva pg-mem §9.1).
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

/**
 * accountIds (D13): dedupe (semântica de conjunto), formato UUID, e TODO id
 * deve existir E pertencer à MESMA org da sessão. Erro único genérico
 * fields ["accountIds"] — não revela QUAIS ids falharam nem por quê
 * (existência vs. org alheia são indistinguíveis na resposta).
 * Devolve a lista em ordem lexicográfica (determinística).
 * Roda DENTRO da transação do chamador (mesmo snapshot do INSERT).
 */
async function validateAccountIds(
  client: DbClient,
  orgId: string,
  raw: string[],
): Promise<string[]> {
  // Achado 1 (pós-auditoria F3): normaliza p/ caixa baixa ANTES do Set —
  // dedupe case-insensitive (uuid maiúsculo+minúsculo = 1 associação) e
  // resposta/junção sempre com ids canônicos minúsculos (UUID_PATTERN aceita
  // ambas as caixas; não-UUID segue como estava e falha no teste abaixo).
  const unique = [...new Set(raw.map((id) => (UUID_PATTERN.test(id) ? id.toLowerCase() : id)))];
  if (unique.some((id) => !UUID_PATTERN.test(id))) {
    throw validationError({ fields: ["accountIds"] });
  }
  if (unique.length === 0) return [];
  const params: unknown[] = [orgId];
  const placeholders = unique
    .map((id) => {
      params.push(id);
      return `$${params.length}`;
    })
    .join(", ");
  const res = await client.query(
    `SELECT id FROM accounts WHERE org_id = $1 AND id IN (${placeholders})`,
    params,
  );
  if (res.rows.length !== unique.length) {
    throw validationError({ fields: ["accountIds"] }); // mensagem genérica
  }
  return unique.sort();
}

/** Lê a junção de N releases de uma vez (por página — não N+1). */
async function fetchAccountIds(client: DbClient, releaseIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>(releaseIds.map((id) => [id, []]));
  if (releaseIds.length === 0) return map;
  const params: unknown[] = [];
  const placeholders = releaseIds
    .map((id) => {
      params.push(id);
      return `$${params.length}`;
    })
    .join(", ");
  const res = await client.query(
    `SELECT release_id, account_id FROM release_accounts WHERE release_id IN (${placeholders})`,
    params,
  );
  for (const row of res.rows as { release_id: unknown; account_id: unknown }[]) {
    const key = String(row.release_id);
    const list = map.get(key);
    if (list) list.push(String(row.account_id));
  }
  for (const list of map.values()) list.sort();
  return map;
}

export function releasesRoutes(ctx: AppContext): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    const requireAuth = makeRequireAuth({ db: ctx.db, clock: ctx.clock });

    // Corpo ausente com Content-Type application/json (contrato §3.4/T11):
    // o parser default do Fastify responde 400 (FST_ERR_CTP_EMPTY_JSON_BODY)
    // para corpo VAZIO; as ações idempotentes (D12) aceitam corpo ausente OU
    // {}. Parser escopado a ESTAS rotas pela encapsulação do plugin — nenhum
    // efeito sobre auth/accounts: corpo vazio → undefined; senão JSON.parse
    // idêntico ao default (malformado → 400 VALIDATION_ERROR pelo handler).
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
          // Malformado → 400 (mesma semântica do parser default: o handler
          // global mapeia o 4xx para VALIDATION_ERROR; sem statusCode seria 500).
          const err = new Error("JSON inválido.") as Error & { statusCode: number };
          err.statusCode = 400;
          done(err, undefined);
        }
      },
    );

    // ------------------------------------------------------------- POST create
    app.post(
      "/api/v1/releases",
      // D6: guard de content-type em preParsing (padrão F2 herdado).
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: createReleaseSchema },
      async (request, reply) => {
        const orgId = request.user!.orgId; // EXCLUSIVAMENTE da sessão (ENG-02)
        // Corpo ausente (parser escopado entrega undefined) OU null literal
        // (JSON "null" parseia para null): sem isso o ajv NÃO valida (Fastify
        // pula validação de body undefined) e o cast abaixo explodiria em
        // 500 — 400 com fields ["body"] (precedente PATCH {}).
        if (request.body == null) throw validationError({ fields: ["body"] });
        const body = request.body as {
          name: string;
          type: string;
          projectId?: string | null;
          accountIds?: string[];
        };

        const name = assertTrimmedLength(body.name, "name", NAME_MAX);
        const type = assertReleaseType(body.type);
        const now = ctx.clock.now();

        // Recurso + vínculo + junção NA MESMA transação (D13/§0.2): ou a
        // release nasce com projeto/associações válidos da própria org, ou
        // nada é gravado.
        const client = await ctx.db.connect();
        try {
          await client.query("BEGIN");
          let row: ReleaseRow;
          let accountIds: string[] = [];
          let projectId: string | null = null; // ausente no POST = nasce sem projeto
          try {
            if (body.projectId !== undefined) {
              projectId = await validateProjectId(client, orgId, body.projectId);
            }
            if (body.accountIds !== undefined) {
              accountIds = await validateAccountIds(client, orgId, body.accountIds);
            }
            const res = await client.query(
              `INSERT INTO releases (org_id, name, type, project_uuid, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $5)
               RETURNING ${RELEASE_COLUMNS}`,
              [orgId, name, type, projectId, now],
            );
            row = res.rows[0] as ReleaseRow;
            for (const accountId of accountIds) {
              await client.query(
                "INSERT INTO release_accounts (release_id, account_id) VALUES ($1, $2)",
                [row.id, accountId],
              );
            }
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            // Corrida §9.3/T13: DELETE concorrente do projeto entre a
            // validação e o INSERT → FK RESTRICT (23503 no banco real;
            // mensagem FK no pg-mem) → 400 genérico, nunca 500.
            if (isProjectFkViolation(err)) throw validationError({ fields: ["projectId"] });
            throw err;
          }
          return reply.code(201).send(toResource(row, accountIds));
        } finally {
          client.release();
        }
      },
    );

    // -------------------------------------------------------------- GET list
    app.get("/api/v1/releases", { preValidation: requireAuth }, async (request, reply) => {
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

      // archived: literal 'true'|'false'; ausente = todas (D13).
      let archived: boolean | undefined;
      const rawArchived = query.archived;
      if (rawArchived !== undefined) {
        if (Array.isArray(rawArchived) || (rawArchived !== "true" && rawArchived !== "false")) {
          throw validationError({ fields: ["archived"] });
        }
        archived = rawArchived === "true";
      }

      const page = parseIntParam(query.page, "page", 1, 1, Number.MAX_SAFE_INTEGER);
      const pageSize = parseIntParam(query.pageSize, "pageSize", PAGE_SIZE_DEFAULT, PAGE_SIZE_MIN, PAGE_SIZE_MAX);

      const params: unknown[] = [orgId];
      let where = "org_id = $1";
      if (search !== undefined) {
        params.push(`%${escapeLikePattern(search)}%`);
        where += ` AND name ILIKE $${params.length}`;
      }
      if (archived !== undefined) {
        params.push(archived);
        where += ` AND archived = $${params.length}`;
      }

      // Padrão F2 §9.1: COUNT + SELECT + agregação da junção no MESMO
      // snapshot (BEGIN ISOLATION LEVEL REPEATABLE READ em cliente fixo).
      // accountIds por página: SEGUNDA query com IN sobre os ids da página
      // (declaração do caminho — não N+1; window function/`count(*) OVER()`
      // não parseia no pg-mem; array_agg em LEFT JOIN ficaria dependente do
      // suporte do pg-mem a agregação de arrays — IN explícito roda nos dois).
      const client = await ctx.db.connect();
      let total: number;
      let items: Record<string, unknown>[];
      let accountMap: Map<string, string[]>;
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        try {
          const countRes = await client.query(
            `SELECT count(*)::int AS total FROM releases WHERE ${where}`,
            params,
          );
          const itemsRes = await client.query(
            `SELECT ${RELEASE_COLUMNS}
               FROM releases
              WHERE ${where}
              ORDER BY created_at DESC, id DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, pageSize, (page - 1) * pageSize],
          );
          const pageIds = (itemsRes.rows as ReleaseRow[]).map((row) => String(row.id));
          accountMap = await fetchAccountIds(client, pageIds);
          await client.query("COMMIT");
          total = Number((countRes.rows[0] as { total?: number } | undefined)?.total ?? 0);
          items = itemsRes.rows;
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw err;
        }
      } finally {
        client.release();
      }

      return reply.code(200).send({
        items: items.map((row) => {
          const releaseRow = row as ReleaseRow;
          return toResource(releaseRow, accountMap.get(String(releaseRow.id)) ?? []);
        }),
        total,
        page,
        pageSize,
      });
    });

    // ----------------------------------------------------------- GET by id
    app.get("/api/v1/releases/:id", { preValidation: requireAuth }, async (request, reply) => {
      const id = String((request.params as Record<string, unknown>).id ?? "");
      if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

      // Recurso + junção no mesmo snapshot (par coerente — padrão F2).
      const client = await ctx.db.connect();
      let row: ReleaseRow | undefined;
      let accountIds: string[] = [];
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        try {
          const res = await client.query(
            `SELECT ${RELEASE_COLUMNS} FROM releases WHERE id = $1 AND org_id = $2`,
            [id, request.user!.orgId],
          );
          row = res.rows[0] as ReleaseRow | undefined;
          if (!row) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§4)
          const map = await fetchAccountIds(client, [String(row.id)]);
          accountIds = map.get(String(row.id)) ?? [];
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw err;
        }
      } finally {
        client.release();
      }
      return reply.code(200).send(toResource(row, accountIds));
    });

    // --------------------------------------------------------------- PATCH
    app.patch(
      "/api/v1/releases/:id",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: patchReleaseSchema },
      async (request, reply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

        // Corpo ausente (parser escopado) OU null literal: idem POST — 400, nunca 500.
        if (request.body == null) throw validationError({ fields: ["body"] });
        const body = request.body as {
          name?: string;
          type?: string;
          projectId?: string | null;
          accountIds?: string[];
        };

        const orgId = request.user!.orgId;
        const sets: string[] = [];
        const params: unknown[] = [id, orgId];
        const push = (column: string, value: unknown): void => {
          params.push(value);
          sets.push(`${column} = $${params.length}`);
        };

        // Validações idênticas ao POST (§3.3); só campos fornecidos.
        // projectId: validado DENTRO da transação (abaixo) — o push acontece
        // lá para manter a ordem posicional dos parâmetros do UPDATE.
        if (body.name !== undefined) push("name", assertTrimmedLength(body.name, "name", NAME_MAX));
        if (body.type !== undefined) push("type", assertReleaseType(body.type));
        const wantsProjectId = body.projectId !== undefined;
        const hasAccountIds = body.accountIds !== undefined;
        if (sets.length === 0 && !wantsProjectId && !hasAccountIds) {
          throw validationError({ fields: ["body"] }); // ≥1 campo
        }
        push("updated_at", ctx.clock.now());

        // accountIds tem semântica REPLACE (D13): substitui o conjunto por
        // inteiro (delete + insert) NA MESMA transação do UPDATE.
        const client = await ctx.db.connect();
        let row: ReleaseRow;
        let accountIds: string[] = [];
        try {
          await client.query("BEGIN");
          try {
            if (hasAccountIds) {
              accountIds = await validateAccountIds(client, orgId, body.accountIds!);
            }
            // §0.2: null limpa (NULL); uuid validado existe+mesma-org → senão
            // 400 genérico; ausente = não mexe (decidido acima).
            if (wantsProjectId) {
              push("project_uuid", await validateProjectId(client, orgId, body.projectId!));
            }
            const res = await client.query(
              `UPDATE releases SET ${sets.join(", ")}
                WHERE id = $1 AND org_id = $2
                RETURNING ${RELEASE_COLUMNS}`,
              params,
            );
            const found = res.rows[0] as ReleaseRow | undefined;
            if (!found) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§4)
            row = found;
            if (hasAccountIds) {
              await client.query("DELETE FROM release_accounts WHERE release_id = $1", [row.id]);
              for (const accountId of accountIds) {
                await client.query(
                  "INSERT INTO release_accounts (release_id, account_id) VALUES ($1, $2)",
                  [row.id, accountId],
                );
              }
            } else {
              // Sem accountIds no PATCH: devolve o conjunto vigente (inalterado).
              const map = await fetchAccountIds(client, [String(row.id)]);
              accountIds = map.get(String(row.id)) ?? [];
            }
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            // Corrida §9.3/T13: DELETE concorrente do projeto entre a
            // validação e o UPDATE → FK RESTRICT → 400 genérico, nunca 500.
            if (isProjectFkViolation(err)) throw validationError({ fields: ["projectId"] });
            throw err;
          }
        } finally {
          client.release();
        }
        return reply.code(200).send(toResource(row, accountIds));
      },
    );

    // ---------------------------------------------- Ações archive/unarchive
    // D12 (ratificada pela D13): AÇÕES idempotentes POST /:id/archive e
    // /:id/unarchive setam archived=true/false. Corpo vazio ou {} — nenhuma
    // propriedade é lida; Content-Type application/json segue obrigatório
    // (D6). Tenant no predicado do próprio UPDATE (§4, padrão F2).
    const archiveAction = (archived: boolean) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

        const client = await ctx.db.connect();
        let row: ReleaseRow;
        let accountIds: string[] = [];
        try {
          await client.query("BEGIN");
          try {
            const res = await client.query(
              `UPDATE releases SET archived = $3, updated_at = $4
                WHERE id = $1 AND org_id = $2
                RETURNING ${RELEASE_COLUMNS}`,
              [id, request.user!.orgId, archived, ctx.clock.now()],
            );
            const found = res.rows[0] as ReleaseRow | undefined;
            if (!found) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§4)
            row = found;
            const map = await fetchAccountIds(client, [String(row.id)]);
            accountIds = map.get(String(row.id)) ?? [];
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
          }
        } finally {
          client.release();
        }
        return reply.code(200).send(toResource(row, accountIds));
      };
    };

    app.post(
      "/api/v1/releases/:id/archive",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      archiveAction(true),
    );
    app.post(
      "/api/v1/releases/:id/unarchive",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      archiveAction(false),
    );
  };
}
