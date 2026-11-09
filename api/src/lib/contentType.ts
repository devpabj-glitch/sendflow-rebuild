// Guard de Content-Type (D6 — decisão do coordenador, ressalva R2 do parecer A4;
// contrato Fatia 2 §3.5): TODA rota mutante (POST/PATCH) exige media type
// application/json — parâmetros como charset são aceitos. Qualquer outro media
// type (text/plain, urlencoded, multipart...) ou header ausente → 400
// VALIDATION_ERROR, rejeitado antes do parser de content-type do Fastify.
//
// Fundamento anti-CSRF: application/json torna a requisição NÃO-simples (spec
// Fetch) e força preflight CORS; origem não autorizada falha no preflight e o
// browser NÃO envia a requisição de fato. Complementa o CORS por origens exatas
// com credentials e a inexistência de GETs mutadores. Sem token CSRF nesta
// fati (avaliação registrada no contrato §3.5).
import type { FastifyReply, FastifyRequest } from "fastify";
import { validationError } from "./errors.js";

/**
 * Hook `preParsing`: aplica a regra D6.
 * FASE (achado #2 do code-review da Fatia 2): preParsing é a fase de rota que
 * roda ANTES do parser de content-type do Fastify — a única que antecede o 415
 * `FST_ERR_CTP_INVALID_MEDIA_TYPE` que o parser devolve para media types sem
 * parser registrado (urlencoded, multipart). Em preValidation (fase anterior
 * desta checagem) o parser já teria encerrado a requisição com 415 antes de
 * qualquer hook; aqui o guard uniformiza: TODO media type não-json → 400
 * VALIDATION_ERROR com details.fields ["content-type"], nunca 415.
 * Precisa devolver uma Promise e repassar o `payload` (o stream do corpo)
 * intacto — nada do corpo é lido aqui; o retorno alimenta o parser seguinte.
 * Ordem com auth (declarada): requireAuth permanece em preValidation — ou seja,
 * para media type NÃO-json o 400 deste guard precede o 401. Essa precedência
 * já existia de fato (o 415 do parser também disparava antes de qualquer
 * hook); para media type json válido o 401 continua vindo primeiro.
 */
export async function requireJsonContentType(
  request: FastifyRequest,
  _reply: FastifyReply,
  payload: unknown,
): Promise<unknown> {
  const raw = request.headers["content-type"];
  const first = Array.isArray(raw) ? raw[0] : raw;
  // Media type = parte antes de ";" (aceita "application/json; charset=utf-8").
  const mediaType = (first ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (mediaType !== "application/json") {
    throw validationError({ fields: ["content-type"] });
  }
  return payload; // stream do corpo passa adiante sem ser lido
}
