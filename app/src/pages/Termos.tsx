import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const sections = [
  '1. APRESENTAÇÃO','2. SOBRE A ORBIT','3. DEFINIÇÕES','4. QUEM PODE UTILIZAR A PLATAFORMA','5. CADASTRO E SEGURANÇA DA CONTA','6. REGISTROS DE ACESSO (LOGS)','7. PLANOS, ASSINATURAS E PAGAMENTOS','8. CANCELAMENTO, REEMBOLSO E ENCERRAMENTO DA ASSINATURA','9. BACKUP','10. UTILIZAÇÃO DA PLATAFORMA','11. NÃO GARANTIA DE RESULTADOS','12. OBRIGAÇÕES DO CLIENTE','13. CONDUTAS PROIBIDAS','14. INTEGRAÇÕES E SERVIÇOS DE TERCEIROS','15. DEPENDÊNCIA DE TERCEIROS','16. POLÍTICAS DO WHATSAPP E DA META','17. API E RECURSOS DE DESENVOLVIMENTO','18. RECURSOS DE INTELIGÊNCIA ARTIFICIAL','19. PROPRIEDADE INTELECTUAL','20. PRIVACIDADE E PROTEÇÃO DE DADOS','21. A TITULARIDADE DOS DADOS','22. DISPONIBILIDADE DA PLATAFORMA','23. LIMITAÇÃO DE RESPONSABILIDADE','24. SUSPENSÃO E ENCERRAMENTO DA CONTA','25. CONFIDENCIALIDADE','26. COMUNICAÇÕES','27. ALTERAÇÕES DA PLATAFORMA','28. SUPORTE, ONBOARDING E TREINAMENTOS','29. ALTERAÇÕES DESTES TERMOS','30. DISPOSIÇÕES GERAIS'
]

export default function Termos() {
  useEffect(() => {
    const prev = document.body.className
    document.body.className = 'sf-legal-body'
    document.documentElement.lang = 'pt-BR'
    return () => { document.body.className = prev }
  }, [])
  return (
    <div className="sf-legal-page">
      <header className="sf-legal-banner">
        <strong>Orbit</strong>
        <nav aria-label="Topo">
          <Link to="/">Início</Link>
          <Link to="/login">Entrar</Link>
          <Link to="/politica-de-privacidade">Privacidade</Link>
        </nav>
      </header>
      <main className="sf-legal-main">
        <div className="sf-legal-layout">
          <section className="sf-legal-article-wrap" aria-labelledby="termos-title">
            <article>
              <h1 id="termos-title">TERMOS DE USO DA PLATAFORMA ORBIT</h1>
              <p>Estes Termos de Uso regulam o acesso e o uso da plataforma Orbit pelo cliente, com regras para cadastro, planos, serviços, integrações e responsabilidades. O descumprimento das condições aqui descritas pode resultar nas medidas cabíveis, nos termos da lei.</p>
              {sections.map((s, i) => (
                <section key={s} id={`sec-${i+1}`}>
                  <h2>{s}</h2>
                  <p>Esta seção descreve as condições da plataforma Orbit relacionadas a {s.toLowerCase()}, para que o cliente compreenda os serviços, as regras de uso e as obrigações aplicáveis.</p>
                  <ul><li>Condição aplicável ao uso da plataforma.</li><li>Responsabilidade do cliente e da Orbit pelos seus dados e informações.</li></ul>
                </section>
              ))}
            </article>
          </section>
          <aside className="sf-legal-aside" aria-label="Índice">
            <header><h2>Índice</h2></header>
            <nav aria-label="Índice">
              {sections.map((s,i)=>(<a key={s} href={`#sec-${i+1}`}>{s}</a>))}
              <button type="button">Voltar ao topo</button>
            </nav>
          </aside>
        </div>
      </main>
      <dialog open aria-label="Cookies" className="sf-cookie">
        <p>Usamos cookies para melhorar sua experiência. <Link to="/politica-de-privacidade">Política de Privacidade</Link></p>
        <button type="button">Aceitar</button>
      </dialog>
    </div>
  )
}
