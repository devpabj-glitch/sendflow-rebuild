// Janela de bloqueio por tentativas do login (contrato §5.3 — contrato técnico
// NOVO por D3; valores D1: 5 falhas / 300 s de janela / 900 s de bloqueio).
// Contador em memória, por chave (e-mail normalizado | IP); zera em restart e é
// por instância (1 réplica — declarado no contrato §14.4). Relógio injetável.
import type { Clock } from "../lib/time.js";

export interface RateLimitOptions {
  max: number;
  windowMs: number;
  blockMs: number;
}

interface Entry {
  failures: number[]; // timestamps (ms) das tentativas FALHADAS dentro da janela
  blockedUntil: number | null;
}

export interface RateLimitCheck {
  blocked: boolean;
  retryAfterSeconds: number;
}

export class LoginRateLimiter {
  /** Varredura de expiração: a cada N checks, entradas totalmente expiradas saem do Map (cap de crescimento). */
  private static readonly SWEEP_EVERY = 64;
  private readonly entries = new Map<string, Entry>();
  private checkCount = 0;

  constructor(
    private readonly opts: RateLimitOptions,
    private readonly clock: Clock,
  ) {}

  private key(email: string, ip: string): string {
    return `${email}|${ip}`;
  }

  /** Chamada ANTES de verificar credenciais: bloqueada → 429 sem revelar se a senha está certa. */
  check(email: string, ip: string): RateLimitCheck {
    const key = this.key(email, ip);
    const now = this.clock.now().getTime();
    // Correção pós-auditoria A3 (Map unbounded): varredura periódica remove
    // entradas totalmente expiradas mesmo de chaves que nunca mais são checadas.
    if (++this.checkCount % LoginRateLimiter.SWEEP_EVERY === 0) this.sweep(now);

    const entry = this.entries.get(key);
    if (!entry) return { blocked: false, retryAfterSeconds: 0 };

    this.prune(entry, now);

    if (entry.blockedUntil !== null) {
      return {
        blocked: true,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000)),
      };
    }
    // Limpeza lazy: entrada totalmente expirada sai do Map.
    if (entry.failures.length === 0) this.entries.delete(key);
    return { blocked: false, retryAfterSeconds: 0 };
  }

  recordFailure(email: string, ip: string): void {
    const key = this.key(email, ip);
    const now = this.clock.now().getTime();
    const entry = this.entries.get(key) ?? { failures: [], blockedUntil: null };
    this.prune(entry, now);
    entry.failures.push(now);
    if (entry.failures.length >= this.opts.max) {
      // Bloqueia e reinicia a contagem: após o bloqueio, janela nova começa limpa.
      entry.blockedUntil = now + this.opts.blockMs;
      entry.failures = [];
    }
    this.entries.set(key, entry);
  }

  /** Sucesso limpa a chave inteira (contrato §5.1: sucesso zera o contador). */
  recordSuccess(email: string, ip: string): void {
    this.entries.delete(this.key(email, ip));
  }

  private prune(entry: Entry, now: number): void {
    entry.failures = entry.failures.filter((t) => now - t < this.opts.windowMs);
    if (entry.blockedUntil !== null && now >= entry.blockedUntil) {
      entry.blockedUntil = null;
    }
  }

  /** Entrada "totalmente expirada" = sem falhas na janela E sem bloqueio ativo. */
  private sweep(now: number): void {
    for (const [key, entry] of this.entries) {
      this.prune(entry, now);
      if (entry.failures.length === 0 && entry.blockedUntil === null) {
        this.entries.delete(key);
      }
    }
  }
}
