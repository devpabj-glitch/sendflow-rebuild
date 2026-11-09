// Cliente HTTP único do front (contrato FATIA-01-FRONT §3.1).
// Toda chamada à API passa por apiFetch — fetch avulso em páginas/componentes é proibido.
// Sessão por cookie httpOnly do servidor: credentials 'include' sempre; o front nunca
// lê, grava ou persiste token (ENG-09).

import type { AccountApi } from '../types'

export type ApiErrorShape = { error: { code: string; message: string; details?: unknown } }

export class ApiError extends Error {
  readonly code: string      // código do servidor (A1 §5.5) OU código do cliente:
                             // 'NETWORK_ERROR' | 'TIMEOUT' | 'BAD_ERROR_BODY'
  readonly status: number    // HTTP status; 0 quando a requisição não completou
  readonly retryAfter?: number // segundos, do cabeçalho Retry-After (presente no 429)
  readonly details?: unknown

  constructor(args: { code: string; status: number; message: string; retryAfter?: number; details?: unknown }) {
    super(args.message)
    this.name = 'ApiError'
    this.code = args.code
    this.status = args.status
    this.retryAfter = args.retryAfter
    this.details = args.details
  }
}

// Base por nome de variável de build: vazia → caminhos relativos (dev com proxy do Vite).
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export async function apiFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 15_000, ...rest } = init ?? {}
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(BASE + path, {
      ...rest,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(rest.body != null ? { 'Content-Type': 'application/json' } : {}),
        ...(rest.headers as Record<string, string> | undefined),
      },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError({ code: 'TIMEOUT', status: 0, message: 'Tempo de resposta esgotado.' })
    }
    // Falha de rede (API fora/offline) — estado honesto, nunca sucesso simulado.
    throw new ApiError({ code: 'NETWORK_ERROR', status: 0, message: 'Não foi possível conectar ao servidor.' })
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    const shape = body as ApiErrorShape | null
    // Corpo fora do envelope → BAD_ERROR_BODY: o front nunca adivinha código que o servidor não mandou.
    if (!shape || typeof shape.error?.code !== 'string' || typeof shape.error.message !== 'string') {
      throw new ApiError({ code: 'BAD_ERROR_BODY', status: res.status, message: 'Erro no servidor.' })
    }
    const retryAfterRaw = res.headers.get('Retry-After')
    const retryAfter = retryAfterRaw != null && /^\d+$/.test(retryAfterRaw) ? Number(retryAfterRaw) : undefined
    throw new ApiError({
      code: shape.error.code,
      status: res.status,
      message: shape.error.message,
      details: shape.error.details,
      retryAfter,
    })
  }

  try {
    return (await res.json()) as T
  } catch {
    throw new ApiError({ code: 'BAD_ERROR_BODY', status: res.status, message: 'Resposta inválida do servidor.' })
  }
}

// Endpoints de auth (A1 §5.1) — únicos desta fatia.

export type AuthUser = { id: string; email: string; name: string }
export type AuthOrganization = { id: string; name: string }
export type AuthSession = { user: AuthUser; organization: AuthOrganization }

export function authRegister(input: { email: string; password: string; name: string; orgName?: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(input) })
}

export function authLogin(input: { email: string; password: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(input) })
}

export async function authLogout(): Promise<void> {
  await apiFetch<void>('/api/v1/auth/logout', { method: 'POST', body: '{}' })
}

export function authMe(): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/v1/auth/me')
}

// Endpoints de contas (FATIA-02, contrato A1 §3.2) — exigem sessão válida.
// Recurso único é devolvido flat (sem envelope); a lista traz paginação do servidor.
// D5/D6 (coordenador): SEM delete no front (endpoint existe no backend mas fica
// fora do escopo desta fatia); mutações POST/PATCH vão com body JSON — apiFetch
// já envia Content-Type application/json sempre que há corpo.

export type AccountListQuery = { search?: string; page?: number; pageSize?: number }
export type AccountListResult = { items: AccountApi[]; total: number; page: number; pageSize: number }
export type AccountCreateInput = { name: string; type?: string; isSpy?: boolean }
export type AccountUpdateInput = { name?: string; type?: string; isSpy?: boolean }

export const accounts = {
  list(query: AccountListQuery = {}): Promise<AccountListResult> {
    const params = new URLSearchParams()
    if (query.search != null && query.search.trim() !== '') params.set('search', query.search.trim())
    if (query.page != null) params.set('page', String(query.page))
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
    const qs = params.toString()
    return apiFetch<AccountListResult>(`/api/v1/accounts${qs ? `?${qs}` : ''}`)
  },
  create(input: AccountCreateInput): Promise<AccountApi> {
    return apiFetch<AccountApi>('/api/v1/accounts', { method: 'POST', body: JSON.stringify(input) })
  },
  get(id: string): Promise<AccountApi> {
    return apiFetch<AccountApi>(`/api/v1/accounts/${encodeURIComponent(id)}`)
  },
  update(id: string, input: AccountUpdateInput): Promise<AccountApi> {
    return apiFetch<AccountApi>(`/api/v1/accounts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) })
  },
}
