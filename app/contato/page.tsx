"use client";

import { useMemo, useState } from "react";

const reasons = [
  "Quero uma demonstração",
  "Preciso de proposta comercial",
  "Dúvidas sobre Stripe e pagamentos",
  "Implantação para múltiplas igrejas"
];

function buildSummary(params: {
  name: string;
  church: string;
  email: string;
  phone: string;
  locations: string;
  tags: string;
  reason: string;
  message: string;
}) {
  return [
    "Novo contato TAP CHURCH",
    `Nome: ${params.name || "-"}`,
    `Igreja/Organização: ${params.church || "-"}`,
    `E-mail: ${params.email || "-"}`,
    `Telefone: ${params.phone || "-"}`,
    `Quantidade de localidades: ${params.locations || "-"}`,
    `Quantidade estimada de tags: ${params.tags || "-"}`,
    `Assunto: ${params.reason || "-"}`,
    "",
    "Mensagem:",
    params.message || "-"
  ].join("\n");
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [church, setChurch] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locations, setLocations] = useState("");
  const [tags, setTags] = useState("");
  const [reason, setReason] = useState(reasons[0]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const summary = useMemo(
    () =>
      buildSummary({
        name,
        church,
        email,
        phone,
        locations,
        tags,
        reason,
        message
      }),
    [name, church, email, phone, locations, tags, reason, message]
  );

  const encodedSummary = encodeURIComponent(summary);
  const mailtoHref = `mailto:comercial@tapchurch.com.br?subject=${encodeURIComponent("Contato comercial TAP CHURCH")}&body=${encodedSummary}`;
  const whatsappHref = `https://wa.me/5534984059374?text=${encodedSummary}`;

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

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
            <h1>Fale com a TAP CHURCH</h1>
            <p>
              Preencha os dados e envie em um clique por WhatsApp ou e-mail.
              Quanto mais detalhes você informar, mais precisa fica a proposta.
            </p>
          </div>
          <div className="hero-card">
            <strong>Canal comercial</strong>
            <span>comercial@tapchurch.com.br</span>
            <span>WhatsApp: (34) 98405-9374</span>
          </div>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <h3>Formulário de contato</h3>
          <div className="contact-grid">
            <label className="contact-field">
              Nome
              <input
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome completo"
              />
            </label>
            <label className="contact-field">
              Igreja/Organização
              <input
                className="admin-input"
                value={church}
                onChange={(event) => setChurch(event.target.value)}
                placeholder="Nome da igreja"
              />
            </label>
            <label className="contact-field">
              E-mail
              <input
                className="admin-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@igreja.com"
              />
            </label>
            <label className="contact-field">
              Telefone
              <input
                className="admin-input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(00) 00000-0000"
              />
            </label>
            <label className="contact-field">
              Quantidade de localidades
              <input
                className="admin-input"
                inputMode="numeric"
                value={locations}
                onChange={(event) => setLocations(event.target.value)}
                placeholder="Ex: 3"
              />
            </label>
            <label className="contact-field">
              Estimativa de tags
              <input
                className="admin-input"
                inputMode="numeric"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Ex: 120"
              />
            </label>
            <label className="contact-field" style={{ gridColumn: "1 / -1" }}>
              Assunto principal
              <select
                className="admin-input"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {reasons.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="contact-field" style={{ gridColumn: "1 / -1" }}>
              Mensagem
              <textarea
                className="admin-input"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                placeholder="Conte seu cenário e objetivo."
              />
            </label>
          </div>

          <div className="hero-actions" style={{ marginTop: 16 }}>
            <a className="btn btn-primary" href={whatsappHref} target="_blank" rel="noreferrer">
              Enviar via WhatsApp
            </a>
            <a className="btn btn-secondary" href={mailtoHref}>
              Enviar via E-mail
            </a>
            <button type="button" className="btn btn-secondary" onClick={copySummary}>
              {copied ? "Resumo copiado" : "Copiar resumo"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
