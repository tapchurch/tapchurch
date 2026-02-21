"use client";

import { useEffect, useState } from "react";

type Lang = "pt" | "en";

const copy = {
  pt: {
    nav: {
      how: "Como funciona",
      platform: "Plataforma",
      pricing: "Precos",
      contact: "Contato",
      login: "Entrar",
      demo: "Agendar demo",
      panel: "Entrar no painel"
    },
    hero: {
      title: "Um TAP para comunicar, ofertar e conectar.",
      desc: "O TAP CHURCH entrega a tag, o micro site e o painel para sua igreja atualizar tudo em minutos. O membro aproxima o celular e acessa avisos, ofertas e links oficiais.",
      cta1: "Quero implementar",
      cta2: "Ver plataforma",
      cta3: "Painel admin",
      cta4: "Criar conta"
    },
    tagCards: [
      {
        chip: "TAP CHURCH",
        title: "Tag NFC personalizada",
        text: "Fixada nas cadeiras, mesas ou entradas."
      },
      {
        chip: "PIX + WALLET",
        title: "Links e comunicacao",
        text: "Pix, carteiras digitais, avisos e chamadas rapidas."
      },
      {
        chip: "DASHBOARD",
        title: "Gerencie locais e links",
        text: "Atualize tudo sem precisar de suporte tecnico."
      }
    ],
    how: {
      title: "Como funciona",
      sub: "A igreja recebe tags prontas, cola no local e ativa a pagina de ofertas. O membro aproxima o celular e escolhe Pix ou carteira digital.",
      cards: [
        ["1. Tag instalada", "Enviamos a tag com layout da igreja. Basta fixar e ativar no painel."],
        ["2. Micro site", "Um link exclusivo com botoes de oferta, projetos e campanhas."],
        ["3. Pagamento", "O membro escolhe Pix, Apple Pay ou Google Pay direto no celular."],
        ["4. Gestao central", "O gestor controla varias localidades em uma unica conta."]
      ]
    },
    platform: {
      title: "Plataforma feita para igrejas",
      sub: "Voce nao precisa ser fintech. Cada igreja usa seus proprios links de pagamento, e o TAP CHURCH organiza tudo.",
      cards: [
        ["Links por localidade", "Sede e filiais com paginas diferentes e organizadas por campanha."],
        ["Painel simples", "Troque links, textos e ordem dos botoes em segundos."],
        ["Equipe com acesso", "Administradores e gestores com permissoes por localidade."],
        ["Ativacao rapida", "Assim que a tag chega, a igreja ja consegue ativar sozinha."]
      ]
    },
    pricing: {
      title: "Modelo de cobranca claro",
      sub: "Mensalidade por igreja e valor por tag. Sem taxas em cima das ofertas.",
      cards: [
        ["Plano plataforma", "Mensalidade por igreja", "Acesso ao painel, micro site, suporte e atualizacoes."],
        ["Tags NFC", "Tag personalizada", "Unidade com layout da igreja e configuracao pronta."],
        ["Tags NFC", "Tag sem personalizacao", "Opcao economica para expansao rapida de cadeiras ou entradas."]
      ]
    },
    contact: {
      title: "Vamos colocar sua igreja no ar",
      sub: "Responda com nome da igreja, quantidade de locais e numero de tags.",
      talk: "Falar com a equipe"
    },
    footer: {
      l1: "Plataforma de ofertas por aproximacao para igrejas.",
      l2: "Pix, Apple Pay e Google Pay por links proprios da igreja."
    }
  },
  en: {
    nav: {
      how: "How it works",
      platform: "Platform",
      pricing: "Pricing",
      contact: "Contact",
      login: "Login",
      demo: "Book demo",
      panel: "Go to dashboard"
    },
    hero: {
      title: "One TAP to communicate, give, and connect.",
      desc: "TAP CHURCH delivers NFC tags, public pages, and a dashboard so churches can update everything in minutes.",
      cta1: "I want this",
      cta2: "See platform",
      cta3: "Admin panel",
      cta4: "Create account"
    },
    tagCards: [
      {
        chip: "TAP CHURCH",
        title: "Custom NFC tag",
        text: "Placed on seats, tables, or entry points."
      },
      {
        chip: "PIX + WALLET",
        title: "Links and communication",
        text: "Pix, digital wallets, announcements, and quick actions."
      },
      {
        chip: "DASHBOARD",
        title: "Manage locations and links",
        text: "Update everything without technical support."
      }
    ],
    how: {
      title: "How it works",
      sub: "The church receives ready-to-use tags, installs them, and activates links. Members tap and choose the payment option.",
      cards: [
        ["1. Tag installed", "We ship tags with church branding. Just place and activate."],
        ["2. Public page", "Each location has its own page and key buttons."],
        ["3. Payment", "Members choose Pix, Apple Pay, or Google Pay on mobile."],
        ["4. Central management", "Manage multiple locations under one account."]
      ]
    },
    platform: {
      title: "Built for churches",
      sub: "You are not a fintech. Each church uses its own payment links and TAP CHURCH organizes the experience.",
      cards: [
        ["Links by location", "Main campus and branches with separate pages."],
        ["Simple dashboard", "Change links and content in seconds."],
        ["Team access", "Admins and editors with role-based access."],
        ["Fast activation", "Churches can activate as soon as tags arrive."]
      ]
    },
    pricing: {
      title: "Clear pricing model",
      sub: "Monthly platform fee plus NFC tags. No fee on church donations.",
      cards: [
        ["Platform plan", "Monthly per church", "Dashboard access, page hosting, support, and updates."],
        ["NFC Tags", "Custom tag", "Ready-to-use units with church branding."],
        ["NFC Tags", "Standard tag", "Lower-cost option for fast expansion."]
      ]
    },
    contact: {
      title: "Let us launch your church setup",
      sub: "Send your church name, number of locations, and expected number of tags.",
      talk: "Talk to sales"
    },
    footer: {
      l1: "Tap-based giving and communication platform for churches.",
      l2: "Pix, Apple Pay, and Google Pay with church-owned links."
    }
  }
} as const;

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("pt");

  useEffect(() => {
    const stored = window.localStorage.getItem("tapchurch_lang");
    if (stored === "pt" || stored === "en") setLang(stored);
  }, []);

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    window.localStorage.setItem("tapchurch_lang", nextLang);
  }

  const t = copy[lang];

  const NfcIcon = ({ size = 18 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M5 4C7.5 6.5 7.5 17.5 5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7C10.5 8.8 10.5 15.2 9 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 9.5C13.9 10.6 13.9 13.4 13 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 9V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

  const CircleIcon = ({
    size = 16,
    color = "currentColor"
  }: {
    size?: number;
    color?: string;
  }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" fill={color} opacity="0.9" />
    </svg>
  );

  const SparkIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" fill="currentColor" />
    </svg>
  );

  const LinkIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 14L14 10M8 16L6 18C4.3 19.7 1.7 19.7 0 18C-1.7 16.3 -1.7 13.7 0 12L2 10M16 8L18 6C19.7 4.3 22.3 4.3 24 6C25.7 7.7 25.7 10.3 24 12L22 14" transform="translate(0 0)" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  const WalletIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 12H21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16.5" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );

  const TeamIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 18.5C4.2 16.3 5.8 15 8 15C10.2 15 11.8 16.3 12.5 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 18.5C14.5 17 15.5 16.2 16.8 16.2C18.1 16.2 19.1 17 19.6 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

  const BoltIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L5 13H11L9.8 22L19 10.5H13.2L13 2Z" fill="currentColor" />
    </svg>
  );

  return (
    <main>
      <div className="container">
        <nav className="nav nav-home">
          <div className="home-brand">
            <img src="/tapchurch.png" alt="TAP CHURCH" style={{ width: 150, height: 44, objectFit: "contain" }} />
          </div>
          <div className="nav-links">
            <a href="#como-funciona">{t.nav.how}</a>
            <a href="#plataforma">{t.nav.platform}</a>
            <a href="#precos">{t.nav.pricing}</a>
            <a href="#contato">{t.nav.contact}</a>
            <a href="/login">{t.nav.login}</a>
          </div>
          <div className="lang-switch" role="tablist" aria-label="Selecionar idioma">
            <button
              type="button"
              className={`lang-btn ${lang === "pt" ? "is-active" : ""}`}
              onClick={() => changeLanguage("pt")}
            >
              PT-BR
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === "en" ? "is-active" : ""}`}
              onClick={() => changeLanguage("en")}
            >
              EN
            </button>
          </div>
          <div className="nav-actions">
            <a className="btn btn-secondary" href="#contato">
              {t.nav.demo}
            </a>
            <a className="btn btn-primary" href="/login">
              {t.nav.panel}
            </a>
          </div>
        </nav>
      </div>

      <section className="container hero">
        <div>
          <h1>{t.hero.title}</h1>
          <p>{t.hero.desc}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#contato">
              {t.hero.cta1}
            </a>
            <a className="btn btn-secondary" href="#plataforma">
              {t.hero.cta2}
            </a>
            <a className="btn btn-primary" href="/signup">
              {t.hero.cta4}
            </a>
          </div>
        </div>
        <div className="hero-card">
          <img
            src="/tapchurch-hero.png"
            alt="Exemplo visual TAP Church"
            className="landing-hero-image"
          />
          {t.tagCards.map((card) => (
            <div className="tag-preview" key={card.title}>
              <div className="tag-chip">{card.chip}</div>
              <strong className="icon-title">
                <NfcIcon />
                {card.title}
              </strong>
              <span>{card.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container" id="como-funciona">
        <h2 className="section-title icon-title">
          <SparkIcon size={20} />
          {t.how.title}
        </h2>
        <p className="section-sub">{t.how.sub}</p>
        <div className="grid">
          {t.how.cards.map(([title, text], index) => (
            <div className="card" key={title}>
              <h3 className="icon-title">
                {index === 0 ? (
                  <NfcIcon />
                ) : index === 1 ? (
                  <LinkIcon />
                ) : index === 2 ? (
                  <WalletIcon />
                ) : (
                  <TeamIcon />
                )}
                {title}
              </h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" id="plataforma">
        <h2 className="section-title icon-title">
          <LinkIcon size={20} />
          {t.platform.title}
        </h2>
        <p className="section-sub">{t.platform.sub}</p>
        <div className="grid">
          {t.platform.cards.map(([title, text], index) => (
            <div className="card" key={title}>
              <h3 className="icon-title">
                {index === 0 ? (
                  <LinkIcon />
                ) : index === 1 ? (
                  <SparkIcon />
                ) : index === 2 ? (
                  <TeamIcon />
                ) : (
                  <BoltIcon />
                )}
                {title}
              </h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" id="precos">
        <h2 className="section-title icon-title">
          <WalletIcon size={20} />
          {t.pricing.title}
        </h2>
        <p className="section-sub">{t.pricing.sub}</p>
        <div className="pricing">
          {t.pricing.cards.map(([badge, title, text], index) => (
            <div className="pricing-card" key={title}>
              <span className="badge">{badge}</span>
              <h3 className="icon-title">
                {index === 0 ? (
                  <WalletIcon />
                ) : (
                  <NfcIcon />
                )}
                {title}
              </h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" id="contato">
        <h2 className="section-title icon-title">
          <TeamIcon size={20} />
          {t.contact.title}
        </h2>
        <p className="section-sub">{t.contact.sub}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="mailto:comercial@tapchurch.com.br">
            {t.contact.talk}
          </a>
          <a className="btn btn-secondary" href="https://wa.me/5534984059374">
            WhatsApp
          </a>
        </div>
      </section>

      <div className="container footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/tapchurch.png" alt="TAP CHURCH" style={{ width: 24, height: 24, objectFit: "contain" }} />
          <strong>TAP CHURCH</strong>
        </div>
        <span>{t.footer.l1}</span>
        <span>{t.footer.l2}</span>
        <span>comercial@tapchurch.com.br · WhatsApp 34 98405-9374</span>
      </div>
    </main>
  );
}
