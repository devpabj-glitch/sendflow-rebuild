// Isolamento de tenant (ENG-02 / TEN-01 — PARCIAL nesta fatia).
//
// LIMITAÇÃO DECLARADA (contrato §12/§14.3): nesta fatia NÃO existem endpoints
// com ID de recurso de outro tenant (produtos chegam nas fatias 2+), portanto o
// teste cruzado HTTP completo (A tenta acessar recurso de B por ID) só é
// possível na fatia 2. Aqui provamos o que existe: (1) cada sessão só enxerga a
// própria org em /me; (2) orgId deriva exclusivamente da sessão; (3) fixture de
// 2 tenants + helper prontos para as próximas fatias.
import { beforeEach, describe, expect, it } from "vitest";
import {
  createHarness,
  meInject,
  registerTenant,
  type TestHarness,
  type TenantFixture,
} from "./helpers.js";

describe("isolamento de tenant em /me (TEN-01 parcial — sem endpoints com ID nesta fatia)", () => {
  let h: TestHarness;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;

  beforeEach(async () => {
    h = await createHarness();
    // Fixture de 2 orgs (A/B) via register ×2 — reutilizável nas próximas fatias.
    tenantA = await registerTenant(h.app, {
      email: "dono-a@test.invalid",
      name: "Dono A",
      orgName: "Org Alfa",
    });
    tenantB = await registerTenant(h.app, {
      email: "dono-b@test.invalid",
      name: "Dono B",
      orgName: "Org Beta",
    });
  });

  it("cada usuário vê SOMENTE a própria org em /me; orgs e usuários são distintos", async () => {
    const meA = await meInject(h.app, tenantA.cookieHeader);
    const meB = await meInject(h.app, tenantB.cookieHeader);

    expect(meA.statusCode).toBe(200);
    expect(meB.statusCode).toBe(200);

    const bodyA = meA.json() as { user: { id: string; email: string }; org: { id: string; name: string } };
    const bodyB = meB.json() as { user: { id: string; email: string }; org: { id: string; name: string } };

    expect(bodyA.user.email).toBe("dono-a@test.invalid");
    expect(bodyA.org.name).toBe("Org Alfa");
    expect(bodyB.user.email).toBe("dono-b@test.invalid");
    expect(bodyB.org.name).toBe("Org Beta");

    expect(bodyA.org.id).not.toBe(bodyB.org.id);
    expect(bodyA.user.id).not.toBe(bodyB.user.id);
  });

  it("oráculo direto no banco: 2 orgs, 2 usuários, cada um na PRÓPRIA org (sem órfãos)", async () => {
    const orgs = await h.pool.query("SELECT id, name FROM organizations ORDER BY name");
    const users = await h.pool.query(
      `SELECT u.email, u.org_id, o.name AS org_name
         FROM users u JOIN organizations o ON o.id = u.org_id
        ORDER BY u.email`,
    );

    expect(orgs.rows).toHaveLength(2);
    expect(users.rows).toHaveLength(2);

    const userA = users.rows.find((r) => r.email === "dono-a@test.invalid");
    const userB = users.rows.find((r) => r.email === "dono-b@test.invalid");
    const orgA = orgs.rows.find((r) => r.name === "Org Alfa");
    const orgB = orgs.rows.find((r) => r.name === "Org Beta");
    expect(userA?.org_id).toBe(orgA?.id);
    expect(userB?.org_id).toBe(orgB?.id);
    expect(userA?.org_id).not.toBe(userB?.org_id);
  });

  it("cookie de A adulterado não resolve dados de B (nem de ninguém): 401 AUTH_UNAUTHENTICATED", async () => {
    const forged = tenantA.cookieHeader.slice(0, -8) + "xxxxxxxx";
    const res = await meInject(h.app, forged);
    expect(res.statusCode).toBe(401);
    expect((res.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");
  });

  it("sessões são entidades separadas por usuário: refazer login de A não afeta sessão de B (ENG-01)", async () => {
    const relogin = await h.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "dono-a@test.invalid", password: "senha-super-secreta" },
    });
    expect(relogin.statusCode).toBe(200);

    // Sessão antiga de B (e a antiga de A) seguem válidas; nova sessão de A também.
    const meB = await meInject(h.app, tenantB.cookieHeader);
    expect(meB.statusCode).toBe(200);
    expect((meB.json() as { org: { name: string } }).org.name).toBe("Org Beta");

    const meAold = await meInject(h.app, tenantA.cookieHeader);
    expect(meAold.statusCode).toBe(200);

    // Oráculo: 3 sessões ativas (register A, register B, re-login A).
    const sessions = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    expect(sessions.rows[0]).toMatchObject({ n: 3 });
  });

  // NOTA para as próximas fatias: quando existirem endpoints com ID de recurso,
  // reutilizar este harness + fixture (createHarness/registerTenant) para o teste
  // cruzado completo (A acessa ID de B → 404 TENANT_FORBIDDEN genérico).
});
