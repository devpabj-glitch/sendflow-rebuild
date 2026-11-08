import React from 'react'
import { useSession } from '../auth'

function YellowBtn({ icon, children, onClick }: { icon?: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="pf-yellow" onClick={onClick}>
      {icon}{children}
    </button>
  )
}

const ic = {
  touch: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.65 10A5.99 5.99 0 0 0 7 6a6 6 0 1 0 5.65 8H17v4h4v-4h2v-4H12.65zM7 15.5A2.5 2.5 0 1 1 9.5 13 2.5 2.5 0 0 1 7 15.5z"/></svg>,
  finger: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 17c.7-1.2 1-2.5 1-3.9 0-1.3-.3-2.6-.9-3.7a7.4 7.4 0 0 0-2.5-2.8l-.6 1a6.3 6.3 0 0 1 2.1 2.4c.5.9.8 2 .8 3.1 0 1.2-.3 2.3-.8 3.3l.9.6zM12 4.5c3.2 0 5.8 2.6 5.8 5.8 0 .8-.1 1.5-.4 2.2l1 .4c.3-.8.4-1.7.4-2.6A6.8 6.8 0 0 0 12 3.5c-1 0-2 .2-2.9.6l.4 1c.8-.4 1.6-.6 2.5-.6zM6.2 10.3c0-1 .3-2 .7-2.9l-1-.4a6.8 6.8 0 0 0-.4 9.3l.8-.6a5.7 5.7 0 0 1-.1-5.4zM12 6.7c2 0 3.6 1.6 3.6 3.6 0 .5-.1 1-.3 1.5l1 .3c.2-.6.3-1.2.3-1.8A4.6 4.6 0 0 0 12 5.7c-.6 0-1.1.1-1.6.3l.3 1c.4-.2.8-.3 1.3-.3zM8.4 10.3c0-1 .5-2 1.3-2.6l-.6-.8a4.6 4.6 0 0 0 .1 7.4l.6-.8a3.6 3.6 0 0 1-1.4-3.2zm3.6-1.5c.8 0 1.5.7 1.5 1.5v7.2l-1.5.3-1.5-1.2v-2.4l-2.1 1.2-.5-.9 2.6-3.6v-.6c0-.8.7-1.5 1.5-1.5z"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1 3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4zm-1 15-3.5-3.5 1.4-1.4L11 13.2l4.6-4.6 1.4 1.4L11 16z"/></svg>,
}

export default function Profile() {
  const { state } = useSession()
  const user = state.status === 'authenticated' ? state.session.user : null
  return (
    <div className="pf">
      <section className="pf-card pf-head">
        <span className="pf-avatar" aria-hidden="true">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="#3a3a3a" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"/></svg>
        </span>
        <strong className="pf-name">{user?.name || 'Usuário'}</strong>
        <div className="pf-head-actions">
          <YellowBtn>Trocar senha</YellowBtn>
          <YellowBtn>Editar Perfil</YellowBtn>
        </div>
      </section>

      <section className="pf-card pf-row">
        <span className="pf-label">Email</span>
        <span className="pf-value">
          {user?.email || ''}
          <span className="pf-verified" title="Verificado" aria-label="Email verificado">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#151515" aria-hidden="true"><path d="m9.5 16.2 8-8-1.4-1.4-6.6 6.6-3-3-1.4 1.4 4.4 4.4z"/></svg>
          </span>
        </span>
      </section>

      <section className="pf-card pf-row">
        <span className="pf-label">Número de telefone</span>
        <span className="pf-value pf-muted">Não informado</span>
      </section>

      <section className="pf-card pf-row">
        <span className="pf-label">Autenticação de 2 fatores</span>
        <YellowBtn>Adicionar Aplicativo Móvel Autenticador{ic.touch}</YellowBtn>
      </section>

      <section className="pf-card pf-row pf-tall">
        <div className="pf-text">
          <span className="pf-label">Login biométrico</span>
          <span className="pf-desc">Use sua impressão digital ou reconhecimento facial para fazer login de forma rápida e segura, sem precisar digitar senha ou código de verificação</span>
        </div>
        <YellowBtn icon={ic.finger}>Adicionar</YellowBtn>
      </section>

      <section className="pf-card pf-row">
        <span className="pf-label">Senha</span>
        <YellowBtn>Trocar senha</YellowBtn>
      </section>

      <section className="pf-card pf-row">
        <span className="pf-label">Privacidade e meus dados</span>
        <YellowBtn icon={ic.shield}>Gerenciar privacidade</YellowBtn>
      </section>
    </div>
  )
}
