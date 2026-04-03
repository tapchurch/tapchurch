"use client";

import { useState } from "react";

type Props = {
  churchSlug: string;
  buttonLabel?: string;
};

export default function OfferCheckoutForm({
  churchSlug,
  buttonLabel = "Continuar para o checkout"
}: Props) {
  const [amount, setAmount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/offers/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: churchSlug,
          amount: Number(amount.replace(",", "."))
        })
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Nao foi possivel iniciar o pagamento.");
        setLoading(false);
        return;
      }

      window.location.href = payload.url;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Falha de conexao ao iniciar pagamento.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <section className="offer-box">
      <div className="offer-box-copy">
        <span className="offer-pill">Ofertas</span>
        <h3>Contribua em segundos</h3>
        <p>
          Defina o valor da oferta e siga para um checkout seguro, moderno e
          rapido com cartao, Apple Pay ou Google Pay quando disponivel.
        </p>
      </div>
      <div className="offer-box-form">
        <label className="offer-field">
          <span>Valor da oferta</span>
          <input
            className="offer-input"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="50,00"
          />
        </label>
        {error ? <span className="offer-error">{error}</span> : null}
        <button
          type="button"
          className="btn btn-primary offer-button"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "Redirecionando..." : buttonLabel}
        </button>
      </div>
    </section>
  );
}
