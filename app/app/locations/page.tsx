"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type Location = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function LocationsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const slugPreview = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    async function loadOrg() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error: orgError } = await supabase
        .from("memberships")
        .select("organization_id, organizations(id, name, slug)")
        .eq("user_id", userData.user.id)
        .single();

      if (orgError || !data?.organizations) {
        setError("Nao foi possivel carregar sua organizacao.");
        setLoading(false);
        return;
      }

      const orgData = data.organizations as Organization;
      setOrg(orgData);

      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select("id, name, slug, address")
        .eq("organization_id", orgData.id)
        .order("created_at", { ascending: false });

      if (locationError) {
        setError("Nao foi possivel carregar localidades.");
      } else {
        setLocations(locationData ?? []);
      }

      setLoading(false);
    }

    loadOrg();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!org) return;

    setSaving(true);
    setError(null);

    const finalSlug = slug ? slugify(slug) : slugify(name);

    const { error: insertError } = await supabase.from("locations").insert({
      organization_id: org.id,
      name,
      slug: finalSlug,
      address: address || null
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const { data: locationData } = await supabase
      .from("locations")
      .select("id, name, slug, address")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });

    setLocations(locationData ?? []);
    setName("");
    setSlug("");
    setAddress("");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!org) return;
    const { error: deleteError } = await supabase
      .from("locations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setLocations((prev) => prev.filter((location) => location.id !== id));
  }

  function startEdit(location: Location) {
    setEditingId(location.id);
    setEditName(location.name);
    setEditSlug(location.slug);
    setEditAddress(location.address ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditAddress("");
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setSaving(true);
    setError(null);

    const finalSlug = editSlug ? slugify(editSlug) : slugify(editName);

    const { error: updateError } = await supabase
      .from("locations")
      .update({
        name: editName,
        slug: finalSlug,
        address: editAddress || null
      })
      .eq("id", editingId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setLocations((prev) =>
      prev.map((location) =>
        location.id === editingId
          ? {
              ...location,
              name: editName,
              slug: finalSlug,
              address: editAddress || null
            }
          : location
      )
    );

    cancelEdit();
    setSaving(false);
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando localidades...</p>
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
            <h1>Localidades</h1>
            <p>
              Gerencie sedes e filiais da igreja. Cada localidade pode ter seu
              proprio micro site.
            </p>
          </div>
          <div className="hero-card">
            <strong>Organizacao</strong>
            <span>{org?.name}</span>
            <span style={{ color: "var(--muted)" }}>Slug: {org?.slug}</span>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 32 }}>
          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Criar localidade</h3>
            <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Nome
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Sede Centro"
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
                Slug (URL)
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder={slugPreview || "sede-centro"}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#0c0c0c",
                    color: "var(--ink)"
                  }}
                />
                <span style={{ color: "var(--muted)", fontSize: 12 }}>
                  Ex: {org?.slug}/{slugPreview || "sede-centro"}
                </span>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Endereco
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Rua, numero, cidade"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#0c0c0c",
                    color: "var(--ink)"
                  }}
                />
              </label>
              {error ? <span style={{ color: "#f2a1a1" }}>{error}</span> : null}
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar localidade"}
              </button>
            </form>
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Localidades cadastradas</h3>
            {locations.length === 0 ? (
              <p>Sem localidades ainda.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {locations.map((location) => (
                  <div
                    key={location.id}
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
                    {editingId === location.id ? (
                      <form
                        onSubmit={handleUpdate}
                        style={{ display: "grid", gap: 10, width: "100%" }}
                      >
                        <label style={{ display: "grid", gap: 6 }}>
                          Nome
                          <input
                            type="text"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            required
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#0c0c0c",
                              color: "var(--ink)"
                            }}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          Slug (URL)
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(event) => setEditSlug(event.target.value)}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#0c0c0c",
                              color: "var(--ink)"
                            }}
                          />
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>
                            Ex: {org?.slug}/{slugify(editName) || "sede-centro"}
                          </span>
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          Endereco
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(event) =>
                              setEditAddress(event.target.value)
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#0c0c0c",
                              color: "var(--ink)"
                            }}
                          />
                        </label>
                        {error ? (
                          <span style={{ color: "#f2a1a1" }}>{error}</span>
                        ) : null}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={saving}
                          >
                            {saving ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div>
                          <strong>{location.name}</strong>
                          <div style={{ color: "var(--muted)" }}>
                            {location.slug}
                          </div>
                          {location.address ? (
                            <div style={{ color: "var(--muted)", fontSize: 13 }}>
                              {location.address}
                            </div>
                          ) : null}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => startEdit(location)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDelete(location.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </>
                    )}
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
