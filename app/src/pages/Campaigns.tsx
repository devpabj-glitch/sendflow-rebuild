import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { M } from '../components/Icons'
import { Modal } from '../components/Ui'
import { byCreatedDesc, fmtDate, nowIso, paginate, uid } from '../utils'
import type { Campaign, CampaignStatus } from '../types'

const tabs = [{ id: 'all', label: 'Campanhas' }, { id: 'active', label: 'Ativas' }, { id: 'archived', label: 'Arquivadas' }] as const
const periods = ['7', '14', '21', '28', '90'] as const
type Tab = typeof tabs[number]['id']

const zeroM = () => ({ clicks: 0, entries: 0, exits: 0, participants: 0, groups: 0 })

export default function Campaigns() {
  const { data, setCampaigns, setAccounts, audit } = useStore()
  const [tab, setTab] = useState<Tab>('all')
  const [period, setPeriod] = useState<typeof periods[number]>('90')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [pattern, setPattern] = useState(false)
  const [edit, setEdit] = useState<Campaign | null>(null)
  const [form, setForm] = useState({ name: '', status: 'active' as CampaignStatus, accountId: '' })

  const list = useMemo(() => {
    const f = byCreatedDesc(data.campaigns).filter(c => (tab === 'all' || c.status === tab) && (!q.trim() || c.name.toLowerCase().includes(q.toLowerCase())))
    return paginate(f, page, 12)
  }, [data.campaigns, tab, q, page])

  const totals = useMemo(() => {
    const source = byCreatedDesc(data.campaigns).filter(c => (tab === 'all' || c.status === tab) && (!q.trim() || c.name.toLowerCase().includes(q.toLowerCase())))
    return source.reduce((acc, c) => {
      const m = c.metricsByPeriod[period] || zeroM()
      acc.clicks += m.clicks; acc.entries += m.entries; acc.exits += m.exits; acc.participants += m.participants; acc.groups += m.groups
      return acc
    }, { clicks: 0, entries: 0, exits: 0, participants: 0, groups: 0 })
  }, [data.campaigns, tab, q, period])

  const save = () => {
    if (!form.name.trim()) return
    if (edit) {
      setCampaigns(arr => arr.map(c => c.id === edit.id ? { ...c, name: form.name.trim(), status: form.status, accountId: form.accountId || undefined } : c))
      audit('Campanha atualizada', 'Campanhas', edit.id)
    } else {
      const id = uid('c')
      const camp: Campaign = { id, name: form.name.trim(), status: form.status, accountId: form.accountId || undefined, createdAt: nowIso(), metricsByPeriod: { '7': zeroM(), '14': zeroM(), '21': zeroM(), '28': zeroM(), '90': zeroM() } }
      setCampaigns(arr => [camp, ...arr])
      if (form.accountId) setAccounts(arr => arr.map(a => a.id === form.accountId ? { ...a, campaignIds: Array.from(new Set([...a.campaignIds, id])) } : a))
      audit('Campanha criada', 'Campanhas', id)
    }
    setOpen(false); setEdit(null); setForm({ name: '', status: 'active', accountId: '' })
  }

  const from = list.total === 0 ? 0 : (list.page - 1) * 12 + 1
  const to = Math.min(list.page * 12, list.total)
  const percent = totals.clicks ? Math.round((totals.entries / totals.clicks) * 100) : 0
  const icon = (paths: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffde07" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>
  )
  const metrics = [
    { n: totals.clicks, label: 'Clicks', hint: '', icon: icon('<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="#ffde07" />') },
    { n: totals.entries, label: 'Entraram', hint: '', icon: icon('<path d="M14 3h7v7" /><path d="M21 3 10 14" /><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />') },
    { n: percent, label: 'Percentual de entrada', hint: '', icon: icon('<path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />') },
    { n: totals.exits, label: 'Sairam', hint: '', icon: icon('<path d="M9 21H4V3h5" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />') },
    { n: totals.participants, label: 'Participantes (total)', hint: '0 Administradores · 0 Leads · 0 em grupos distintos', icon: icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />') },
    { n: totals.groups, label: 'Grupos (total)', hint: '0 grupos distintos de WhatsApp', icon: icon('<circle cx="9" cy="9" r="3.2" /><circle cx="16.5" cy="15.5" r="3.2" /><path d="M11.3 11.3l3 3" />') },
    { n: 0, label: 'Grupos cheios', hint: '', icon: icon('<rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12.5 2.4 2.4 4.6-5" />') },
    { n: 0, label: 'Grupos disponíveis', hint: '', icon: icon('<rect x="4" y="4" width="16" height="16" rx="3" />') },
  ]

  return (
    <div className="ov acc">
      <div className="acc-head">
        <h2>Campanhas</h2>
        <div className="acc-actions">
          <button className="acc-outline" type="button" onClick={() => setPattern(true)}>Padrão de criação</button>
          <Link className="acc-outline" to="/whats/accounts-campaigns"><M.hub size={16} /> Contas e Campanhas</Link>
          <Link className="acc-outline" to="/whats/group-search"><M.search size={16} /> Buscar grupos</Link>
          <button className="acc-outline" type="button" onClick={() => { setEdit(null); setForm({ name: '', status: 'active', accountId: '' }); setOpen(true) }}>+ Campanha</button>
        </div>
      </div>
      <div className="cmp-note">
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" style={{ verticalAlign: '-3px', marginRight: 6 }} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8h.01" /><path d="M12 12v5" /></svg>Cliques, entradas e saídas dos últimos 90 dias. Participantes e grupos mostram o total atual e os grupos distintos de WhatsApp entre campanhas.</span>
      </div>
      <div className="cmp-periods-row">
        <div className="cmp-periods">
          {periods.map(p => <button key={p} type="button" className={period === p ? 'is-on' : ''} onClick={() => setPeriod(p)}>{p} Dias</button>)}
        </div>
      </div>
      <div className="cmp-grid">
        {metrics.map(item => (
          <article key={item.label}>
            <header>{item.icon}<strong>{item.n}</strong></header>
            <b>{item.label}</b>
            {item.hint ? <small>{item.hint}</small> : null}
          </article>
        ))}
      </div>
      <div className="acc-bar">
        <div className="acc-tabs">
          {tabs.map(t => <button key={t.id} type="button" className={tab === t.id ? 'is-on' : ''} onClick={() => { setTab(t.id); setPage(1) }}>{t.label}</button>)}
        </div>
        <label className="acc-sort">Ordenação
          <select aria-label="Ordenação" defaultValue="created"><option value="created">Data de criação</option></select>
        </label>
      </div>
      <label className="acc-search"><span>Buscar</span><M.search size={18} /><input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} /></label>
      <div className="acc-pager">
        <span>Linhas por página</span>
        <select aria-label="Linhas por página" defaultValue="12"><option>12</option></select>
        <span>{from}-{to} de {list.total}</span>
        <button type="button" disabled={list.page <= 1} onClick={() => setPage(1)}>«</button>
        <button type="button" disabled={list.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
        <button type="button" disabled={list.page >= list.pages} onClick={() => setPage(p => p + 1)}>›</button>
      </div>
      <div className="cmp-export"><Link className="acc-outline" to="/whats/actions">Ver exportações →</Link></div>
      {list.total === 0 ? <p className="acc-empty">Nenhum registro encontrado</p> : (
        <ul className="acc-list">
          {list.items.map(c => {
            const m = c.metricsByPeriod[period] || zeroM()
            const acc = data.accounts.find(a => a.id === c.accountId)
            return (
              <li key={c.id}>
                <div><strong>{c.name}</strong><span>{acc?.name || 'Sem conta'} · {m.clicks} cliques</span></div>
                <em>{c.status === 'active' ? 'Ativa' : 'Arquivada'}</em>
                <span>{fmtDate(c.createdAt)}</span>
                <button type="button" onClick={() => { setEdit(c); setForm({ name: c.name, status: c.status, accountId: c.accountId || '' }); setOpen(true) }}>Editar</button>
              </li>
            )
          })}
        </ul>
      )}
      {pattern ? (
        <div className="g-modal-back" onClick={() => setPattern(false)}>
          <div className="g-modal ov-config" onClick={e => e.stopPropagation()}>
            <header><strong>Padrão de criação</strong><button type="button" onClick={() => setPattern(false)} aria-label="Fechar">×</button></header>
            <p className="acc-note">Novas campanhas nascem ativas, sem conta obrigatória, e entram na ordenação por data de criação.</p>
            <div className="ov-config-foot"><button className="ov-yellow" type="button" onClick={() => setPattern(false)}>Fechar</button></div>
          </div>
        </div>
      ) : null}
      <Modal title={edit ? 'Editar campanha' : 'Nova campanha'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CampaignStatus }))}><option value="active">Ativa</option><option value="archived">Arquivada</option></select></label>
          <label className="lbl">Conta associada<select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}><option value="">Nenhuma</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        </div>
      </Modal>
    </div>
  )
}
