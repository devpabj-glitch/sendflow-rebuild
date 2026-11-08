// Rate limit do login (contrato §5.3 — contrato técnico NOVO por D3; valores D1:
// 5 falhas / janela 300 s / bloqueio 900 s). Relógio falso avança o tempo sem sleeps.
// Correções pós-auditoria A3 cobertas aqui: rate limit do register por IP,
// agregado por IP para falhas de login (stuffing) e varredura de expiração do Map.
import { beforeEach, describe, expect, it } from "vitest";
import { LoginRateLimiter } from "../src/auth/rateLimit.js";
import {
  createHarness,
  FakeClock,
  loginInject,
  registerTenant,
  type TestHarness,
} from "./helpers.js";

const WINDOW_MS = 300_000;
const BLOCK_MS = 900_000;

describe("janela de bloqueio por tentativas (D1: 5/300s/900s)", () => {
  let h: TestHarness;
  beforeEach(async () => {
    h = await createHarness();
    await registerTenant(h.app, {
      email: "alvo@test.invalid",
      password: "senha-super-secreta",
      orgName: "Org Alvo",
    });
  });

  it("5 falhas → 6ª tentativa recebe 429 AUTH_RATE_LIMITED com Retry-After — mesmo com a senha CORRETA", async () => {
    for (let i = 1; i <= 5; i++) {
      const res = await loginInject(h.app, "alvo@test.invalid", "senha-errada-" + i);
      expect(res.statusCode).toBe(401); // falhas 1–5: 401 AUTH_INVALID_CREDENTIALS
      expect((res.json() as { error: { code: string } }).error.code).toBe("AUTH_INVALID_CREDENTIALS");
    }

    // 6ª com a senha correta: 429 (bloqueio não revela se a senha está certa).
    const blocked = await loginInject(h.app, "alvo@test.invalid", "senha-super-secreta");
    expect(blocked.statusCode).toBe(429);
    const body = blocked.json() as { error: { code: string } };
    expect(body.error.code).toBe("AUTH_RATE_LIMITED");

    const retryAfter = Number(blocked.headers["retry-after"]);
    expect(Number.isFinite(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(BLOCK_MS / 1000);
    await h.app.close();
  });

  it("após o bloqueio expirar (relógio > 900s), o login volta a funcionar", async () => {
    for (let i = 0; i < 5; i++) {
      await loginInject(h.app, "alvo@test.invalid", "senha-errada-" + i);
    }
    const blocked = await loginInject(h.app, "alvo@test.invalid", "senha-super-secreta");
    expect(blocked.statusCode).toBe(429);

    h.clock.advanceMs(BLOCK_MS + 1_000); // bloqueio (900s) E janela (300s) expirados

    const ok = await loginInject(h.app, "alvo@test.invalid", "senha-super-secreta");
    expect(ok.statusCode).toBe(200);
    await h.app.close();
  });

  it("sucesso limpa a janela: 4 falhas + sucesso + 4 falhas → ainda NÃO bloqueia; a 5ª falha pós-reset bloqueia a seguinte", async () => {
    for (let i = 0; i < 4; i++) {
      await loginInject(h.app, "alvo@test.invalid", "senha-errada-" + i);
    }
    const ok = await loginInject(h.app, "alvo@test.invalid", "senha-super-secreta");
    expect(ok.statusCode).toBe(200); // sucesso zera o contador

    // 4 novas falhas: sem o reset, a contagem acumulada (8) já teria bloqueado.
    for (let i = 0; i < 4; i++) {
      const res = await loginInject(h.app, "alvo@test.invalid", "errada-apos-reset-" + i);
      expect(res.statusCode).toBe(401); // não bloqueou — janela foi limpa pelo sucesso
    }
    // 5ª falha pós-reset: 401 (ainda não bloqueada ao TENTAR) e arma o bloqueio…
    const fifth = await loginInject(h.app, "alvo@test.invalid", "quinta-falha-x");
    expect(fifth.statusCode).toBe(401);
    // …então a 6ª tentativa é 429.
    const sixth = await loginInject(h.app, "alvo@test.invalid", "senha-super-secreta");
    expect(sixth.statusCode).toBe(429);
    await h.app.close();
  });

  it("chave é por e-mail|IP: outro e-mail não é afetado pelo bloqueio de um deles", async () => {
    await registerTenant(h.app, { email: "outro@test.invalid", password: "senha-super-secreta" });
    for (let i = 0; i < 6; i++) {
      await loginInject(h.app, "alvo@test.invalid", "senha-errada-" + i);
    }
    const blocked = await loginInject(h.app, "alvo@test.invalid", "senha-super-secreta");
    expect(blocked.statusCode).toBe(429);

    const other = await loginInject(h.app, "outro@test.invalid", "senha-super-secreta");
    expect(other.statusCode).toBe(200); // chave separada (e-mail diferente)
    await h.app.close();
  });

  it("janela de 300s: falhas antigas saem da contagem (relógio avança além da janela entre falhas)", async () => {
    // 5 falhas espaçadas de janela+1s: cada uma expira antes da próxima → nunca acumula 5.
    for (let i = 0; i < 5; i++) {
      const res = await loginInject(h.app, "alvo@test.invalid", "errada-lenta-" + i);
      expect(res.statusCode).toBe(401);
      h.clock.advanceMs(WINDOW_MS + 1_000);
    }
    // Sem bloqueio armado: login com a senha CORRETA funciona.
    const ok = await loginInject(h.app, "alvo@test.invalid", "senha-super-secreta");
    expect(ok.statusCode).toBe(200);
    await h.app.close();
  });
});

describe("rate limit do register (por IP — AUTH_REGISTER_*, correção pós-auditoria A3)", () => {
  it("11º registro do mesmo IP na janela → 429 AUTH_RATE_LIMITED; após o bloqueio expirar, volta (relógio falso)", async () => {
    const h = await createHarness(); // default AUTH_REGISTER_RATE_MAX=10 / 300000 / 900000
    const register = (n: number) =>
      h.app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { email: `reg-${n}@test.invalid`, password: "senha-super-secreta", name: `Reg ${n}` },
      });

    // 10 primeiros do mesmo IP: todos criados (o 10º arma o bloqueio mas completa).
    for (let i = 1; i <= 10; i++) {
      const res = await register(i);
      expect(res.statusCode).toBe(201);
    }

    // 11º do mesmo IP dentro da janela: 429 + Retry-After.
    const blocked = await register(11);
    expect(blocked.statusCode).toBe(429);
    const body = blocked.json() as { error: { code: string } };
    expect(body.error.code).toBe("AUTH_RATE_LIMITED");
    const retryAfter = Number(blocked.headers["retry-after"]);
    expect(Number.isFinite(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(BLOCK_MS / 1000);

    // Bloqueio (900s) e janela (300s) expirados no relógio falso → register volta.
    h.clock.advanceMs(BLOCK_MS + 1_000);
    const after = await register(12);
    expect(after.statusCode).toBe(201);
    await h.app.close();
  });
});

describe("agregado por IP para falhas de login (stuffing — AUTH_LOGIN_IP_*, correção pós-auditoria A3)", () => {
  it("falhas com e-mails DIFERENTES do mesmo IP: limiter por e-mail não pega; agregado por IP bloqueia (env reduzido: max 3)", async () => {
    // AUTH_LOGIN_IP_RATE_MAX=3 via env no teste (produção: 30 por 300000 ms).
    const h = await createHarness({ AUTH_LOGIN_IP_RATE_MAX: "3" });

    // 3 falhas com e-mails distintos: nenhuma chave e-mail|IP acumula 5 → todas 401.
    for (let i = 1; i <= 3; i++) {
      const res = await loginInject(h.app, `stuffing-${i}@test.invalid`, "senha-errada-" + i);
      expect(res.statusCode).toBe(401);
      expect((res.json() as { error: { code: string } }).error.code).toBe("AUTH_INVALID_CREDENTIALS");
    }

    // 4º e-mail inédito do MESMO IP: agregado por IP já armado → 429 (sem Retry-After divergente).
    const blocked = await loginInject(h.app, "stuffing-4@test.invalid", "senha-errada-4");
    expect(blocked.statusCode).toBe(429);
    expect((blocked.json() as { error: { code: string } }).error.code).toBe("AUTH_RATE_LIMITED");
    const retryAfter = Number(blocked.headers["retry-after"]);
    expect(Number.isFinite(retryAfter)).toBe(true);
    expect(retryAfter).toBeLessThanOrEqual(BLOCK_MS / 1000);
    await h.app.close();
  });
});

describe("varredura de expiração do Map (cap de crescimento — correção pós-auditoria A3)", () => {
  it("a cada 64 checks, entradas totalmente expiradas saem do Map", () => {
    const clock = new FakeClock();
    const limiter = new LoginRateLimiter({ max: 5, windowMs: WINDOW_MS, blockMs: BLOCK_MS }, clock);
    const entriesOf = (l: LoginRateLimiter): Map<string, unknown> =>
      (l as unknown as { entries: Map<string, unknown> }).entries;

    // 200 chaves com 1 falha cada (não arma bloqueio — max 5).
    for (let i = 0; i < 200; i++) {
      limiter.recordFailure(`u${i}@test.invalid`, `10.0.${Math.floor(i / 250)}.${i % 250}`);
    }
    expect(entriesOf(limiter).size).toBe(200);

    clock.advanceMs(WINDOW_MS + 1_000); // tudo expira (falhas e bloqueios)

    // 63 checks: abaixo do gatilho (64) — entradas órfãs permanecem.
    for (let i = 0; i < 63; i++) limiter.check(`probe-${i}@test.invalid`, "10.9.9.9");
    expect(entriesOf(limiter).size).toBe(200);

    // 64º check: varredura remove TODAS as entradas totalmente expiradas.
    limiter.check("probe-63@test.invalid", "10.9.9.9");
    expect(entriesOf(limiter).size).toBe(0);
  });
});
