export default function PricingPage() {
  return (
    <main>
      <div className="container">
        <nav className="nav" style={{ marginBottom: 32 }}>
          <a className="brand" href="/">
            TAP CHURCH
          </a>
          <div className="nav-links">
            <a href="/">Início</a>
            <a href="/contato">Contato</a>
            <a href="/login">Entrar</a>
          </div>
        </nav>

        <section className="hero">
          <div>
            <h1>Preços e modelo comercial</h1>
            <p>
              Estrutura clara para igrejas começarem rápido e escalar por
              localidade.
            </p>
          </div>
          <div className="hero-card">
            <strong>Resumo rápido</strong>
            <span>Plataforma mensal: R$ 49,90 por igreja</span>
            <span>Tag sem personalização: R$ 19,90 por unidade</span>
            <span>Tag personalizada: valor sob consulta</span>
          </div>
        </section>

        <section className="pricing" style={{ marginTop: 24 }}>
          <div className="pricing-card">
            <span className="badge">Plano mensal</span>
            <h3>Plataforma TAP CHURCH</h3>
            <p>
              <strong>R$ 49,90/mês</strong> por igreja.
            </p>
            <p>
              Inclui painel administrativo, gestão de localidades, links
              dinâmicos, páginas públicas e suporte operacional.
            </p>
          </div>

          <div className="pricing-card">
            <span className="badge">Tags NFC</span>
            <h3>Tag sem personalização</h3>
            <p>
              <strong>R$ 19,90</strong> por unidade.
            </p>
            <p>
              Opção econômica para implantação rápida em cadeiras, entradas e
              ambientes de circulação.
            </p>
          </div>

          <div className="pricing-card">
            <span className="badge">Tags NFC</span>
            <h3>Tag personalizada</h3>
            <p>
              <strong>Preço sob consulta.</strong>
            </p>
            <p>
              Valor varia por volume, acabamento e complexidade da identidade
              visual da igreja.
            </p>
          </div>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <h3>Exemplo de composição mensal</h3>
          <div className="pricing-table">
            <div className="pricing-row">
              <span>Plataforma mensal</span>
              <strong>R$ 49,90</strong>
            </div>
            <div className="pricing-row">
              <span>100 tags sem personalização (100 × R$ 19,90)</span>
              <strong>R$ 1.990,00</strong>
            </div>
            <div className="pricing-row total">
              <span>Total de implantação + 1º mês</span>
              <strong>R$ 2.039,90</strong>
            </div>
          </div>
          <p style={{ color: "var(--muted)", marginTop: 10 }}>
            Observação: o exemplo é ilustrativo. Custos logísticos e tags
            personalizadas são calculados na proposta.
          </p>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <h3>Stripe: como funciona no TAP CHURCH</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <p>
              Cada igreja conecta sua própria conta Stripe (Connect Express) e
              recebe os valores diretamente nela.
            </p>
            <p>
              O checkout suporta cartão, Apple Pay e Google Pay conforme o
              dispositivo/navegador do ofertante.
            </p>
            <p>
              Na operação de oferta, a plataforma aplica uma taxa de
              intermediação de <strong>1%</strong> do valor
              (`application_fee_amount`), e o restante é transferido para a
              conta da igreja (`transfer_data.destination`).
            </p>
            <p>
              As taxas de processamento da Stripe são definidas pela própria
              Stripe e podem variar por país, método de pagamento e tipo de
              conta.
            </p>
          </div>
        </section>

        <section className="hero-actions" style={{ marginTop: 24 }}>
          <a className="btn btn-primary" href="/contato">
            Solicitar proposta
          </a>
          <a className="btn btn-secondary" href="https://wa.me/5534984059374">
            Falar no WhatsApp
          </a>
        </section>
      </div>
    </main>
  );
}
