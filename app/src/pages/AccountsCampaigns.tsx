import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { ApiError, accounts, releases } from '../lib/api'
import { Badge, EmptyState, PageHead, Tabs } from '../components/Ui'
import { byCreatedDesc } from '../utils'
import type { AccountApi, ReleaseApi } from '../types'

const views = [{ id: 'account', label: 'Por conta' }, { id: 'campaign', label: 'Por campanha' }, { id: 'matrix', label: 'Matriz' }] as const
type View = typeof views[number]['id']

// FATIA-04 (ASC): a tela sempre exibiu o cruzamento completo (nunca teve pager
// próprio) e a API pagina em até 100 itens — o cliente concatena as páginas
// até esgotar `total`, mantendo o comportamento visual (limite de escala
// declarado no contrato A1 §2; revisitar com endpoint agregado se virar
// gargalo medido).
const FETCH_PAGE_SIZE = 100

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number }

// Achado 3: sob deriva de paginação (item entra/sai entre fetches e desloca a
// janela), o mesmo id pode voltar em duas páginas — dedupe por id preservando
// a última ocorrência (também elimina React key duplicada na matriz).
async function fetchAll<T extends { id: string }>(fetchPage: (page: number) => Promise<Paged<T>>): Promise<T[]> {
  const first = await fetchPage(1)
  const all = [...first.items]
  const pages = Math.ceil(first.total / Math.max(1, first.pageSize))
  for (let p = 2; p <= pages; p++) all.push(...(await fetchPage(p)).items)
  return [...new Map(all.map(i => [i.id, i] as [string, T])).values()]
}

function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    if (err.code === 'BAD_ERROR_BODY' || err.code === 'INTERNAL_ERROR') return 'Erro no servidor. Tente novamente em instantes.'
    return err.message
  }
  return 'Erro inesperado.'
}

