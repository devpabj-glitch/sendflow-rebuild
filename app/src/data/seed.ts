import type { AppData } from '../types'

// Dados reais da conta: sem registros. Todas as listas vazias — os módulos
// mostram seus estados vazios reais ("Nenhum registro encontrado" etc.).
export const seedData: AppData = {
  accounts: [],
  campaigns: [],
  actions: [],
  automations: [],
  leads: [],
  deeplinks: [],
  deeplinkFolders: [],
  audit: [],
  team: [],
  permissions: [
    { id: 'p1', module: 'Contas', view: true, edit: true, manage: true },
    { id: 'p2', module: 'Campanhas', view: true, edit: true, manage: false },
    { id: 'p3', module: 'Automações', view: true, edit: false, manage: false },
    { id: 'p4', module: 'Leads', view: true, edit: true, manage: false },
    { id: 'p5', module: 'Webhooks', view: true, edit: false, manage: true },
    { id: 'p6', module: 'Equipe', view: true, edit: false, manage: false },
  ],
  webhooks: [],
  groups: [],
}
