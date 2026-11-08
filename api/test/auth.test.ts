// Autenticação (contrato §5): register/login/logout/me; scrypt; cookie (D2);
// TTL 72h (D1); senha mínima 8 (D1); e-mail duplicado 409 (D1).
// Oráculo independente: leitura direta das tabelas pg-mem (não a resposta da API).
import { beforeEach, describe, expect, it } from "vitest";
import { sha256Hex } from "../src/auth/session.js";
import {
  createHarness,
  loginInject,
  meInject,
  registerTenant,
  sessionTokenOf,
  setCookieHeaderOf,
  cookieHeaderFor,
  type TestHarness,
} from "./helpers.js";

const HOUR_MS = 3_600_000;

describe("POST /api/v1/auth/register", () => {
  let h: TestHarness;
  beforeEach(async () => {
    h = await createHarness();
  });

  it("201: cria org + usuário dono + sessão (login automático) e seta cookie conforme D2", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "Ana.Test@Test.Invalid", // maiúsculas de propósito: normaliza trim+lowercase
        password: "senha-super-secreta",
        name: "Ana",
        orgName: "Minha Org",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as {
      user: { id: string; email: string; name: string };
      org: { id: string; name: string };
    };
    expect(body.user.email).toBe("ana.test@test.invalid"); // normalizado
    expect(body.user.name).toBe("Ana");
    expect(body.org.name).toBe("Minha Org");
    expect(Object.keys(body.user).sort()).toEqual(["email", "id", "name"]); // nunca vaza password_hash

    // Cookie D2: grupos_session; HttpOnly; Secure; SameSite=None; Path=/; sem Domain.
    const cookie = setCookieHeaderOf(res);
    expect(cookie).toContain("grupos_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toContain("Domain=");

    // Oráculo: 1 org, 1 user, 1 sessão; hash no formato scrypt.
    const orgs = await h.pool.query("SELECT count(*)::int AS n FROM organizations");
    const users = await h.pool.query("SELECT email, password_hash FROM users");
    const sessions = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    expect(orgs.rows[0]).toMatchObject({ n: 1 });
    expect(sessions.rows[0]).toMatchObject({ n: 1 });
    expect(users.rows).toHaveLength(1);
    expect(String((users.rows[0] as { password_hash: string }).password_hash)).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
    await h.app.close();
  });

  it("201: orgName ausente → nome derivado do e-mail (Organização de {parte-local})", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "joao@test.invalid", password: "senha-super-secreta", name: "João" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { org: { name: string } };
    expect(body.org.name).toBe("Organização de joao");
    await h.app.close();
  });

  it("400 VALIDATION_ERROR: senha com menos de 8 caracteres (D1: contrato novo, mínimo 8)", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "curta@test.invalid", password: "1234567", name: "Curta" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
    // Oráculo: nada foi criado.
    const users = await h.pool.query("SELECT count(*)::int AS n FROM users");
    expect(users.rows[0]).toMatchObject({ n: 0 });
    await h.app.close();
  });

  it("409 AUTH_EMAIL_TAKEN: e-mail duplicado (mesmo em caixa alta) — preserva contrato vigente", async () => {
    const first = await h.app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "dup@test.invalid", password: "senha-super-secreta", name: "Dup" },
    });
    expect(first.statusCode).toBe(201);

    const second = await h.app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "DUP@test.invalid", password: "outra-senha-valida", name: "Dup 2" },
    });
    expect(second.statusCode).toBe(409);
    const body = second.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("AUTH_EMAIL_TAKEN");
    expect(body.error.message).toBe("Este e-mail já está cadastrado.");
    // Oráculo: continua 1 usuário.
    const users = await h.pool.query("SELECT count(*)::int AS n FROM users");
    expect(users.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });
});

