// GET /api/v1/health (contrato §8): sem autenticação, sem toque em dados de tenant.
// revision fecha REL-01 (commit → deploy → checagem pública da mesma revisão).
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { AppContext } from "../app.js";

export function healthRoutes(ctx: AppContext): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get("/api/v1/health", async (_request, reply) => {
      // Correção pós-auditoria A3 (banco pendurado): o SELECT 1 corre contra um
      // timeout curto — quem perder a corrida define db "down" (503). A query
      // perdedora tem o erro absorvido para nunca virar unhandled rejection.
      let timer: NodeJS.Timeout | undefined;
      try {
        const query = ctx.db.query("SELECT 1");
        query.catch(() => undefined);
        await Promise.race([
          query,
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("healthcheck: timeout do SELECT 1")),
              ctx.dbHealthTimeoutMs,
            );
          }),
        ]);
        return reply.code(200).send({ status: "ok", revision: ctx.config.revision, db: "up" });
      } catch {
        // Banco inacessível (ou pendurado) nunca derruba o processo: 503 degraded.
        return reply.code(503).send({ status: "degraded", revision: ctx.config.revision, db: "down" });
      } finally {
        clearTimeout(timer);
      }
    });
  };
}
