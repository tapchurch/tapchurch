export default function PricingPage() {
  return (
    <main>
      <div className="container">
        <nav className="nav nav-home" style={{ marginBottom: 32 }}>
          <a className="home-brand" href="/" aria-label="Ir para a página inicial">
            <img
              src="/tapchurch.png"
              alt="TAP CHURCH"
              style={{ width: 150, height: 44, objectFit: "contain" }}
            />
          </a>
          <div className="nav-links">
            <a href="/">Início</a>
            <a href="/precos">Preços</a>
            <a href="/contato">Contato</a>
            <a href="/login">Entrar</a>
          </div>
        </nav>

        <section className="hero">
          <div>
            <h1>Preços e modelo comercial</h1>
            <p>
              Estrutura clara para igrejas começarem rápido e escalar por
              localidade, com explicação direta de implantação, mensalidade e
              uso da tag como canal de comunicação.
            </p>
          </div>
          <div className="hero-card">
            <strong>Resumo rápido</strong>
            <span>Plataforma mensal: R$ 49,90 por igreja</span>
            <span>Tag sem personalização: R$ 19,90 por unidade</span>
            <span>Tag personalizada: valor sob consulta</span>
          </div>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <h3>Como funciona a cobrança</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <p>
              1. A igreja contrata a plataforma e paga a mensalidade fixa de{" "}
              <strong>R$ 49,90/mês</strong>.
            </p>
            <p>
              2. A implantação das tags é calculada por quantidade, com opção
              sem personalização ou personalizada.
            </p>
            <p>
              3. A igreja organiza suas páginas, links e localidades em um único
              painel, sem depender de suporte técnico.
            </p>
            <p>
              4. O foco atual da plataforma está em comunicação rápida,
              organização e ativação das tags NFC.
            </p>
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
            <p>
              Ideal para manter comunicação, campanhas e acessos oficiais sempre
              atualizados sem depender de equipe técnica.
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
            <p>Indicada para expansão em volume com custo previsível.</p>
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
            <p>
              Recomendado para igrejas que querem reforço de marca no ambiente.
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
          <h3>O que está incluído no plano mensal</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <p>• Painel para criar e editar links por localidade.</p>
            <p>• Página pública por igreja/localidade para acesso via NFC.</p>
            <p>• Área de equipe com controle de acesso por usuário.</p>
            <p>• Ajustes de aparência (logo, cores e conteúdo principal).</p>
            <p>• Suporte operacional para dúvidas de uso da plataforma.</p>
          </div>
        </section>

        

        <section className="card" style={{ marginTop: 24 }}>
          <h3>Perguntas frequentes</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <p>
              <strong>Preciso instalar aplicativo para usar a tag?</strong>
            </p>
            <p>
              Não. O membro apenas aproxima o celular e abre a página da igreja
              com os links e informações definidos no painel.
            </p>
            <p>
              <strong>Preciso comprar todas as tags de uma vez?</strong>
            </p>
            <p>
              Não. Você pode começar com um lote inicial e expandir por fases.
            </p>
            <p>
              <strong>Posso ter várias localidades no mesmo acesso?</strong>
            </p>
            <p>
              Sim. A estrutura já foi desenhada para gestão multi-localidade.
            </p>
            <p>
              <strong>Tag personalizada tem preço fixo?</strong>
            </p>
            <p>
              Não. O valor depende do projeto gráfico, material e quantidade.
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
