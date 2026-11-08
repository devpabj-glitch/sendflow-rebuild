import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthBrandPanel, AuthCookieBanner } from './Login'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  useEffect(() => {
    const prev = document.body.className
    document.body.className = 'sf-auth2-body'
    document.documentElement.lang = 'pt-BR'
    return () => { document.body.className = prev }
  }, [])
  return (
    <div className="sf-auth2-page">
      <AuthBrandPanel />
      <main className="sf-auth2-main">
        <div className="sf-auth2-col">
          <h2>Esqueceu a senha?</h2>
          {sent ? (
            <p className="sf-auth2-sent">Se o e-mail existir, enviaremos instruções para redefinir sua senha.</p>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSent(true) }} className="sf-auth2-form">
              <input name="email" type="text" required placeholder="Digite seu endereço de email *" />
              <button type="submit" className="sf-auth2-primary">Enviar link</button>
              <Link to="/login" className="sf-auth2-forgot">Voltar para login</Link>
            </form>
          )}
        </div>
      </main>
      <footer className="sf-auth2-footer">© Orbit. All rights reserved.</footer>
      <AuthCookieBanner />
    </div>
  )
}
