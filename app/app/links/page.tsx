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
};

type LinkItem = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon_url: string | null;
  category: "payment" | "generic";
  method: "pix" | "digital_wallet" | "custom" | null;
  featured_type: "instagram" | "youtube" | "site" | null;
  sort_order: number;
  is_active: boolean;
};

const ICON_PRESETS = [
  { label: "Instagram", url: "https://cdn.simpleicons.org/instagram/FFFFFF" },
  { label: "YouTube", url: "https://cdn.simpleicons.org/youtube/FFFFFF" },
  { label: "Site", url: "https://cdn.simpleicons.org/googlechrome/FFFFFF" }
];

function normalizeUrl(value: string) {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `https://${value}`;
}

export default function LinksPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [category, setCategory] = useState<LinkItem["category"]>("generic");
  const [method, setMethod] = useState<LinkItem["method"]>("pix");
  const [featuredType, setFeaturedType] = useState<LinkItem["featured_type"]>(
    null
  );
  const [sortOrder, setSortOrder] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [editCategory, setEditCategory] = useState<LinkItem["category"]>(
    "generic"
  );
  const [editMethod, setEditMethod] = useState<LinkItem["method"]>("pix");
  const [editFeaturedType, setEditFeaturedType] =
    useState<LinkItem["featured_type"]>(null);
  const [editSortOrder, setEditSortOrder] = useState(0);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

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
        .select("id, name, slug")
        .eq("organization_id", orgData.id)
        .order("created_at", { ascending: false });

      if (locationError) {
        setError("Nao foi possivel carregar localidades.");
      } else {
        setLocations(locationData ?? []);
        if (locationData && locationData.length > 0) {
          setSelectedLocationId(locationData[0].id);
        }
      }

      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadLinks() {
      if (!selectedLocationId) {
        setLinks([]);
        return;
      }
      const { data, error: linksError } = await supabase
        .from("links")
        .select(
          "id, title, url, description, icon_url, category, method, featured_type, sort_order, is_active"
        )
        .eq("location_id", selectedLocationId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (linksError) {
        setError("Nao foi possivel carregar links.");
        return;
      }

      setLinks(data ?? []);
    }

    loadLinks();
  }, [selectedLocationId]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLocationId) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("links").insert({
      location_id: selectedLocationId,
      title,
      url: normalizeUrl(url),
      description: description || null,
      icon_url: iconUrl || null,
      category,
      method: category === "payment" ? method : null,
      featured_type: featuredType,
      sort_order: Number.isNaN(Number(sortOrder)) ? 0 : Number(sortOrder),
      is_active: true
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const { data } = await supabase
      .from("links")
      .select(
        "id, title, url, description, icon_url, category, method, featured_type, sort_order, is_active"
      )
      .eq("location_id", selectedLocationId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    setLinks(data ?? []);
    setTitle("");
    setUrl("");
    setDescription("");
    setIconUrl("");
    setCategory("generic");
    setMethod("pix");
    setFeaturedType(null);
    setSortOrder(0);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase
      .from("links")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setLinks((prev) => prev.filter((link) => link.id !== id));
  }

  async function toggleActive(link: LinkItem) {
    const { error: updateError } = await supabase
      .from("links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setLinks((prev) =>
      prev.map((item) =>
        item.id === link.id ? { ...item, is_active: !item.is_active } : item
      )
    );
  }

  function startEdit(link: LinkItem) {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditDescription(link.description ?? "");
    setEditIconUrl(link.icon_url ?? "");
    setEditCategory(link.category);
    setEditMethod(link.method ?? "pix");
    setEditFeaturedType(link.featured_type ?? null);
    setEditSortOrder(link.sort_order);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditUrl("");
    setEditDescription("");
    setEditIconUrl("");
    setEditCategory("payment");
    setEditMethod("pix");
    setEditFeaturedType(null);
    setEditSortOrder(0);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("links")
      .update({
        title: editTitle,
        url: normalizeUrl(editUrl),
        description: editDescription || null,
        icon_url: editIconUrl || null,
        category: editCategory,
        method: editCategory === "payment" ? editMethod : null,
        featured_type: editFeaturedType,
        sort_order: Number.isNaN(Number(editSortOrder)) ? 0 : Number(editSortOrder)
      })
      .eq("id", editingId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setLinks((prev) =>
      prev.map((link) =>
        link.id === editingId
          ? {
              ...link,
              title: editTitle,
              url: editUrl,
              description: editDescription || null,
              icon_url: editIconUrl || null,
              category: editCategory,
              method: editCategory === "payment" ? editMethod : null,
              featured_type: editFeaturedType,
              sort_order: Number.isNaN(Number(editSortOrder))
                ? 0
                : Number(editSortOrder)
            }
          : link
      )
    );

    cancelEdit();
    setSaving(false);
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando links...</p>
        </div>
      </main>
    );
  }

  const activeLinks = links.filter((link) => link.is_active);
  const featuredLinks = activeLinks.filter((link) => link.featured_type);

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
            <h1>Links</h1>
            <p>TAP para comunicar, avisar e facilitar ofertas.</p>
          </div>
          <div className="hero-card">
            <strong>Organizacao</strong>
            <span>{org?.name}</span>
            <span style={{ color: "var(--muted)" }}>Slug: {org?.slug}</span>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 32 }}>
          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Selecionar localidade</h3>
            <select
              value={selectedLocationId}
              onChange={(event) => setSelectedLocationId(event.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--stroke)",
                background: "#ffffff",
                color: "var(--ink)"
              }}
            >
              {locations.length === 0 ? (
                <option value="">Nenhuma localidade cadastrada</option>
              ) : (
                locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))
              )}
            </select>
            {selectedLocation ? (
              <div className="nav-actions" style={{ marginTop: 8 }}>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>
                  Link publico: /go/{org?.slug}/{selectedLocation.slug}
                </span>
                <a
                  className="btn btn-secondary"
                  href={`/go/${org?.slug}/${selectedLocation.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Previa do site
                </a>
              </div>
            ) : null}
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Novo link</h3>
            <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Titulo
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Oferta geral"
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
                URL
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://"
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
                Descricao (opcional)
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex: Culto ao vivo, novo video, etc."
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
                Icone (opcional)
                <input
                  type="url"
                  value={iconUrl}
                  onChange={(event) => setIconUrl(event.target.value)}
                  placeholder="https://.../icon-16.png"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                />
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ICON_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIconUrl(preset.url)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                Tipo de link
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as LinkItem["category"])
                  }
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                >
                  <option value="generic">Generico</option>
                  <option value="payment">Pagamento</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Metodo
                <select
                  value={method ?? "pix"}
                  onChange={(event) =>
                    setMethod(event.target.value as LinkItem["method"])
                  }
                  disabled={category === "generic"}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                >
                  <option value="pix">Pix</option>
                  <option value="digital_wallet">Carteira digital</option>
                  <option value="custom">Outro</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Destaque (opcional)
                <select
                  value={featuredType ?? ""}
                  onChange={(event) =>
                    setFeaturedType(
                      (event.target.value || null) as LinkItem["featured_type"]
                    )
                  }
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                >
                  <option value="">Sem destaque</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="site">Site</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Ordem
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value))}
                  min={0}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                />
              </label>
              {error ? <span style={{ color: "#f2a1a1" }}>{error}</span> : null}
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar link"}
              </button>
            </form>
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Links cadastrados</h3>
            {links.length === 0 ? (
              <p>Sem links para essa localidade.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {links.map((link) => (
                  <div
                    key={link.id}
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
                    {editingId === link.id ? (
                      <form
                        onSubmit={handleUpdate}
                        style={{ display: "grid", gap: 10, width: "100%" }}
                      >
                        <label style={{ display: "grid", gap: 6 }}>
                          Titulo
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
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
                          URL
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(event) => setEditUrl(event.target.value)}
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
                          Descricao (opcional)
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
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
                          Icone (opcional)
                          <input
                            type="url"
                            value={editIconUrl}
                            onChange={(event) => setEditIconUrl(event.target.value)}
                            placeholder="https://.../icon-16.png"
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
                              color: "var(--ink)"
                            }}
                          />
                        </label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {ICON_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setEditIconUrl(preset.url)}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <label style={{ display: "grid", gap: 6 }}>
                          Tipo de link
                          <select
                            value={editCategory}
                            onChange={(event) =>
                              setEditCategory(
                                event.target.value as LinkItem["category"]
                              )
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
                              color: "var(--ink)"
                            }}
                          >
                            <option value="generic">Generico</option>
                            <option value="payment">Pagamento</option>
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          Metodo
                          <select
                            value={editMethod ?? "pix"}
                            onChange={(event) =>
                              setEditMethod(event.target.value as LinkItem["method"])
                            }
                            disabled={editCategory === "generic"}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
                              color: "var(--ink)"
                            }}
                          >
                            <option value="pix">Pix</option>
                            <option value="digital_wallet">Carteira digital</option>
                            <option value="custom">Outro</option>
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          Destaque (opcional)
                          <select
                            value={editFeaturedType ?? ""}
                            onChange={(event) =>
                              setEditFeaturedType(
                                (event.target.value || null) as LinkItem["featured_type"]
                              )
                            }
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
                              color: "var(--ink)"
                            }}
                          >
                            <option value="">Sem destaque</option>
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                            <option value="site">Site</option>
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          Ordem
                          <input
                            type="number"
                            value={editSortOrder}
                            onChange={(event) =>
                              setEditSortOrder(Number(event.target.value))
                            }
                            min={0}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid var(--stroke)",
                              background: "#ffffff",
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
                          <strong>{link.title}</strong>
                          <div style={{ color: "var(--muted)" }}>{link.url}</div>
                          <div style={{ color: "var(--muted)", fontSize: 13 }}>
                            {link.category === "payment"
                              ? `pagamento · ${link.method ?? "pix"}`
                              : "link generico"}
                            {link.featured_type ? " · destaque" : ""}
                            {" "}· ordem {link.sort_order}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => startEdit(link)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => toggleActive(link)}
                          >
                            {link.is_active ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDelete(link.id)}
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

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Preview do micro-site</h3>
            <p style={{ color: "var(--muted)" }}>
              Simulacao de como o membro vai ver no celular.
            </p>
            <div className="phone" style={{ marginTop: 16 }}>
              <div className="phone-screen">
                <div className="phone-header">
                  <strong>{org?.name ?? "Igreja"}</strong>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    {selectedLocation?.name ?? "Localidade"}
                  </span>
                </div>
                {featuredLinks.length > 0 ? (
                  <div className="featured-list">
                    <span className="featured-badge">Destaques</span>
                    {featuredLinks.map((link) => (
                      <a
                        key={link.id}
                        className="phone-link"
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <strong>{link.title}</strong>
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>
                            {link.featured_type}
                          </span>
                        </div>
                        <span style={{ color: "var(--muted)" }}>Abrir</span>
                      </a>
                    ))}
                  </div>
                ) : null}

                {activeLinks.length === 0 ? (
                  <div className="phone-link">
                    <span>Sem links ativos</span>
                    <span style={{ color: "var(--muted)" }}>-</span>
                  </div>
                ) : (
                  activeLinks
                    .filter((link) => !link.featured_type)
                    .map((link) => (
                      <a
                        key={link.id}
                        className="phone-link"
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <strong>{link.title}</strong>
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>
                            {link.category === "payment"
                              ? `Pagamento · ${link.method ?? "pix"}`
                              : "Link"}
                          </span>
                        </div>
                        <span style={{ color: "var(--muted)" }}>Abrir</span>
                      </a>
                    ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
