import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { EmptyState, Modal, PageHead, Pagination } from '../components/Ui'
import { byCreatedDesc, fmtDate, nowIso, paginate, uid } from '../utils'
import type { Deeplink } from '../types'

export default function Deeplinks() {
  const { data, setDeeplinks, setDeeplinkFolders, audit } = useStore()
  const [q, setQ] = useState('')
  const [folder, setFolder] = useState('')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)
  const [openFolder, setOpenFolder] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', folder: '' })
  const [folderName, setFolderName] = useState('')
  const [moveTo, setMoveTo] = useState('')

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const f = byCreatedDesc(data.deeplinks).filter(d => (!t || `${d.title} ${d.url}`.toLowerCase().includes(t)) && (!folder || d.folder === folder))
    return paginate(f, page, 12)
  }, [data.deeplinks, q, folder, page])

  const selectedIds = list.items.filter(i => sel[i.id]).map(i => i.id)
  const allSelected = list.items.length > 0 && selectedIds.length === list.items.length

  const save = () => {
    if (!form.title.trim() || !form.url.trim()) return
    const id = uid('d')
    setDeeplinks(arr => [{ id, title: form.title.trim(), url: form.url.trim(), folder: form.folder || 'Geral', clicks: 0, createdAt: nowIso() }, ...arr])
    audit('Deep link criado', 'Deep links', id); setOpen(false); setForm({ title: '', url: '', folder: '' })
  }
  const saveFolder = () => {
    if (!folderName.trim()) return
    const id = uid('df'); setDeeplinkFolders(arr => [{ id, name: folderName.trim(), createdAt: nowIso() }, ...arr])
    audit('Pasta de deep link criada', 'Deep links', id); setOpenFolder(false); setFolderName('')
  }
  const move = () => {
    if (!moveTo || !selectedIds.length) return
    setDeeplinks(arr => arr.map(d => selectedIds.includes(d.id) ? { ...d, folder: moveTo } : d))
    audit('Deep links movidos em massa', 'Deep links', `${selectedIds.length}`); setSel({}); setMoveTo('')
  }

  return (
    <div>
      <PageHead title="Deep links" sub="Organize links em pastas e mova itens em massa." actions={<div className="row"><button className="btn" onClick={() => setOpenFolder(true)}>Pasta</button><button className="btn primary" onClick={() => setOpen(true)}>Deep link</button></div>} />
      <div className="toolbar">
        <div className="field"><span>Buscar</span><input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Título ou URL" /></div>
        <div className="field"><span>Pasta</span><select value={folder} onChange={e => { setFolder(e.target.value); setPage(1) }}><option value="">Todas</option>{data.deeplinkFolders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select></div>
        <label className="row" style={{ fontSize: '.9rem', color: 'var(--text-muted)' }}><input className="check" type="checkbox" checked={allSelected} onChange={e => setSel(Object.fromEntries(list.items.map(i => [i.id, e.target.checked])))} /> Selecionar tudo ({selectedIds.length}/{list.items.length})</label>
        <div className="field"><span>Mover para</span><select value={moveTo} onChange={e => setMoveTo(e.target.value)}><option value="">Pasta...</option>{data.deeplinkFolders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select></div>
        <button className="btn sm" onClick={move} disabled={!moveTo || !selectedIds.length}>Mover em massa</button>
      </div>
      <div className="card table-wrap">
        <table><thead><tr><th></th><th>Título</th><th>URL</th><th>Pasta</th><th>Cliques</th><th>Criado em</th></tr></thead>
          <tbody>{list.items.map(d => <tr key={d.id}><td><input className="check" type="checkbox" checked={!!sel[d.id]} onChange={e => setSel(s => ({ ...s, [d.id]: e.target.checked }))} /></td><td style={{ fontWeight: 600 }}>{d.title}</td><td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.url}</td><td><span className="chip">{d.folder}</span></td><td>{d.clicks}</td><td>{fmtDate(d.createdAt)}</td></tr>)}</tbody>
        </table>
        {list.total === 0 ? <EmptyState /> : <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />}
      </div>
      <Modal title="Novo deep link" open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Título<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></label>
          <label className="lbl">URL<input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://wa.me/..." /></label>
          <label className="lbl">Pasta<select value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))}><option value="">Geral</option>{data.deeplinkFolders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select></label>
        </div>
      </Modal>
      <Modal title="Nova pasta" open={openFolder} onClose={() => setOpenFolder(false)} footer={<><button className="btn" onClick={() => setOpenFolder(false)}>Cancelar</button><button className="btn primary" onClick={saveFolder}>Salvar</button></>}>
        <label className="lbl">Nome da pasta<input value={folderName} onChange={e => setFolderName(e.target.value)} /></label>
      </Modal>
    </div>
  )
}
