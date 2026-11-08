import React, { createContext, useContext, useEffect, useState } from 'react'

// Estrutura de multilinguagem: PT (padrao), EN, ES.
// Cobertura: rotulos principais (sidebar, topo, titulos, estado vazio, ajuda).

export type Lang = 'pt' | 'en' | 'es'

type Dict = Record<string, string>

const pt: Dict = {
  'nav.home': 'Início', 'nav.overview': 'Visão geral', 'nav.actions': 'Ações',
  'nav.automations': 'Automações', 'nav.projects': 'Projetos', 'nav.leads': 'Leads',
  'nav.broadcasts': 'Broadcast', 'nav.legacy': 'Broadcast legado', 'nav.personalization': 'Personalização',
  'nav.integrations': 'Integrações', 'nav.deeplinks': 'Deep link', 'nav.security': 'Segurança',
  'nav.history': 'Histórico', 'nav.team': 'Equipe', 'nav.trainings': 'Treinamentos',
  'top.search': 'Buscar', 'top.notifications': 'Notificações', 'top.theme': 'Alternar tema', 'top.language': 'Idioma',
  'title./whats/overview': 'Visão geral', 'title./whats/accounts': 'Contas', 'title./whats/accounts-campaigns': 'Contas e campanhas',
  'title./whats/campaigns': 'Campanhas', 'title./whats/group-search': 'Buscar grupo', 'title./whats/actions': 'Ações',
  'title./whats/automations': 'Automações', 'title./whats/projects': 'Projetos', 'title./whats/leads': 'Leads',
  'title./whats/broadcasts': 'Broadcast', 'title./whats/leads-groups': 'Broadcast legado', 'title./whats/personalizacao': 'Personalização',
  'title./whats/integracoes': 'Integrações', 'title./whats/deeplinks': 'Deep link', 'title./whats/seguranca': 'Segurança',
  'title./whats/history': 'Histórico', 'title./whats/team': 'Equipe', 'title./whats/webhooks': 'Webhooks',
  'title./whats/contents': 'Treinamentos',
  'title./profile': '', 'title./subscriptions': '',
  'common.empty': 'Nenhum registro encontrado',
  'help.greeting': 'Olá, como podemos ajudar?',
  'help.awayTitle': 'Estamos ausentes no momento',
  'help.awayLine': 'Voltamos no próximo horário comercial.',
  'help.startChat': 'Iniciar Conversa',
  'help.articles': 'Artigos Populares',
  'help.article1': 'Como conectar sua primeira conta',
  'help.article2': 'Criando sua primeira campanha',
  'help.article3': 'Automações: gatilhos e pastas',
  'help.article4': 'Campanhas com grupos importados',
  'help.article5': 'Boas práticas de envio',
  'help.viewAll': 'Ver todos os artigos',
  'help.note': 'Estes artigos são demonstrativos.',
  'lang.pt': 'Português', 'lang.en': 'English', 'lang.es': 'Español',
}

const en: Dict = {
  'nav.home': 'Home', 'nav.overview': 'Overview', 'nav.actions': 'Actions',
  'nav.automations': 'Automations', 'nav.projects': 'Projects', 'nav.leads': 'Leads',
  'nav.broadcasts': 'Broadcast', 'nav.legacy': 'Legacy broadcast', 'nav.personalization': 'Personalization',
  'nav.integrations': 'Integrations', 'nav.deeplinks': 'Deep links', 'nav.security': 'Security',
  'nav.history': 'History', 'nav.team': 'Team', 'nav.trainings': 'Training',
  'top.search': 'Search', 'top.notifications': 'Notifications', 'top.theme': 'Toggle theme', 'top.language': 'Language',
  'title./whats/overview': 'Overview', 'title./whats/accounts': 'Accounts', 'title./whats/accounts-campaigns': 'Accounts and campaigns',
  'title./whats/campaigns': 'Campaigns', 'title./whats/group-search': 'Search groups', 'title./whats/actions': 'Actions',
  'title./whats/automations': 'Automations', 'title./whats/projects': 'Projects', 'title./whats/leads': 'Leads',
  'title./whats/broadcasts': 'Broadcast', 'title./whats/leads-groups': 'Legacy broadcast', 'title./whats/personalizacao': 'Personalization',
  'title./whats/integracoes': 'Integrations', 'title./whats/deeplinks': 'Deep links', 'title./whats/seguranca': 'Security',
  'title./whats/history': 'History', 'title./whats/team': 'Team', 'title./whats/webhooks': 'Webhooks',
  'title./whats/contents': 'Training',
  'common.empty': 'No records found',
  'help.greeting': 'Hi, how can we help?',
  'help.awayTitle': 'We are away right now',
  'help.awayLine': 'We will be back during business hours.',
  'help.startChat': 'Start Conversation',
  'help.articles': 'Popular Articles',
  'help.article1': 'Connecting your first account',
  'help.article2': 'Creating your first campaign',
  'help.article3': 'Automations: triggers and folders',
  'help.article4': 'Campaigns with imported groups',
  'help.article5': 'Sending best practices',
  'help.viewAll': 'View all articles',
  'help.note': 'These articles are for demonstration.',
  'lang.pt': 'Português', 'lang.en': 'English', 'lang.es': 'Español',
}

