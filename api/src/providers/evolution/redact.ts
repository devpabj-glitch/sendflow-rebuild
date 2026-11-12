// FUNCAO UNICA de redacao do payload de webhook da Evolution (emenda R1 do
// parecer A4; ENG-09). A Evolution 2.3.7 inclui a propria apikey GLOBAL no
// corpo de TODO webhook (confirmado em producao - ver contrato 5.3/0.1.8):
// qualquer persistencia/log/mensagem que toque payload de webhook passa
// OBRIGATORIAMENTE por redactEvolutionWebhookPayload() — nao existe segundo
// caminho de serializacao de payload no codigo.
//
// O que e redigido:
// - campo `apikey` (qualquer profundidade): REMOVIDO (o jsonb gravado nao tem
//   a chave; T8 verifica por oraculo SQL);
// - `qrcode.{base64, code, pairingCode}`: ANULADOS — o QR nao persiste em
//   NENHUMA forma (D4/F7-D4): nem a imagem (base64, ~13KB data URL) nem o
//   token de pareamento (`code` "2@..." / `pairingCode`); a forma do objeto e
//   mantida (campos null) para a auditoria continuar legivel (count etc.).
// destination/server_url/sender NAO sao segredos e permanecem.
export const EVOLUTION_REDACTED_APIKEY_FIELD = "apikey";
export const EVOLUTION_REDACTED_QRCODE_OBJECT = "qrcode";
/** Campos do QR anulados na redação (imagem + token de pareamento — D4). */
export const EVOLUTION_REDACTED_QRCODE_FIELDS = ["base64", "code", "pairingCode"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Devolve copia profunda do payload com `apikey` removido em qualquer
 * nivel e `qrcode.base64` anulado. O original nao e mutado.
 */
export function redactEvolutionWebhookPayload<T>(payload: T): T {
  return redactValue(payload) as T;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (!isPlainObject(value)) {
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key === EVOLUTION_REDACTED_APIKEY_FIELD) {
      continue; // removido por inteiro (campo ausente no jsonb/log)
    }
    if (key === EVOLUTION_REDACTED_QRCODE_OBJECT && isPlainObject(inner)) {
      out[key] = redactQrcode(inner);
      continue;
    }
    out[key] = redactValue(inner);
  }
  return out;
}

function redactQrcode(qrcode: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(qrcode)) {
    out[key] = (EVOLUTION_REDACTED_QRCODE_FIELDS as readonly string[]).includes(key)
      ? null
      : redactValue(inner);
  }
  return out;
}