describe("POST /api/v1/auth/login + GET /api/v1/auth/me", () => {
  let h: TestHarness;
  beforeEach(async () => {
    h = await createHarness();
    await registerTenant(h.app, { email: "dono@test.invalid", password: "senha-super-secreta", orgName: "Org Dono" });
  });

  it("200: login com credenciais corretas → cookie presente; /me devolve user e org da sessão", async () => {
    const login = await loginInject(h.app, "dono@test.invalid", "senha-super-secreta");
    expect(login.statusCode).toBe(200);
    const loginBody = login.json() as { user: { email: string }; org: { name: string } };
    expect(loginBody.user.email).toBe("dono@test.invalid");
    expect(loginBody.org.name).toBe("Org Dono");
    expect(setCookieHeaderOf(login)).toContain("grupos_session=");

    const me = await meInject(h.app, cookieHeaderFor(sessionTokenOf(login)));
    expect(me.statusCode).toBe(200);
    const meBody = me.json() as { user: { id: string; email: string }; org: { id: string; name: string } };
    expect(meBody.user.email).toBe("dono@test.invalid");
    expect(meBody.org.name).toBe("Org Dono");
    await h.app.close();
  });

  it("401 AUTH_INVALID_CREDENTIALS: senha errada e e-mail inexistente → mesma mensagem genérica", async () => {
    const wrongPassword = await loginInject(h.app, "dono@test.invalid", "senha-errada-123");
    const unknownEmail = await loginInject(h.app, "ninguem@test.invalid", "senha-super-secreta");

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    const bodyA = wrongPassword.json() as { error: { code: string; message: string } };
    const bodyB = unknownEmail.json() as { error: { code: string; message: string } };
    expect(bodyA.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(bodyB.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(bodyA.error.message).toBe(bodyB.error.message); // não distingue e-mail existente
    await h.app.close();
  });

  it("401 AUTH_UNAUTHENTICATED: /me sem cookie, com cookie adulterado", async () => {
    const noCookie = await h.app.inject({ method: "GET", url: "/api/v1/auth/me" });
    expect(noCookie.statusCode).toBe(401);
    expect((noCookie.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");

    const tampered = await meInject(h.app, cookieHeaderFor("token-adulterado-completamente-falso"));
    expect(tampered.statusCode).toBe(401);
    expect((tampered.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");
    await h.app.close();
  });

  it("204: logout invalida a sessão e limpa o cookie; /me com o cookie antigo vira 401; logout sem cookie também 204 (idempotente)", async () => {
    const login = await loginInject(h.app, "dono@test.invalid", "senha-super-secreta");
    const token = sessionTokenOf(login);
    const cookie = cookieHeaderFor(token);

    const logout = await h.app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie } });
    expect(logout.statusCode).toBe(204);

    const me = await meInject(h.app, cookie);
    expect(me.statusCode).toBe(401);

    // Oráculo: a LINHA da sessão de login (por token_hash) foi apagada.
    // (A sessão criada pelo register no beforeEach é outra linha — permanece.)
    const deleted = await h.pool.query(
      "SELECT count(*)::int AS n FROM sessions WHERE token_hash = $1",
      [sha256Hex(token)],
    );
    expect(deleted.rows[0]).toMatchObject({ n: 0 });

    const logoutAgain = await h.app.inject({ method: "POST", url: "/api/v1/auth/logout" });
    expect(logoutAgain.statusCode).toBe(204);
    await h.app.close();
  });

  it("401 AUTH_UNAUTHENTICATED: sessão expirada (relógio avançado > TTL 72h) é recusada e purgada", async () => {
    const login = await loginInject(h.app, "dono@test.invalid", "senha-super-secreta");
    const token = sessionTokenOf(login);
    const cookie = cookieHeaderFor(token);

    h.clock.advanceMs(72 * HOUR_MS + 1_000); // TTL (D1: 72h) + 1s

    const me = await meInject(h.app, cookie);
    expect(me.statusCode).toBe(401);
    expect((me.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");

    // Oráculo: a sessão EXPIRADA validada (por token_hash) foi apagada
    // (expiração preguiçosa). A sessão do register não foi validada após
    // expirar — permanece até ser tocada ou purgada em lote (declarado §14.10).
    const purged = await h.pool.query(
      "SELECT count(*)::int AS n FROM sessions WHERE token_hash = $1",
      [sha256Hex(token)],
    );
    expect(purged.rows[0]).toMatchObject({ n: 0 });
    await h.app.close();
  });

  it("sessão dentro do TTL continua válida (relógio avançado 71h)", async () => {
    const login = await loginInject(h.app, "dono@test.invalid", "senha-super-secreta");
    h.clock.advanceMs(71 * HOUR_MS);
    const me = await meInject(h.app, cookieHeaderFor(sessionTokenOf(login)));
    expect(me.statusCode).toBe(200);
    await h.app.close();
  });
});
