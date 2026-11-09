import React, { useEffect, useMemo, useState } from 'react'
import { ApiError, groups, releases } from '../lib/api'
import type { GroupListResult } from '../lib/api'
import { fmtDate } from '../utils'

const PAGE_SIZE = 12

// FATIA-05: dados vêm da API /api/v1/groups — lista GLOBAL por org (a tela
// nunca teve filtro de release e NÃO ganhou um; sem releaseId no pedido).
// A tela segue somente leitura+busca (o que sempre foi): nenhum botão de
// ação por linha foi adicionado — marcar/desmarcar cheio, editar e excluir
// pertencem à fatia da lista de grupos por campanha e usam o namespace
// `groups` (markFull/markNotFull idempotentes; D15 sem massa, iteração por
// id; D16 DELETE 204). Zero mudança de estilos/classes.
function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    if (err.code === 'BAD_ERROR_BODY' || err.code === 'INTERNAL_ERROR') return 'Erro no servidor. Tente novamente em instantes.'
    return err.message
  }
  return 'Erro inesperado.'
}

export default function GroupSearch() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<GroupListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [releaseNames, setReleaseNames] = useState<Record<string, string>>({})

  // Busca com debounce leve (padrão F3/Campaigns); Enter confirma na hora.
  // O servidor casa substring CI em name OU gid (contrato A1 §3.2) — o
  // placeholder "Nome do grupo ou GID" passa a ser verdadeiro.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    groups.list({ search, page, pageSize: PAGE_SIZE })
      .then(r => { if (!cancelled) { setResult(r); setLoading(false) } })
      .catch((err: unknown) => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  }, [search, page, nonce])

  // Coluna "Campanha": mapa id→nome da primeira página de releases
  // (pageSize 100 = máximo do servidor — além disso o nome fica '—',
  // honesto; sem join no servidor nesta fatia). Falha aqui NÃO derruba a
  // lista de grupos — a coluna segue com '—'.
  useEffect(() => {
    let cancelled = false
    releases.list({ pageSize: 100 })
      .then(r => { if (!cancelled) setReleaseNames(Object.fromEntries(r.items.map(x => [x.id, x.name]))) })
      .catch(() => { /* coluna segue '—' */ })
    return () => { cancelled = true }
  }, [nonce])

  // Ordenação existente mantida no CLIENTE sobre a página (o servidor ordena
  // fixo created_at DESC, id DESC — contrato A1 §3.2): 'recent' = como vem;
  // 'old' = página invertida. Não é reordenação global — declarado no
  // contrato front. No legado a opção "Mais antigos" não tinha efeito.
  const items = useMemo(() => {
    const rows = result?.items ?? []
    return sort === 'old' ? [...rows].reverse() : rows
  }, [result, sort])

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
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearch(q); setPage(1) } }}
          placeholder="Nome do grupo ou GID"
          aria-label="Nome do grupo ou GID"
        />
      </div>
      <p className="gs-help">Grupos que estão em alguma campanha deste cliente. Busque pelo nome ou pelo GID.</p>

      {error != null ? (
        <div className="gs-empty">
          <span>{errorText(error)}</span>
          <button className="acc-outline" type="button" onClick={() => setNonce(n => n + 1)}>Tentar novamente</button>
        </div>
      ) : loading && result == null ? (
        <div className="gs-empty"><span>Carregando…</span></div>
      ) : items.length === 0 ? (
        <div className="gs-empty">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M8 8l6 6" /></svg>
          <span>Nenhum grupo encontrado.</span>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Grupo</th><th>Participantes</th><th>Conta</th><th>Campanha</th><th>Categoria</th><th>Criado em</th></tr></thead>
            <tbody>
              {items.map(g => <tr key={g.id}><td style={{ fontWeight: 600 }}>{g.name}</td><td>{g.participants}</td><td>—</td><td>{releaseNames[g.releaseId] ?? '—'}</td><td><span className="chip">—</span></td><td>{fmtDate(g.createdAt)}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
