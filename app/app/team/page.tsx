"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Organization = {
  id: string;
  name: string;
};

type Member = {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "editor";
};

export default function TeamPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Member["role"]>("editor");

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      setCurrentUserId(userData.user.id);

      const { data, error: orgError } = await supabase
        .from("memberships")
        .select("organization_id, organizations(id, name)")
        .eq("user_id", userData.user.id)
        .single();

      if (orgError || !data?.organizations) {
        setError("Nao foi possivel carregar sua organizacao.");
        setLoading(false);
        return;
      }

      const orgData = data.organizations as Organization;
      setOrg(orgData);

      const { data: memberData, error: memberError } = await supabase
        .from("memberships")
        .select("id, user_id, role")
        .eq("organization_id", orgData.id)
        .order("created_at", { ascending: true });

      if (memberError) {
        setError("Nao foi possivel carregar equipe.");
      } else {
        setMembers(memberData ?? []);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!org) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("memberships").insert({
      user_id: userId,
      organization_id: org.id,
      role
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const { data: memberData } = await supabase
      .from("memberships")
      .select("id, user_id, role")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: true });

    setMembers(memberData ?? []);
    setUserId("");
    setRole("editor");
    setSaving(false);
  }

  async function handleRoleChange(member: Member, newRole: Member["role"]) {
    const { error: updateError } = await supabase
      .from("memberships")
      .update({ role: newRole })
      .eq("id", member.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMembers((prev) =>
      prev.map((item) => (item.id === member.id ? { ...item, role: newRole } : item))
    );
  }

  async function handleRemove(member: Member) {
    if (member.user_id === currentUserId) {
      setError("Voce nao pode remover a si mesmo.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("memberships")
      .delete()
      .eq("id", member.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMembers((prev) => prev.filter((item) => item.id !== member.id));
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando equipe...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <nav className="nav" style={{ marginBottom: 32 }}>
          <div className="brand">{org?.name ?? "TAP CHURCH"}</div>
          <div className="nav-links">
            <a href="/app">Painel</a>
            <a href="/app/locations">Localidades</a>
            <a href="/app/tags">Tags</a>
            <a href="/app/links">Links</a>
            <a href="/app/team">Equipe</a>
            <a href="/app/settings">Micro-site</a>
          </div>
        </nav>

        <section className="hero">
          <div>
            <h1>Equipe</h1>
            <p>Gerencie permissoes dos usuarios da igreja.</p>
          </div>
          <div className="hero-card">
            <strong>{org?.name}</strong>
            <span style={{ color: "var(--muted)" }}>
              Cole o User ID do Supabase Auth para adicionar.
            </span>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 32 }}>
          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Adicionar usuario</h3>
            <form onSubmit={handleAdd} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                User ID (Auth)
                <input
                  type="text"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="UUID do usuario"
                  required
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#0c0c0c",
                    color: "var(--ink)"
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Permissao
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as Member["role"])}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#0c0c0c",
                    color: "var(--ink)"
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </select>
              </label>
              {error ? <span style={{ color: "#f2a1a1" }}>{error}</span> : null}
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Adicionar"}
              </button>
            </form>
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Equipe atual</h3>
            {members.length === 0 ? (
              <p>Sem usuarios cadastrados.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      border: "1px solid var(--stroke)",
                      borderRadius: 14,
                      padding: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    <div>
                      <strong>{member.user_id}</strong>
                      <div style={{ color: "var(--muted)" }}>{member.role}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={member.role}
                        onChange={(event) =>
                          handleRoleChange(
                            member,
                            event.target.value as Member["role"]
                          )
                        }
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--stroke)",
                          background: "#0c0c0c",
                          color: "var(--ink)"
                        }}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleRemove(member)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
