export default function HomePage() {
  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/tapchurch.png"
              alt="TAP CHURCH"
              style={{ width: 34, height: 34, objectFit: "contain" }}
            />
            <div className="brand">TAP CHURCH</div>
          </div>
          <div className="nav-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#plataforma">Plataforma</a>
            <a href="#precos">Precos</a>
            <a href="#contato">Contato</a>
            <a href="/login">Entrar</a>
          </div>
          <a className="btn btn-secondary" href="#contato">
            Agendar demo
          </a>
          <a className="btn btn-primary" href="/login">
            Entrar no painel
          </a>
        </nav>
      </div>

      <section className="container hero">
        <div>
          <h1>Um TAP para comunicar, ofertar e conectar.</h1>
          <p>
            O TAP CHURCH entrega a tag, o micro site e o painel para sua igreja
            atualizar tudo em minutos. O membro aproxima o celular e acessa
            avisos, ofertas e links oficiais.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#contato">
              Quero implementar
            </a>
            <a className="btn btn-secondary" href="#plataforma">
              Ver plataforma
            </a>
            <a className="btn btn-secondary" href="/login">
              Painel admin
            </a>
            <a className="btn btn-primary" href="/signup">
              Criar conta
            </a>
          </div>
        </div>
        <div className="hero-card">
          <div className="tag-preview">
            <div className="tag-chip">TAP CHURCH</div>
            <strong>Tag NFC personalizada</strong>
            <span>Fixada nas cadeiras, mesas ou entradas.</span>
          </div>
          <div className="tag-preview">
            <div className="tag-chip">PIX + WALLET</div>
            <strong>Links e comunicacao</strong>
            <span>Pix, carteiras digitais, avisos e chamadas rápidas.</span>
          </div>
          <div className="tag-preview">
            <div className="tag-chip">DASHBOARD</div>
            <strong>Gerencie locais e links</strong>
            <span>Atualize tudo sem precisar de suporte tecnico.</span>
          </div>
        </div>
      </section>

      <section className="container" id="como-funciona">
        <h2 className="section-title">Como funciona</h2>
        <p className="section-sub">
          A igreja recebe tags prontas, cola no local e ativa a pagina de
          ofertas. O membro aproxima o celular e escolhe Pix ou carteira
          digital.
        </p>
        <div className="grid">
          <div className="card">
            <h3>1. Tag instalada</h3>
            <p>
              Enviamos a tag com layout da igreja. Basta fixar e ativar no
              painel.
            </p>
          </div>
          <div className="card">
            <h3>2. Micro site</h3>
            <p>
              Um link exclusivo com botoes de oferta, projetos e campanhas.
            </p>
          </div>
          <div className="card">
            <h3>3. Pagamento</h3>
            <p>
              O membro escolhe Pix, Apple Pay ou Google Pay direto no celular.
            </p>
          </div>
          <div className="card">
            <h3>4. Gestao central</h3>
            <p>
              O gestor controla varias localidades em uma unica conta.
            </p>
          </div>
        </div>
      </section>

      <section className="container" id="plataforma">
        <h2 className="section-title">Plataforma feita para igrejas</h2>
        <p className="section-sub">
          Voce nao precisa ser fintech. Cada igreja usa seus proprios links de
          pagamento, e o TAP CHURCH organiza tudo.
        </p>
        <div className="grid">
          <div className="card">
            <h3>Links por localidade</h3>
            <p>
              Sede e filiais com paginas diferentes e organizadas por campanha.
            </p>
          </div>
          <div className="card">
            <h3>Painel simples</h3>
            <p>
              Troque links, textos e ordem dos botoes em segundos.
            </p>
          </div>
          <div className="card">
            <h3>Equipe com acesso</h3>
            <p>
              Administradores e gestores com permissoes por localidade.
            </p>
          </div>
          <div className="card">
            <h3>Ativacao rapida</h3>
            <p>
              Assim que a tag chega, a igreja ja consegue ativar sozinha.
            </p>
          </div>
        </div>
      </section>

      <section className="container" id="precos">
        <h2 className="section-title">Modelo de cobranca claro</h2>
        <p className="section-sub">
          Mensalidade por igreja e valor por tag. Sem taxas em cima das ofertas.
        </p>
        <div className="pricing">
          <div className="pricing-card">
            <span className="badge">Plano plataforma</span>
            <h3>Mensalidade por igreja</h3>
            <p>
              Acesso ao painel, micro site, suporte e atualizacoes.
            </p>
          </div>
          <div className="pricing-card">
            <span className="badge">Tags NFC</span>
            <h3>Tag personalizada</h3>
            <p>
              Unidade com layout da igreja e configuracao pronta.
            </p>
          </div>
          <div className="pricing-card">
            <span className="badge">Tags NFC</span>
            <h3>Tag sem personalizacao</h3>
            <p>
              Opcao economica para expansao rapida de cadeiras ou entradas.
            </p>
          </div>
        </div>
      </section>

      <section className="container" id="contato">
        <h2 className="section-title">Vamos colocar sua igreja no ar</h2>
        <p className="section-sub">
          Responda com nome da igreja, quantidade de locais e numero de tags.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="mailto:comercial@tapchurch.com.br">
            Falar com a equipe
          </a>
          <a className="btn btn-secondary" href="https://wa.me/5534984059374">
            WhatsApp
          </a>
        </div>
      </section>

      <div className="container footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/tapchurch.png"
            alt="TAP CHURCH"
            style={{ width: 24, height: 24, objectFit: "contain" }}
          />
          <strong>TAP CHURCH</strong>
        </div>
        <span>Plataforma de ofertas por aproximacao para igrejas.</span>
        <span>Pix, Apple Pay e Google Pay por links proprios da igreja.</span>
        <span>comercial@tapchurch.com.br · WhatsApp 34 98405-9374</span>
      </div>
    </main>
  );
}
