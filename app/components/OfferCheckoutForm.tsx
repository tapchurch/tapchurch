"use client";

import { useState } from "react";

type Props = {
  churchSlug: string;
  buttonLabel?: string;
};

export default function OfferCheckoutForm({
  churchSlug,
  buttonLabel = "Ofertar com cartao / carteira digital"
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
    <div className="card" style={{ minHeight: "unset" }}>
      <h3>Oferta por cartao / wallet</h3>
      <p style={{ color: "var(--muted)" }}>
        Apple Pay e Google Pay aparecem automaticamente no Checkout, quando
        disponivel no dispositivo.
      </p>
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Valor da oferta (R$)
          <input
            className="admin-input"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="50,00"
          />
        </label>
        {error ? <span style={{ color: "#b42318" }}>{error}</span> : null}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "Redirecionando..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}
