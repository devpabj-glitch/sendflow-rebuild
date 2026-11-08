import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AuthBrandPanel, AuthCookieBanner } from './Login'

// Sem endpoint de recuperação nesta fatia (A1 §1.2): a tela declara indisponibilidade —
// não finge envio de e-mail e não dispara nenhuma requisição (contrato §3.6, PM regra 3).
export default function ForgotPassword() {
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
          <p className="sf-auth2-sent">A redefinição de senha por e-mail ainda não está disponível nesta versão. Fale com o administrador da sua organização.</p>
          <div className="sf-auth2-form">
            <Link to="/login" className="sf-auth2-forgot">Voltar para login</Link>
          </div>
        </div>
      </main>
      <footer className="sf-auth2-footer">© Orbit. All rights reserved.</footer>
      <AuthCookieBanner />
    </div>
  )
}
