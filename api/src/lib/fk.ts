// Detecção de violação de FK do vínculo projeto→release (corrida declarada no
// contrato da Fatia 6 PRJ §9.3/T13): o PostgreSQL real sinaliza com código
// 23503; o pg-mem APLICA a FK RESTRICT mas não popula `code` — só a mensagem
// "violates foreign key constraint" nomeando a constraint
// releases_project_uuid_fkey (comportamento observado em probe offline e
// registrado em DEV/VERIFY.md; a via FK é defesa-de-profundidade — o gate
// primário é o COUNT na transação da API, §9.2).
// A checagem por mensagem casa as duas formas SEM confundir com a FK de
// org_id (releases_org_id_fkey — não contém "project"): quem chama decide o
// mapeamento (DELETE de projeto → 409 PROJECT_NOT_EMPTY; INSERT/PATCH de
// release → 400 fields ["projectId"] — nunca 500).
export function isProjectFkViolation(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  const message = String(e?.message ?? "");
  if (e?.code !== "23503" && !/foreign key/i.test(message)) return false;
  return /project/i.test(message);
}
