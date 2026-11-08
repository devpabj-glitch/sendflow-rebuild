import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useModuleLists } from '../demo/useModule'
import { calculatedFull, countsAsFull, entryPercent, periodPhrase } from '../demo/rules'
import { nowIso } from '../utils'

const TABS = [
  'Visão geral',
  'Contas associadas',
  'Diagnósticos',
  'Grupos',
  'Solicitações de entrada',
  'Atividades',
  'Leadscoring',
  'Mensagens',
  'Mensagens recebidas',
  'Calendário',
  'Automações',
  'Ações',
] as const

const periods = ['7', '14', '21', '28', '90'] as const

function Unsampled({ note }: { note: string }) {
  return <p className="acc-empty">{note}</p>
}

export default function CampaignDetail() {
  const { id } = useParams()
  const { demo, campaigns, accounts, groups, setGroups } = useModuleLists()
  const camp = campaigns.find(c => c.id === id)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Visão geral')
  const [period, setPeriod] = useState<(typeof periods)[number]>('90')
  const [settings, setSettings] = useState(false)
  const [creators, setCreators] = useState(false)
  const [range, setRange] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [groupFilter, setGroupFilter] = useState<'all' | 'full' | 'open' | 'suspended'>('all')
  const [groupQ, setGroupQ] = useState('')
  const [entryTab, setEntryTab] = useState<'Pendentes' | 'Processadas' | 'Configurações'>('Pendentes')
  const [actionTab, setActionTab] = useState('Visão geral')
  const [createOpen, setCreateOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const mine = useMemo(() => groups.filter(g => g.campaignId === id || g.campaign === camp?.name), [groups, id, camp?.name])
  const visibleGroups = mine.filter(g => {
    const calc = calculatedFull(g.participants, g.limit || 0)
    const manual = !!g.fullManual
    if (groupFilter === 'suspended') return !!g.suspended
    if (g.suspended) return false
    if (groupFilter === 'full') return countsAsFull(manual, calc)
    if (groupFilter === 'open') return !countsAsFull(manual, calc)
    return true
  }).filter(g => !groupQ.trim() || g.name.toLowerCase().includes(groupQ.toLowerCase()))

  if (!camp) {
    return <div className="ov acc"><p className="acc-empty">Campanha não encontrada nesta visão.</p><Link to="/whats/campaigns">Voltar</Link></div>
  }

  const metrics = camp.metricsByPeriod[period] || camp.metricsByPeriod['90']
  const percent = entryPercent(metrics?.clicks || 0, metrics?.entries || 0)
  const associated = accounts.filter(a => a.campaignIds.includes(camp.id) || camp.accountId === a.id)

  const toggleFull = (gid: string) => {
    if (!demo) return
    setGroups(arr => arr.map(g => g.id === gid ? { ...g, fullManual: !g.fullManual } : g))
  }

  return (
    <div className="ov acc detail">
      <p className="detail-crumb"><Link to="/whats/campaigns">Campanhas</Link> <span>/</span> {camp.name} <span>/</span> {tab}</p>
      {demo ? <p className="demo-note">Exemplos fictícios. Nada nesta campanha é enviado ou gravado num servidor.</p> : <p className="demo-note">Visão vazia. Abra a demonstração para ver os exemplos.</p>}
      <div className="detail-tabs" role="tablist">
        {TABS.map(name => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? 'is-on' : ''} onClick={() => setTab(name)}>{name}</button>
        ))}
      </div>

      {tab === 'Visão geral' && (
        <section>
          <p className="cmp-note">{periodPhrase(period)} Quadro 14:46. O texto acompanha o período escolhido.</p>
          <div className="cmp-periods-row"><div className="cmp-periods">{periods.map(p => <button key={p} type="button" className={period === p ? 'is-on' : ''} onClick={() => setPeriod(p)}>{p} Dias</button>)}</div></div>
          <div className="cmp-grid">
            {[
              ['Clicks', metrics?.clicks || 0],
              ['Entraram', metrics?.entries || 0],
              ['Percentual de entrada', percent],
              ['Saíram', metrics?.exits || 0],
              ['Participantes', metrics?.participants || 0],
              ['Grupos', metrics?.groups || 0],
              ['Grupos cheios', mine.filter(g => countsAsFull(!!g.fullManual, calculatedFull(g.participants, g.limit || 0))).length],
              ['Grupos disponíveis', mine.filter(g => !g.suspended && !countsAsFull(!!g.fullManual, calculatedFull(g.participants, g.limit || 0))).length],
            ].map(([label, n]) => <article key={String(label)}><header><strong>{n}</strong></header><b>{label}</b></article>)}
          </div>
          <article className="ov-card detail-invite">
            <strong>Link de convite</strong>
            <code>{camp.invite || 'https://exemplo.local/convite/vazio'}</code>
            <div>
              <button type="button" className="acc-outline" onClick={() => setCopied(true)}>Editar</button>
              <button type="button" className="ov-yellow" onClick={() => { navigator.clipboard?.writeText(camp.invite || '').catch(() => {}); setCopied(true) }}>Copiar</button>
            </div>
            {copied ? <small>Cópia local do link fictício. Não abre conversa.</small> : null}
          </article>
          <div className="detail-chart" aria-label="Gráfico demonstrativo de cliques">
            <b>Clicks</b>
            <div className="detail-bars">{[2, 5, 3, 6, 4, 7, 3].map((n, i) => <span key={i} style={{ height: `${n * 10}px` }} />)}</div>
            <small>Série ilustrativa. Não é medição do período.</small>
          </div>
        </section>
      )}

      {tab === 'Contas associadas' && (
        <section>
          <header className="acc-head"><h2>Associe uma conta</h2><button type="button" className="acc-outline" onClick={() => setSettings(true)}>Configurações</button></header>
          <p className="demo-note">{picked.length}/{associated.length || accounts.length} contas nesta lista. Papéis por conta não foram confirmados no quadro 07:05.</p>
          <ul className="acc-list">
            {(associated.length ? associated : accounts).map(a => (
              <li key={a.id}>
                <label><input type="checkbox" checked={picked.includes(a.id)} onChange={() => setPicked(list => list.includes(a.id) ? list.filter(x => x !== a.id) : [...list, a.id])} /> <strong>{a.name}</strong></label>
                <span>{a.status === 'connected' ? 'Online' : 'Offline'}</span>
              </li>
            ))}
          </ul>
          {settings ? (
            <div className="g-modal-back" onClick={() => setSettings(false)}>
              <div className="g-modal ov-config" onClick={e => e.stopPropagation()}>
                <header><strong>Configurações</strong><button type="button" onClick={() => setSettings(false)} aria-label="Fechar">×</button></header>
                <label className="detail-toggle"><input type="checkbox" checked={creators} onChange={() => setCreators(v => !v)} /> Especificar contas criadoras de grupos</label>
                <label className="detail-toggle"><input type="checkbox" checked={range} onChange={() => setRange(v => !v)} /> Especificar range de operação das contas</label>
                <p className="acc-note">O selo de administrador do quadro não ficou legível. Não há papel gravado aqui.</p>
                <div className="ov-config-foot"><button type="button" onClick={() => setSettings(false)}>Fechar</button><button type="button" className="ov-yellow" onClick={() => setSettings(false)}>Salvar na demonstração</button></div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {tab === 'Diagnósticos' && <Unsampled note="A aba Diagnósticos aparece no quadro 07:05. O conteúdo não foi amostrado." />}

      {tab === 'Grupos' && (
        <section>
          <div className="acc-actions">
            <button type="button" className="ov-yellow" onClick={() => setCreateOpen(true)}>Criar grupos</button>
          </div>
          <div className="detail-filters">
            {([['all', 'Todos os grupos'], ['full', 'Grupos cheios'], ['open', 'Grupos não cheios'], ['suspended', 'Grupo suspenso']] as const).map(([id, label]) => (
              <button key={id} type="button" className={groupFilter === id ? 'is-on' : ''} onClick={() => setGroupFilter(id)}>{label}</button>
            ))}
          </div>
          <p className="demo-note">Cheio manual é o interruptor da linha. Cheio calculado compara participantes com o limite. O filtro “cheios” inclui quem estiver em qualquer um dos dois.</p>
          <label className="acc-search"><span>Buscar</span><input value={groupQ} onChange={e => setGroupQ(e.target.value)} /></label>
          {visibleGroups.length === 0 ? <p className="acc-empty">Nenhum registro encontrado</p> : (
            <ul className="acc-list">
              {visibleGroups.map(g => {
                const calc = calculatedFull(g.participants, g.limit || 0)
                return (
                  <li key={g.id}>
                    <div><strong>{g.name}</strong><span>{g.clicks || 0} cliques reais · {g.participants} participantes</span></div>
                    <em>Manual: {g.fullManual ? 'Sim' : 'Não'}</em>
                    <span>Calculado: {calc ? 'Sim' : 'Não'} ({g.participants}/{g.limit || 0})</span>
                    <button type="button" disabled={!demo} onClick={() => toggleFull(g.id)}>{g.fullManual ? 'Desmarcar cheio' : 'Marcar cheio'}</button>
                  </li>
                )
              })}
            </ul>
          )}
          {createOpen ? <GroupDraft demo={demo} onClose={() => setCreateOpen(false)} onSave={name => {
            if (!demo || !camp) return
            setGroups(arr => [{ id: `demo-${Date.now()}`, name, participants: 0, limit: 50, fullManual: false, clicks: 0, account: 'Linha Norte', campaign: camp.name, campaignId: camp.id, category: 'normal', createdAt: nowIso(), suspended: false }, ...arr])
            setCreateOpen(false)
          }} /> : null}
        </section>
      )}

      {tab === 'Solicitações de entrada' && (
        <section>
          <div className="detail-filters">
            {(['Pendentes', 'Processadas', 'Configurações'] as const).map(name => (
              <button key={name} type="button" className={entryTab === name ? 'is-on' : ''} onClick={() => setEntryTab(name)}>{name}</button>
            ))}
          </div>
          {entryTab === 'Configurações' ? <Unsampled note="A aba Configurações foi nomeada no quadro 45:01. Aprovação por tag não foi amostrada." /> : (
            <>
              <p className="demo-note">0 pendente(s). Botões de aprovar e recusar ficam desabilitados sem seleção.</p>
              <div className="acc-actions">
                <button type="button" className="acc-outline" disabled>Recusar selecionadas</button>
                <button type="button" className="acc-outline" disabled>Aprovar selecionadas</button>
              </div>
              <p className="acc-empty">Nenhuma solicitação pendente no momento</p>
            </>
          )}
        </section>
      )}

      {tab === 'Atividades' && <Unsampled note="Em 43:55 o cursor só passa sobre Atividades. A tabela não foi amostrada." />}

      {tab === 'Leadscoring' && (
        <section>
          <p className="demo-note">Pontos lidos no quadro 43:55. Não são uma regra fixa.</p>
          <div className="detail-filters">
            <span>Recebeu 10</span><span>Visualizou 20</span><span>Reproduziu 40</span><span>Reagiu 50</span><span>Mensagem 60</span>
          </div>
          <p className="acc-empty">Tabela de exemplo mascarada. Nenhum número real.</p>
          <ul className="acc-list"><li><strong>•••• 1204</strong><span>40 pts</span></li></ul>
        </section>
      )}

      {tab === 'Mensagens' && <Unsampled note="A aba Mensagens está no quadro 07:05. O editor em blocos foi visto no fluxo de ação (27:33), não como layout desta aba." />}
      {tab === 'Mensagens recebidas' && <Unsampled note="A aba foi nomeada em 07:05. O conteúdo não foi amostrado." />}
      {tab === 'Calendário' && <Unsampled note="A aba foi nomeada em 07:05. O conteúdo não foi amostrado." />}
      {tab === 'Automações' && <Unsampled note="A aba foi nomeada em 07:05. O assistente de automação visto depois é outra tela." />}

      {tab === 'Ações' && (
        <section>
          <div className="detail-filters">
            {['Visão geral', 'Na fila', 'Agendado', 'Processando', 'Sucesso', 'Falhas'].map(name => (
              <button key={name} type="button" className={actionTab === name ? 'is-on' : ''} onClick={() => setActionTab(name)}>{name}</button>
            ))}
          </div>
          <p className="demo-note">Dois itens de exemplo do quadro 14:22. O intervalo de horário é deste caso, não uma regra. Nenhum envio acontece.</p>
          {(actionTab === 'Visão geral' || actionTab === 'Agendado' || actionTab === 'Sucesso') ? (
            <ul className="acc-list">
              <li><div><strong>Criar grupo</strong><span>Agendado para 26/07/2026, 22:11</span></div><em>Exemplo</em></li>
              {actionTab !== 'Agendado' ? <li><div><strong>Criar grupo</strong><span>Duração ilustrativa 9s</span></div><em>Exemplo</em></li> : null}
            </ul>
          ) : <p className="acc-empty">Nenhum registro encontrado</p>}
        </section>
      )}
    </div>
  )
}

function GroupDraft({ demo, onClose, onSave }: { demo: boolean; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('Grupo de exemplo')
  const [desc, setDesc] = useState('')
  const [start, setStart] = useState('1')
  const [info, setInfo] = useState(true)
  return (
    <div className="g-modal-back" onClick={onClose}>
      <div className="g-modal ov-config detail-draft" onClick={e => e.stopPropagation()}>
        <header><strong>Criação de grupos</strong><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
        <div className="detail-filters">
          <button type="button" className={info ? 'is-on' : ''} onClick={() => setInfo(true)}>Informações</button>
          <button type="button" className={!info ? 'is-on' : ''} onClick={() => setInfo(false)}>Administradores</button>
        </div>
        {info ? (
          <div className="form-grid">
            <label className="lbl">Nome dos grupos<input value={name} maxLength={95} onChange={e => setName(e.target.value)} /></label>
            <small>{name.length}/95</small>
            <label className="lbl">Descrição<textarea value={desc} maxLength={2048} onChange={e => setDesc(e.target.value)} /></label>
            <small>{desc.length}/2048</small>
            <label className="lbl">Início da contagem<input value={start} onChange={e => setStart(e.target.value)} /></label>
            <p className="acc-note">Alterações de exemplo valem só para grupos novos desta demonstração. Limite, reserva, modo normal/seguro e os toggles do quadro existem como campos no vídeo; aqui o salvamento não dispara criação externa.</p>
          </div>
        ) : (
          <div>
            <button type="button" className="ov-yellow">+ Novo administrador</button>
            <p className="acc-note">Seções vistas em 14:06: administradores de contas associadas e de contas de criação. DDI e número não apareceram no quadro.</p>
          </div>
        )}
        <div className="ov-config-foot">
          <button type="button" onClick={onClose}>Fechar</button>
          <button type="button" className="ov-yellow" disabled={!demo || !name.trim()} onClick={() => onSave(name.trim())}>Salvar na demonstração</button>
        </div>
      </div>
    </div>
  )
}
