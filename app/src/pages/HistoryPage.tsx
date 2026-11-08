import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { EmptyState, PageHead, Pagination } from '../components/Ui'
import { byCreatedDesc, fmtDate, paginate } from '../utils'

type Row = { id: string; action: string; where: string; ip: string; refId: string; team: string; startedAt: string; endedAt: string }

export default function HistoryPage() {
  const { data } = useStore()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const rows = [...data.audit].sort((a,b)=>+new Date(b.startedAt)-+new Date(a.startedAt)) as Row[]
    const f = rows.filter(r => !t || `${r.action} ${r.where} ${r.ip} ${r.refId} ${r.team}`.toLowerCase().includes(t))
    return paginate(f, page, 12)
  }, [data.audit, q, page])

  return (
    <div>
      <PageHead title="Histórico de auditoria" sub="Registro de ações com origem, equipe e datas." />
      <div className="toolbar">
        <div className="field"><span>Buscar</span><input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Ação, onde, IP, ID ou equipe" /></div>
        <span className="chip">Ordenação: Data de início</span>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Ação</th><th>Onde</th><th>Endereço de IP</th><th>ID</th><th>Equipe</th><th>Data de início</th><th>Data de fim</th></tr></thead>
          <tbody>
            {list.items.map(r => <tr key={r.id}><td style={{ fontWeight: 600 }}>{r.action}</td><td>{r.where}</td><td>{r.ip}</td><td>{r.refId}</td><td>{r.team}</td><td>{fmtDate(r.startedAt)}</td><td>{fmtDate(r.endedAt)}</td></tr>)}
          </tbody>
        </table>
        {list.total === 0 ? <EmptyState /> : <Pagination page={list.page} pages={list.pages} total={list.total} perPage={12} onPage={setPage} />}
      </div>
    </div>
  )
}
