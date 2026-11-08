import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { I, M } from './Icons'
import { useStore } from '../store'
import { currentUser, logout } from '../auth'
import { LangFlag, useI18n } from '../i18n'
import type { Lang } from '../i18n'

type Item = { to: string; labelKey: string; icon: React.ReactNode; end?: boolean }

const items: Item[] = [
  { to: '/whats/overview', labelKey: 'nav.home', icon: <M.home size={22} />, end: true },
  { to: '/whats/accounts-campaigns', labelKey: 'nav.overview', icon: <M.dashboard size={22} /> },
  { to: '/whats/actions', labelKey: 'nav.actions', icon: <M.bolt size={22} /> },
  { to: '/whats/automations', labelKey: 'nav.automations', icon: <M.flow size={22} /> },
  { to: '/whats/projects', labelKey: 'nav.projects', icon: <M.folder size={22} /> },
  { to: '/whats/leads', labelKey: 'nav.leads', icon: <M.users size={22} /> },
  { to: '/whats/broadcasts', labelKey: 'nav.broadcasts', icon: <M.tower size={22} /> },
  { to: '/whats/leads-groups', labelKey: 'nav.legacy', icon: <M.podcast size={22} /> },
  { to: '/whats/personalizacao', labelKey: 'nav.personalization', icon: <M.tune size={22} /> },
  { to: '/whats/integracoes', labelKey: 'nav.integrations', icon: <M.hub size={22} /> },
  { to: '/whats/deeplinks', labelKey: 'nav.deeplinks', icon: <M.link size={22} /> },
  { to: '/whats/seguranca', labelKey: 'nav.security', icon: <M.shield size={22} /> },
  { to: '/whats/history', labelKey: 'nav.history', icon: <M.history size={22} /> },
  { to: '/whats/team', labelKey: 'nav.team', icon: <M.team size={22} /> },
  { to: '/whats/contents', labelKey: 'nav.trainings', icon: <M.school size={22} /> },
]

const overviewGroup = ['/whats/accounts', '/whats/accounts-campaigns', '/whats/campaigns', '/whats/webhooks', '/whats/group-search']

function railOn(to: string, path: string) {
  if (to === '/whats/accounts-campaigns') return overviewGroup.includes(path)
  if (to === '/whats/overview') return path === '/whats/overview'
  return path === to
}

