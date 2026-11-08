import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Account, Campaign, GroupItem, Webhook } from '../types'
import { freshDemo } from './data'

const MODE_KEY = 'grupos-demo-mode'
const PACK_KEY = 'grupos-demo-pack'

export type DemoPack = {
  accounts: Account[]
  campaigns: Campaign[]
  groups: GroupItem[]
  webhooks: Webhook[]
}

type Ctx = {
  demo: boolean
  setDemo: (on: boolean) => void
  pack: DemoPack
  setPack: (u: (prev: DemoPack) => DemoPack) => void
}

const DemoCtx = createContext<Ctx | null>(null)

function loadPack(): DemoPack {
  try {
    const raw = localStorage.getItem(PACK_KEY)
    if (raw) return JSON.parse(raw) as DemoPack
  } catch { /* ignore */ }
  return freshDemo()
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demo, setDemoState] = useState(() => localStorage.getItem(MODE_KEY) === 'on')
  const [pack, setPackState] = useState<DemoPack>(loadPack)

  useEffect(() => { localStorage.setItem(MODE_KEY, demo ? 'on' : 'off') }, [demo])
  useEffect(() => { localStorage.setItem(PACK_KEY, JSON.stringify(pack)) }, [pack])

  const value = useMemo<Ctx>(() => ({
    demo,
    setDemo: (on) => {
      setDemoState(on)
      if (on && pack.accounts.length === 0) setPackState(freshDemo())
    },
    pack,
    setPack: (u) => setPackState(prev => u(prev)),
  }), [demo, pack])

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoCtx)
  if (!ctx) throw new Error('useDemo fora do provider')
  return ctx
}
