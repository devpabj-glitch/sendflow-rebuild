import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { I, M } from '../components/Icons'
import { useSession } from '../auth'
import { accounts, releases } from '../lib/api'

type ListCardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; total: number; names: string[] }

// FATIA-02/03: as colunas Contas e Campanhas leem da API (F3 = /releases, D13);
// Webhooks segue local (fatia futura) — valor inalterado.
export default function Overview() {
  const [open, setOpen] = useState(false)
  const { state } = useSession()
  const user = state.status === 'authenticated' ? state.session.user : null
  const displayName = user?.name || 'Usuário'
  const [acc, setAcc] = useState<ListCardState>({ status: 'loading' })
  const [accRetry, setAccRetry] = useState(0)
  const [rel, setRel] = useState<ListCardState>({ status: 'loading' })
  const [relRetry, setRelRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setAcc({ status: 'loading' })
    accounts.list({ page: 1, pageSize: 5 })
      .then(r => { if (!cancelled) setAcc({ status: 'ok', total: r.total, names: r.items.map(a => a.name) }) })
      .catch(() => { if (!cancelled) setAcc({ status: 'error' }) })
    return () => { cancelled = true }
  }, [accRetry])

  useEffect(() => {
    let cancelled = false
    setRel({ status: 'loading' })
    releases.list({ page: 1, pageSize: 5 })
      .then(r => { if (!cancelled) setRel({ status: 'ok', total: r.total, names: r.items.map(x => x.name) }) })
      .catch(() => { if (!cancelled) setRel({ status: 'error' }) })
    return () => { cancelled = true }
  }, [relRetry])

  const cardOf = (s: ListCardState, what: string, retry: () => void) => s.status === 'ok'
    ? { value: String(s.total), content: s.total === 0 ? 'Nenhum registro encontrado' : s.names.join(' · ') }
    : s.status === 'loading'
      ? { value: '—', content: 'Carregando…' }
      : { value: '—', content: <><span>{`Não foi possível carregar ${what}.`}</span> <button type="button" onClick={retry}>Tentar novamente</button></> }

  const quotas = [
    { title: 'Contas', to: '/whats/accounts', ...cardOf(acc, 'as contas', () => setAccRetry(n => n + 1)) },
    { title: 'Campanhas', to: '/whats/campaigns', ...cardOf(rel, 'as campanhas', () => setRelRetry(n => n + 1)) },
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
