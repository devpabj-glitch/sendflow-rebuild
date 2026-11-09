// Rotas de grupos (Fatia 5 - GRU; contrato docs/contracts/FATIA-05-GRUPOS-
// CONTRATO.md com D15-D18 aplicadas na §0.1; parecer A4 ADERENTE).
// Recurso PLANO /api/v1/groups (D18): releaseId viaja no body do POST e como
// filtro opcional na lista - a tela GroupSearch exige lista global por org.
// AMARRA DEC-06 legado: cheio = cheioManual OR (limitPessoas != null AND
// participants >= limitPessoas) - OR sem precedencia, cada sinal basta;
// DERIVADO NA LEITURA (nunca coluna, nunca aceito em body). Cliques nunca
// ocupam vaga (PM regra 7; VGC-05).
// seq = ordinal de criacao DENTRO da release (created_at ASC, id ASC),
// DERIVADO na leitura (nunca coluna); novo grupo entra no fim sem renumerar;
// DELETE (D16 ratificado: 204; repeticao -> 404; massa FORA sempre) decai
// ordinais posteriores - declarado no contrato §9.7.
// clicks/participants: NENHUM endpoint desta fatia os escreve (fonte futura
// e provedor/eventos - FLX/VGC); nascem 0 e so leitura existe.
// releaseId (POST): DEVE existir E ser da MESMA org -> senao 400 generico
// fields ["releaseId"] (padrao D13 accountIds - nao revela qual nem por quê).
// releaseId (lista): bem-formado alheio/inexistente -> 200 vazio honesto
// (PADRAO NOVO documentado no contrato §3.3 para a A2); malformado -> 400.
// org_id vem EXCLUSIVAMENTE da sessao (requireAuth) - nunca do body/query.
// Mutacoes (POST/PATCH/acoes/DELETE) exigem Content-Type application/json
// (D6 - lib/contentType.ts); DELETE sem corpo passa pelo guard por
// uniformidade (contrato §3.4).
// "groups" e keyword NAO-reservada no PostgreSQL real e foi verificada no
// parser do pg-mem (risco §9.1 do contrato NAO materializado).
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { AppContext } from "../app.js";
import type { DbClient } from "../lib/db.js";
import { makeRequireAuth } from "../middleware/requireAuth.js";
import { requireJsonContentType } from "../lib/contentType.js";
import { tenantForbidden, validationError } from "../lib/errors.js";

// Defaults técnicos provisórios (DEC-12 aberta — contrato §3.3/D-PEND-4).
const NAME_MAX = 120;
const GID_MAX = 120;
const LIMIT_PESSOAS_MAX = 100_000;
const SEARCH_MAX = 120;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GROUP_COLUMNS =
  "id, release_id, name, gid, clicks, participants, limit_pessoas, cheio_manual, created_at, updated_at";

// DEC-06 legado (§4.1): predicado plano do sinal de teto — reutilizado no
// filtro cheio=sim|nao (sem OVER/row-constructor: pg-mem não parseia).
const CHEIO_EXPR = "(cheio_manual = true OR (limit_pessoas IS NOT NULL AND participants >= limit_pessoas))";

// Schemas só garantem forma/tipos; trim/comprimento pós-trim e faixa do
// limitPessoas são aplicados no handler (400 VALIDATION_ERROR com
// details.fields — §3.3). additionalProperties:false → org_id/id/releaseId
// (no PATCH)/clicks/participants/cheioManual/cheio/seq → 400.
const createGroupSchema = {
  body: {
    type: "object",
    required: ["releaseId", "name"],
    additionalProperties: false,
    properties: {
      releaseId: { type: "string" },
      name: { type: "string" },
      // null explícito aceito para LIMPAR (POST: equivalente a ausente).
      gid: { type: ["string", "null"] },
      limitPessoas: { type: ["integer", "null"] },
    },
  },
} as const;

const patchGroupSchema = {
  body: {
    type: "object",
    additionalProperties: false, // releaseId NUNCA em body (imutável) → 400
    properties: {
      name: { type: "string" },
      gid: { type: ["string", "null"] },
      limitPessoas: { type: ["integer", "null"] },
    },
  },
} as const;

