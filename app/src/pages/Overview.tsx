import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { I, M } from '../components/Icons'
import { useSession } from '../auth'
import { accounts } from '../lib/api'

type AccountsCardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; total: number; names: string[] }

// FATIA-02: apenas a coluna Contas lê da API; Campanhas e Webhooks seguem
// locais (fatias futuras) — valores inalterados.
export default function Overview() {
  const [open, setOpen] = useState(false)
  const { state } = useSession()
  const user = state.status === 'authenticated' ? state.session.user : null
  const displayName = user?.name || 'Usuário'
  const [acc, setAcc] = useState<AccountsCardState>({ status: 'loading' })
  const [accRetry, setAccRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setAcc({ status: 'loading' })
    accounts.list({ page: 1, pageSize: 5 })
      .then(r => { if (!cancelled) setAcc({ status: 'ok', total: r.total, names: r.items.map(a => a.name) }) })
      .catch(() => { if (!cancelled) setAcc({ status: 'error' }) })
    return () => { cancelled = true }
  }, [accRetry])

  const accountsCard = acc.status === 'ok'
    ? { value: String(acc.total), content: acc.total === 0 ? 'Nenhum registro encontrado' : acc.names.join(' · ') }
    : acc.status === 'loading'
      ? { value: '—', content: 'Carregando…' }
      : { value: '—', content: <><span>Não foi possível carregar as contas.</span> <button type="button" onClick={() => setAccRetry(n => n + 1)}>Tentar novamente</button></> }

  const quotas = [
    { title: 'Contas', value: accountsCard.value, to: '/whats/accounts', content: accountsCard.content },
    { title: 'Campanhas', value: '0/∞', to: '/whats/campaigns', content: 'Nenhum registro encontrado' },
    { title: 'Webhooks', value: '0', to: '/whats/webhooks', content: 'Nenhum registro encontrado' },
  ]
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
            <p>{card.content}</p>
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
