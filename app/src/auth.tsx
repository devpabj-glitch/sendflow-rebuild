// Sessão de servidor (contrato FATIA-01-FRONT §3.2).
// Substitui o antigo auth.ts (usuário local com senha em SHA-256 e sessão em localStorage):
// nada de usuário fixo, hash de senha ou sessão persistida no navegador — a sessão é um
// cookie httpOnly do servidor; o front guarda apenas o snapshot {user, organization}.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ApiError, authLogin, authLogout, authMe, type AuthSession } from './lib/api'

export type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: AuthSession }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: ApiError }

type SessionContextValue = {
  state: SessionState
  signIn: (email: string, password: string) => Promise<void> // lança ApiError ao falhar
  signOut: () => Promise<void>                                // lança ApiError ao falhar
  retryBootstrap: () => void                                  // reexecuta o me (tela de erro)
}

const SessionContext = createContext<SessionContextValue | null>(null)

// Higiene de chaves legadas do auth local (PM regra 10): credenciais antigas não ficam no navegador.
const LEGACY_KEYS = ['orbit.users', 'orbit.session']
function cleanLegacyKeys() {
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // storage indisponível (modo restrito): higiene best-effort, idempotente
    }
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  const [bootstrapNonce, setBootstrapNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    cleanLegacyKeys()
    setState({ status: 'loading' })
    authMe()
      .then(session => {
        if (!cancelled) setState({ status: 'authenticated', session })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401 && err.code === 'AUTH_UNAUTHENTICATED') {
          // Caso normal (sem sessão) — não é erro.
          setState({ status: 'unauthenticated' })
          return
        }
        // Rede/timeout/5xx/corpo ilegível: erro honesto — nunca degrada para
        // "autenticado" nem "desautenticado" sem resposta do servidor.
        setState({
          status: 'error',
          error: err instanceof ApiError
            ? err
            : new ApiError({ code: 'NETWORK_ERROR', status: 0, message: 'Não foi possível conectar ao servidor.' }),
        })
      })
    return () => {
      cancelled = true
    }
  }, [bootstrapNonce])

  const retryBootstrap = useCallback(() => {
    setBootstrapNonce(n => n + 1)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    // Sucesso grava a sessão da resposta (login já devolve {user, organization});
    // falha NÃO altera o estado global — só propaga o ApiError para a tela mapear.
    const session = await authLogin({ email, password })
    setState({ status: 'authenticated', session })
  }, [])

  const signOut = useCallback(async () => {
    // 204 idempotente por contrato A1; falha mantém a sessão e propaga o erro —
    // logout só-local seria simular sucesso sobre sessão possivelmente ainda viva (PM regra 3).
    await authLogout()
    setState({ status: 'unauthenticated' })
  }, [])

  return (
    <SessionContext.Provider value={{ state, signIn, signOut, retryBootstrap }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>.')
  return ctx
}
