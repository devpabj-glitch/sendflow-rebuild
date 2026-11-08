import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { Badge, EmptyState, Modal, PageHead, Pagination } from '../components/Ui'
import { byCreatedDesc, fmtDate, nowIso, paginate, uid } from '../utils'
import type { Automation, AutomationStatus } from '../types'

export default function Automations() {
  const { data, setAutomations, audit } = useStore()
  const [q, setQ] = useState('')
  const [trigger, setTrigger] = useState('')
  const [status, setStatus] = useState<'all' | AutomationStatus>('all')
  const [folder, setFolder] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Automation | null>(null)
  const [form, setForm] = useState({ name: '', trigger: 'Novo lead criado', status: 'enabled' as AutomationStatus, folder: 'Geral' })
  const fileRef = useRef<HTMLInputElement>(null)
  const triggers = Array.from(new Set(data.automations.map(a => a.trigger)))
  const folders = Array.from(new Set(data.automations.map(a => a.folder)))

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const f = byCreatedDesc(data.automations).filter(a =>
      (!t || a.name.toLowerCase().includes(t)) && (!trigger || a.trigger === trigger) && (status === 'all' || a.status === status) && (!folder || a.folder === folder))
    return paginate(f, page, 12)
  }, [data.automations, q, trigger, status, folder, page])

  const save = () => {
    if (!form.name.trim()) return
    if (edit) { setAutomations(arr => arr.map(a => a.id === edit.id ? { ...a, ...form } : a)); audit('Automação atualizada', 'Automações', edit.id) }
    else { const id = uid('au'); setAutomations(arr => [{ id, ...form, createdAt: nowIso() }, ...arr]); audit('Automação criada', 'Automações', id) }
    setOpen(false); setEdit(null)
  }

  const importJson = async (file: File) => {
    try {
      const txt = await file.text(); const json = JSON.parse(txt)
      const items = Array.isArray(json) ? json : [json]
      const mapped: Automation[] = items.map((it: any, i: number) => ({
        id: uid('au'), name: String(it.name || it.nome || `Importada ${i + 1}`), trigger: String(it.trigger || it.gatilho || 'Gatilho importado'),
        status: (it.status === 'disabled' || it.ativo === false) ? 'disabled' : 'enabled', folder: String(it.folder || it.pasta || 'Importadas'), createdAt: nowIso(),
      }))
      setAutomations(arr => [...mapped, ...arr]); audit('Automações importadas (JSON)', 'Automações', `${mapped.length}`)
    } catch { alert('Não foi possível ler o JSON. Use um objeto ou lista com campos name/trigger/status/folder.') }
  }

  return (
    <div>
      <PageHead title="Automações" actions={<div className="row">
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} />
        <button className="btn" onClick={() => { const f = form.folder; setEdit(null); setForm({ name: '', trigger: 'Novo lead criado', status: 'enabled', folder: f }); setOpen(true) }}>+ PASTA</button>
        <button className="btn primary" onClick={() => { setEdit(null); setForm({ name: '', trigger: 'Novo lead criado', status: 'enabled', folder: 'Geral' }); setOpen(true) }}>+ ADICIONAR</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>⬆ IMPORTAR JSON</button>
      </div>} />
      <div className="au-searchrow">
        <label className="au-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span>Buscar</span>
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="" aria-label="Buscar automação" />
        </label>
        <div className="field"><span>Gatilho</span><select value={trigger} onChange={e => { setTrigger(e.target.value); setPage(1) }}><option value="">Todos</option>{triggers.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      </div>
      <div className="segmented" style={{ marginBottom: 14 }}>
        <button className={status==='enabled'?'active':''} onClick={() => { setStatus('enabled'); setPage(1) }}>ATIVADO</button>
        <button className={status==='disabled'?'active':''} onClick={() => { setStatus('disabled'); setPage(1) }}>DESATIVADO</button>
        <button className={status==='all'?'active':''} onClick={() => { setStatus('all'); setPage(1) }}>TODOS</button>
      </div>
      {list.total === 0 ? (
        <div className="au-bare">
          <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />
          <EmptyState />
        </div>
      ) : (
        <div className="card table-wrap">
          <table><thead><tr><th>Nome</th><th>Gatilho</th><th>Status</th><th>Pasta</th><th>Criada em</th><th></th></tr></thead>
            <tbody>{list.items.map(a => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td><td>{a.trigger}</td><td><Badge tone={a.status==='enabled'?'success':'muted'}>{a.status==='enabled'?'ATIVADO':'DESATIVADO'}</Badge></td><td><span className="chip">{a.folder}</span></td><td>{fmtDate(a.createdAt)}</td><td><button className="btn sm" onClick={() => { setEdit(a); setForm({ name: a.name, trigger: a.trigger, status: a.status, folder: a.folder }); setOpen(true) }}>Editar</button></td></tr>)}</tbody>
          </table>
          <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />
        </div>
      )}
      <Modal title={edit ? 'Editar automação' : 'Nova automação'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Gatilho<input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} /></label>
          <label className="lbl">Pasta<input value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))} /></label>
          <label className="lbl">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AutomationStatus }))}><option value="enabled">ATIVADO</option><option value="disabled">DESATIVADO</option></select></label>
        </div>
      </Modal>
    </div>
  )
}
