export type AccountStatus = 'connected' | 'disconnected' | 'no_session'
export type ActionStatus = 'queued' | 'scheduled' | 'processing' | 'success' | 'failed'
export type AutomationStatus = 'enabled' | 'disabled'
export type CampaignStatus = 'active' | 'archived'
export type WebhookStatus = 'integration' | 'archived'

export interface Account {
  id: string
  name: string
  phone: string
  status: AccountStatus
  createdAt: string
  lastSeen?: string
  campaignIds: string[]
}

// FATIA-02: conta vinda da API (recurso flat do contrato A1 §3.1 — sem telefone,
// sem ID externo). O `Account` local acima segue para as telas ainda não
// migradas (Layout, Campaigns, AccountsCampaigns) e para o store.
// Único valor honesto até existir integração de provedor (DIR-04).
export type AccountConnectionStatus = 'nao_conectada'

export interface AccountApi {
  id: string
  name: string
  type: string
  isSpy: boolean
  connectionStatus: AccountConnectionStatus
  createdAt: string
  updatedAt: string
}

export interface CampaignMetrics {
  clicks: number
  entries: number
  exits: number
  participants: number
  groups: number
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  createdAt: string
  accountId?: string
  metricsByPeriod: Record<string, CampaignMetrics>
}

// FATIA-03 (D13 do dono, 08/11/2026): campanha vinda da API original SendFlow —
// recurso /releases com tipos EXATOS 'WhatsRelease'|'WhatsList'|'WhatsViralCampaign'
// ("Aleatório" não existe). `archived` é boolean; archive/unarchive são ações
// idempotentes (D12). O `Campaign` local acima segue para as telas ainda não
// migradas (Layout, AccountsCampaigns) e para o store.
export type ReleaseType = 'WhatsRelease' | 'WhatsList' | 'WhatsViralCampaign'

export interface ReleaseApi {
  id: string
  name: string
  type: ReleaseType
  projectId: string | null
  archived: boolean
  accountIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ActionItem {
  id: string
  name: string
  type: string
  status: ActionStatus
  createdAt: string
  scheduledFor?: string
  target?: string
}

export interface Automation {
  id: string
  name: string
  trigger: string
  status: AutomationStatus
  folder: string
  createdAt: string
  config?: Record<string, unknown>
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  fields: Record<string, string>
  tags: string[]
  createdAt: string
}

export interface Deeplink {
  id: string
  title: string
  url: string
  folder: string
  clicks: number
  createdAt: string
}

export interface DeeplinkFolder {
  id: string
  name: string
  createdAt: string
}

export interface AuditEntry {
  id: string
  action: string
  where: string
  ip: string
  refId: string
  team: string
  startedAt: string
  endedAt: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'invited'
  createdAt: string
}

export interface PermissionRow {
  id: string
  module: string
  view: boolean
  edit: boolean
  manage: boolean
}

export interface Webhook {
  id: string
  name: string
  url: string
  event: string
  status: WebhookStatus
  createdAt: string
}

export interface GroupItem {
  id: string
  name: string
  participants: number
  account: string
  campaign: string
  category: string
  createdAt: string
}

// FATIA-05: grupo vindo da API (contrato A1 §3.1 — recurso /api/v1/groups).
// `cheio` é DERIVADO no servidor (DEC-06 legado: marcação manual OU teto
// calculado por participantes) e somente leitura — nunca enviado em body.
// `seq` é derivado por release e vem null na lista global sem releaseId
// (contrato A1 §4). O `GroupItem` local acima segue para as telas ainda
// não migradas (Layout) e para o store.
export interface GroupApi {
  id: string
  releaseId: string
  name: string
  gid: string | null
  clicks: number
  participants: number
  limitPessoas: number | null
  cheioManual: boolean
  cheio: boolean
  seq: number | null
  createdAt: string
  updatedAt: string
}

export interface AppData {
  accounts: Account[]
  campaigns: Campaign[]
  actions: ActionItem[]
  automations: Automation[]
  leads: Lead[]
  deeplinks: Deeplink[]
  deeplinkFolders: DeeplinkFolder[]
  audit: AuditEntry[]
  team: TeamMember[]
  permissions: PermissionRow[]
  webhooks: Webhook[]
  groups: GroupItem[]
}
