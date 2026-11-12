import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { ApiError, accounts } from '../lib/api'
import { M } from '../components/Icons'
import { Modal } from '../components/Ui'
import { fmtDate } from '../utils'
import type { AccountApi, AccountConnectionStatus } from '../types'

// Abas coarse sobre os 5 estados reais (contrato FATIA-07 §12.2): "Desconectadas"
// agrupa desconectada+banida (sem sessão viva); "Sem sessão" agrupa
// nao_conectada+aguardando_qr (nunca autenticou). O badge da linha sempre
// mostra o estado exato vindo do servidor.
const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'conectada', label: 'Conectadas' },
  { id: 'desconectada', label: 'Desconectadas' },
  { id: 'nao_conectada', label: 'Sem sessão' },
] as const
type Tab = typeof tabs[number]['id']

const PAGE_SIZE = 12
const POLL_MS = 3000

// FATIA-07 (contrato A1 §12.2 + parecer R4): os 5 estados REAIS do servidor —
// rótulo e cor honestos, zero estado otimista (DIR-04). `banida` não afirma
// causa certa: o provedor reportou encerramento 401/403.
const STATUS_META: Record<AccountConnectionStatus, { label: string; cls: string; hint?: string }> = {
  nao_conectada: { label: 'Não conectada', cls: 's-nao_conectada' },
  aguardando_qr: { label: 'Aguardando QR', cls: 's-aguardando_qr' },
  conectada: { label: 'Conectada', cls: 's-conectada' },
  desconectada: { label: 'Desconectada', cls: 's-desconectada' },
  banida: { label: 'Banida', cls: 's-banida', hint: 'O provedor encerrou a sessão (401/403)' },
}

function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    if (err.code === 'BAD_ERROR_BODY' || err.code === 'INTERNAL_ERROR') return 'Erro no servidor. Tente novamente em instantes.'
    return err.message
  }
  return 'Erro inesperado.'
}

// FATIA-07 (§4.5): mensagens honestas para os erros definitivos do fluxo de conexão.
function connectionErrorText(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'ACCOUNT_CONNECTED': return 'Esta conta já está conectada.'
      case 'EVOLUTION_NOT_CONNECTED': return 'A conta ainda não tem instância no provedor. Feche esta janela e clique em Conectar para gerar um novo QR.'
      case 'EVOLUTION_NOT_CONFIGURED': return 'Integração não configurada.'
      case 'EVOLUTION_UNAVAILABLE': return 'Provedor indisponível, tente novamente.'
      default:
        if (err.status === 404) return 'Conta não encontrada.'
        return errorText(err)
    }
  }
  return errorText(err)
}

