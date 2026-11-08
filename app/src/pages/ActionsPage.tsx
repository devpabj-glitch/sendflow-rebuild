import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Badge, EmptyState, Modal, PageHead, Pagination, Tabs } from '../components/Ui'
import { byCreatedDesc, fmtDate, nowIso, paginate, uid } from '../utils'
import type { ActionItem, ActionStatus } from '../types'

const tabs = [
  { id: 'overview', label: 'Visão geral' }, { id: 'queued', label: 'Na fila' }, { id: 'scheduled', label: 'Agendado' },
  { id: 'processing', label: 'Processando' }, { id: 'success', label: 'Sucesso' }, { id: 'failed', label: 'Falhas' },
] as const
type Tab = typeof tabs[number]['id']
const tone = (s: ActionStatus) => s === 'success' ? 'success' : s === 'failed' ? 'danger' : s === 'processing' ? 'info' : s === 'scheduled' ? 'warning' : 'muted'
const label = (s: ActionStatus) => ({ queued: 'Na fila', scheduled: 'Agendado', processing: 'Processando', success: 'Sucesso', failed: 'Falha' }[s])

export default function ActionsPage() {
  const { data, setActions, audit } = useStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Disparo', status: 'queued' as ActionStatus, target: '', scheduledFor: '' })

  const list = useMemo(() => {
    const fromT = from ? +new Date(from) : -Infinity
    const toT = to ? +new Date(to) + 86400000 - 1 : Infinity
    const f = byCreatedDesc(data.actions).filter(a => {
      const t = +new Date(a.createdAt)
      return (tab === 'overview' || a.status === tab) && t >= fromT && t <= toT
    })
    return paginate(f, page, 12)
  }, [data.actions, tab, from, to, page])

  const save = () => {
    if (!form.name.trim()) return
    const id = uid('x')
    const item: ActionItem = { id, name: form.name.trim(), type: form.type, status: form.status, target: form.target.trim() || undefined, createdAt: nowIso(), scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined }
    setActions(arr => [item, ...arr]); audit('Ação criada', 'Ações', id)
    setOpen(false); setForm({ name: '', type: 'Disparo', status: 'queued', target: '', scheduledFor: '' })
  }

  return (
    <div>
      <PageHead title="Ações" sub="Fila, agendamento e resultado das ações." actions={<button className="btn primary" onClick={() => setOpen(true)}>Adicionar ação</button>} />
      <Tabs items={tabs as any} value={tab} onChange={v => { setTab(v as Tab); setPage(1) }} />
      <div className="toolbar">
        <div className="field"><span>Início</span><input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} /></div>
        <div className="field"><span>Fim</span><input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} /></div>
        <span className="chip">Filtro por intervalo de datas · Ordenação: Data de criação</span>
      </div>
      <div className="card table-wrap">
        <table><thead><tr><th>Ação</th><th>Tipo</th><th>Status</th><th>Alvo</th><th>Agendada para</th><th>Criada em</th></tr></thead>
          <tbody>{list.items.map(a => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td><td>{a.type}</td><td><Badge tone={tone(a.status) as any}>{label(a.status)}</Badge></td><td>{a.target || '—'}</td><td>{fmtDate(a.scheduledFor)}</td><td>{fmtDate(a.createdAt)}</td></tr>)}</tbody>
        </table>
        {list.total === 0 ? <EmptyState /> : <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />}
      </div>
      <Modal title="Nova ação" open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Tipo<input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} /></label>
          <label className="lbl">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ActionStatus }))}><option value="queued">Na fila</option><option value="scheduled">Agendado</option><option value="processing">Processando</option><option value="success">Sucesso</option><option value="failed">Falhas</option></select></label>
          <label className="lbl">Alvo<input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} /></label>
          <label className="lbl">Agendar para<input type="datetime-local" value={form.scheduledFor} onChange={e => setForm(f => ({ ...f, scheduledFor: e.target.value }))} /></label>
        </div>
      </Modal>
    </div>
  )
}
