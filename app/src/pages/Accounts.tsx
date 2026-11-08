import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { M } from '../components/Icons'
import { Modal } from '../components/Ui'
import { byCreatedDesc, fmtDate, nowIso, paginate, uid } from '../utils'
import type { Account, AccountStatus } from '../types'

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'connected', label: 'Conectadas' },
  { id: 'disconnected', label: 'Desconectadas' },
  { id: 'no_session', label: 'Sem sessão' },
] as const
type Tab = typeof tabs[number]['id']

export default function Accounts() {
  const { data, setAccounts, audit } = useStore()
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [upgrade, setUpgrade] = useState(false)
  const [edit, setEdit] = useState<Account | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', status: 'connected' as AccountStatus })

  const list = useMemo(() => {
    const f = byCreatedDesc(data.accounts).filter(a =>
      (tab === 'all' || a.status === tab) && (!q.trim() || `${a.name} ${a.phone}`.toLowerCase().includes(q.toLowerCase())))
    return paginate(f, page, 12)
  }, [data.accounts, tab, q, page])

  const save = () => {
    if (!form.name.trim() || !form.phone.trim()) return
    if (edit) {
      setAccounts(arr => arr.map(a => a.id === edit.id ? { ...a, ...form } : a))
      audit('Conta atualizada', 'Contas', edit.id)
    } else {
      const id = uid('a')
      setAccounts(arr => [{ id, name: form.name.trim(), phone: form.phone.trim(), status: form.status, createdAt: nowIso(), campaignIds: [] }, ...arr])
      audit('Conta criada', 'Contas', id)
    }
    setOpen(false); setEdit(null); setForm({ name: '', phone: '', status: 'connected' })
  }

  const from = list.total === 0 ? 0 : (list.page - 1) * 12 + 1
  const to = Math.min(list.page * 12, list.total)
  const statusLabel = (s: AccountStatus) => s === 'connected' ? 'Conectada' : s === 'disconnected' ? 'Desconectada' : 'Sem sessão'

  return (
    <div className="ov acc">
      <div className="acc-head">
        <h2>Contas</h2>
        <div className="acc-actions">
          <Link className="acc-outline" to="/whats/accounts-campaigns"><M.hub size={16} /> Contas e Campanhas</Link>
          <button className="acc-outline" type="button" onClick={() => setUpgrade(true)}><M.bolt size={16} /> Fazer upgrade de plano</button>
          <button className="acc-outline" type="button" onClick={() => { setEdit(null); setForm({ name: '', phone: '', status: 'connected' }); setOpen(true) }}>+ Conta</button>
        </div>
      </div>
      <div className="acc-bar">
        <div className="acc-tabs">
          {tabs.map(t => (
            <button key={t.id} type="button" className={tab === t.id ? 'is-on' : ''} onClick={() => { setTab(t.id); setPage(1) }}>{t.label}</button>
          ))}
        </div>
        <label className="acc-sort">Ordenação
          <select aria-label="Ordenação" defaultValue="created"><option value="created">Data de criação</option></select>
        </label>
      </div>
      <label className="acc-search">
        <span>Buscar</span>
        <M.search size={18} />
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </label>
      <div className="acc-pager">
        <span>Linhas por página</span>
        <select aria-label="Linhas por página" defaultValue="12"><option>12</option></select>
        <span>{from}-{to} de {list.total}</span>
        <button type="button" aria-label="Primeira página" disabled={list.page <= 1} onClick={() => setPage(1)}>«</button>
        <button type="button" aria-label="Página anterior" disabled={list.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
        <button type="button" aria-label="Próxima página" disabled={list.page >= list.pages} onClick={() => setPage(p => p + 1)}>›</button>
      </div>
      {list.total === 0 ? <p className="acc-empty">Nenhum registro encontrado</p> : (
        <ul className="acc-list">
          {list.items.map(a => (
            <li key={a.id}>
              <div>
                <strong>{a.name}</strong>
                <span>{a.phone}</span>
              </div>
              <em>{statusLabel(a.status)}</em>
              <span>{fmtDate(a.createdAt)}</span>
              <button type="button" onClick={() => { setEdit(a); setForm({ name: a.name, phone: a.phone, status: a.status }); setOpen(true) }}>Editar</button>
            </li>
          ))}
        </ul>
      )}
      {upgrade ? (
        <div className="g-modal-back" onClick={() => setUpgrade(false)}>
          <div className="g-modal ov-config" onClick={e => e.stopPropagation()}>
            <header><strong>Ampliar o plano</strong><button type="button" onClick={() => setUpgrade(false)} aria-label="Fechar">×</button></header>
            <p className="acc-note">O plano atual comporta 1 conta. Para abrir mais linhas, fale com o comercial da Grupos. Nada é cobrado nesta tela.</p>
            <div className="ov-config-foot"><button type="button" className="ov-yellow" onClick={() => setUpgrade(false)}>Entendi</button></div>
          </div>
        </div>
      ) : null}
      <Modal title={edit ? 'Editar conta' : 'Nova conta'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Telefone<input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+55 11 90000-0000" /></label>
          <label className="lbl">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AccountStatus }))}><option value="connected">Conectada</option><option value="disconnected">Desconectada</option><option value="no_session">Sem sessão</option></select></label>
        </div>
      </Modal>
    </div>
  )
}
