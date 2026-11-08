import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useSession } from './auth'
import Overview from './pages/Overview'
import Accounts from './pages/Accounts'
import AccountsCampaigns from './pages/AccountsCampaigns'
import Campaigns from './pages/Campaigns'
import GroupSearch from './pages/GroupSearch'
import ActionsPage from './pages/ActionsPage'
import Automations from './pages/Automations'
import Leads from './pages/Leads'
import Deeplinks from './pages/Deeplinks'
import HistoryPage from './pages/HistoryPage'
import TeamPage from './pages/TeamPage'
import WebhooksPage from './pages/WebhooksPage'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Termos from './pages/Termos'
import Privacidade from './pages/Privacidade'
import Profile from './pages/Profile'
import Subscriptions from './pages/Subscriptions'
import Landing from './pages/Landing'
import Placeholder from './pages/Placeholder'

// Autenticação afirmada pelo servidor (bootstrap GET /api/v1/auth/me) — não por chave local.
// Estados honestos (PM regra 3): carregando ≠ erro ≠ desautenticado; texto neutro centrado,
// sem criar identidade visual (contrato §3.4/§5).
function RequireAuth({ children }: { children: React.ReactElement }) {
  const { state, retryBootstrap } = useSession()
  if (state.status === 'loading') {
    return (
      <div role="status" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ margin: 0 }}>Carregando…</p>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div role="alert" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 24 }}>
        <p style={{ margin: 0 }}>Não foi possível confirmar sua sessão. Verifique sua conexão.</p>
        <button type="button" onClick={retryBootstrap}>Tentar novamente</button>
      </div>
    )
  }
  if (state.status === 'unauthenticated') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/termo-de-uso" element={<Termos />} />
      <Route path="/politica-de-privacidade" element={<Privacidade />} />
      <Route path="/privacy.html" element={<Navigate to="/politica-de-privacidade" replace />} />
      <Route path="/account/privacy" element={<Privacidade />} />
      <Route path="/whats" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />        <Route path="accounts-campaigns" element={<AccountsCampaigns />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="group-search" element={<GroupSearch />} />
        <Route path="actions" element={<ActionsPage />} />
        <Route path="automations" element={<Automations />} />
        <Route path="leads" element={<Leads />} />
        <Route path="deeplinks" element={<Deeplinks />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="attendants" element={<Navigate to="/whats/team" replace />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="projects" element={<Placeholder title="Projetos" note="Organize campanhas, contas e integrações por frente de trabalho." />} />
        <Route path="broadcasts" element={<Placeholder title="Broadcast" note="Envios em massa para a base aparecem aqui." />} />
        <Route path="leads-groups" element={<Placeholder title="Broadcast legado" note="Fila antiga de envios, mantida só para consulta." />} />
        <Route path="personalizacao" element={<Placeholder title="Personalização" note="Modelos de mensagem, variáveis e marcas d'água da operação." />} />
        <Route path="integracoes" element={<Placeholder title="Integrações" note="Conectores, API e automações externas." />} />
        <Route path="seguranca" element={<Placeholder title="Segurança" note="Listas de bloqueio e regras anti-spam." />} />
        <Route path="contents" element={<Placeholder title="Treinamentos" note="Conteúdos da operação ainda não liberados neste plano." locked />} />

      </Route>
      <Route path="/profile" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Profile />} />
      </Route>
      <Route path="/subscriptions" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Subscriptions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


