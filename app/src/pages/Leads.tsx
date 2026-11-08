import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { EmptyState, Modal, PageHead, Pagination, Tabs } from '../components/Ui'
import { byCreatedDesc, downloadText, fmtDate, leadsToCsv, nowIso, paginate, uid } from '../utils'
import type { Lead } from '../types'

const tabs = [{ id: 'overview', label: 'Visão geral' }, { id: 'tags', label: 'Tags' }] as const
type Tab = typeof tabs[number]['id']

export default function Leads() {
  const { data, setLeads, audit } = useStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Lead | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', tags: '', fieldKey: '', fieldValue: '' })
  const allTags = useMemo(() => Array.from(new Set(data.leads.flatMap(l => l.tags))).sort(), [data.leads])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return byCreatedDesc(data.leads).filter(l => (!t || `${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(t)) && (!tag || l.tags.includes(tag)))
  }, [data.leads, q, tag])
  const list = paginate(filtered, page, 12)
  const tagCounts = useMemo(() => allTags.map(t => ({ tag: t, count: data.leads.filter(l => l.tags.includes(t)).length })).sort((a,b)=>b.count-a.count), [allTags, data.leads])

  const save = () => {
    if (!form.name.trim() || !form.phone.trim()) return
    const tags = form.tags.split(',').map(s => s.trim()).filter(Boolean)
    const fields = form.fieldKey.trim() && form.fieldValue.trim() ? { [form.fieldKey.trim()]: form.fieldValue.trim() } : {}
    if (edit) { setLeads(arr => arr.map(l => l.id === edit.id ? { ...l, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), tags, fields: { ...l.fields, ...fields } } : l)); audit('Lead atualizado', 'Leads', edit.id) }
    else { const id = uid('l'); setLeads(arr => [{ id, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), tags, fields, createdAt: nowIso() }, ...arr]); audit('Lead adicionado', 'Leads', id) }
    setOpen(false); setEdit(null); setForm({ name: '', phone: '', email: '', tags: '', fieldKey: '', fieldValue: '' })
  }

  return (
    <div>
      <PageHead title="Leads" sub="Contatos com campos, tags e exportação." actions={<div className="row"><button className="btn" onClick={() => { downloadText('leads.csv', leadsToCsv(filtered), 'text/csv;charset=utf-8'); audit('Leads exportados', 'Leads', `${filtered.length}`) }}>Exportar</button><button className="btn primary" onClick={() => { setEdit(null); setForm({ name: '', phone: '', email: '', tags: '', fieldKey: '', fieldValue: '' }); setOpen(true) }}>Adicionar</button></div>} />
      <Tabs items={tabs as any} value={tab} onChange={v => { setTab(v as Tab); setPage(1) }} />
      {tab === 'overview' ? (
        <>
          <div className="toolbar">
            <div className="field"><span>Buscar</span><input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Nome, número ou e-mail" /></div>
            <div className="field"><span>Tag</span><select value={tag} onChange={e => { setTag(e.target.value); setPage(1) }}><option value="">Todas</option>{allTags.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <span className="chip">Ordenação: Data de criação</span>
          </div>
          <div className="card table-wrap">
            <table><thead><tr><th>Nome</th><th>Número</th><th>Email</th><th>Campos</th><th>Tags</th><th>Criado em</th><th></th></tr></thead>
              <tbody>{list.items.map(l => <tr key={l.id}><td style={{ fontWeight: 600 }}>{l.name}</td><td>{l.phone}</td><td>{l.email || '—'}</td><td>{Object.entries(l.fields).map(([k,v]) => <span key={k} className="chip">{k}: {v}</span>)}{!Object.keys(l.fields).length && '—'}</td><td>{l.tags.map(t => <span key={t} className="chip">{t}</span>)}</td><td>{fmtDate(l.createdAt)}</td><td><button className="btn sm" onClick={() => { setEdit(l); setForm({ name: l.name, phone: l.phone, email: l.email, tags: l.tags.join(', '), fieldKey: '', fieldValue: '' }); setOpen(true) }}>Editar</button></td></tr>)}</tbody>
            </table>
            {list.total === 0 ? <EmptyState /> : <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />}
          </div>
        </>
      ) : (
        <div className="card table-wrap">
          <table><thead><tr><th>Tag</th><th>Leads</th></tr></thead><tbody>{tagCounts.map(t => <tr key={t.tag}><td><span className="chip">{t.tag}</span></td><td style={{ fontWeight: 600 }}>{t.count}</td></tr>)}</tbody></table>
          {tagCounts.length === 0 && <EmptyState hint="Crie leads com tags para vê-las aqui." />}
        </div>
      )}
      <Modal title={edit ? 'Editar lead' : 'Novo lead'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Número<input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></label>
          <label className="lbl">Email<input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></label>
          <label className="lbl">Tags (separadas por vírgula)<input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="vip, quente" /></label>
          <label className="lbl">Campo (chave)<input value={form.fieldKey} onChange={e => setForm(f => ({ ...f, fieldKey: e.target.value }))} placeholder="origem" /></label>
          <label className="lbl">Campo (valor)<input value={form.fieldValue} onChange={e => setForm(f => ({ ...f, fieldValue: e.target.value }))} placeholder="Site" /></label>
        </div>
      </Modal>
    </div>
  )
}
