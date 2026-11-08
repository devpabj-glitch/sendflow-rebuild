import React, { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Badge, EmptyState, PageHead, Tabs } from '../components/Ui'
import { byCreatedDesc } from '../utils'

const views = [{ id: 'account', label: 'Por conta' }, { id: 'campaign', label: 'Por campanha' }, { id: 'matrix', label: 'Matriz' }] as const
type View = typeof views[number]['id']

export default function AccountsCampaigns() {
  const { data } = useStore()
  const [view, setView] = useState<View>('account')
  const [alert, setAlert] = useState<'all' | 'idle' | 'exposed'>('all')
  const [display, setDisplay] = useState<'table' | 'cards'>('table')

  const total = data.accounts.length
  const online = data.accounts.filter(a => a.status === 'connected').length
  const offline = data.accounts.filter(a => a.status !== 'connected').length
  const associated = data.campaigns.filter(c => c.accountId).length
  const idleAccounts = data.accounts.filter(a => a.campaignIds.length === 0)
  const exposedCampaigns = data.campaigns.filter(c => c.status === 'active' && !c.accountId)

  const accountRows = useMemo(() => {
    let rows = byCreatedDesc(data.accounts).map(a => ({ ...a, camps: data.campaigns.filter(c => c.accountId === a.id || a.campaignIds.includes(c.id)) }))
    if (alert === 'idle') rows = rows.filter(r => r.camps.length === 0)
    return rows
  }, [data, alert])

  const campaignRows = useMemo(() => {
    let rows = byCreatedDesc(data.campaigns).map(c => ({ ...c, account: data.accounts.find(a => a.id === c.accountId) }))
    if (alert === 'exposed') rows = rows.filter(r => r.status === 'active' && !r.accountId)
    return rows
  }, [data, alert])

  return (
    <div>
      <PageHead title="Contas e Campanhas" sub="Visão cruzada com alertas de saúde da operação." />
      <div className="grid kpis">
        <div className="card kpi"><div className="kpi-label">Contas</div><div className="kpi-value">{total}</div><div className="kpi-hint">Total</div></div>
        <div className="card kpi"><div className="kpi-label">Conectadas</div><div className="kpi-value" style={{ color: 'var(--success)' }}>{online}</div><div className="kpi-hint">Online</div></div>
        <div className="card kpi"><div className="kpi-label">Desconectadas</div><div className="kpi-value" style={{ color: 'var(--warning)' }}>{offline}</div><div className="kpi-hint">Offline/sem sessão</div></div>
        <div className="card kpi"><div className="kpi-label">Campanhas</div><div className="kpi-value">{associated}</div><div className="kpi-hint">Associadas</div></div>
      </div>
      <Tabs items={views as any} value={view} onChange={v => setView(v as View)} />
      <div className="alerts">
        <button className={`tab ${alert === 'all' ? 'active' : ''}`} onClick={() => setAlert('all')}>Todos</button>
        <button className={`tab ${alert === 'idle' ? 'active' : ''}`} onClick={() => setAlert('idle')}>Contas ociosas ({idleAccounts.length})</button>
        <button className={`tab ${alert === 'exposed' ? 'active' : ''}`} onClick={() => setAlert('exposed')}>Campanhas expostas ({exposedCampaigns.length})</button>
        <div className="spacer" />
        <div className="segmented">
          <button className={display === 'table' ? 'active' : ''} onClick={() => setDisplay('table')}>Tabela</button>
          <button className={display === 'cards' ? 'active' : ''} onClick={() => setDisplay('cards')}>Cards</button>
        </div>
      </div>
      <div className="card">
        {view === 'account' && (
          display === 'table' ? (
            <div className="table-wrap"><table><thead><tr><th>Conta</th><th>Status</th><th>Campanhas</th><th>Alerta</th></tr></thead><tbody>
              {accountRows.map(a => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td><td><Badge tone={a.status==='connected'?'success':a.status==='disconnected'?'warning':'muted'}>{a.status==='connected'?'Online':'Offline'}</Badge></td><td>{a.camps.length ? a.camps.map(c=>c.name).join(', ') : '—'}</td><td>{a.camps.length===0 ? <Badge tone="warning">Ociosa</Badge> : <Badge tone="success">OK</Badge>}</td></tr>)}
            </tbody></table>{accountRows.length===0 && <EmptyState title="Nenhuma conta encontrada" />}</div>
          ) : <div className="grid" style={{ padding: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>{accountRows.map(a => <div key={a.id} className="card pad"><strong>{a.name}</strong><div style={{ margin: '8px 0' }}><Badge tone={a.camps.length? 'success':'warning'}>{a.camps.length? `${a.camps.length} campanha(s)` : 'Ociosa'}</Badge></div><div style={{ color:'var(--text-muted)', fontSize:'.88rem' }}>{a.camps.map(c=>c.name).join(', ')||'Sem associação'}</div></div>)}{accountRows.length===0 && <EmptyState title="Nenhuma conta encontrada" />}</div>
        )}
        {view === 'campaign' && (
          <div className="table-wrap"><table><thead><tr><th>Campanha</th><th>Status</th><th>Conta</th><th>Alerta</th></tr></thead><tbody>
            {campaignRows.map(c => <tr key={c.id}><td style={{ fontWeight: 600 }}>{c.name}</td><td><Badge tone={c.status==='active'?'info':'muted'}>{c.status==='active'?'Ativa':'Arquivada'}</Badge></td><td>{c.account?.name || '—'}</td><td>{c.status==='active' && !c.accountId ? <Badge tone="danger">Exposta</Badge> : <Badge tone="success">OK</Badge>}</td></tr>)}
          </tbody></table>{campaignRows.length===0 && <EmptyState />}</div>
        )}
        {view === 'matrix' && (
          <div className="matrix table-wrap"><table><thead><tr><th>Conta \ Campanha</th>{byCreatedDesc(data.campaigns).map(c => <th key={c.id}>{c.name}</th>)}</tr></thead><tbody>
            {byCreatedDesc(data.accounts).map(a => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td>{byCreatedDesc(data.campaigns).map(c => { const on = c.accountId === a.id || a.campaignIds.includes(c.id); return <td key={c.id}>{on ? <Badge tone="success">Associada</Badge> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td> })}</tr>)}
          </tbody></table></div>
        )}
      </div>
    </div>
  )
}
