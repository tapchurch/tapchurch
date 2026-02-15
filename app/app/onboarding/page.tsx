"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Comece com poucas tags e painel completo."
  },
  {
    id: "growth",
    name: "Growth",
    description: "Para igrejas com varias localidades."
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Projetos maiores e suporte dedicado."
  }
];

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [plan, setPlan] = useState(plans[0].id);

  const slugPreview = useMemo(() => slugify(orgName), [orgName]);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (membership) {
        window.location.href = "/app";
        return;
      }

      setLoading(false);
    }
    checkSession();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const finalSlug = orgSlug ? slugify(orgSlug) : slugify(orgName);

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug: finalSlug, plan_name: plan })
      .select("id")
      .single();

    if (orgError || !orgData) {
      setError(orgError?.message ?? "Erro ao criar organizacao");
      setSaving(false);
      return;
    }

    const { error: membershipError } = await supabase
      .from("memberships")
      .insert({
        user_id: userData.user.id,
        organization_id: orgData.id,
        role: "owner"
      });

    if (membershipError) {
      setError(membershipError.message);
      setSaving(false);
      return;
    }

    window.location.href = "/app/locations";
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <section className="hero" style={{ marginTop: 48 }}>
          <div>
            <h1>Configurar igreja</h1>
            <p>Crie sua igreja e selecione o plano inicial.</p>
          </div>
          <div className="hero-card">
            <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Nome da igreja
                <input
                  type="text"
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder="Ex: Igreja Batista Central"
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
                Slug (URL)
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(event) => setOrgSlug(event.target.value)}
                  placeholder={slugPreview || "igreja-centro"}
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
                Plano inicial
                <select
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                >
                  {plans.map((planOption) => (
                    <option key={planOption.id} value={planOption.id}>
                      {planOption.name}
                    </option>
                  ))}
                </select>
              </label>
              {error ? (
                <span style={{ color: "#f2a1a1" }}>{error}</span>
              ) : null}
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Criar igreja"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
