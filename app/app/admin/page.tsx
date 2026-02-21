"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PanelHeader from "@/app/components/PanelHeader";

type Organization = {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

type Invite = {
  id: string;
  organization_id: string;
  email: string;
  status: "pending" | "accepted";
  created_at: string;
  accepted_at: string | null;
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
  const [invites, setInvites] = useState<Record<string, Invite>>({});
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteLoadingId, setInviteLoadingId] = useState<string | null>(null);
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
    const [orgRes, locRes, tagRes, linkRes, memberRes, orgListRes, inviteRes] =
      await Promise.all([
      supabase.from("organizations").select("id", { count: "exact", head: true }),
      supabase.from("locations").select("id", { count: "exact", head: true }),
      supabase.from("tags").select("id", { count: "exact", head: true }),
      supabase.from("links").select("id", { count: "exact", head: true }),
      supabase.from("memberships").select("id", { count: "exact", head: true }),
      supabase
        .from("organizations")
        .select("id, name, slug, contact_email, contact_phone, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("pending_memberships")
        .select("id, organization_id, email, status, created_at, accepted_at")
        .order("created_at", { ascending: false })
    ]);

    setMetrics({
      organizations: orgRes.count ?? 0,
      locations: locRes.count ?? 0,
      tags: tagRes.count ?? 0,
      links: linkRes.count ?? 0,
      memberships: memberRes.count ?? 0
    });

    setOrganizations(orgListRes.data ?? []);

    const inviteMap: Record<string, Invite> = {};
    (inviteRes.data ?? []).forEach((invite) => {
      if (!inviteMap[invite.organization_id]) {
        inviteMap[invite.organization_id] = invite as Invite;
      }
    });
    setInvites(inviteMap);
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

  async function sendInviteEmail(organizationId: string, email: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sessao invalida para envio de convite.");
    }

    const response = await fetch("/api/admin/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ organizationId, email })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Falha ao enviar convite por email.");
    }
  }

  async function handleCreateClient() {
    const name = newName.trim();
    const slug = slugify(newSlug || newName);
    const email = newEmail.trim().toLowerCase();
    const phone = newPhone.trim();

    if (!name || !slug || !email) {
      setError("Preencha nome, slug e email para criar o cliente.");
      return;
    }

    setCreateLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();

    const { data: orgData, error: insertError } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        contact_email: email,
        contact_phone: phone || null
      })
      .select("id")
      .single();

    if (insertError || !orgData) {
      setError(`Nao foi possivel criar cliente: ${insertError.message}`);
      setCreateLoading(false);
      return;
    }

    const { error: inviteError } = await supabase
      .from("pending_memberships")
      .upsert(
        {
          organization_id: orgData.id,
          email,
          role: "owner",
          status: "pending",
          invited_by: userData.user?.id ?? null,
          accepted_at: null
        },
        { onConflict: "organization_id,email" }
      );

    setCreateLoading(false);

    if (inviteError) {
      setError(
        `Cliente criado, mas o vinculo por email falhou: ${inviteError.message}`
      );
      await loadAdminData();
      return;
    }

    try {
      await sendInviteEmail(orgData.id, email);
    } catch (mailError) {
      const message =
        mailError instanceof Error ? mailError.message : "Erro ao enviar email.";
      setError(`Cliente criado e vinculado, mas email nao enviado: ${message}`);
    }

    setNewName("");
    setNewSlug("");
    setNewEmail("");
    setNewPhone("");
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

    const normalizedEmail = org.contact_email?.trim().toLowerCase() ?? null;
    const normalizedPhone = org.contact_phone?.trim() || null;

    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        name,
        slug,
        contact_email: normalizedEmail,
        contact_phone: normalizedPhone
      })
      .eq("id", org.id);

    setSavingId(null);

    if (updateError) {
      setError(`Nao foi possivel salvar cliente: ${updateError.message}`);
      return;
    }

    await loadAdminData();
  }

  async function handleResendInvite(org: Organization) {
    const email = org.contact_email?.trim().toLowerCase();
    if (!email) {
      setError("Defina um email do cliente para criar o vinculo principal.");
      return;
    }

    setInviteLoadingId(org.id);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const { error: inviteError } = await supabase
      .from("pending_memberships")
      .upsert(
        {
          organization_id: org.id,
          email,
          role: "owner",
          status: "pending",
          invited_by: userData.user?.id ?? null,
          accepted_at: null
        },
        { onConflict: "organization_id,email" }
      );

    setInviteLoadingId(null);

    if (inviteError) {
      setError(`Falha ao criar convite por email: ${inviteError.message}`);
      return;
    }

    try {
      await sendInviteEmail(org.id, email);
    } catch (mailError) {
      const message =
        mailError instanceof Error ? mailError.message : "Erro ao enviar email.";
      setError(`Convite gerado, mas email nao enviado: ${message}`);
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

    const { data: deletedRows, error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId)
      .select("id");

    setDeletingId(null);

    if (deleteError) {
      setError(
        `Nao foi possivel excluir cliente. Verifique dependencias no banco: ${deleteError.message}`
      );
      return;
    }

    if (!deletedRows || deletedRows.length === 0) {
      setError(
        "Nenhum cliente foi excluido. Verifique policy de DELETE na tabela organizations para super_admin."
      );
      return;
    }

    setOrganizations((prev) => prev.filter((item) => item.id !== orgId));
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
          <PanelHeader
            navLinks={[
              { href: "/app", label: "Painel" },
              { href: "/app/admin", label: "Painel global" }
            ]}
            logoHref="/app/admin"
          />
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
        <PanelHeader
          navLinks={[
            { href: "/app", label: "Painel igreja" },
            { href: "/app/admin", label: "Painel global" }
          ]}
          logoHref="/app/admin"
        />

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
          <p>Crie a igreja cliente e vincule o email principal da conta.</p>
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
            <input
              className="admin-input"
              type="email"
              placeholder="email principal"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="telefone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
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
          {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
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
                  <div className="admin-org-fields">
                    <input
                      className="admin-input"
                      type="email"
                      placeholder="email principal"
                      value={org.contact_email ?? ""}
                      onChange={(e) =>
                        setOrganizations((prev) =>
                          prev.map((item) =>
                            item.id === org.id
                              ? { ...item, contact_email: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <input
                      className="admin-input"
                      placeholder="telefone"
                      value={org.contact_phone ?? ""}
                      onChange={(e) =>
                        setOrganizations((prev) =>
                          prev.map((item) =>
                            item.id === org.id
                              ? { ...item, contact_phone: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                  <span className="admin-muted">
                    Criado em: {new Date(org.created_at).toLocaleString("pt-BR")}
                  </span>
                  <span className="admin-muted">
                    Vinculo da conta:{" "}
                    {invites[org.id]?.status === "accepted"
                      ? "ativo"
                      : invites[org.id]?.status === "pending"
                        ? "convite pendente"
                        : "sem convite"}
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
                      className="btn btn-secondary"
                      onClick={() => handleResendInvite(org)}
                      disabled={inviteLoadingId === org.id}
                    >
                      {inviteLoadingId === org.id
                        ? "Gerando..."
                        : "Gerar convite"}
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
