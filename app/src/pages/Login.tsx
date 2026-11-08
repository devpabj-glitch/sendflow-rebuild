import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../auth'
import { ApiError } from '../lib/api'

// Mapa de erro por código do servidor (contrato §3.5 + decisão do coordenador §0.5) — pt-BR, tom atual.
function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return 'E-mail ou senha inválidos.'
      case 'AUTH_RATE_LIMITED':
        return err.retryAfter != null
          ? `Muitas tentativas. Aguarde ${err.retryAfter} segundos e tente novamente.`
          : 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      case 'AUTH_EMAIL_TAKEN':
        return 'Este e-mail já está cadastrado.'
      case 'VALIDATION_ERROR':
        return err.message || 'Campos inválidos.'
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
      default:
        return 'Erro no servidor. Tente novamente em instantes.'
    }
  }
  return 'Erro no servidor. Tente novamente em instantes.'
}

export function AuthBrandPanel() {
  return (
    <div className="sf-auth2-brand" aria-hidden="true">
      <svg width="96" height="150" viewBox="0 0 96 150" role="img" aria-label="Orbit">
        <defs>
          <linearGradient id="orbG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe36e" />
            <stop offset="1" stopColor="#f0b400" />
          </linearGradient>
        </defs>
        <path d="M30 8 L74 30 L74 58 L46 44 L46 96 L74 82 L74 120 L30 142 Z" fill="url(#orbG)" />
        <circle cx="14" cy="75" r="9" fill="none" stroke="url(#orbG)" strokeWidth="5" />
      </svg>
      <strong className="sf-auth2-wordmark">Orbit</strong>
    </div>
  )
}

export function AuthCookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('orbit-cookie-consent'))
  const choose = (v: string) => { localStorage.setItem('orbit-cookie-consent', v); setVisible(false) }
  if (!visible) return null
  return (
    <dialog open className="sf-auth2-cookie" aria-label="Cookies">
      <span className="sf-auth2-cookie-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1A73E8" /><circle cx="9" cy="9" r="1.6" fill="#fff" /><circle cx="14.5" cy="11" r="1.4" fill="#fff" /><circle cx="10.5" cy="15" r="1.5" fill="#fff" /></svg>
      </span>
      <div className="sf-auth2-cookie-copy">
        <strong>Sua privacidade importa</strong>
        <p>Usamos cookies essenciais para o funcionamento da plataforma e, com seu consentimento, cookies de análise e marketing para melhorar sua experiência. Saiba mais em nossa <Link to="/politica-de-privacidade">Política de Privacidade</Link> ou gerencie seus dados.</p>
      </div>
      <button type="button" className="sf-auth2-cookie-settings" aria-label="Personalizar cookies">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5F6368" strokeWidth="2" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
      </button>
      <div className="sf-auth2-cookie-actions">
        <button type="button" className="sf-auth2-cookie-text" onClick={() => choose('essential')}>APENAS NECESSÁRIOS</button>
        <button type="button" className="sf-auth2-cookie-all" onClick={() => choose('all')}>ACEITAR TODOS</button>
      </div>
    </dialog>
  )
}

export default function Login() {
  const nav = useNavigate()
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const prev = document.body.className
    document.body.className = 'sf-auth2-body'
    document.documentElement.lang = 'pt-BR'
    return () => { document.body.className = prev }
  }, [])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, pass)
      nav('/whats/overview')
    } catch (err) {
      setError(loginErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="sf-auth2-page">
      <AuthBrandPanel />
      <main className="sf-auth2-main">
        <div className="sf-auth2-col">
          <h2>Bem vindo de volta!</h2>
          {error ? <p role="alert" className="sf-auth2-error">{error}</p> : null}
          <form onSubmit={submit} className="sf-auth2-form">
            <input
              name="email" type="email" required autoComplete="email"
              placeholder="Email *" value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              name="password" type="password" required autoComplete="current-password"
              placeholder="Senha *" value={pass}
              onChange={e => setPass(e.target.value)}
            />
            <Link to="/forgot-password" className="sf-auth2-forgot">Esqueceu a senha?</Link>
            <button type="submit" className="sf-auth2-primary" disabled={busy}>{busy ? 'Entrando…' : 'Login'}</button>
            <button type="button" className="sf-auth2-secondary" onClick={() => nav('/')}>Quero saber mais</button>
          </form>
        </div>
      </main>
      <footer className="sf-auth2-footer">© Orbit. All rights reserved.</footer>
      <AuthCookieBanner />
    </div>
  )
}
