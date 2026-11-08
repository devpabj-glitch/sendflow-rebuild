import type { Account, Campaign, GroupItem, Webhook } from '../types'
import { useStore } from '../store'
import { useDemo } from './DemoContext'

type Updater<T> = (prev: T[]) => T[]

export function useModuleLists() {
  const { demo, pack, setPack } = useDemo()
  const { data, setAccounts, setCampaigns, setGroups, setWebhooks } = useStore()
  if (!demo) {
    return {
      demo: false,
      accounts: data.accounts,
      campaigns: data.campaigns,
      groups: data.groups,
      webhooks: data.webhooks,
      setAccounts,
      setCampaigns,
      setGroups,
      setWebhooks,
    }
  }
  return {
    demo: true,
    accounts: pack.accounts,
    campaigns: pack.campaigns,
    groups: pack.groups,
    webhooks: pack.webhooks,
    setAccounts: (u: Updater<Account>) => setPack(p => ({ ...p, accounts: u(p.accounts) })),
    setCampaigns: (u: Updater<Campaign>) => setPack(p => ({ ...p, campaigns: u(p.campaigns) })),
    setGroups: (u: Updater<GroupItem>) => setPack(p => ({ ...p, groups: u(p.groups) })),
    setWebhooks: (u: Updater<Webhook>) => setPack(p => ({ ...p, webhooks: u(p.webhooks) })),
  }
}
