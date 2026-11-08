import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { byCreatedDesc, paginate, fmtDate } from '../utils'

export default function GroupSearch() {
  const { data } = useStore()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const f = byCreatedDesc(data.groups).filter(g => !t || g.name.toLowerCase().includes(t))
    return paginate(f, page, 12)
  }, [data.groups, q, page])

  return (
    <div className="gs-root">
      <div className="gs-head">
        <h2 className="gs-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          Buscar grupo
        </h2>
        <label className="gs-sort">Ordenação
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="recent">Mais recentes</option>
            <option value="old">Mais antigos</option>
          </select>
        </label>
      </div>

      <div className="gs-search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
          placeholder="Nome do grupo ou GID"
          aria-label="Nome do grupo ou GID"
        />
      </div>
      <p className="gs-help">Grupos que estão em alguma campanha deste cliente. Busque pelo nome ou pelo GID. Com 3 caracteres ou mais, a busca também inclui grupos das contas que não estão em campanha.</p>

      {list.total === 0 ? (
        <div className="gs-empty">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M8 8l6 6" /></svg>
          <span>Nenhum grupo encontrado.</span>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Grupo</th><th>Participantes</th><th>Conta</th><th>Campanha</th><th>Categoria</th><th>Criado em</th></tr></thead>
            <tbody>
              {list.items.map(g => <tr key={g.id}><td style={{ fontWeight: 600 }}>{g.name}</td><td>{g.participants}</td><td>{g.account}</td><td>{g.campaign}</td><td><span className="chip">{g.category}</span></td><td>{fmtDate(g.createdAt)}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
