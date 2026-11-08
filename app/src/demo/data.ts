import type { Account, Campaign, GroupItem, Webhook } from '../types'

const m = (clicks: number, entries: number, exits: number, participants: number, groups: number) =>
  ({ clicks, entries, exits, participants, groups })

function periods(base: ReturnType<typeof m>) {
  return {
    '7': { ...base, clicks: Math.round(base.clicks * 0.2), entries: Math.round(base.entries * 0.2) },
    '14': { ...base, clicks: Math.round(base.clicks * 0.4), entries: Math.round(base.entries * 0.4) },
    '21': { ...base, clicks: Math.round(base.clicks * 0.6), entries: Math.round(base.entries * 0.6) },
    '28': { ...base, clicks: Math.round(base.clicks * 0.8), entries: Math.round(base.entries * 0.8) },
    '90': base,
  }
}

export const demoAccounts: Account[] = [
  { id: 'demo-a1', name: 'Linha Norte', phone: '+55 11 90000-0101', status: 'connected', createdAt: '2026-07-01T10:00:00.000Z', updatedAt: '2026-07-20T10:00:00.000Z', campaignIds: ['demo-c1'], spy: false, channel: 'WhatsApp' },
  { id: 'demo-a2', name: 'Linha Leste', phone: '+55 11 90000-0102', status: 'connected', createdAt: '2026-07-02T10:00:00.000Z', updatedAt: '2026-07-18T10:00:00.000Z', campaignIds: ['demo-c1'], spy: true, channel: 'WhatsApp' },
  { id: 'demo-a3', name: 'Linha Oeste', phone: '+55 21 90000-0103', status: 'disconnected', createdAt: '2026-07-03T10:00:00.000Z', updatedAt: '2026-07-11T10:00:00.000Z', campaignIds: [], spy: false, channel: 'WhatsApp' },
  { id: 'demo-a4', name: 'Linha Sul', phone: '+55 31 90000-0104', status: 'no_session', createdAt: '2026-07-04T10:00:00.000Z', updatedAt: '2026-07-04T10:00:00.000Z', campaignIds: [], spy: false, channel: 'WhatsApp' },
]

export const demoCampaigns: Campaign[] = [
  {
    id: 'demo-c1', name: 'Campanha Exemplo', status: 'active', accountId: 'demo-a1', kind: 'Campanha',
    createdAt: '2026-07-05T12:00:00.000Z', updatedAt: '2026-07-26T15:00:00.000Z',
    invite: 'https://exemplo.local/convite/demo',
    metricsByPeriod: periods(m(120, 48, 6, 100, 3)),
  },
  {
    id: 'demo-c2', name: 'Lista de apoio', status: 'active', kind: 'Lista',
    createdAt: '2026-07-08T12:00:00.000Z', updatedAt: '2026-07-22T12:00:00.000Z',
    invite: 'https://exemplo.local/convite/lista',
    metricsByPeriod: periods(m(40, 10, 1, 10, 1)),
  },
  {
    id: 'demo-c3', name: 'Campanha encerrada', status: 'archived', accountId: 'demo-a2', kind: 'Aleatório',
    createdAt: '2026-06-01T12:00:00.000Z', updatedAt: '2026-06-20T12:00:00.000Z',
    invite: 'https://exemplo.local/convite/antiga',
    metricsByPeriod: periods(m(15, 4, 2, 8, 1)),
  },
]

export const demoGroups: GroupItem[] = [
  { id: 'demo-g1', name: 'Grupo Alfa', participants: 40, limit: 50, fullManual: false, clicks: 30, account: 'Linha Norte', campaign: 'Campanha Exemplo', campaignId: 'demo-c1', category: 'normal', createdAt: '2026-07-10T12:00:00.000Z', suspended: false },
  { id: 'demo-g2', name: 'Grupo Beta', participants: 50, limit: 50, fullManual: true, clicks: 80, account: 'Linha Norte', campaign: 'Campanha Exemplo', campaignId: 'demo-c1', category: 'normal', createdAt: '2026-07-11T12:00:00.000Z', suspended: false },
  { id: 'demo-g3', name: 'Grupo Gama', participants: 12, limit: 50, fullManual: true, clicks: 10, account: 'Linha Leste', campaign: 'Campanha Exemplo', campaignId: 'demo-c1', category: 'normal', createdAt: '2026-07-12T12:00:00.000Z', suspended: false },
  { id: 'demo-g4', name: 'Grupo Suspenso', participants: 5, limit: 50, fullManual: false, clicks: 0, account: 'Linha Oeste', campaign: 'Campanha Exemplo', campaignId: 'demo-c1', category: 'suspenso', createdAt: '2026-07-13T12:00:00.000Z', suspended: true },
]

export const demoWebhooks: Webhook[] = [
  { id: 'demo-w1', name: 'Entrada de pagamento', url: 'https://exemplo.local/hooks/pagamento', event: 'API', status: 'integration', createdAt: '2026-07-06T12:00:00.000Z' },
  { id: 'demo-w2', name: 'Avisos do formulário', url: 'https://exemplo.local/hooks/formulario', event: 'Formulário', status: 'integration', createdAt: '2026-07-07T12:00:00.000Z' },
]

export function freshDemo() {
  return {
    accounts: demoAccounts.map(a => ({ ...a, campaignIds: [...a.campaignIds] })),
    campaigns: demoCampaigns.map(c => ({ ...c, metricsByPeriod: structuredClone(c.metricsByPeriod) })),
    groups: demoGroups.map(g => ({ ...g })),
    webhooks: demoWebhooks.map(w => ({ ...w })),
  }
}
