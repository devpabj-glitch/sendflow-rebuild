// Relógio injetável: produção usa SystemClock; testes injetam relógio falso
// (expiração de sessão, janela do rate limit) sem depender de sleeps.

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
