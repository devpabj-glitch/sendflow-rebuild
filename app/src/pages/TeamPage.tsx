import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Badge, EmptyState, Modal, PageHead, Pagination, Tabs } from '../components/Ui'
import { byCreatedDesc, fmtDate, nowIso, paginate, uid } from '../utils'
import type { TeamMember } from '../types'

const tabs = [{ id: 'team', label: 'Equipe' }, { id: 'perms', label: 'Permissões' }] as const
type Tab = typeof tabs[number]['id']

export default function TeamPage() {
  const { data, setTeam, setPermissions, audit } = useStore()
  const [tab, setTab] = useState<Tab>('team')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<TeamMember | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'Operadora', status: 'invited' as TeamMember['status'] })

  const list = useMemo(() => paginate(byCreatedDesc(data.team), page, 12), [data.team, page])

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) return
    if (edit) { setTeam(arr => arr.map(t => t.id === edit.id ? { ...t, ...form } : t)); audit('Membro atualizado', 'Equipe', edit.id) }
    else { const id = uid('t'); setTeam(arr => [{ id, ...form, createdAt: nowIso() }, ...arr]); audit('Membro adicionado', 'Equipe', id) }
    setOpen(false); setEdit(null); setForm({ name: '', email: '', role: 'Operadora', status: 'invited' })
  }

  const togglePerm = (id: string, key: 'view' | 'edit' | 'manage') => {
    setPermissions(arr => arr.map(p => p.id === id ? { ...p, [key]: !p[key] } : p))
    audit('Permissões alteradas', 'Equipe', id)
  }

  return (
    <div>
      <PageHead title="Equipe" sub="Membros e permissões por módulo." actions={tab === 'team' ? <button className="btn primary" onClick={() => { setEdit(null); setForm({ name: '', email: '', role: 'Operadora', status: 'invited' }); setOpen(true) }}>Adicionar</button> : null} />
      <Tabs items={tabs as any} value={tab} onChange={v => setTab(v as Tab)} />
      {tab === 'team' ? (
        <div className="card table-wrap">
          <table><thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th>Criado em</th><th></th></tr></thead>
            <tbody>{list.items.map(t => <tr key={t.id}><td style={{ fontWeight: 600 }}>{t.name}</td><td>{t.email}</td><td>{t.role}</td><td><Badge tone={t.status==='active'?'success':'info'}>{t.status==='active'?'Ativo':'Convidado'}</Badge></td><td>{fmtDate(t.createdAt)}</td><td><button className="btn sm" onClick={() => { setEdit(t); setForm({ name: t.name, email: t.email, role: t.role, status: t.status }); setOpen(true) }}>Editar</button></td></tr>)}</tbody>
          </table>
          {list.total === 0 ? <EmptyState /> : <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />}
        </div>
      ) : (
        <div className="card table-wrap">
          <table><thead><tr><th>Módulo</th><th>Ver</th><th>Editar</th><th>Gerenciar</th></tr></thead>
            <tbody>{data.permissions.map(p => <tr key={p.id}><td style={{ fontWeight: 600 }}>{p.module}</td>{(['view','edit','manage'] as const).map(k => <td key={k}><input className="check" type="checkbox" checked={p[k]} onChange={() => togglePerm(p.id, k)} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      <Modal title={edit ? 'Editar membro' : 'Novo membro'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></>}>
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">E-mail<input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></label>
          <label className="lbl">Papel<input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></label>
          <label className="lbl">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TeamMember['status'] }))}><option value="active">Ativo</option><option value="invited">Convidado</option></select></label>
        </div>
      </Modal>
    </div>
  )
}
