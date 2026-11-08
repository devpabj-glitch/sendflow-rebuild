// Healthcheck (contrato §8) — AUTH isento; revision fecha REL-01.
// Correção pós-auditoria A3: banco PENDURADO (query que nunca resolve) também
// vira 503 db:down pela corrida de timeout (timeout curto injetado no teste).
import { describe, expect, it } from "vitest";
import { brokenPool, createHarness, hangingPool } from "./helpers.js";

describe("GET /api/v1/health", () => {
  it("responde 200 {status:ok, db:up} com revision presente", async () => {
    const { app } = await createHarness();
    const res = await app.inject({ method: "GET", url: "/api/v1/health" });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; revision: string; db: string };
    expect(body.status).toBe("ok");
    expect(body.db).toBe("up");
    expect(typeof body.revision).toBe("string");
    expect(body.revision.length).toBeGreaterThan(0);
    expect(body.revision).toBe("test-rev"); // REVISION injetada (fallback RAILWAY_GIT_COMMIT_SHA em prod)
    await app.close();
  });

  it("responde 503 {status:degraded, db:down} quando o banco cai (processo segue de pé)", async () => {
    const { app } = await createHarness({}, { db: brokenPool() });
    const res = await app.inject({ method: "GET", url: "/api/v1/health" });

    expect(res.statusCode).toBe(503);
    const body = res.json() as { status: string; revision: string; db: string };
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("down");
    expect(body.revision).toBe("test-rev");
    await app.close();
  });

  it("503 db:down quando o banco PENDURA (query nunca resolve): corrida de timeout vence (A3)", async () => {
    const started = Date.now();
    const { app } = await createHarness({}, { db: hangingPool(), dbHealthTimeoutMs: 50 });
    const res = await app.inject({ method: "GET", url: "/api/v1/health" });
    const elapsed = Date.now() - started;

    expect(res.statusCode).toBe(503);
    const body = res.json() as { status: string; revision: string; db: string };
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("down");
    // Perdeu a corrida em ~50ms (teto do timeout injetado) — não pendurou o request.
    expect(elapsed).toBeLessThan(5_000);
    await app.close();
  });
});
