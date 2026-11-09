import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Privacidade() {
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
          <Link to="/termo-de-uso">Termos</Link>
        </nav>
      </header>
      <main className="sf-legal-main">
        <div className="sf-legal-layout" style={{gridTemplateColumns:'minmax(0,1140px)'}}>
          <section className="sf-legal-article-wrap" aria-labelledby="priv-title">
            <article>
              <h1 id="priv-title">Política de Privacidade do Orbit</h1>
              <h2>Introdução</h2>
              <p>Esta Política de Privacidade descreve como os dados e informações dos usuários são tratados na plataforma Orbit, em conformidade com a legislação aplicável, incluindo a LGPD.</p>

              <h2>1. Dados Coletados</h2>
              <p>A Orbit pode coletar dados necessários para o funcionamento da plataforma e dos serviços.</p>
              <h3>1.1. Informações pessoais</h3>
              <p>Podemos coletar informações pessoais fornecidas pelo usuário, como nome, email e dados de contato.</p>
              <h3>1.2. Informações coletadas automaticamente</h3>
              <p>Informações técnicas podem ser coletadas automaticamente durante o uso da plataforma.</p>
              <h3>1.3. Dados de terceiros</h3>
              <p>Dados podem ser recebidos de integrações ou serviços de terceiros, conforme autorizado.</p>

              <h2>2. Uso dos Dados</h2>
              <p>Os dados são usados para operar a plataforma, prestar serviços, melhorar a experiência e cumprir obrigações legais.</p>
              <ul><li>Fornecer e manter os serviços da plataforma.</li><li>Comunicar informações importantes sobre a plataforma.</li></ul>

              <h2>3. Compartilhamento de Dados</h2>
              <p>O compartilhamento de dados pode ocorrer nas situações descritas nesta política.</p>
              <h3>3.1. Prestadores de serviço e parceiros</h3>
              <p>Podemos compartilhar dados com parceiros que apoiam a operação da plataforma.</p>
              <h3>3.2. Integrações com plataformas de terceiros</h3>
              <p>Integrações podem envolver troca de informações com serviços conectados.</p>
              <h3>3.3. Obrigação legal</h3>
              <p>Dados podem ser compartilhados para cumprir obrigações legais ou ordens de autoridades.</p>
              <h3>3.4. Sem venda de dados</h3>
              <p>A Orbit não vende dados pessoais dos usuários.</p>

              <h2>4. Segurança dos Dados</h2>
              <p>Adotamos medidas para proteger os dados e informações armazenados na plataforma.</p>
              <h2>5. Retenção dos Dados</h2>
              <p>Os dados são retidos pelo tempo necessário para as finalidades da plataforma ou exigências legais.</p>
              <h2>6. Direitos dos Usuários</h2>
              <p>Os usuários podem exercer seus direitos sobre dados pessoais, conforme a legislação aplicável.</p>
              <h2>7. Cookies e Tecnologias Similares</h2>
              <p>Cookies podem ser usados para melhorar a experiência na plataforma.</p>
              <h2>8. Transferência Internacional de Dados</h2>
              <p>Dados podem ser transferidos internacionalmente quando necessário para os serviços.</p>
              <h2>9. Alterações nesta Política</h2>
              <p>Esta política pode ser atualizada para refletir mudanças na plataforma ou na lei.</p>
              <h2>10. Contato</h2>
              <p>Em caso de dúvidas sobre privacidade e dados, entre em contato com a equipe da Orbit pelo chat da plataforma.</p>
              <h2>11. Jurisdição e Conformidade Legal</h2>
              <p>Esta política é interpretada de acordo com a legislação aplicável. Você pode exercer seus direitos no âmbito da LGPD a qualquer momento.</p>
            </article>
          </section>
        </div>
      </main>
      <dialog open className="sf-cookie" aria-label="Cookies">
        <p>Usamos cookies para melhorar sua experiência. <Link to="/politica-de-privacidade">Política de Privacidade</Link></p>
        <button type="button">Aceitar</button>
      </dialog>
    </div>
  )
}
