"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/app";
  }

  return (
    <main>
      <div className="container">
        <section className="hero" style={{ marginTop: 48 }}>
          <div>
            <h1>Entrar no painel</h1>
            <p>
              Acesse com o e-mail da igreja para gerenciar localidades, tags e
              links de pagamento.
            </p>
          </div>
          <div className="hero-card">
            <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                E-mail
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@igreja.com"
                  required
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Senha
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center"
                  }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--stroke)",
                      background: "#ffffff",
                      color: "var(--ink)"
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{ padding: "10px 14px" }}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </label>
              {error ? (
                <span style={{ color: "#f2a1a1" }}>{error}</span>
              ) : null}
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
