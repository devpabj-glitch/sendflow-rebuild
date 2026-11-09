import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { ApiError, accounts } from '../lib/api'
import { M } from '../components/Icons'
import { Modal } from '../components/Ui'
import { fmtDate } from '../utils'
import type { AccountApi, AccountStatus } from '../types'

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'connected', label: 'Conectadas' },
  { id: 'disconnected', label: 'Desconectadas' },
  { id: 'no_session', label: 'Sem sessão' },
] as const
type Tab = typeof tabs[number]['id']

const PAGE_SIZE = 12

// FATIA-02: a API só conhece 'nao_conectada' (único estado honesto sem provedor —
// contrato A1 §2.1.4). Mapeia para o rótulo "Sem sessão" já existente na tela;
// nunca "Conectada"/"Online" (DIR-04).
const statusOf = (a: AccountApi): AccountStatus => (a.connectionStatus === 'nao_conectada' ? 'no_session' : 'disconnected')

function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    if (err.code === 'BAD_ERROR_BODY' || err.code === 'INTERNAL_ERROR') return 'Erro no servidor. Tente novamente em instantes.'
    return err.message
  }
  return 'Erro inesperado.'
}

const emptyForm = { name: '', type: 'WhatsApp', isSpy: false }

export default function Accounts() {
  const { audit } = useStore() // histórico segue local (fatia futura); dados vêm da API
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{ items: AccountApi[]; total: number; page: number; pageSize: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [open, setOpen] = useState(false)
  const [upgrade, setUpgrade] = useState(false)
  const [edit, setEdit] = useState<AccountApi | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Busca com debounce leve (mantém o comportamento visual de filtrar ao digitar);
  // Enter confirma na hora.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    accounts.list({ search, page, pageSize: PAGE_SIZE })
      .then(r => { if (!cancelled) { setResult(r); setLoading(false) } })
      .catch((err: unknown) => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  }, [search, page, nonce])

  const shown = useMemo(() => {
    const items = result?.items ?? []
    return tab === 'all' ? items : items.filter(a => statusOf(a) === tab)
  }, [result, tab])

  const save = async () => {
    if (!form.name.trim() || saving) return
    setSaving(true); setSaveError('')
    try {
      if (edit) {
        const updated = await accounts.update(edit.id, { name: form.name.trim(), type: form.type, isSpy: form.isSpy })
        audit('Conta atualizada', 'Contas', updated.id)
      } else {
        const created = await accounts.create({ name: form.name.trim(), type: form.type, isSpy: form.isSpy })
        audit('Conta criada', 'Contas', created.id)
        setPage(1) // lista é created_at DESC: a nova conta entra no topo da primeira página
      }
      setOpen(false); setEdit(null); setForm(emptyForm)
      setNonce(n => n + 1) // relê do servidor — a API é a fonte da verdade
    } catch (err) {
      setSaveError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const curPage = result?.page ?? page
  const from = total === 0 ? 0 : (curPage - 1) * PAGE_SIZE + 1
  const to = Math.min(curPage * PAGE_SIZE, total)
  const statusLabel = (s: AccountStatus) => s === 'connected' ? 'Conectada' : s === 'disconnected' ? 'Desconectada' : 'Sem sessão'

  return (
    <div className="ov acc">
      <div className="acc-head">
        <h2>Contas</h2>
        <div className="acc-actions">
          <Link className="acc-outline" to="/whats/accounts-campaigns"><M.hub size={16} /> Contas e Campanhas</Link>
          <button className="acc-outline" type="button" onClick={() => setUpgrade(true)}><M.bolt size={16} /> Fazer upgrade de plano</button>
          <button className="acc-outline" type="button" onClick={() => { setEdit(null); setForm(emptyForm); setSaveError(''); setOpen(true) }}>+ Conta</button>
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
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setSearch(q); setPage(1) } }} />
      </label>
      <div className="acc-pager">
        <span>Linhas por página</span>
        <select aria-label="Linhas por página" defaultValue={PAGE_SIZE}><option>{PAGE_SIZE}</option></select>
        <span>{from}-{to} de {total}</span>
        <button type="button" aria-label="Primeira página" disabled={curPage <= 1} onClick={() => setPage(1)}>«</button>
        <button type="button" aria-label="Página anterior" disabled={curPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
        <button type="button" aria-label="Próxima página" disabled={curPage >= pages} onClick={() => setPage(p => p + 1)}>›</button>
      </div>
      {error != null ? (
        <div>
          <p className="acc-empty">{errorText(error)}</p>
          <button className="acc-outline" type="button" onClick={() => setNonce(n => n + 1)}>Tentar novamente</button>
        </div>
      ) : loading && result == null ? <p className="acc-empty">Carregando…</p> : shown.length === 0 ? <p className="acc-empty">Nenhum registro encontrado</p> : (
        <ul className="acc-list">
          {shown.map(a => (
            <li key={a.id}>
              <div>
                <strong>{a.name}</strong>
                <span>{a.type}</span>
              </div>
              <em>{statusLabel(statusOf(a))}</em>
              <span>{fmtDate(a.createdAt)}</span>
              <button type="button" onClick={() => { setEdit(a); setForm({ name: a.name, type: a.type, isSpy: a.isSpy }); setSaveError(''); setOpen(true) }}>Editar</button>
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
      <Modal title={edit ? 'Editar conta' : 'Nova conta'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save} disabled={saving}>Salvar</button></>}>
        {saveError ? <p className="acc-note" role="alert">{saveError}</p> : null}
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Tipo<select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{['WhatsApp', ...(form.type !== 'WhatsApp' ? [form.type] : [])].map(t => <option key={t} value={t}>{t}</option>)}</select></label>
          <label className="lbl">Conta espiã<input type="checkbox" checked={form.isSpy} onChange={e => setForm(f => ({ ...f, isSpy: e.target.checked }))} /></label>
        </div>
      </Modal>
    </div>
  )
}
