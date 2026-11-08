export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function fmtShort(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

export function byCreatedDesc<T extends { createdAt: string }>(arr: T[]) {
  return [...arr].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

export function paginate<T>(arr: T[], page: number, perPage: number) {
  const total = arr.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const safe = Math.min(Math.max(1, page), pages)
  const start = (safe - 1) * perPage
  return { items: arr.slice(start, start + perPage), total, pages, page: safe, start }
}

export function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function leadsToCsv(rows: { name: string; phone: string; email: string; tags: string[]; fields: Record<string, string> }[]) {
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['Nome', 'Número', 'Email', 'Tags', 'Campos']
  const lines = rows.map(r => [r.name, r.phone, r.email, r.tags.join('; '), Object.entries(r.fields).map(([k,v]) => `${k}:${v}`).join('; ')].map(esc).join(','))
  return [head.join(','), ...lines].join('\n')
}
