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
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  async function loadAdminData() {
    const [orgRes, locRes, tagRes, linkRes, memberRes, orgListRes] = await Promise.all([
      supabase.from("organizations").select("id", { count: "exact", head: true }),
      supabase.from("locations").select("id", { count: "exact", head: true }),
      supabase.from("tags").select("id", { count: "exact", head: true }),
      supabase.from("links").select("id", { count: "exact", head: true }),
      supabase.from("memberships").select("id", { count: "exact", head: true }),
      supabase
        .from("organizations")
        .select("id, name, slug, created_at")
        .order("created_at", { ascending: false })
        .limit(100)
    ]);

    setMetrics({
      organizations: orgRes.count ?? 0,
      locations: locRes.count ?? 0,
      tags: tagRes.count ?? 0,
      links: linkRes.count ?? 0,
      memberships: memberRes.count ?? 0
    });

    setOrganizations(orgListRes.data ?? []);
  }

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
      await loadAdminData();
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleCreateClient() {
    const name = newName.trim();
    const slug = slugify(newSlug || newName);

    if (!name || !slug) {
      setError("Preencha nome e slug validos para criar o cliente.");
      return;
    }

    setCreateLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("organizations")
      .insert({ name, slug });

    setCreateLoading(false);

    if (insertError) {
      setError(`Nao foi possivel criar cliente: ${insertError.message}`);
      return;
    }

    setNewName("");
    setNewSlug("");
    await loadAdminData();
  }

  async function handleSaveClient(org: Organization) {
    const name = org.name.trim();
    const slug = slugify(org.slug);

    if (!name || !slug) {
      setError("Nome e slug sao obrigatorios.");
      return;
    }

    setSavingId(org.id);
    setError(null);

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ name, slug })
      .eq("id", org.id);

    setSavingId(null);

    if (updateError) {
      setError(`Nao foi possivel salvar cliente: ${updateError.message}`);
      return;
    }

    await loadAdminData();
  }

  async function handleDeleteClient(orgId: string) {
    const ok = window.confirm(
      "Excluir este cliente? Essa acao pode remover localidades, links e tags associadas."
    );
    if (!ok) return;

    setDeletingId(orgId);
    setError(null);

    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);

    setDeletingId(null);

    if (deleteError) {
      setError(
        `Nao foi possivel excluir cliente. Verifique dependencias no banco: ${deleteError.message}`
      );
      return;
    }

    await loadAdminData();
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
          <h3>Cadastrar novo cliente</h3>
          <p>Crie a igreja cliente direto por este painel global.</p>
          <div className="admin-form-grid">
            <input
              className="admin-input"
              placeholder="Nome da igreja cliente"
              value={newName}
              onChange={(e) => {
                const value = e.target.value;
                setNewName(value);
                if (!newSlug) setNewSlug(slugify(value));
              }}
            />
            <input
              className="admin-input"
              placeholder="slug-da-igreja"
              value={newSlug}
              onChange={(e) => setNewSlug(slugify(e.target.value))}
            />
            <button
              className="btn btn-primary"
              onClick={handleCreateClient}
              disabled={createLoading}
            >
              {createLoading ? "Criando..." : "Adicionar cliente"}
            </button>
          </div>
          {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <h3>Clientes cadastrados</h3>
          {organizations.length === 0 ? (
            <p>Nenhuma organizacao cadastrada.</p>
          ) : (
            <div className="admin-org-list">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="admin-org-item"
                >
                  <div className="admin-org-fields">
                    <input
                      className="admin-input"
                      value={org.name}
                      onChange={(e) =>
                        setOrganizations((prev) =>
                          prev.map((item) =>
                            item.id === org.id ? { ...item, name: e.target.value } : item
                          )
                        )
                      }
                    />
                    <input
                      className="admin-input"
                      value={org.slug}
                      onChange={(e) =>
                        setOrganizations((prev) =>
                          prev.map((item) =>
                            item.id === org.id
                              ? { ...item, slug: slugify(e.target.value) }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                  <span className="admin-muted">
                    Criado em: {new Date(org.created_at).toLocaleString("pt-BR")}
                  </span>
                  <div className="admin-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => window.open(`/app/locations?org=${org.id}`, "_blank")}
                    >
                      Gerenciar
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveClient(org)}
                      disabled={savingId === org.id}
                    >
                      {savingId === org.id ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteClient(org.id)}
                      disabled={deletingId === org.id}
                    >
                      {deletingId === org.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