export function Layout() {
  const { theme, toggleTheme, data } = useStore()
  const { t, lang, setLang } = useI18n()
  const user = currentUser()
  const userName = user?.name || 'Usuário'
  const userEmail = user?.email || ''
  const [q, setQ] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [menu, setMenu] = useState(false)
  const [bell, setBell] = useState(false)
  const [cookies, setCookies] = useState(() => localStorage.getItem('grupos-cookies') || '')
  const [help, setHelp] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const title = t('title.' + loc.pathname)

  useEffect(() => { document.title = 'Grupos' }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') { setShowSearch(false); setMenu(false); setBell(false); setHelp(false); setLangOpen(false); setSupportOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return [] as { label: string; sub: string; to: string }[]
    const out: { label: string; sub: string; to: string }[] = []
    const push = (label: string, sub: string, to: string) => out.push({ label, sub, to })
    data.accounts.filter(a => a.name.toLowerCase().includes(term) || a.phone.includes(term)).slice(0, 4).forEach(a => push(a.name, `Conta · ${a.phone}`, '/whats/accounts'))
    data.campaigns.filter(c => c.name.toLowerCase().includes(term)).slice(0, 4).forEach(c => push(c.name, `Campanha · ${c.status === 'active' ? 'Ativa' : 'Arquivada'}`, '/whats/campaigns'))
    data.leads.filter(l => l.name.toLowerCase().includes(term) || l.phone.includes(term) || l.email.toLowerCase().includes(term)).slice(0, 4).forEach(l => push(l.name, `Lead · ${l.phone}`, '/whats/leads'))
    data.groups.filter(g => g.name.toLowerCase().includes(term) || g.category.toLowerCase().includes(term)).slice(0, 4).forEach(g => push(g.name, `Grupo · ${g.category}`, '/whats/group-search'))
    items.filter(i => t(i.labelKey).toLowerCase().includes(term)).forEach(i => push(t(i.labelKey), 'Módulo', i.to))
    return out.slice(0, 10)
  }, [q, data])

  const chooseCookies = (value: string) => {
    localStorage.setItem('grupos-cookies', value)
    setCookies(value)
  }

  return (
    <div className={`g-shell ${theme === 'light' ? 'is-light' : ''}`}>
      <aside className="g-rail" aria-label="Módulos">
        <a className="g-logo" href="/whats/overview" aria-label="Grupos">
          <svg width="46" height="28" viewBox="0 0 46 28" aria-hidden="true">
            <rect x="1" y="3" width="22" height="22" rx="7" fill="#ffde07" />
            <path d="M15.2 9.2a5.2 5.2 0 1 0 1.1 6.4" stroke="#151515" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M12.4 14.2h4.2" stroke="#151515" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="33" cy="9" r="2.2" fill="#ffde07" />
            <circle cx="40" cy="14" r="2.2" fill="#fff" />
            <circle cx="33" cy="19" r="2.2" fill="#fff" />
          </svg>
        </a>
        <nav className="g-rail-nav">
          {items.map(it => (
            <NavLink key={it.to} to={it.to} end={it.end} title={t(it.labelKey)} aria-label={t(it.labelKey)}
              className={() => `g-rail-btn ${railOn(it.to, loc.pathname) ? 'is-on' : ''}`}>
              {it.icon}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="g-main">
        <header className="g-top">
          <button className="g-menu-btn" type="button" aria-label="Menu de módulos" onClick={() => setMenuOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
          </button>
          <span className="g-top-logo" aria-hidden="true">
            <svg width="30" height="26" viewBox="0 0 46 28">
              <rect x="1" y="3" width="22" height="22" rx="7" fill="#ffde07" />
              <path d="M15.2 9.2a5.2 5.2 0 1 0 1.1 6.4" stroke="#151515" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M12.4 14.2h4.2" stroke="#151515" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="33" cy="9" r="2.2" fill="#ffde07" />
              <circle cx="40" cy="14" r="2.2" fill="#fff" />
              <circle cx="33" cy="19" r="2.2" fill="#fff" />
            </svg>
          </span>
          <h1 className="g-title">{title}</h1>
          <div className="g-top-spacer" />
          <button className="g-search" onClick={() => setShowSearch(true)} type="button">
            <M.search size={18} />
            <span>{t('top.search')}</span>
            <kbd>⌃ + K</kbd>
          </button>
          <div className="g-lang-wrap">
            <button className="g-icon g-lang" type="button" aria-label={t('top.language')} title={t('top.language')} onClick={() => { setLangOpen(v => !v); setMenu(false); setBell(false) }}>
              <LangFlag lang={lang} size={20} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginLeft: 4 }}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {langOpen ? (
              <div className="g-pop g-pop-lang" role="menu">
                {(['pt', 'en', 'es'] as Lang[]).map(l => (
                  <button key={l} type="button" role="menuitem" className={l === lang ? 'is-on' : ''} onClick={() => { setLang(l); setLangOpen(false) }}>
                    <LangFlag lang={l} size={18} />
                    <span>{t('lang.' + l)}</span>
                    {l === lang ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffde07" strokeWidth="2.5" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button className="g-icon" type="button" aria-label={t('top.theme')} onClick={toggleTheme}>
            {theme === 'dark' ? <M.sun size={22} /> : <I.moon size={20} />}
          </button>
          <button className="g-icon" type="button" aria-label={t('top.notifications')} onClick={() => { setBell(v => !v); setMenu(false); setLangOpen(false) }}>
            <M.bell size={22} />
          </button>
          <button className="g-user" type="button" onClick={() => { setMenu(v => !v); setBell(false) }}>
            <span>{userName}</span>
            <span className="g-avatar">{userName.slice(0, 1).toUpperCase()}</span>
          </button>
          {menu ? (
            <div className="g-pop g-pop-user" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenu(false); nav('/profile') }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4.5a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8zm0 13.4a7.6 7.6 0 0 1-5.3-2.1c.9-1.7 3-2.9 5.3-2.9s4.4 1.2 5.3 2.9a7.6 7.6 0 0 1-5.3 2.1z"/></svg>
                <span>Meu Perfil</span>
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); nav('/subscriptions') }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4v-6h16v6zm0-8H4V6h16v4z"/></svg>
                <span>Minhas assinaturas</span>
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); nav('/termo-de-uso') }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                <span>Termos de uso</span>
              </button>
              <button type="button" role="menuitem" onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); setCopied(true); setMenu(false) }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>
                <span>{copied ? 'Link copiado!' : 'Copiar link da página'}</span>
              </button>
              <button type="button" role="menuitem" onClick={() => { logout(); nav('/login') }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>
                <span>Sair</span>
              </button>
            </div>
          ) : null}
          {bell ? (
            <div className="g-pop g-pop-bell">
              <strong>Notificações</strong>
              <p>Nenhuma notificação nova.</p>
            </div>
          ) : null}
        </header>
        <div className="g-content" onClick={() => { setMenu(false); setBell(false) }}>
          <Outlet />
        </div>
      </div>

      {menuOpen ? (
        <div className="g-modal-back" onClick={() => setMenuOpen(false)}>
          <div className="g-modal" onClick={e => e.stopPropagation()}>
            <div className="g-modal-search"><strong>Módulos</strong></div>
            <div className="g-menu-grid">
              {items.map(it => (
                <a key={it.to} href="#" onClick={e => { e.preventDefault(); nav(it.to); setMenuOpen(false) }}>
                  {it.icon}
                  <span>{t(it.labelKey)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showSearch ? (
        <div className="g-modal-back" onClick={() => setShowSearch(false)}>
          <div className="g-modal" onClick={e => e.stopPropagation()}>
            <div className="g-modal-search">
              <I.search size={18} />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar contas, campanhas, leads e módulos" />
            </div>
            <div className="g-modal-list">
              {(q.trim() ? results : items.slice(0, 6).map(i => ({ label: t(i.labelKey), sub: 'Módulo', to: i.to }))).map((r, i) => (
                <button key={i} type="button" onClick={() => { nav(r.to); setShowSearch(false); setQ('') }}>
                  <b>{r.label}</b>
                  <small>{r.sub}</small>
                </button>
              ))}
              {q.trim() && !results.length ? <p className="g-empty-inline">Nenhum resultado</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {!cookies ? (
        <aside className="g-cookie" aria-label="Cookies">
          <span className="g-cookie-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1a73e8" /><circle cx="9" cy="9" r="1.8" fill="#fff" /><circle cx="15" cy="10.5" r="1.5" fill="#fff" /><circle cx="10.5" cy="15.5" r="1.6" fill="#fff" /><path d="M18 15l3 3-3 3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
          </span>
          <div className="g-cookie-copy">
            <strong>Sua privacidade importa</strong>
            <p>Usamos cookies essenciais para o funcionamento da plataforma e, com seu consentimento, cookies de análise e marketing para melhorar sua experiência. Saiba mais em nossa <a href="/politica-de-privacidade">Política de Privacidade</a> ou <a href="/account/privacy">gerencie seus dados</a>.</p>
          </div>
          <button type="button" className="g-cookie-settings" aria-label="Personalizar cookies">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
          </button>
          <div className="g-cookie-actions">
            <button type="button" className="g-cookie-text" onClick={() => chooseCookies('essential')}>APENAS NECESSÁRIOS</button>
            <button type="button" className="g-cookie-ok" onClick={() => chooseCookies('all')}>ACEITAR TODOS</button>
          </div>
        </aside>
      ) : null}

      <button className="g-help" type="button" aria-label="Atalhos" onClick={() => setHelp(v => !v)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#151515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
        </svg>
      </button>
      {help ? (
        <div className="g-help-card">
          <strong>Atalhos</strong>
          <p>Ctrl + K abre a busca. Esc fecha janelas abertas.</p>
          <button type="button" onClick={() => setHelp(false)}>Fechar</button>
        </div>
      ) : null}

      <button className="g-support" type="button" aria-label={supportOpen ? 'Fechar suporte' : 'Suporte'} onClick={() => setSupportOpen(v => !v)}>
        {supportOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
      {supportOpen ? (
        <div className="g-support-card" role="dialog" aria-label="Suporte">
          <div className="g-support-head">
            <span className="g-support-badge" aria-hidden="true">?</span>
          </div>
          <div className="g-support-body">
            <h3 className="g-support-title">{t('help.greeting')}</h3>
            <div className="g-support-away">
              <strong>{t('help.awayTitle')}</strong>
              <span>{t('help.awayLine')}</span>
              <button type="button" className="g-support-start">
                {t('help.startChat')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
              </button>
            </div>
            <strong className="g-support-sub">{t('help.articles')}</strong>
            <ul className="g-support-list">
              {['help.article1', 'help.article2', 'help.article3', 'help.article4', 'help.article5'].map(k => (
                <li key={k}>
                  <button type="button">
                    <span>{t(k)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="g-support-all">{t('help.viewAll')}</button>
            <p className="g-support-note">{t('help.note')}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
