import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { I, M } from '../components/Icons'
import { currentUser } from '../auth'
import { useDemo } from '../demo/DemoContext'
import { useModuleLists } from '../demo/useModule'
import { entryPercent } from '../demo/rules'

export default function Overview() {
  const [open, setOpen] = useState(false)
  const [qAcc, setQAcc] = useState('')
  const [qCamp, setQCamp] = useState('')
  const [qHook, setQHook] = useState('')
  const user = currentUser()
  const displayName = user?.name || 'Usuário'
  const { demo } = useDemo()
  const { accounts, campaigns, webhooks } = useModuleLists()

  const accRows = accounts.filter(a => !qAcc.trim() || a.name.toLowerCase().includes(qAcc.toLowerCase()))
  const campRows = campaigns.filter(c => !qCamp.trim() || c.name.toLowerCase().includes(qCamp.toLowerCase()))
  const hookRows = webhooks.filter(w => !qHook.trim() || w.name.toLowerCase().includes(qHook.toLowerCase()))
  const accountQuota = demo ? `${accounts.length}/∞` : `${accounts.length}/1`

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
        <article className="ov-card ov-slot">
          <header>
            <h2>Contas <span>{accountQuota}</span></h2>
            <Link to="/whats/accounts" className="ov-add" aria-label="Adicionar Contas"><I.plusCircle size={22} /></Link>
          </header>
          <label className="ov-col-search"><span>Buscar</span><input value={qAcc} onChange={e => setQAcc(e.target.value)} /></label>
          {accRows.length === 0 ? <p>Nenhum registro encontrado</p> : (
            <ul className="ov-rows">
              {accRows.map(a => (
                <li key={a.id}>
                  <span className="ov-avatar sm" aria-hidden="true">{a.name.slice(0, 1)}</span>
                  <i className={a.status === 'connected' ? 'ov-dot on' : 'ov-dot'} />
                  <strong>{a.name}</strong>
                  <Link to="/whats/accounts" aria-label={`Abrir ${a.name}`}>›</Link>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="ov-card ov-slot">
          <header>
            <h2>Campanhas <span>{campaigns.length}/∞</span></h2>
            <Link to="/whats/campaigns" className="ov-add" aria-label="Adicionar Campanhas"><I.plusCircle size={22} /></Link>
          </header>
          <label className="ov-col-search"><span>Buscar</span><input value={qCamp} onChange={e => setQCamp(e.target.value)} /></label>
          {campRows.length === 0 ? <p>Nenhum registro encontrado</p> : (
            <ul className="ov-rows">
              {campRows.map(c => {
                const met = c.metricsByPeriod['90'] || { clicks: 0, entries: 0, exits: 0, participants: 0, groups: 0 }
                return (
                  <li key={c.id}>
                    <i className="ov-dot on" />
                    <Link to={`/whats/campaigns/${c.id}`}><strong>{c.name}</strong></Link>
                    <small>{met.clicks} · {met.entries} · {entryPercent(met.clicks, met.entries)}% · {met.groups}</small>
                  </li>
                )
              })}
            </ul>
          )}
        </article>
        <article className="ov-card ov-slot">
          <header>
            <h2>Webhooks <span>{webhooks.length}</span></h2>
            <Link to="/whats/webhooks" className="ov-add" aria-label="Adicionar Webhooks"><I.plusCircle size={22} /></Link>
          </header>
          <label className="ov-col-search"><span>Buscar</span><input value={qHook} onChange={e => setQHook(e.target.value)} /></label>
          {hookRows.length === 0 ? <p>Nenhum registro encontrado</p> : (
            <ul className="ov-rows">
              {hookRows.map(w => (
                <li key={w.id}>
                  <strong>{w.name}</strong>
                  <em>{w.event}</em>
                  <Link to="/whats/webhooks" aria-label={`Abrir ${w.name}`}>›</Link>
                </li>
              ))}
            </ul>
          )}
        </article>
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