// 401 = sessão expirada: para tudo e segue o fluxo existente de redirect ao login.
const isAuthExpired = (err: unknown): boolean => err instanceof ApiError && err.status === 401
// Transitório (rede/timeout) é silencioso no polling e mantém tentando (§12.3);
// qualquer resposta definitiva do servidor (401/404/409/502/503…) para o polling.
const isTransient = (err: unknown): boolean =>
  err instanceof ApiError && (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT')

const emptyForm = { name: '', type: 'WhatsApp', isSpy: false }

export default function Accounts() {
  const { audit } = useStore() // histórico segue local (fatia futura); dados vêm da API
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{ items: AccountApi[]; total: number; page: number; pageSize: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [open, setOpen] = useState(false)
  const [upgrade, setUpgrade] = useState(false)
  const [edit, setEdit] = useState<AccountApi | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Modal de conexão por QR (FATIA-07 §12.3): TODO estado exibido vem de resposta
  // do servidor — nunca otimista. Fechar o modal não cancela nada no servidor
  // (§12.3.3): o QR expira sozinho no provedor e o badge continua mostrando o
  // estado real (ex.: `aguardando_qr` residual).
  const [qrTarget, setQrTarget] = useState<AccountApi | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrBusy, setQrBusy] = useState(false)       // POST connect inicial em voo
  const [qrNewBusy, setQrNewBusy] = useState(false) // GET /qr ("Gerar novo QR") em voo
  const [qrError, setQrError] = useState('')
  const [polling, setPolling] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)

  // Desconexão (§12.3.4): ação destrutiva — confirmação explícita antes do POST.
  const [disconnectTarget, setDisconnectTarget] = useState<AccountApi | null>(null)
  const [disconnectBusy, setDisconnectBusy] = useState(false)
  const [disconnectError, setDisconnectError] = useState('')

  // Busca com debounce leve (mantém o comportamento visual de filtrar ao digitar);
  // Enter confirma na hora.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    accounts.list({ search, page, pageSize: PAGE_SIZE })
      .then(r => { if (!cancelled) { setResult(r); setLoading(false) } })
      .catch((err: unknown) => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  }, [search, page, nonce])

  const shown = useMemo(() => {
    const items = result?.items ?? []
    if (tab === 'all') return items
    if (tab === 'desconectada') return items.filter(a => a.connectionStatus === 'desconectada' || a.connectionStatus === 'banida')
    if (tab === 'nao_conectada') return items.filter(a => a.connectionStatus === 'nao_conectada' || a.connectionStatus === 'aguardando_qr')
    return items.filter(a => a.connectionStatus === 'conectada')
  }, [result, tab])

  // Atualiza a linha da lista com uma conta vinda de QUALQUER resposta do servidor
  // (connect/qr/poll/disconnect) — é evidência, não otimismo.
  const mergeAccount = (a: AccountApi) =>
    setResult(r => (r == null ? r : { ...r, items: r.items.map(it => (it.id === a.id ? a : it)) }))

  const refreshAccount = (id: string) => {
    accounts.get(id).then(mergeAccount).catch(() => { /* mantém o último estado conhecido */ })
  }

  const save = async () => {
    if (!form.name.trim() || saving) return
    setSaving(true); setSaveError('')
    try {
      if (edit) {
        const updated = await accounts.update(edit.id, { name: form.name.trim(), type: form.type, isSpy: form.isSpy })
        audit('Conta atualizada', 'Contas', updated.id)
      } else {
        const created = await accounts.create({ name: form.name.trim(), type: form.type, isSpy: form.isSpy })
        audit('Conta criada', 'Contas', created.id)
        setPage(1) // lista é created_at DESC: a nova conta entra no topo da primeira página
      }
      setOpen(false); setEdit(null); setForm(emptyForm)
      setNonce(n => n + 1) // relê do servidor — a API é a fonte da verdade
    } catch (err) {
      setSaveError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  // --- Fluxo de conexão por QR (FATIA-07 §12.3) ---

  // Sessão do modal: invalida cadeias assíncronas órfãs (ex.: POST connect que
  // resolve depois de o usuário fechar o modal) para não reabrir polling zumbi.
  const qrSession = useRef(0)
  const pollInFlight = useRef(false)

  const closeQr = () => {
    qrSession.current++
    setPolling(false)
    setQrTarget(null)
    setQrDataUrl(null)
    setQrError('')
    setQrBusy(false)
    setQrNewBusy(false)
  }

  const finishConnected = (acc: AccountApi | null) => {
    if (acc) mergeAccount(acc)
    audit('Conta conectada', 'Contas', acc?.id ?? qrTarget?.id ?? '—')
    setNotice({ kind: 'ok', text: acc?.phone ? `Conta conectada (${acc.phone}).` : 'Conta conectada.' })
    closeQr()
  }

  // Parecer R4: copy honesta — o provedor encerrou a sessão (401/403); sem causa certa.
  const finishBanned = (acc: AccountApi | null) => {
    if (acc) mergeAccount(acc)
    setNotice({ kind: 'warn', text: 'O provedor encerrou a sessão (401/403). A conta foi marcada como banida.' })
    closeQr()
  }

  const handleAuthExpired = () => {
    closeQr()
    setDisconnectTarget(null)
    nav('/login') // fluxo existente: a sessão do servidor é a verdade (cookie morto → login)
  }

  const startConnect = (a: AccountApi) => {
    const session = ++qrSession.current
    setNotice(null)
    setQrTarget(a)
    setQrDataUrl(null)
    setQrError('')
    setPolling(false)
    setQrBusy(true)
    accounts.connect(a.id)
      .then(res => {
        mergeAccount(res.account) // evidência do servidor (status/phone reais)
        if (session !== qrSession.current) return // modal já foi fechado
        setQrDataUrl(res.qrDataUrl)
        if (res.account.connectionStatus === 'conectada') finishConnected(res.account)
        else if (res.account.connectionStatus === 'banida') finishBanned(res.account)
        else setPolling(true) // acompanha o estado real até a leitura do QR
      })
      .catch((err: unknown) => {
        if (session !== qrSession.current) return
        if (isAuthExpired(err)) { handleAuthExpired(); return }
        if (err instanceof ApiError && err.code === 'ACCOUNT_CONNECTED') {
          // Já conectada (resposta definitiva): mostra o estado REAL da conta.
          closeQr()
          refreshAccount(a.id)
          setNotice({ kind: 'ok', text: 'A conta já estava conectada.' })
          return
        }
        setQrError(connectionErrorText(err)) // estado intacto; sem retry automático (§12.3.1)
      })
      .finally(() => { if (session === qrSession.current) setQrBusy(false) })
  }

  // Um ciclo de polling (§12.3.2): lê o estado real (GET /accounts/:id) e o QR
  // vigente (GET /accounts/:id/qr) em paralelo. A conclusão pelo estado real
  // (conectada/banida) tem prioridade sobre falha do QR no mesmo ciclo; erros
  // transitórios de rede são silenciosos; definitivos (401/404/409/502/503)
  // param o polling com mensagem honesta.
  const pollTick = () => {
    const id = qrTarget?.id
    if (id == null || pollInFlight.current) return
    pollInFlight.current = true
    void (async () => {
      let latest: AccountApi | null = null
      let status: AccountConnectionStatus | null = null
      let definitiveError: unknown = null
      const [got, qrd] = await Promise.allSettled([accounts.get(id), accounts.qr(id)])

      if (got.status === 'fulfilled') {
        latest = got.value
        mergeAccount(got.value)
        status = got.value.connectionStatus
      }
      if (qrd.status === 'fulfilled') {
        setQrDataUrl(qrd.value.qrDataUrl) // null = ainda gerando (§0.1.7)
        status = qrd.value.connectionStatus // evidência mais recente do ciclo
      } else {
        const err = qrd.reason as unknown
        if (err instanceof ApiError && err.code === 'ACCOUNT_CONNECTED') status = 'conectada' // conectou (§12.3.2)
        else if (isAuthExpired(err)) { handleAuthExpired(); return }
        else if (!isTransient(err)) definitiveError = err
      }
      if (got.status === 'rejected') {
        const err = got.reason as unknown
        if (isAuthExpired(err)) { handleAuthExpired(); return }
        if (!isTransient(err)) definitiveError = err
      }

      if (status === 'conectada') {
        const acc = latest ?? (await accounts.get(id).catch(() => null))
        finishConnected(acc)
      } else if (status === 'banida') {
        finishBanned(latest)
      } else if (definitiveError != null) {
        setPolling(false)
        setQrError(connectionErrorText(definitiveError))
      }
    })().finally(() => { pollInFlight.current = false })
  }

  // Intervalo de 3s enquanto o modal estiver aberto em fase de polling; o cleanup
  // para tudo em unmount/navegação (parecer R7a).
  const pollTickRef = useRef<() => void>(() => {})
  useEffect(() => { pollTickRef.current = pollTick })
  const qrTargetId = qrTarget?.id ?? null
  useEffect(() => {
    if (!polling || qrTargetId == null) return
    const iv = setInterval(() => pollTickRef.current(), POLL_MS)
    return () => clearInterval(iv)
  }, [polling, qrTargetId])

  // "Gerar novo QR": busca o QR vigente (§12.3.2) — também retoma o polling
  // quando um erro definitivo o havia parado.
  const regenerateQr = () => {
    const id = qrTarget?.id
    if (id == null || qrNewBusy || qrBusy) return
    const session = qrSession.current
    setQrNewBusy(true); setQrError('')
    accounts.qr(id)
      .then(res => {
        if (session !== qrSession.current) return
        setQrDataUrl(res.qrDataUrl)
        if (res.connectionStatus === 'conectada') {
          accounts.get(id).then(finishConnected).catch(() => finishConnected(null))
          return
        }
        setPolling(true)
      })
      .catch((err: unknown) => {
        if (session !== qrSession.current) return
        if (isAuthExpired(err)) { handleAuthExpired(); return }
        if (err instanceof ApiError && err.code === 'ACCOUNT_CONNECTED') {
          accounts.get(id).then(finishConnected).catch(() => finishConnected(null))
          return
        }
        setPolling(false)
        setQrError(connectionErrorText(err))
      })
      .finally(() => { if (session === qrSession.current) setQrNewBusy(false) })
  }

  // --- Desconexão (§12.3.4): atualiza SEMPRE pela resposta do servidor ---

  const confirmDisconnect = () => {
    const a = disconnectTarget
    if (a == null || disconnectBusy) return
    setDisconnectBusy(true); setDisconnectError('')
    accounts.disconnect(a.id)
      .then(acc => {
        mergeAccount(acc) // estado real da resposta (nunca assumir)
        audit('Conta desconectada', 'Contas', acc.id)
        setDisconnectTarget(null)
        setNotice({ kind: 'ok', text: 'Conta desconectada.' })
      })
      .catch((err: unknown) => {
        if (isAuthExpired(err)) { handleAuthExpired(); return }
        if (err instanceof ApiError && err.code === 'EVOLUTION_NOT_CONNECTED') {
          // O estado real já mudou fora da tela — atualiza pela resposta do servidor.
          setDisconnectTarget(null)
          refreshAccount(a.id)
          setNotice({ kind: 'warn', text: 'A conta já não estava conectada.' })
          return
        }
        setDisconnectError(connectionErrorText(err)) // estado anterior mantido
      })
      .finally(() => setDisconnectBusy(false))
  }

  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const curPage = result?.page ?? page
  const from = total === 0 ? 0 : (curPage - 1) * PAGE_SIZE + 1
  const to = Math.min(curPage * PAGE_SIZE, total)

  return (
    <div className="ov acc">
      <div className="acc-head">
        <h2>Contas</h2>
        <div className="acc-actions">
          <Link className="acc-outline" to="/whats/accounts-campaigns"><M.hub size={16} /> Contas e Campanhas</Link>
          <button className="acc-outline" type="button" onClick={() => setUpgrade(true)}><M.bolt size={16} /> Fazer upgrade de plano</button>
          <button className="acc-outline" type="button" onClick={() => { setEdit(null); setForm(emptyForm); setSaveError(''); setOpen(true) }}>+ Conta</button>
        </div>
      </div>
      {notice ? (
        <p className={`acc-note acc-note-${notice.kind}`} role={notice.kind === 'warn' ? 'alert' : 'status'}>{notice.text}</p>
      ) : null}
      <div className="acc-bar">
        <div className="acc-tabs">
          {tabs.map(t => (
            <button key={t.id} type="button" className={tab === t.id ? 'is-on' : ''} onClick={() => { setTab(t.id); setPage(1) }}>{t.label}</button>
          ))}
        </div>
        <label className="acc-sort">Ordenação
          <select aria-label="Ordenação" defaultValue="created"><option value="created">Data de criação</option></select>
        </label>
      </div>
      <label className="acc-search">
        <span>Buscar</span>
        <M.search size={18} />
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setSearch(q); setPage(1) } }} />
      </label>
      <div className="acc-pager">
        <span>Linhas por página</span>
        <select aria-label="Linhas por página" defaultValue={PAGE_SIZE}><option>{PAGE_SIZE}</option></select>
        <span>{from}-{to} de {total}</span>
        <button type="button" aria-label="Primeira página" disabled={curPage <= 1} onClick={() => setPage(1)}>«</button>
        <button type="button" aria-label="Página anterior" disabled={curPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
        <button type="button" aria-label="Próxima página" disabled={curPage >= pages} onClick={() => setPage(p => p + 1)}>›</button>
      </div>
      {error != null ? (
        <div>
          <p className="acc-empty">{errorText(error)}</p>
          <button className="acc-outline" type="button" onClick={() => setNonce(n => n + 1)}>Tentar novamente</button>
        </div>
      ) : loading && result == null ? <p className="acc-empty">Carregando…</p> : shown.length === 0 ? <p className="acc-empty">Nenhum registro encontrado</p> : (
        <ul className="acc-list">
          {shown.map(a => {
            const meta = STATUS_META[a.connectionStatus]
            return (
              <li key={a.id}>
                <div>
                  <strong>{a.name}</strong>
                  {/* phone = último número conhecido (§0.1.2): informação, não "online agora" */}
                  <span>{a.phone ? `${a.type} · ${a.phone}` : a.type}</span>
                </div>
                <em className={meta.cls} title={meta.hint}>{meta.label}</em>
                <span>{fmtDate(a.createdAt)}</span>
                <div className="acc-row-actions">
                  {a.connectionStatus === 'conectada' ? (
                    <button type="button" onClick={() => { setDisconnectError(''); setDisconnectTarget(a) }}>Desconectar</button>
                  ) : (
                    <button type="button" onClick={() => startConnect(a)}>Conectar</button>
                  )}
                  <button type="button" onClick={() => { setEdit(a); setForm({ name: a.name, type: a.type, isSpy: a.isSpy }); setSaveError(''); setOpen(true) }}>Editar</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {upgrade ? (
        <div className="g-modal-back" onClick={() => setUpgrade(false)}>
          <div className="g-modal ov-config" onClick={e => e.stopPropagation()}>
            <header><strong>Ampliar o plano</strong><button type="button" onClick={() => setUpgrade(false)} aria-label="Fechar">×</button></header>
            <p className="acc-note">O plano atual comporta 1 conta. Para abrir mais linhas, fale com o comercial da Grupos. Nada é cobrado nesta tela.</p>
            <div className="ov-config-foot"><button type="button" className="ov-yellow" onClick={() => setUpgrade(false)}>Entendi</button></div>
          </div>
        </div>
      ) : null}
      <Modal title={edit ? 'Editar conta' : 'Nova conta'} open={open} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" onClick={save} disabled={saving}>Salvar</button></>}>
        {saveError ? <p className="acc-note" role="alert">{saveError}</p> : null}
        <div className="form-grid">
          <label className="lbl">Nome<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="lbl">Tipo<select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{['WhatsApp', ...(form.type !== 'WhatsApp' ? [form.type] : [])].map(t => <option key={t} value={t}>{t}</option>)}</select></label>
          <label className="lbl">Conta espiã<input type="checkbox" checked={form.isSpy} onChange={e => setForm(f => ({ ...f, isSpy: e.target.checked }))} /></label>
        </div>
      </Modal>
      <Modal
        title={`Conectar ${qrTarget?.name ?? 'conta'}`}
        open={qrTarget != null}
        onClose={closeQr}
        footer={<>
          <button className="btn" onClick={closeQr}>Fechar</button>
          <button className="btn primary" onClick={regenerateQr} disabled={qrNewBusy || qrBusy}>{qrNewBusy ? 'Gerando…' : 'Gerar novo QR'}</button>
        </>}
      >
        {qrError ? <p className="acc-note" role="alert">{qrError}</p> : null}
        {qrBusy ? (
          <p className="acc-qr-hint">Conectando ao provedor…</p>
        ) : qrDataUrl ? (
          <div className="acc-qr"><img src={qrDataUrl} alt={`QR code de conexão da conta ${qrTarget?.name ?? ''}`} /></div>
        ) : (
          <p className="acc-qr-hint">Gerando QR…</p>
        )}
        <p className="acc-qr-hint">Abra o WhatsApp no celular em <strong>Aparelhos conectados</strong> e leia o código. A conexão é confirmada automaticamente.</p>
      </Modal>
      <Modal
        title="Desconectar conta"
        open={disconnectTarget != null}
        onClose={() => setDisconnectTarget(null)}
        footer={<>
          <button className="btn" onClick={() => setDisconnectTarget(null)}>Cancelar</button>
          <button className="btn danger" onClick={confirmDisconnect} disabled={disconnectBusy}>{disconnectBusy ? 'Desconectando…' : 'Desconectar'}</button>
        </>}
      >
        {disconnectError ? <p className="acc-note" role="alert">{disconnectError}</p> : null}
        <p>
          Você vai desconectar <strong>{disconnectTarget?.name}</strong>
          {disconnectTarget?.phone ? ` (${disconnectTarget.phone})` : ''} do WhatsApp. Ela só volta a enviar depois de conectar de novo por QR.
        </p>
      </Modal>
    </div>
  )
}
