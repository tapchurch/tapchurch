"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type GlobalMetrics = {
  organizations: number;
  locations: number;
  tags: number;
  links: number;
  memberships: number;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      setEmail(userData.user.email ?? "");

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleError) {
        setError(
          "Permissao global nao configurada. Crie a tabela user_roles e policies no Supabase."
        );
        setLoading(false);
        return;
      }

      if (!roleData) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      const [orgRes, locRes, tagRes, linkRes, memberRes, orgListRes] =
        await Promise.all([
          supabase.from("organizations").select("id", { count: "exact", head: true }),
          supabase.from("locations").select("id", { count: "exact", head: true }),
          supabase.from("tags").select("id", { count: "exact", head: true }),
          supabase.from("links").select("id", { count: "exact", head: true }),
          supabase.from("memberships").select("id", { count: "exact", head: true }),
          supabase
            .from("organizations")
            .select("id, name, slug, created_at")
            .order("created_at", { ascending: false })
            .limit(20)
        ]);

      setMetrics({
        organizations: orgRes.count ?? 0,
        locations: locRes.count ?? 0,
        tags: tagRes.count ?? 0,
        links: linkRes.count ?? 0,
        memberships: memberRes.count ?? 0
      });

      setOrganizations(orgListRes.data ?? []);
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando painel global...</p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main>
        <div className="container">
          <nav className="nav" style={{ marginBottom: 32 }}>
            <div className="brand">TAP CHURCH</div>
            <div className="nav-links">
              <span>{email}</span>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Sair
            </button>
          </nav>
          <div className="card">
            <h3>Acesso negado</h3>
            <p>Esse painel e exclusivo para usuarios com role super_admin.</p>
            {error ? <p>{error}</p> : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <nav className="nav" style={{ marginBottom: 32 }}>
          <div className="brand">TAP CHURCH GLOBAL</div>
          <div className="nav-links">
            <a href="/app">Painel igreja</a>
            <a href="/app/admin">Painel global</a>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Sair
          </button>
        </nav>

        <section className="hero">
          <div>
            <h1>Painel Global</h1>
            <p>Gestao de todas as igrejas clientes e instancias cadastradas.</p>
          </div>
          <div className="hero-card">
            <strong>Usuario</strong>
            <span>{email}</span>
            <span style={{ color: "var(--muted)" }}>Role: super_admin</span>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 32 }}>
          <div className="card">
            <h3>Igrejas</h3>
            <p>{metrics?.organizations ?? 0}</p>
          </div>
          <div className="card">
            <h3>Localidades</h3>
            <p>{metrics?.locations ?? 0}</p>
          </div>
          <div className="card">
            <h3>Tags</h3>
            <p>{metrics?.tags ?? 0}</p>
          </div>
          <div className="card">
            <h3>Links</h3>
            <p>{metrics?.links ?? 0}</p>
          </div>
          <div className="card">
            <h3>Usuarios vinculados</h3>
            <p>{metrics?.memberships ?? 0}</p>
          </div>
        </section>

        <section className="card" style={{ marginTop: 32 }}>
          <h3>Clientes recentes</h3>
          {organizations.length === 0 ? (
            <p>Nenhuma organizacao cadastrada.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {organizations.map((org) => (
                <div
                  key={org.id}
                  style={{
                    border: "1px solid var(--stroke)",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 4
                  }}
                >
                  <strong>{org.name}</strong>
                  <span style={{ color: "var(--muted)" }}>Slug: {org.slug}</span>
                  <span style={{ color: "var(--muted)" }}>
                    Criado em: {new Date(org.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
