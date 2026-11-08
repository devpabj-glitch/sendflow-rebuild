import React from 'react'
import { I } from './Icons'
import { useI18n } from '../i18n'

export function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map(it => (
        <button key={it.id} type="button" role="tab" aria-selected={value === it.id} className={`tab ${value === it.id ? 'active' : ''}`} onClick={() => onChange(it.id)}>{it.label}</button>
      ))}
    </div>
  )
}

export function Badge({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'info' | 'muted'; children: React.ReactNode }) {
  return <span className={`badge b-${tone}`}>{children}</span>
}

export function EmptyState({ title, hint }: { title?: string; hint?: string }) {
  const { t } = useI18n()
  return <div className="empty"><strong>{title ?? t('common.empty')}</strong>{hint ? <div>{hint}</div> : null}</div>
}

export function Pagination({ page, pages, total, perPage, onPage }: { page: number; pages: number; total: number; perPage: number; onPage: (p: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(total, page * perPage)
  return (
    <div className="pagination">
      <div className="pag-info">
        <span>Linhas por página</span>
        <span className="pag-perpage">{perPage}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </span>
        <span>{from}-{to} de {total}</span>
      </div>
      <div className="pager">
        <button className="pag-btn" onClick={() => onPage(1)} disabled={page <= 1} aria-label="Primeira página">«</button>
        <button className="pag-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">‹</button>
        <button className="pag-btn" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Próxima página">›</button>
      </div>
    </div>
  )
}

export function Modal({ title, open, onClose, children, footer }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="modal-back" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Fechar"><I.x /></button></div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div><h1 className="page-title">{title}</h1>{sub ? <p className="page-sub">{sub}</p> : null}</div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  )
}
