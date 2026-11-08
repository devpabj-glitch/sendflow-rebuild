import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Badge, EmptyState, Modal, PageHead, Pagination, Tabs } from '../components/Ui'
import { byCreatedDesc, fmtDate, nowIso, paginate, uid } from '../utils'
import type { Webhook, WebhookStatus } from '../types'

const tabs = [{ id: 'integration', label: 'Integrações' }, { id: 'archived', label: 'Arquivadas' }] as const
type Tab = typeof tabs[number]['id']

export default function WebhooksPage() {
  const { data, setWebhooks, audit } = useStore()
  const [tab, setTab] = useState<Tab>('integration')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Webhook | null>(null)
  const [form, setForm] = useState({ name: '', url: '', event: 'lead.created', status: 'integration' as WebhookStatus })

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return paginate(byCreatedDesc(data.webhooks).filter(w => w.status === tab && (!t || `${w.name} ${w.url} ${w.event}`.toLowerCase().includes(t))), page, 12)
  }, [data.webhooks, tab, q, page])

  const save = () => {
    if (!form.name.trim() || !form.url.trim()) return
    if (edit) { setWebhooks(arr => arr.map(w => w.id === edit.id ? { ...w, ...form } : w)); audit('Webhook atualizado', 'Webhooks', edit.id) }
    else { const id = uid('w'); setWebhooks(arr => [{ id, ...form, createdAt: nowIso() }, ...arr]); audit('Webhook criado', 'Webhooks', id) }
    setOpen(false); setEdit(null); setForm({ name: '', url: '', event: 'lead.created', status: 'integration' })
  }

  return (
    <div>
      <PageHead title="Webhooks" sub="Integrações ativas e arquivadas." actions={<button className="btn primary" onClick={() => { setEdit(null); setForm({ name: '', url: '', event: 'lead.created', status: 'integration' }); setOpen(true) }}>Adicionar webhook</button>} />
      <Tabs items={tabs as any} value={tab} onChange={v => { setTab(v as Tab); setPage(1) }} />
      <div className="toolbar">
        <div className="field"><span>Buscar</span><input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Nome, URL ou evento" /></div>
        <span className="chip">Ordenação: Data de criação</span>
      </div>
      <div className="card table-wrap">
        <table><thead><tr><th>Nome</th><th>URL</th><th>Evento</th><th>Status</th><th>Criado em</th><th></th></tr></thead>
          <tbody>{list.items.map(w => <tr key={w.id}><td style={{ fontWeight: 600 }}>{w.name}</td><td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.url}</td><td><span className="chip">{w.event}</span></td><td><Badge tone={w.status==='integration'?'info':'muted'}>{w.status==='integration'?'Integração':'Arquivada'}</Badge></td><td>{fmtDate(w.createdAt)}</td><td><button className="btn sm" onClick={() => { setEdit(w); setForm({ name: w.name, url: w.url, event: w.event, status: w.status }); setOpen(true) }}>Editar</button></td></tr>)}</tbody>
        </table>
        {list.total === 0 ? <EmptyState /> : <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />}
      </div>
      <Modal title={edit ? 'Editar webhook' : 'Novo webhook'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">URL<input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></label>
          <label className="lbl">Evento<input value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))} placeholder="lead.created" /></label>
          <label className="lbl">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as WebhookStatus }))}><option value="integration">Integração</option><option value="archived">Arquivada</option></select></label>
        </div>
      </Modal>
    </div>
  )
}