// type alias (não interface): sem assinatura de índice implícita, o cast de
// Record<string, unknown> das rows falharia no tsc (padrão accounts.ts).
type GroupRow = {
  id: string;
  release_id: string;
  name: string;
  gid: string | null;
  clicks: number;
  participants: number;
  limit_pessoas: number | null;
  cheio_manual: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

interface GroupResource {
  id: string;
  releaseId: string;
  name: string;
  gid: string | null;
  seq: number | null;
  clicks: number;
  participants: number;
  limitPessoas: number | null;
  cheioManual: boolean;
  cheio: boolean; // DERIVADO (§4.1) — somente leitura
  createdAt: string;
  updatedAt: string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

// DEC-06 legado (§4.1): cheio = manual OU teto — transcrição da expressão
// de leitura; nenhum sinal deriva do outro.
function isCheio(row: GroupRow): boolean {
  return (
    row.cheio_manual === true ||
    (row.limit_pessoas !== null && Number(row.participants) >= Number(row.limit_pessoas))
  );
}

// Recurso flat (contrato §3.1): camelCase; vocabulário DEC-06 (cheio,
// cheioManual, limitPessoas); timestamps ISO-8601 UTC; seq derivada (§4.2)
// — null em listas sem releaseId único.
function toResource(row: GroupRow, seq: number | null): GroupResource {
  return {
    id: String(row.id),
    releaseId: String(row.release_id),
    name: String(row.name),
    gid: row.gid === null ? null : String(row.gid),
    seq,
    clicks: Number(row.clicks),
    participants: Number(row.participants),
    limitPessoas: row.limit_pessoas === null || row.limit_pessoas === undefined ? null : Number(row.limit_pessoas),
    cheioManual: row.cheio_manual === true,
    cheio: isCheio(row),
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
 * gid: TRIM APENAS (decisão declarada — NÃO normaliza caixa: formato de GID
 * não é especificado e o produto não demonstrou normalização; a busca é CI
 * via lower() na query). 1..120 pós-trim; sem validação de formato (não
 * inventar — §3.3).
 */
function parseGid(raw: string): string {
  return assertTrimmedLength(raw, "gid", GID_MAX);
}

/** limitPessoas: inteiro 1..100000 (DEC-12 provisório; 0/negativo → 400). */
function parseLimitPessoas(raw: number): number {
  if (!Number.isInteger(raw) || raw < 1 || raw > LIMIT_PESSOAS_MAX) {
    throw validationError({ fields: ["limitPessoas"] });
  }
  return raw;
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
 * seq individual (§4.2): COUNT de predecessores do item na SUA release —
 * predicados PLANOS (sem row-constructor, sem OVER — pg-mem não parseia
 * janelas, lição F2/F3). Roda na MESMA transação do chamador (mesmo
 * snapshot). `createdAt`/`id` vêm da linha lida pelo banco (RETURNING), não
 * do relógio da aplicação.
 */
async function seqOf(
  client: DbClient,
  orgId: string,
  releaseId: string,
  createdAt: Date | string,
  id: string,
): Promise<number> {
  const res = await client.query(
    `SELECT count(*)::int AS n FROM groups
      WHERE release_id = $1 AND org_id = $2
        AND (created_at < $3 OR (created_at = $3 AND id < $4))`,
    [releaseId, orgId, createdAt, id],
  );
  return Number((res.rows[0] as { n?: number } | undefined)?.n ?? 0) + 1;
}

/**
 * Mapa id→ordinal da release INTEIRA (§4.2 lista com releaseId único): 1
 * query por página trazendo TODOS os ids ordenados por (created_at ASC,
 * id ASC) — exato sob qualquer filtro/paginação (o ordinal é da release
 * inteira, não do filtro). Escala declarada: nº de grupos da release
 * (contrato §9.4). Sem window function (pg-mem não parseia OVER).
 */
async function seqMapForRelease(
  client: DbClient,
  orgId: string,
  releaseId: string,
): Promise<Map<string, number>> {
  const res = await client.query(
    `SELECT id FROM groups WHERE org_id = $1 AND release_id = $2 ORDER BY created_at ASC, id ASC`,
    [orgId, releaseId],
  );
  const map = new Map<string, number>();
  (res.rows as { id: unknown }[]).forEach((row, index) => {
    map.set(String(row.id), index + 1);
  });
  return map;
}

export function groupsRoutes(ctx: AppContext): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    const requireAuth = makeRequireAuth({ db: ctx.db, clock: ctx.clock });

    // Corpo ausente com Content-Type application/json (contrato §3.4/T13):
    // o parser default do Fastify responde 400 (FST_ERR_CTP_EMPTY_JSON_BODY)
    // para corpo VAZIO; as ações idempotentes (D12) aceitam corpo ausente OU
    // {}. Parser escopado a ESTAS rotas pela encapsulação do plugin — nenhum
    // efeito sobre auth/accounts/releases (mesmo padrão F3).
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
          // Malformado → 400 (mesma semântica do parser default).
          const err = new Error("JSON inválido.") as Error & { statusCode: number };
          err.statusCode = 400;
          done(err, undefined);
        }
      },
    );

    // ------------------------------------------------------------- POST create
    app.post(
      "/api/v1/groups",
      // D6: guard de content-type em preParsing (padrão F2 herdado).
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: createGroupSchema },
      async (request, reply) => {
        const orgId = request.user!.orgId; // EXCLUSIVAMENTE da sessão (ENG-02)
        // Corpo ausente (parser escopado) OU null literal ("null" parseia
        // para null) → 400, nunca 500 no cast (precedente F3).
        if (request.body == null) throw validationError({ fields: ["body"] });
        const body = request.body as {
          releaseId: string;
          name: string;
          gid?: string | null;
          limitPessoas?: number | null;
        };

        if (!UUID_PATTERN.test(body.releaseId)) throw validationError({ fields: ["releaseId"] });
        // Canônico minúsculo (mesma correção pós-auditoria F3 achado 1).
        const releaseId = body.releaseId.toLowerCase();
        const name = assertTrimmedLength(body.name, "name", NAME_MAX);
        const gid = body.gid === undefined || body.gid === null ? null : parseGid(body.gid);
        const limitPessoas =
          body.limitPessoas === undefined || body.limitPessoas === null
            ? null
            : parseLimitPessoas(body.limitPessoas);
        const now = ctx.clock.now();

        // Validação do pai + INSERT + seq NA MESMA transação (§5): ou o
        // grupo nasce com release válida da própria org, ou nada é gravado.
        const client = await ctx.db.connect();
        let row: GroupRow;
        let seq: number;
        try {
          await client.query("BEGIN");
          try {
            // D13 padrão accountIds: existe E é da MESMA org → senão 400
            // GENÉRICO (existente vs. alheia são indistinguíveis na resposta).
            const rel = await client.query(
              "SELECT id FROM releases WHERE id = $1 AND org_id = $2",
              [releaseId, orgId],
            );
            if (rel.rows.length === 0) throw validationError({ fields: ["releaseId"] });
            const res = await client.query(
              `INSERT INTO groups (org_id, release_id, name, gid, limit_pessoas, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $6)
               RETURNING ${GROUP_COLUMNS}`,
              [orgId, releaseId, name, gid, limitPessoas, now],
            );
            row = res.rows[0] as GroupRow;
            seq = await seqOf(client, orgId, row.release_id, row.created_at, row.id);
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
          }
        } finally {
          client.release();
        }
        return reply.code(201).send(toResource(row, seq));
      },
    );

    // -------------------------------------------------------------- GET list
    app.get("/api/v1/groups", { preValidation: requireAuth }, async (request, reply) => {
      const orgId = request.user!.orgId;
      const query = request.query as Record<string, unknown>;

      // releaseId (query): opcional; UUID; bem-formado mas inexistente/alheio
      // ⇒ 200 vazio honesto (PADRÃO NOVO §3.3 — filtro ≠ acesso a recurso).
      let releaseFilter: string | undefined;
      const rawRelease = query.releaseId;
      if (rawRelease !== undefined) {
        if (Array.isArray(rawRelease) || typeof rawRelease !== "string" || !UUID_PATTERN.test(rawRelease)) {
          throw validationError({ fields: ["releaseId"] });
        }
        releaseFilter = rawRelease.toLowerCase();
      }

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

      // cheio: literal 'todos'|'sim'|'nao'; ausente/'todos' = sem filtro.
      let cheioFilter: "sim" | "nao" | undefined;
      const rawCheio = query.cheio;
      if (rawCheio !== undefined) {
        if (Array.isArray(rawCheio) || (rawCheio !== "todos" && rawCheio !== "sim" && rawCheio !== "nao")) {
          throw validationError({ fields: ["cheio"] });
        }
        if (rawCheio !== "todos") cheioFilter = rawCheio;
      }

      const page = parseIntParam(query.page, "page", 1, 1, Number.MAX_SAFE_INTEGER);
      const pageSize = parseIntParam(query.pageSize, "pageSize", PAGE_SIZE_DEFAULT, PAGE_SIZE_MIN, PAGE_SIZE_MAX);

      const params: unknown[] = [orgId];
      let where = "org_id = $1";
      if (releaseFilter !== undefined) {
        params.push(releaseFilter);
        where += ` AND release_id = $${params.length}`;
      }
      if (search !== undefined) {
        // Substring CI em name OU gid (GroupSearch): lower() nas colunas +
        // ILIKE + termo em caixa baixa — determinístico nos dois motores;
        // curingas do termo escapados (F2 §3.2).
        params.push(`%${escapeLikePattern(search.toLowerCase())}%`);
        where += ` AND (lower(name) ILIKE $${params.length} OR lower(gid) ILIKE $${params.length})`;
      }
      if (cheioFilter === "sim") {
        where += ` AND ${CHEIO_EXPR}`;
      } else if (cheioFilter === "nao") {
        where += ` AND NOT ${CHEIO_EXPR}`;
      }

      // Padrão F2 §9.1: COUNT + SELECT da página + mapa ordinal da release
      // no MESMO snapshot (BEGIN ISOLATION LEVEL REPEATABLE READ em cliente
      // fixo). seq só é computada quando a lista filtra UM único releaseId;
      // sem releaseId (busca global) os itens vêm seq:null (§4.2 — sem
      // consumidor na tela GroupSearch; N queries sem consumidor).
      const client = await ctx.db.connect();
      let total: number;
      let items: Record<string, unknown>[];
      let seqMap: Map<string, number> | undefined;
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        try {
          const countRes = await client.query(
            `SELECT count(*)::int AS total FROM groups WHERE ${where}`,
            params,
          );
          const itemsRes = await client.query(
            `SELECT ${GROUP_COLUMNS}
               FROM groups
              WHERE ${where}
              ORDER BY created_at DESC, id DESC
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, pageSize, (page - 1) * pageSize],
          );
          if (releaseFilter !== undefined) {
            seqMap = await seqMapForRelease(client, orgId, releaseFilter);
          }
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
          const groupRow = row as GroupRow;
          return toResource(groupRow, seqMap?.get(String(groupRow.id)) ?? null);
        }),
        total,
        page,
        pageSize,
      });
    });

    // ----------------------------------------------------------- GET by id
    app.get("/api/v1/groups/:id", { preValidation: requireAuth }, async (request, reply) => {
      const id = String((request.params as Record<string, unknown>).id ?? "");
      if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

      const client = await ctx.db.connect();
      let row: GroupRow;
      let seq: number;
      try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        try {
          const res = await client.query(
            `SELECT ${GROUP_COLUMNS} FROM groups WHERE id = $1 AND org_id = $2`,
            [id, request.user!.orgId],
          );
          const found = res.rows[0] as GroupRow | undefined;
          if (!found) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§5)
          row = found;
          seq = await seqOf(client, request.user!.orgId, row.release_id, row.created_at, row.id);
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw err;
        }
      } finally {
        client.release();
      }
      return reply.code(200).send(toResource(row, seq));
    });

    // --------------------------------------------------------------- PATCH
    app.patch(
      "/api/v1/groups/:id",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth], schema: patchGroupSchema },
      async (request, reply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });
        if (request.body == null) throw validationError({ fields: ["body"] });
        const body = request.body as {
          name?: string;
          gid?: string | null;
          limitPessoas?: number | null;
        };

        const orgId = request.user!.orgId;
        const sets: string[] = [];
        const params: unknown[] = [id, orgId];
        const push = (column: string, value: unknown): void => {
          params.push(value);
          sets.push(`${column} = $${params.length}`);
        };

        // Edita SOMENTE o registro local (GRU-07 é fila futura; nenhum
        // efeito externo — DIR-04). releaseId é IMUTÁVEL (campo desconhecido
        // → 400 pelo schema). clicks/participants/cheioManual/cheio JAMAIS
        // em body (idem).
        if (body.name !== undefined) push("name", assertTrimmedLength(body.name, "name", NAME_MAX));
        if (body.gid !== undefined) push("gid", body.gid === null ? null : parseGid(body.gid));
        if (body.limitPessoas !== undefined) {
          push("limit_pessoas", body.limitPessoas === null ? null : parseLimitPessoas(body.limitPessoas));
        }
        if (sets.length === 0) throw validationError({ fields: ["body"] }); // ≥1 campo
        push("updated_at", ctx.clock.now());

        const client = await ctx.db.connect();
        let row: GroupRow;
        let seq: number;
        try {
          await client.query("BEGIN");
          try {
            const res = await client.query(
              `UPDATE groups SET ${sets.join(", ")}
                WHERE id = $1 AND org_id = $2
                RETURNING ${GROUP_COLUMNS}`,
              params,
            );
            const found = res.rows[0] as GroupRow | undefined;
            if (!found) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§5)
            row = found;
            seq = await seqOf(client, orgId, row.release_id, row.created_at, row.id);
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
          }
        } finally {
          client.release();
        }
        return reply.code(200).send(toResource(row, seq));
      },
    );

    // ------------------------------------------- Ações mark-full/mark-not-full
    // D12: AÇÕES idempotentes (GRU-04): setam cheio_manual=true/false e
    // NADA mais (além de updated_at) — contadores, limite, nome, gid,
    // release_id e created_at intocados (teste dirigido T4 com oráculo
    // SQL). Corpo vazio ou {}; nenhuma propriedade é lida; repetir → 200.
    // NÃO dispara gatilho de borda (§0.2.3 — sem consumidor AUT/FIL).
    // Desmarcar manual NÃO elimina o sinal do teto: a resposta devolve
    // cheio:true se o teto segue atingido (DEC-06 legado regra 2).
    const markAction = (cheioManual: boolean) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

        const orgId = request.user!.orgId;
        const client = await ctx.db.connect();
        let row: GroupRow;
        let seq: number;
        try {
          await client.query("BEGIN");
          try {
            const res = await client.query(
              `UPDATE groups SET cheio_manual = $3, updated_at = $4
                WHERE id = $1 AND org_id = $2
                RETURNING ${GROUP_COLUMNS}`,
              [id, orgId, cheioManual, ctx.clock.now()],
            );
            const found = res.rows[0] as GroupRow | undefined;
            if (!found) throw tenantForbidden(); // 404 genérico: inexistente ≡ alheio (§5)
            row = found;
            seq = await seqOf(client, orgId, row.release_id, row.created_at, row.id);
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
          }
        } finally {
          client.release();
        }
        return reply.code(200).send(toResource(row, seq));
      };
    };

    app.post(
      "/api/v1/groups/:id/mark-full",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      markAction(true),
    );
    app.post(
      "/api/v1/groups/:id/mark-not-full",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      markAction(false),
    );

    // ------------------------------------------------------- DELETE (D16)
    // D16 RATIFICADA (§0.1): hard delete da linha LOCAL — nenhum efeito
    // externo afirmado (DIR-04; grupo real é provedor NT). 204 sem corpo;
    // repetição → 404 genérico byte a byte (org no predicado — inexistente ≡
    // alheio). MASSA FORA sempre (D10 + D15 + D16). Efeito declarado §9.7:
    // ordinais seq posteriores na release DECRECEM (derivação sem coluna).
    // Guard D6 por uniformidade (§3.4) — DELETE também exige media type json.
    app.delete(
      "/api/v1/groups/:id",
      { preParsing: [requireJsonContentType], preValidation: [requireAuth] },
      async (request, reply) => {
        const id = String((request.params as Record<string, unknown>).id ?? "");
        if (!UUID_PATTERN.test(id)) throw validationError({ fields: ["id"] });

        // Statement único atômico; tenant no PRÓPRIO predicado (nunca
        // "busca e deleta" em dois passos — §5).
        const res = await ctx.db.query(`DELETE FROM groups WHERE id = $1 AND org_id = $2`, [
          id,
          request.user!.orgId,
        ]);
        if ((res.rowCount ?? 0) === 0) throw tenantForbidden();
        return reply.code(204).send(); // sem corpo
      },
    );
  };
}
