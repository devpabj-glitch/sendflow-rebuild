// Webhook de entrada da Evolution 2.3.7 (F7-D6, contrato §5): POST
// /api/v1/webhooks/evolution — SEM sessão (servidor-a-servidor). Autentica
// pelo header x-grupos-evo-secret (comparação em tempo constante); resolve o
// tenant EXCLUSIVAMENTE pelo instanceName → conta → org_id (ENG-02: nada do
// body é confiado). Toda auditoria/log passa pela FUNÇÃO ÚNICA de redação
// (R1: providers/evolution/redact.ts) — a Evolution inclui a apikey global
// no corpo de todo webhook. Respostas: 401 secret; 400 body/CT; 204
// instância desconhecida (auditada); 200 {} processado (política anti-storm:
// falha interna pós-validação é logada + respondida 200, §5.2.4).
import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { AppContext } from "../../app.js";
import { jidLocalPart } from "../../providers/evolution/instance.js";
import { redactEvolutionWebhookPayload } from "../../providers/evolution/redact.js";
import { applyConnectionEvidence, type ConnectionEvidence } from "../../lib/connectionEvidence.js";
import { requireJsonContentType } from "../../lib/contentType.js";
import { evolutionWebhookSecretInvalid, validationError } from "../../lib/errors.js";

/** Comparação em tempo constante via digest sha256 (não vaza comprimento). */
function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Mapeamento D4 (contrato §5.3) — leitura defensiva: campos ausentes ou
 * inesperados NUNCA quebram o processamento. Retorna null quando o evento
 * não carrega evidência de estado (audit only: connecting/refused, QR de
 * limite, eventos fora do par CONNECTION_UPDATE/QRCODE_UPDATED — §0.1.6/9).
 */
export function evidenceOfWebhookEvent(event: string, data: unknown): ConnectionEvidence | null {
  const record = isRecord(data) ? data : null;

  if (event === "CONNECTION_UPDATE" && record) {
    const state = typeof record.state === "string" ? record.state : null;
    if (state === "open") {
      // wuid = JID completo do dono (ex.: 5511…@s.whatsapp.net).
      const wuid = typeof record.wuid === "string" && record.wuid.length > 0 ? record.wuid : null;
      return {
        status: "conectada",
        phoneJid: wuid,
        phone: wuid === null ? undefined : jidLocalPart(wuid),
      };
    }
    if (state === "close") {
      // statusReason 401/403 = sessão morta/banida (D4); numérico ou string.
      const rawReason = record.statusReason;
      const reason =
        typeof rawReason === "number"
          ? rawReason
          : typeof rawReason === "string" && /^\d+$/.test(rawReason)
            ? Number(rawReason)
            : null;
      return { status: reason === 401 || reason === 403 ? "banida" : "desconectada" };
    }
    return null; // connecting/outros → audit only
  }

  if (event === "QRCODE_UPDATED" && record) {
    const qrcode = isRecord(record.qrcode) ? record.qrcode : null;
    const base64 = qrcode ? qrcode.base64 : undefined;
    if (typeof base64 === "string" && base64.length > 0) {
      return { status: "aguardando_qr" }; // QR NÃO persiste (D4)
    }
    return null; // "QR code limit reached" (§0.1.6) → sem mudança
  }

  return null; // fora do par → audit only + 200 (§0.1.9)
}

export function evolutionWebhookRoutes(ctx: AppContext): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.post(
      "/api/v1/webhooks/evolution",
      // Guard CT uniforme (D6 herdado): a Evolution sempre posta JSON; media
      // type diverso → 400 ANTES de qualquer efeito (sem storm de retry).
      { preParsing: [requireJsonContentType] },
      async (request, reply) => {
        // (1) Secret em tempo constante; env vazia = TUDO inválido (§5.1.1).
        const expected = ctx.config.evolutionWebhookSecret;
        const rawProvided = request.headers["x-grupos-evo-secret"];
        const provided = Array.isArray(rawProvided) ? rawProvided[0] : rawProvided;
        if (
          expected === "" ||
          typeof provided !== "string" ||
          !secretsMatch(provided, expected)
        ) {
          throw evolutionWebhookSecretInvalid();
        }

        // (2) Schema mínimo {event, instance} — extras aceitos (§5.1.3).
        const body = request.body;
        if (!isRecord(body)) throw validationError({ fields: ["event", "instance"] });
        const { event, instance } = body;
        if (
          typeof event !== "string" ||
          event.length === 0 ||
          typeof instance !== "string" ||
          instance.length === 0
        ) {
          throw validationError({ fields: ["event", "instance"] });
        }

        // (3) R1: a partir daqui o payload que circula (auditoria/log) é
        // SEMPRE o redigido — apikey removida, qrcode.base64 anulada.
        const redactedPayload = redactEvolutionWebhookPayload(request.body);

        // (4) Tenant pelo instanceName (UNIQUE global) — nunca do body (ENG-02).
        const found = await ctx.db.query(
          "SELECT id, org_id FROM accounts WHERE evolution_instance_name = $1",
          [instance],
        );
        const account = found.rows[0] as { id: string; org_id: string } | undefined;

        // §5.2.4: falha interna pós-validação NÃO vira resposta de erro
        // (anti-storm de retry) — loga (payload já redigido) e responde 200.
        try {
          if (!account) {
            // Instância desconhecida: auditada com org/account NULL → 204.
            await ctx.db.query(
              `INSERT INTO integration_events (org_id, account_id, event_type, payload)
               VALUES (NULL, NULL, 'UNKNOWN_INSTANCE', $1)`,
              [redactedPayload],
            );
            return reply.code(204).send();
          }

          // Auditoria primeiro (§5.2.3), depois o estado (write only com evidência).
          await ctx.db.query(
            `INSERT INTO integration_events (org_id, account_id, event_type, payload)
             VALUES ($1, $2, $3, $4)`,
            [account.org_id, account.id, event, redactedPayload],
          );

          const evidence = evidenceOfWebhookEvent(event, body.data);
          if (evidence) {
            await applyConnectionEvidence(
              { db: ctx.db, clock: ctx.clock },
              String(account.id),
              evidence,
            );
          }
          return reply.code(200).send({});
        } catch (err) {
          request.log.error(
            {
              err: err instanceof Error ? { name: err.name, message: err.message } : String(err),
              event,
              instance,
              payload: redactedPayload, // R1: nunca o payload cru
            },
            "falha ao processar webhook evolution (respondido 200 anti-storm)",
          );
          return reply.code(200).send({});
        }
      },
    );
  };
}