const es: Dict = {
  'nav.home': 'Inicio', 'nav.overview': 'Resumen', 'nav.actions': 'Acciones',
  'nav.automations': 'Automatizaciones', 'nav.projects': 'Proyectos', 'nav.leads': 'Leads',
  'nav.broadcasts': 'Difusión', 'nav.legacy': 'Difusión legado', 'nav.personalization': 'Personalización',
  'nav.integrations': 'Integraciones', 'nav.deeplinks': 'Enlaces', 'nav.security': 'Seguridad',
  'nav.history': 'Historial', 'nav.team': 'Equipo', 'nav.trainings': 'Capacitación',
  'top.search': 'Buscar', 'top.notifications': 'Notificaciones', 'top.theme': 'Cambiar tema', 'top.language': 'Idioma',
  'title./whats/overview': 'Resumen', 'title./whats/accounts': 'Cuentas', 'title./whats/accounts-campaigns': 'Cuentas y campañas',
  'title./whats/campaigns': 'Campañas', 'title./whats/group-search': 'Buscar grupo', 'title./whats/actions': 'Acciones',
  'title./whats/automations': 'Automatizaciones', 'title./whats/projects': 'Proyectos', 'title./whats/leads': 'Leads',
  'title./whats/broadcasts': 'Difusión', 'title./whats/leads-groups': 'Difusión legado', 'title./whats/personalizacao': 'Personalización',
  'title./whats/integracoes': 'Integraciones', 'title./whats/deeplinks': 'Enlaces', 'title./whats/seguranca': 'Seguridad',
  'title./whats/history': 'Historial', 'title./whats/team': 'Equipo', 'title./whats/webhooks': 'Webhooks',
  'title./whats/contents': 'Capacitación',
  'common.empty': 'No se encontraron registros',
  'help.greeting': 'Hola, ¿cómo podemos ayudar?',
  'help.awayTitle': 'Estamos ausentes ahora',
  'help.awayLine': 'Volveremos en el próximo horario comercial.',
  'help.startChat': 'Iniciar Conversación',
  'help.articles': 'Artículos Populares',
  'help.article1': 'Conectar tu primera cuenta',
  'help.article2': 'Crear tu primera campaña',
  'help.article3': 'Automatizaciones: disparadores y carpetas',
  'help.article4': 'Campañas con grupos importados',
  'help.article5': 'Buenas prácticas de envío',
  'help.viewAll': 'Ver todos los artículos',
  'help.note': 'Estos artículos son demostrativos.',
  'lang.pt': 'Portugués', 'lang.en': 'English', 'lang.es': 'Español',
}

const dicts: Record<Lang, Dict> = { pt, en, es }

export const LANG_KEY = 'grupos-lang'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY)
    return saved === 'en' || saved === 'es' || saved === 'pt' ? saved : 'pt'
  })
  useEffect(() => { localStorage.setItem(LANG_KEY, lang); document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang }, [lang])
  const t = (key: string) => dicts[lang][key] ?? dicts.pt[key] ?? key
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: 'pt', setLang: () => {}, t: k => k,
})

export const useI18n = () => useContext(I18nContext)

export function LangFlag({ lang, size = 20 }: { lang: Lang; size?: number }) {
  const h = Math.round(size * 0.7)
  if (lang === 'pt')
    return (
      <svg width={size} height={h} viewBox="0 0 20 14" aria-hidden="true">
        <rect width="20" height="14" rx="1.5" fill="#009b3a" />
        <polygon points="10,1.6 18.2,7 10,12.4 1.8,7" fill="#ffdf00" />
        <circle cx="10" cy="7" r="2.3" fill="#002776" />
      </svg>
    )
  if (lang === 'en')
    return (
      <svg width={size} height={h} viewBox="0 0 20 14" aria-hidden="true">
        <rect width="20" height="14" rx="1.5" fill="#b22234" />
        {[1, 3, 5, 7, 9, 11].map(y => <rect key={y} x="0" y={y * 14 / 13} width="20" height={14 / 13} fill="#fff" />)}
        <rect width="9" height="7.6" rx="0.8" fill="#3c3b6e" />
      </svg>
    )
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" rx="1.5" fill="#aa151b" />
      <rect y="4.1" width="20" height="5.8" fill="#f1bf00" />
    </svg>
  )
}



