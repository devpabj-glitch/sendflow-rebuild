import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { seedData } from './data/seed'
import type { AppData, Account, Campaign, ActionItem, Automation, Lead, Deeplink, DeeplinkFolder, AuditEntry, TeamMember, PermissionRow, Webhook, GroupItem } from './types'
import { uid, nowIso } from './utils'

const KEY = 'orbit-data-v1'
const THEME_KEY = 'orbit-theme'

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch { /* ignore */ }
  return seedData
}

function save(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

type Updater<T> = (prev: T[]) => T[]

type Ctx = {
  data: AppData
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setAccounts: (u: Updater<Account>) => void
  setCampaigns: (u: Updater<Campaign>) => void
  setActions: (u: Updater<ActionItem>) => void
  setAutomations: (u: Updater<Automation>) => void
  setLeads: (u: Updater<Lead>) => void
  setDeeplinks: (u: Updater<Deeplink>) => void
  setDeeplinkFolders: (u: Updater<DeeplinkFolder>) => void
  setAudit: (u: Updater<AuditEntry>) => void
  setTeam: (u: Updater<TeamMember>) => void
  setPermissions: (u: Updater<PermissionRow>) => void
  setWebhooks: (u: Updater<Webhook>) => void
  setGroups: (u: Updater<GroupItem>) => void
  audit: (action: string, where: string, refId?: string) => void
}

const Store = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(load)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark')

  useEffect(() => { save(data) }, [data])
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  const mut = <K extends keyof AppData>(key: K) => (u: Updater<AppData[K][number]>) =>
    setData(d => ({ ...d, [key]: u(d[key] as any) }))

  const audit = (action: string, where: string, refId = '—') => {
    const entry: AuditEntry = { id: uid('h'), action, where, ip: '127.0.0.1', refId, team: 'Operador local', startedAt: nowIso(), endedAt: nowIso() }
    setData(d => ({ ...d, audit: [entry, ...d.audit] }))
  }

  const value = useMemo<Ctx>(() => ({
    data, theme,
    toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
    setAccounts: mut('accounts') as any,
    setCampaigns: mut('campaigns') as any,
    setActions: mut('actions') as any,
    setAutomations: mut('automations') as any,
    setLeads: mut('leads') as any,
    setDeeplinks: mut('deeplinks') as any,
    setDeeplinkFolders: mut('deeplinkFolders') as any,
    setAudit: mut('audit') as any,
    setTeam: mut('team') as any,
    setPermissions: mut('permissions') as any,
    setWebhooks: mut('webhooks') as any,
    setGroups: mut('groups') as any,
    audit,
  }), [data, theme])

  return <Store.Provider value={value}>{children}</Store.Provider>
}

export function useStore() {
  const ctx = useContext(Store)
  if (!ctx) throw new Error('StoreProvider ausente')
  return ctx
}
