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
};

type TagItem = {
  id: string;
  code: string;
  label: string | null;
  location_id: string | null;
};

export default function TagsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [locationId, setLocationId] = useState<string>("");

  const [editCode, setEditCode] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editLocationId, setEditLocationId] = useState<string>("");

  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    locations.forEach((loc) => map.set(loc.id, loc.name));
    return map;
  }, [locations]);

  useEffect(() => {
    async function loadData() {
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

      const orgValue = Array.isArray(data.organizations)
        ? data.organizations[0]
        : data.organizations;
      const orgData = orgValue as Organization;
      setOrg(orgData);

      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select("id, name")
        .eq("organization_id", orgData.id)
        .order("created_at", { ascending: false });

      if (locationError) {
        setError("Nao foi possivel carregar localidades.");
      } else {
        setLocations(locationData ?? []);
        if (locationData && locationData.length > 0) {
          setLocationId(locationData[0].id);
        }
      }

      const { data: tagData, error: tagError } = await supabase
        .from("tags")
        .select("id, code, label, location_id")
        .eq("organization_id", orgData.id)
        .order("created_at", { ascending: false });

      if (tagError) {
        setError("Nao foi possivel carregar tags.");
      } else {
        setTags(tagData ?? []);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  async function refreshTags(orgId: string) {
    const { data: tagData } = await supabase
      .from("tags")
      .select("id, code, label, location_id")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    setTags(tagData ?? []);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!org) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("tags").insert({
      organization_id: org.id,
      location_id: locationId || null,
      code,
      label: label || null
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    await refreshTags(org.id);
    setCode("");
    setLabel("");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase
      .from("tags")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTags((prev) => prev.filter((tag) => tag.id !== id));
  }

  function startEdit(tag: TagItem) {
    setEditingId(tag.id);
    setEditCode(tag.code);
    setEditLabel(tag.label ?? "");
    setEditLocationId(tag.location_id ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditCode("");
    setEditLabel("");
    setEditLocationId("");
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("tags")
      .update({
        code: editCode,
        label: editLabel || null,
        location_id: editLocationId || null
      })
      .eq("id", editingId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setTags((prev) =>
      prev.map((tag) =>
        tag.id === editingId
          ? {
              ...tag,
              code: editCode,
              label: editLabel || null,
              location_id: editLocationId || null
            }
          : tag
      )
    );

    cancelEdit();
    setSaving(false);
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando tags...</p>
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
            <h1>Tags NFC</h1>
            <p>Cadastre e associe tags por localidade.</p>
          </div>
          <div className="hero-card">
            <strong>Organizacao</strong>
            <span>{org?.name}</span>
            <span style={{ color: "var(--muted)" }}>Slug: {org?.slug}</span>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 32 }}>
          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Nova tag</h3>
            <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Codigo da tag
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Ex: TAG-001"
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
                Identificacao
                <input
                  type="text"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Ex: Cadeira 24"
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
                Localidade
                <select
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                >
                  <option value="">Sem localidade</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              {error ? <span style={{ color: "#f2a1a1" }}>{error}</span> : null}
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar tag"}
              </button>
            </form>
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Tags cadastradas</h3>
            {tags.length === 0 ? (
              <p>Sem tags ainda.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {tags.map((tag) => (
                  <div
                    key={tag.id}
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
                    {editingId === tag.id ? (
                      <form
                        onSubmit={handleUpdate}
                        style={{ display: "grid", gap: 10, width: "100%" }}
                      >
                        <label style={{ display: "grid", gap: 6 }}>
                          Codigo
                          <input
                            type="text"
                            value={editCode}
                            onChange={(event) => setEditCode(event.target.value)}
                            required
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
                              color: "var(--ink)"
                            }}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          Identificacao
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(event) => setEditLabel(event.target.value)}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
                              color: "var(--ink)"
                            }}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          Localidade
                          <select
                            value={editLocationId}
                            onChange={(event) =>
                              setEditLocationId(event.target.value)
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
                              color: "var(--ink)"
                            }}
                          >
                            <option value="">Sem localidade</option>
                            {locations.map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.name}
                              </option>
                            ))}
                          </select>
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
                          <strong>{tag.code}</strong>
                          <div style={{ color: "var(--muted)" }}>
                            {tag.label || "Sem identificacao"}
                          </div>
                          <div style={{ color: "var(--muted)", fontSize: 13 }}>
                            {tag.location_id
                              ? locationMap.get(tag.location_id) ?? "Sem localidade"
                              : "Sem localidade"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => startEdit(tag)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDelete(tag.id)}
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
