import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { I, M } from '../components/Icons'
import { useSession } from '../auth'

const quotas = [
  { title: 'Contas', value: '0/1', to: '/whats/accounts' },
  { title: 'Campanhas', value: '0/∞', to: '/whats/campaigns' },
  { title: 'Webhooks', value: '0', to: '/whats/webhooks' },
]

export default function Overview() {
  const [open, setOpen] = useState(false)
  const { state } = useSession()
  const user = state.status === 'authenticated' ? state.session.user : null
  const displayName = user?.name || 'Usuário'
  return (
    <div className="ov">
      <section className="ov-card ov-profile">
        <div className="ov-who">
          <span className="ov-avatar" aria-hidden="true"><I.user size={36} /></span>
          <div>
            <div className="ov-name">{displayName}</div>
            <div className="ov-meta">{user?.email || ''}</div>
          </div>
        </div>
        <span className="ov-divider" aria-hidden="true" />
        <button className="ov-yellow" type="button" onClick={() => setOpen(true)}>
          CONFIGURAÇÕES <I.chevron size={16} />
        </button>
      </section>

      <section className="ov-card ov-map">
        <div className="ov-who">
          <span className="ov-hub" aria-hidden="true"><M.hub size={22} /></span>
          <div>
            <div className="ov-map-title">Mapa Contas × Campanhas</div>
            <div className="ov-meta">Todas as associações estão em ordem</div>
          </div>
        </div>
        <Link className="ov-yellow" to="/whats/accounts-campaigns">
          Ver dashboard <I.chevron size={16} />
        </Link>
      </section>

      <section className="ov-grid">
        {quotas.map(card => (
          <article className="ov-card ov-slot" key={card.title}>
            <header>
              <h2>{card.title} <span>{card.value}</span></h2>
              <Link to={card.to} className="ov-add" aria-label={`Adicionar ${card.title}`}><I.plusCircle size={22} /></Link>
            </header>
            <p>Nenhum registro encontrado</p>
          </article>
        ))}
      </section>

      {open ? (
        <div className="g-modal-back" onClick={() => setOpen(false)}>
          <div className="g-modal ov-config" onClick={e => e.stopPropagation()}>
            <header>
              <strong>Configurações da conta</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><I.x size={18} /></button>
            </header>
            <label>Nome<input defaultValue={displayName} /></label>
            <label>E-mail<input defaultValue={user?.email || ''} /></label>
            <div className="ov-config-foot">
              <button type="button" className="ov-yellow" onClick={() => setOpen(false)}>Salvar nesta sessão</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
