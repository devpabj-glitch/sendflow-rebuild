import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { ApiError, releases } from '../lib/api'
import type { ReleaseListResult } from '../lib/api'
import { M } from '../components/Icons'
import { Modal } from '../components/Ui'
import { fmtDate } from '../utils'
import type { ReleaseApi, ReleaseType } from '../types'

const tabs = [{ id: 'all', label: 'Campanhas' }, { id: 'active', label: 'Ativas' }, { id: 'archived', label: 'Arquivadas' }] as const
const periods = ['7', '14', '21', '28', '90'] as const
type Tab = typeof tabs[number]['id']

const PAGE_SIZE = 12

// D13 (dono, 08/11/2026): tipos EXATOS da API original SendFlow — 'WhatsRelease'
// |'WhatsList'|'WhatsViralCampaign'. Rótulos humanizados na tela; os VALORES
// enviados são os três exatos. "Aleatório" não existe nesta API e não aparece.
const typeOptions: { value: ReleaseType; label: string }[] = [
  { value: 'WhatsRelease', label: 'Campanha' },
  { value: 'WhatsList', label: 'Lista' },
  { value: 'WhatsViralCampaign', label: 'Campanha viral' },
]
const typeLabel = (t: ReleaseType) => typeOptions.find(o => o.value === t)?.label ?? t

// Abas → filtro `archived` do servidor: Campanhas = todas (filtro ausente),
// Ativas = archived=false, Arquivadas = archived=true (D13: boolean).
const archivedOf = (t: Tab): boolean | undefined => (t === 'active' ? false : t === 'archived' ? true : undefined)

// Métricas: nenhum evento existe nesta fatia — zeros são o dado real (DEC-14
// aberta; DIR-04: nenhum número inventado).
const totals = { clicks: 0, entries: 0, exits: 0, participants: 0, groups: 0 }

function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    if (err.code === 'BAD_ERROR_BODY' || err.code === 'INTERNAL_ERROR') return 'Erro no servidor. Tente novamente em instantes.'
    return err.message
  }
  return 'Erro inesperado.'
}

const emptyForm = { name: '', type: 'WhatsRelease' as ReleaseType }

// FATIA-03: dados vêm da API /releases (D13); o store local de campanhas segue
// para as telas ainda não migradas (Layout, AccountsCampaigns).
export default function Campaigns() {
  const { audit } = useStore() // histórico segue local (fatia futura); dados vêm da API
  const [tab, setTab] = useState<Tab>('all')
  const [period, setPeriod] = useState<typeof periods[number]>('90')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<ReleaseListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [open, setOpen] = useState(false)
  const [pattern, setPattern] = useState(false)
  const [edit, setEdit] = useState<ReleaseApi | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [acting, setActing] = useState(false)

  // Busca com debounce leve (mantém o comportamento visual de filtrar ao digitar);
  // Enter confirma na hora.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    releases.list({ search, page, pageSize: PAGE_SIZE, archived: archivedOf(tab) })
      .then(r => { if (!cancelled) { setResult(r); setLoading(false) } })
      .catch((err: unknown) => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  }, [search, page, tab, nonce])

  const save = async () => {
    if (!form.name.trim() || saving) return
    setSaving(true); setSaveError('')
    try {
      if (edit) {
        const updated = await releases.update(edit.id, { name: form.name.trim(), type: form.type })
        audit('Campanha atualizada', 'Campanhas', updated.id)
      } else {
        const created = await releases.create({ name: form.name.trim(), type: form.type })
        audit('Campanha criada', 'Campanhas', created.id)
        setPage(1) // lista é created_at DESC: a nova campanha entra no topo da primeira página
      }
      setOpen(false); setEdit(null); setForm(emptyForm)
      setNonce(n => n + 1) // relê do servidor — a API é a fonte da verdade
    } catch (err) {
      setSaveError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  // Arquivar/desarquivar por item — ação idempotente (D12), no modal de edição
  // (única via do legado para trocar status; o grid do item tem colunas fixas e
  // não comporta outro botão). A tela nunca teve seleção em massa (D10: sem
  // endpoint em massa; se um dia existir, iterar por id).
  const toggleArchive = async () => {
    if (!edit || acting) return
    setActing(true); setSaveError('')
    const wasArchived = edit.archived
    try {
      const updated = wasArchived ? await releases.unarchive(edit.id) : await releases.archive(edit.id)
      audit(wasArchived ? 'Campanha desarquivada' : 'Campanha arquivada', 'Campanhas', updated.id)
      setOpen(false); setEdit(null); setForm(emptyForm)
      setNonce(n => n + 1)
    } catch (err) {
      setSaveError(errorText(err))
    } finally {
      setActing(false)
    }
  }

  const items = result?.items ?? []
  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const curPage = result?.page ?? page
  const from = total === 0 ? 0 : (curPage - 1) * PAGE_SIZE + 1
  const to = Math.min(curPage * PAGE_SIZE, total)
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
          <button className="acc-outline" type="button" onClick={() => { setEdit(null); setForm(emptyForm); setSaveError(''); setOpen(true) }}>+ Campanha</button>
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
      <label className="acc-search"><span>Buscar</span><M.search size={18} /><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setSearch(q); setPage(1) } }} /></label>
      <div className="acc-pager">
        <span>Linhas por página</span>
        <select aria-label="Linhas por página" defaultValue={PAGE_SIZE}><option>{PAGE_SIZE}</option></select>
        <span>{from}-{to} de {total}</span>
        <button type="button" aria-label="Primeira página" disabled={curPage <= 1} onClick={() => setPage(1)}>«</button>
        <button type="button" aria-label="Página anterior" disabled={curPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
        <button type="button" aria-label="Próxima página" disabled={curPage >= pages} onClick={() => setPage(p => p + 1)}>›</button>
      </div>
      <div className="cmp-export"><Link className="acc-outline" to="/whats/actions">Ver exportações →</Link></div>
      {error != null ? (
        <div>
          <p className="acc-empty">{errorText(error)}</p>
          <button className="acc-outline" type="button" onClick={() => setNonce(n => n + 1)}>Tentar novamente</button>
        </div>
      ) : loading && result == null ? <p className="acc-empty">Carregando…</p> : items.length === 0 ? <p className="acc-empty">Nenhum registro encontrado</p> : (
        <ul className="acc-list">
          {items.map(c => (
            <li key={c.id}>
              <div><strong>{c.name}</strong><span>{typeLabel(c.type)} · {(c.accountIds ?? []).length === 0 ? 'Sem conta' : `${(c.accountIds ?? []).length} ${(c.accountIds ?? []).length === 1 ? 'conta' : 'contas'}`} · {totals.clicks} cliques</span></div>
              <em>{c.archived ? 'Arquivada' : 'Ativa'}</em>
              <span>{fmtDate(c.createdAt)}</span>
              <button type="button" onClick={() => { setEdit(c); setForm({ name: c.name, type: c.type }); setSaveError(''); setOpen(true) }}>Editar</button>
            </li>
          ))}
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
      <Modal title={edit ? 'Editar campanha' : 'Nova campanha'} open={open} onClose={() => setOpen(false)} footer={<>{edit ? <button className="btn" type="button" onClick={toggleArchive} disabled={acting}>{edit.archived ? 'Desarquivar' : 'Arquivar'}</button> : null}<button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save} disabled={saving}>Salvar</button></>}>
        {saveError ? <p className="acc-note" role="alert">{saveError}</p> : null}
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Tipo<select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ReleaseType }))}>{typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
        </div>
      </Modal>
    </div>
  )
}
