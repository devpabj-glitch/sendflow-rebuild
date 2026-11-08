import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { landing as c } from '../data/landingContent'

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="faq-list">
      {items.map((it, i) => (
        <div key={i} className="faq-item" data-state={open === i ? 'open' : 'closed'}>
          <h3 className="faq-q">
            <button type="button" aria-expanded={open === i} aria-controls={`faq-panel-${i}`} id={`faq-btn-${i}`} className="faq-btn" onClick={() => setOpen(open === i ? null : i)}>
              {it.q}
              <svg viewBox="0 0 12 8" aria-hidden="true" className="faq-chevron"><polygon points="0,0 12,0 6,8" /></svg>
            </button>
          </h3>
          <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} hidden={open !== i} className="faq-panel">
            <p>{it.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Landing() {
  useEffect(() => {
    const prev = document.body.className
    document.body.className = 'sf-body'
    return () => { document.body.className = prev }
  }, [])
  return (
    <div className="sf-landing">
      <img src={c.hero.banner} alt={c.hero.bannerAlt} className="sf-top-banner" width="1440" height="90" />
      <header className="sf-header" role="banner">
        <div className="sf-container sf-header-inner">
          <a href="/" aria-label="Início"><img src={c.header.logo} alt={c.header.logoAlt} className="sf-logo" /></a>
          <nav aria-label="Principal" className="sf-nav">
            <a href={c.header.esUrl} className="sf-lang-link"><img src={c.header.esFlag} alt={c.header.esAlt} width="24" height="17" /></a>
            <Link to={c.header.loginUrl} className="sf-login-pill">{c.header.loginText}</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="sf-hero">
          <div className="sf-container sf-hero-grid">
            <div className="sf-hero-copy">
              <h1>{c.hero.title}</h1>
              <p>{c.hero.subtitle}</p>
              <div className="sf-hero-actions">
                <a href={c.hero.ctaUrl} className="sf-btn-primary">{c.hero.cta}</a>
              </div>
            </div>
            <img src={c.hero.mockup} alt="" className="sf-hero-mockup" />
          </div>
        </section>

        <section className="sf-section sf-dark" id="suporte" style={{ backgroundImage: `url(${c.support.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="sf-container sf-two-col">
            <img src={c.support.image} alt={c.support.imageAlt} className="sf-img" />
            <div>
              <h2>{c.support.title}</h2>
              <p>{c.support.text}</p>
            </div>
          </div>
        </section>

        <section className="sf-section sf-dark" id="players">
          <div className="sf-container">
            <h2>{c.players.title}</h2>
            <ul className="sf-players-grid">
              {c.players.logos.map((l) => (
                <li key={l.alt} className="sf-player">
                  <img src={l.src} alt={l.alt} />
                  <span>{l.alt}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sf-section sf-dark sf-pad-lg" id="leads" style={{ backgroundImage: `url(${c.leads.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="sf-container sf-container-wide">
            <h2>{c.leads.title}</h2>
            <p>{c.leads.text}</p>
            <img src={c.leads.mockup} alt={c.leads.mockupAlt} className="sf-img sf-img-wide" loading="lazy" />
            <div className="sf-integrations-card">
              <h3 className="sf-int-card-title">{c.leads.integrationsTitle}</h3>
              <ul className="sf-integration-list sf-int-hidden">
                {c.leads.integrations.map(n => (
                  <li key={n.name}>{n.src ? <img src={n.src} alt={n.name} /> : <span className="sf-int-name">{n.name}</span>}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="sf-section sf-dark sf-pad-lg" id="manual">
          <div className="sf-container">
            <span className="sf-tag">{c.bonus.tag}</span>
            <h3>{c.bonus.title}</h3>
            <p>{c.bonus.text}</p>
            <a href={c.bonus.ctaUrl} className="sf-btn-primary">{c.bonus.cta}</a>
          </div>
        </section>

        <section className="sf-section sf-dark" id="depoimentos">
          <div className="sf-container sf-container-wide">
            <h2>{c.testimonials.title}</h2>
            <div className="sf-video-grid">
              {c.testimonials.videos.map(v => (
                <video key={v.label} controls preload="metadata" src={v.src} aria-label={v.label}><track kind="captions" /></video>
              ))}
            </div>
          </div>
        </section>

        <section className="sf-section sf-dark" id="funcionalidades" style={{ padding: 0 }}>
          <div className="sf-container sf-container-wide">
            <h2>{c.features.title}</h2>
            <div className="sf-feature-grid">
              {c.features.items.map((t, i) => (
                <article key={i} className="sf-feature-card">
                  <span className="sf-feature-icon" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fede05" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {i % 6 === 0 ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>
                        : i % 6 === 1 ? <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>
                        : i % 6 === 2 ? <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>
                        : i % 6 === 3 ? <><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>
                        : i % 6 === 4 ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>
                        : <><path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 4v5h5" /><path d="m9 13 3 3 6-6" /></>}
                    </svg>
                  </span>
                  <p>{t}</p>
                  <a href={c.features.ctaUrl} className="sf-btn-secondary">{c.features.cta}</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sf-section sf-dark" id="planos" style={{ padding: '80px 20px' }}>
          <div className="sf-container">
            <h2>{c.plans.title}</h2>
            <p>{c.plans.subtitle}</p>
            <div className="sf-plans">
              {c.plans.items.map(p => (
                <article key={p.name} className={`sf-plan ${p.highlight ? 'is-best' : ''}`}>
                  <div className={`sf-plan-head ${p.highlight ? 'is-yellow' : ''}`}><h3>{p.name}</h3></div>
                  <div className="sf-plan-body">
                    {p.badge ? <span className="sf-plan-best">{p.badge}</span> : null}
                    <p className="sf-plan-desc">{p.desc}</p>
                    <ul>{p.features.map(f => <li key={f}>{f}</li>)}</ul>
                    <p className="sf-plan-note">{p.note}</p>
                    <div className="sf-plan-pricing">
                      <span className="sf-plan-installment">até 6x de</span>
                      <strong className="sf-plan-price">R${(p.price.split('R$')[1] || '').replace(',72*', ',72*').replace(',45*', ',45*').replace(',08*', ',08*')}</strong>
                      <span className="sf-plan-full">{p.fullPrice.replace('ou ', '')}</span>
                    </div>
                    <a href="#planos" className={`sf-btn-plan sf-btn-${p.highlight ? 'green' : 'yellow'}`}>{p.cta}</a>
                    <p className="sf-plan-ctanote-in">{c.plans.ctaNote}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="sf-plan-ctanote">{c.plans.ctaNote}</p>
            <p className="sf-plan-esnote"><img src={c.header.esFlag} alt="" width="18" height="13" style={{ verticalAlign: '-2px', marginRight: 6 }} /><a href={c.plans.esUrl}>{c.plans.esNote}</a></p>
          </div>
        </section>

        <section className="sf-section sf-dark" id="garantia">
          <div className="sf-container sf-guarantee">
            <span className="sf-seal" aria-hidden="true"><b>14</b><small>DIAS DE<br />GARANTIA</small></span>
            <div>
              <h2>{c.guarantee.title}</h2>
              <p>{c.guarantee.text}</p>
              <a href={c.guarantee.ctaUrl} className="sf-btn-primary">{c.guarantee.cta}</a>
            </div>
          </div>
        </section>

        <section className="sf-section sf-dark" id="faq">
          <div className="sf-container">
            <h2>{c.faq.title}</h2>
            <Accordion items={c.faq.items} />
            <a href={c.faq.ctaUrl} className="sf-btn-primary">{c.faq.cta}</a>
          </div>
        </section>

        <section className="sf-section sf-dark" id="contato">
          <div className="sf-container">
            <h2>{c.stillDoubts.title}</h2>
            <a href={c.stillDoubts.ctaUrl} className="sf-btn-secondary">{c.stillDoubts.cta}</a>
          </div>
        </section>
      </main>

      <footer className="sf-footer">
        <div className="sf-container sf-footer-inner">
          <img src={c.header.logo} alt={c.header.logoAlt} className="sf-logo" />
          <nav aria-label="Rodapé">
            <span>{c.footer.company}</span>
            <Link to={c.footer.terms.url}>{c.footer.terms.text}</Link>
            <Link to={c.footer.privacy.url}>{c.footer.privacy.text}</Link>
            <span>{c.footer.copyright}</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