// FATIA-04 (ASC): matriz contas×campanhas sobre a API (GRUPOS ASC-01). Dados
// vêm de accounts.list × releases.list (org-scoped, TEN-01); associação =
// 1 PATCH /releases/:id com o conjunto COMPLETO novo (semântica replace, D13)
// — nunca delta. SEM atualização otimista: TODOS os checkboxes ficam
// desabilitados durante o envio e o estado vem da RESPOSTA do PATCH
// (verdade do servidor) — o contador N/M nunca reflete estado local não
// confirmado (aceitação do PM). Em erro a célula permanece no último estado
// confirmado (rollback implícito: nada não confirmado é exibido).
// Ressalva 1 do parecer: rótulo NEUTRO "Sem associações" (conta com 0
// associações) — "conta ociosa" não é exibido como oficial até DEC-14.
// Ressalva 2: "Campanhas sem contas" marcado como PROVISÓRIO até DEC-14;
// critério determinístico: não arquivada E accountIds vazio.
export default function AccountsCampaigns() {
  const { audit } = useStore() // histórico segue local (fatia futura); dados vêm da API
  const [view, setView] = useState<View>('account')
  const [alert, setAlert] = useState<'all' | 'idle' | 'exposed'>('all')
  const [display, setDisplay] = useState<'table' | 'cards'>('table')

  const [accountsList, setAccountsList] = useState<AccountApi[] | null>(null)
  const [releasesList, setReleasesList] = useState<ReleaseApi[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [savingRelease, setSavingRelease] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')

  // `archived` ausente = todas as releases (contrato A1 §3.1; associação a
  // release arquivada NÃO é bloqueada — nenhuma fonte amarra).
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    Promise.all([
      fetchAll(page => accounts.list({ page, pageSize: FETCH_PAGE_SIZE })),
      fetchAll(page => releases.list({ page, pageSize: FETCH_PAGE_SIZE })),
    ])
      .then(([accs, rels]) => {
        if (cancelled) return
        // Achado 2: ponto único de normalização — accountIds pode vir ausente
        // da API; todo acesso lê do estado já saneado (nunca undefined.includes).
        setAccountsList(accs); setReleasesList(rels.map(r => ({ ...r, accountIds: r.accountIds ?? [] }))); setLoading(false)
      })
      .catch((err: unknown) => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  }, [nonce])

  const accs = accountsList ?? []
  const rels = releasesList ?? []
  const accountsTotal = accs.length
  const releasesTotal = rels.length

  // Derivados determinísticos (Ressalvas 1 e 2 / contrato §3.3–3.4).
  const campsOf = (a: AccountApi) => rels.filter(r => r.accountIds.includes(a.id))
  const idleAccounts = accs.filter(a => campsOf(a).length === 0)
  const withAccounts = rels.filter(r => r.accountIds.length > 0)
  const exposedCampaigns = rels.filter(r => !r.archived && r.accountIds.length === 0)

  // Achado 4: ordenação pré-computada uma vez por mudança de lista — antes
  // byCreatedDesc era re-executado por linha da matriz no render.
  const sortedAccs = useMemo(() => byCreatedDesc(accs), [accountsList])
  const sortedRels = useMemo(() => byCreatedDesc(rels), [releasesList])

  const accountRows = useMemo(() => {
    let rows = sortedAccs.map(a => ({ ...a, camps: campsOf(a) }))
    if (alert === 'idle') rows = rows.filter(r => r.camps.length === 0)
    return rows
  }, [accountsList, releasesList, alert])

  const campaignRows = useMemo(() => {
    let rows = sortedRels.map(r => ({ ...r, accountNames: accs.filter(a => r.accountIds.includes(a.id)).map(a => a.name).join(', ') }))
    if (alert === 'exposed') rows = rows.filter(r => !r.archived && r.accountIds.length === 0)
    return rows
  }, [accountsList, releasesList, alert])

  // Toggle = 1 PATCH com o conjunto completo (replace, D13). Durante o envio
  // TODOS os checkboxes ficam desabilitados (Achado 1): o envio já é
  // single-flight (return acima), então nenhuma outra célula — da mesma release
  // ou não — pode disparar até a resposta; toggles concorrentes partiriam de
  // snapshots distintos (lost-update §3.7 do contrato).
  const toggle = async (account: AccountApi, release: ReleaseApi) => {
    if (savingRelease) return
    const set = new Set(release.accountIds)
    if (set.has(account.id)) set.delete(account.id)
    else set.add(account.id)
    setSavingRelease(release.id); setSaveError('')
    try {
      const updated = await releases.update(release.id, { accountIds: Array.from(set) })
      setReleasesList(rs => (rs ?? []).map(r => (r.id === updated.id ? { ...updated, accountIds: updated.accountIds ?? [] } : r)))
      audit('Associação conta×campanha atualizada', 'Contas e Campanhas', updated.id)
    } catch (err) {
      setSaveError(errorText(err))
    } finally {
      setSavingRelease(null)
    }
  }

  return (
    <div>
      <PageHead title="Contas e Campanhas" sub="Visão cruzada com alertas de saúde da operação." />
      {/* KPIs adaptados ao contrato A1 §3.5: a API só conhece 'nao_conectada' —
          os cards Conectadas/Desconectadas não têm dado real e saem (DIR-04);
          entram contadores determinísticos das próprias associações. */}
      <div className="grid kpis">
        <div className="card kpi"><div className="kpi-label">Contas</div><div className="kpi-value">{accountsTotal}</div><div className="kpi-hint">Total</div></div>
        <div className="card kpi"><div className="kpi-label">Campanhas</div><div className="kpi-value">{releasesTotal}</div><div className="kpi-hint">Total</div></div>
        <div className="card kpi"><div className="kpi-label">Sem associações</div><div className="kpi-value">{idleAccounts.length}</div><div className="kpi-hint">Contas com 0 associações</div></div>
        <div className="card kpi"><div className="kpi-label">Com conta associada</div><div className="kpi-value">{withAccounts.length}</div><div className="kpi-hint">Campanhas</div></div>
      </div>
      <Tabs items={views as any} value={view} onChange={v => setView(v as View)} />
      <div className="alerts">
        {/* Ressalva 1: rótulo neutro — critério determinístico "0 associações". */}
        <button className={`tab ${alert === 'all' ? 'active' : ''}`} onClick={() => setAlert('all')}>Todos</button>
        <button className={`tab ${alert === 'idle' ? 'active' : ''}`} onClick={() => setAlert('idle')}>Sem associações ({idleAccounts.length})</button>
        {/* Ressalva 2: rótulo PROVISÓRIO até DEC-14 — critério determinístico
            "não arquivada e sem contas", não "cobertura adequada". */}
        <button className={`tab ${alert === 'exposed' ? 'active' : ''}`} onClick={() => setAlert('exposed')}>Campanhas sem contas ({exposedCampaigns.length} · provisório)</button>
        <div className="spacer" />
        <div className="segmented">
          <button className={display === 'table' ? 'active' : ''} onClick={() => setDisplay('table')}>Tabela</button>
          <button className={display === 'cards' ? 'active' : ''} onClick={() => setDisplay('cards')}>Cards</button>
        </div>
      </div>
      <div className="card">
        {saveError ? <p role="alert" style={{ margin: '0 14px 10px' }}>{saveError}</p> : null}
        {error != null ? (
          <div>
            <EmptyState title={errorText(error)} />
            <div style={{ padding: '0 14px 14px' }}><button className="btn" type="button" onClick={() => { setSaveError(''); setNonce(n => n + 1) }}>Tentar novamente</button></div>
          </div>
        ) : loading && (accountsList == null || releasesList == null) ? (
          <EmptyState title="Carregando…" />
        ) : (
          <>
            {view === 'account' && (
              display === 'table' ? (
                <div className="table-wrap"><table><thead><tr><th>Conta</th><th>Status</th><th>Campanhas</th><th>Alerta</th></tr></thead><tbody>
                  {/* connectionStatus só tem 'nao_conectada' (F2) — rótulo honesto
                      único "Sem sessão"; nunca Online/Offline (DIR-04). */}
                  {accountRows.map(a => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td><td><Badge tone="muted">Sem sessão</Badge></td><td>{a.camps.length ? a.camps.map(c => c.name).join(', ') : '—'}</td><td>{a.camps.length === 0 ? <Badge tone="muted">Sem associações</Badge> : <Badge tone="success">OK</Badge>}</td></tr>)}
                </tbody></table>{accountRows.length === 0 && <EmptyState title="Nenhuma conta encontrada" />}</div>
              ) : <div className="grid" style={{ padding: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>{accountRows.map(a => <div key={a.id} className="card pad"><strong>{a.name}</strong><div style={{ margin: '8px 0' }}><Badge tone={a.camps.length ? 'success' : 'muted'}>{a.camps.length ? `${a.camps.length} campanha(s)` : 'Sem associações'}</Badge></div><div style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{a.camps.map(c => c.name).join(', ') || 'Sem associação'}</div></div>)}{accountRows.length === 0 && <EmptyState title="Nenhuma conta encontrada" />}</div>
            )}
            {view === 'campaign' && (
              <div className="table-wrap"><table><thead><tr><th>Campanha</th><th>Status</th><th>Contas</th><th>Alerta</th></tr></thead><tbody>
                {campaignRows.map(c => <tr key={c.id}><td style={{ fontWeight: 600 }}>{c.name}</td><td><Badge tone={c.archived ? 'muted' : 'info'}>{c.archived ? 'Arquivada' : 'Ativa'}</Badge></td><td>{c.accountNames || '—'}</td><td>{!c.archived && c.accountIds.length === 0 ? <Badge tone="danger">Sem contas</Badge> : <Badge tone="success">OK</Badge>}</td></tr>)}
              </tbody></table>{campaignRows.length === 0 && <EmptyState title="Nenhuma campanha encontrada" />}</div>
            )}
            {view === 'matrix' && (accountsTotal === 0 || releasesTotal === 0 ? (
              <EmptyState title={accountsTotal === 0 ? 'Nenhuma conta encontrada' : 'Nenhuma campanha encontrada'} />
            ) : (
              <div className="matrix table-wrap"><table><thead><tr><th>Conta \ Campanha</th>{sortedRels.map(c => <th key={c.id}>{c.name}{c.archived ? ' · arquivada' : ''} <small>{c.accountIds.length}/{accountsTotal}</small></th>)}</tr></thead><tbody>
                {sortedAccs.map(a => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name} <small>{campsOf(a).length}/{releasesTotal}</small></td>{sortedRels.map(c => <td key={c.id}><input type="checkbox" checked={c.accountIds.includes(a.id)} onChange={() => toggle(a, c)} disabled={savingRelease != null} aria-label={`Associação: ${a.name} × ${c.name}`} /></td>)}</tr>)}
              </tbody></table></div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
