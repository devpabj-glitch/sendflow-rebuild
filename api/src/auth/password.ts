// Hash de senha com scrypt (node:crypto, stdlib — ENG-09).
// Formato persistido: scrypt$N$r$p$salt_hex$hash_hex (params registradas no próprio hash).
// Correção pós-auditoria A3: scrypt ASYNC promissificado — a versão sync
// bloqueava o event loop a cada hash/verify; o formato do hash é IDÊNTICO.
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { validationError } from "../lib/errors.js";

const SCRYPT_N = 16_384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;

// promisify(scrypt) perde as sobrecargas tipadas; assinatura única e explícita.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

// Política de senha (D1, decidido): contrato NOVO da API — mínimo 8 caracteres.
// O antigo auth local com mínimo 4 deixa de existir junto com o próprio auth local.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = await scryptAsync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [ , nStr, rStr, pStr, saltHex, hashHex] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N <= 0 || r <= 0 || p <= 0) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;
  try {
    const actual = await scryptAsync(password, salt, expected.length, { N, r, p });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Defesa em profundidade: o JSON Schema da rota já rejeita <8; isto garante a
// política mesmo se algum caminho futuro bypassar o schema.
export function assertRegisterPasswordPolicy(password: unknown): asserts password is string {
  if (
    typeof password !== "string" ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw validationError({
      fields: [
        {
          field: "password",
          reason: `deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres`,
        },
      ],
    });
  }
}

// Hash descartável para equalizar o tempo de resposta quando o e-mail não existe
// (contrato §5.5: mesma mensagem e mesmo esforço nos dois casos de credencial inválida).
// Async agora: computado UMA vez, lazy, e memoizado (formato idêntico ao real).
let dummyHashPromise: Promise<string> | null = null;
export function getDummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(randomUUID());
  return dummyHashPromise;
}
