"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/app/onboarding";
  }

  return (
    <main>
      <div className="container">
        <section className="hero" style={{ marginTop: 48 }}>
          <div>
            <h1>Criar conta</h1>
            <p>Crie seu acesso para configurar a igreja e escolher o plano.</p>
          </div>
          <div className="hero-card">
            <form onSubmit={handleSignup} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Nome
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nome completo"
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
                Telefone
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(00) 00000-0000"
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
                {loading ? "Criando..." : "Criar conta"}
              </button>
              <a href="/login" style={{ color: "var(--muted)" }}>
                Ja tenho conta
              </a>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
