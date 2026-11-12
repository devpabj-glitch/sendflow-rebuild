// Aplicação de EVIDÊNCIA de estado do provedor Evolution à conta (F7-D3,
// DIR-04): ÚNICA forma de mutar connection_status/phone/phone_jid fora da
// criação da conta. Chamada pelas rotas de conexão (resposta do provedor no
// mesmo request — §0.1.3) e pelo webhook (mapeamento D4 — §5.3). Falhas de
// chamada ao provedor NUNCA chegam aqui (viram 502/503 antes, sem mutar).
import type { Clock } from "./time.js";
import type { QueryExecutor } from "./db.js";

export type ConnectionStatus =
  | "nao_conectada"
  | "aguardando_qr"
  | "conectada"
  | "desconectada"
  | "banida";

/** Evidência colhida de resposta/webhook do provedor. */
export interface ConnectionEvidence {
  status: Exclude<ConnectionStatus, "nao_conectada">; // nunca escrito por rotas
  /** JID completo do dono quando conhecido (ex.: 5511999999999@s.whatsapp.net). */
  phoneJid?: string | null;
  /** Parte local do JID (ex.: 5511999999999); ausente = preserva o último. */
  phone?: string | null;
}

/**
 * Escreve a evidência: status sempre; phone/phone_jid preservados quando a
 * evidência não os traz (COALESCE — §0.1.2: phone persiste após
 * desconectada/banida como último número conhecido). updated_at anda
 * (aplicação). Sem QR em nenhuma coluna (D4).
 */
export async function applyConnectionEvidence(
  deps: { db: QueryExecutor; clock: Clock },
  accountId: string,
  evidence: ConnectionEvidence,
): Promise<void> {
  await deps.db.query(
    `UPDATE accounts
        SET connection_status = $2,
            phone_jid = COALESCE($3::text, phone_jid),
            phone = COALESCE($4::text, phone),
            updated_at = $5
      WHERE id = $1`,
    [
      accountId,
      evidence.status,
      evidence.phoneJid ?? null,
      evidence.phone ?? null,
      deps.clock.now(),
    ],
  );
}
