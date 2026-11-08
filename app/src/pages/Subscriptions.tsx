import React from 'react'

const rows = [
  ['Status', 'Ativo'],
  ['Número da recorrência atual', '1'],
  ['Período de recorrência', '6 meses'],
  ['Créditos de conta', '1'],
  ['Créditos de campanha', 'Ilimitado'],
  ['Créditos de grupo', 'Ilimitado'],
  ['Data da Compra', '06/11/2026, 21:12:23'],
  ['Data da Expiração', '06/05/2027, 21:12:26'],
]

export default function Subscriptions() {
  return (
    <div className="pf">
      <div className="sub-head">
        <h2 className="sub-title">Minhas Assinaturas</h2>
        <a className="sub-upgrade" href="#" onClick={e => e.preventDefault()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.5 18.49l6-6.01 4 4L21 8.92v4.99l-7.5 7.51-4-4-4.5 4.5-1.5-4.43zM3 13.1V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1L13.5 13.5l-4-4L3 13.1z"/></svg>
          Fazer upgrade de plano
        </a>
      </div>
      <section className="pf-card sub-card">
        <header className="sub-card-head">
          <strong>Plano Lite - Semestral</strong>
        </header>
        <dl className="sub-rows">
          {rows.map(([k, v]) => (
            <div className="pf-row" key={k}>
              <dt className="pf-label">{k}</dt>
              <dd className="pf-value">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
