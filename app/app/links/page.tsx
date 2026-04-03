"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PanelHeader from "@/app/components/PanelHeader";

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
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);
  const [hasIconUrlColumn, setHasIconUrlColumn] = useState(true);
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

      if (linksError && linksError.message.includes("icon_url")) {
        // Fallback temporario para bancos ainda sem a coluna icon_url.
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("links")
          .select(
            "id, title, url, description, category, method, featured_type, sort_order, is_active"
          )
          .eq("location_id", selectedLocationId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (fallbackError) {
          setError("Nao foi possivel carregar links.");
          return;
        }

        setHasIconUrlColumn(false);
        setSchemaWarning(
          "Banco sem coluna icon_url. Rode o SQL de atualizacao para habilitar icones."
        );
        setLinks(
          (fallbackData ?? []).map((item) => ({
            ...item,
            icon_url: null
          }))
        );
        return;
      }

      if (linksError) {
        setError("Nao foi possivel carregar links.");
        return;
      }

      setHasIconUrlColumn(true);
      setLinks(data ?? []);
    }

    loadLinks();
  }, [selectedLocationId]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLocationId) return;

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      location_id: selectedLocationId,
      title,
      url: normalizeUrl(url),
      description: description || null,
      category,
      method: category === "payment" ? method : null,
      featured_type: featuredType,
      sort_order: Number.isNaN(Number(sortOrder)) ? 0 : Number(sortOrder),
      is_active: true
    };
    if (hasIconUrlColumn) payload.icon_url = iconUrl || null;

    const { error: insertError } = await supabase.from("links").insert(payload);

    if (insertError && insertError.message.includes("icon_url")) {
      setHasIconUrlColumn(false);
      setSchemaWarning(
        "Banco sem coluna icon_url. Link salvo sem icone ate aplicar o SQL."
      );
      const { error: retryError } = await supabase.from("links").insert({
        location_id: selectedLocationId,
        title,
        url: normalizeUrl(url),
        description: description || null,
        category,
        method: category === "payment" ? method : null,
        featured_type: featuredType,
        sort_order: Number.isNaN(Number(sortOrder)) ? 0 : Number(sortOrder),
        is_active: true
      });
      if (retryError) {
        setError(retryError.message);
        setSaving(false);
        return;
      }
    } else if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const selectColumns = hasIconUrlColumn
      ? "id, title, url, description, icon_url, category, method, featured_type, sort_order, is_active"
      : "id, title, url, description, category, method, featured_type, sort_order, is_active";

    const { data } = await supabase
      .from("links")
      .select(selectColumns as never)
      .eq("location_id", selectedLocationId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    const normalizedData = (data as unknown as Record<string, unknown>[] | null) ?? [];
    setLinks(
      normalizedData.map((item) => ({
        ...item,
        icon_url: "icon_url" in item ? (item.icon_url as string | null) : null
      })) as LinkItem[]
    );
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

    const updatePayload: Record<string, unknown> = {
      title: editTitle,
      url: normalizeUrl(editUrl),
      description: editDescription || null,
      category: editCategory,
      method: editCategory === "payment" ? editMethod : null,
      featured_type: editFeaturedType,
      sort_order: Number.isNaN(Number(editSortOrder)) ? 0 : Number(editSortOrder)
    };
    if (hasIconUrlColumn) updatePayload.icon_url = editIconUrl || null;

    const { error: updateError } = await supabase
      .from("links")
      .update(updatePayload)
      .eq("id", editingId);

    if (updateError && updateError.message.includes("icon_url")) {
      setHasIconUrlColumn(false);
      setSchemaWarning(
        "Banco sem coluna icon_url. Edicao salva sem icone ate aplicar o SQL."
      );
      const { error: retryUpdateError } = await supabase
        .from("links")
        .update({
          title: editTitle,
          url: normalizeUrl(editUrl),
          description: editDescription || null,
          category: editCategory,
          method: editCategory === "payment" ? editMethod : null,
          featured_type: editFeaturedType,
          sort_order: Number.isNaN(Number(editSortOrder)) ? 0 : Number(editSortOrder)
        })
        .eq("id", editingId);
      if (retryUpdateError) {
        setError(retryUpdateError.message);
        setSaving(false);
        return;
      }
    } else if (updateError) {
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

  async function handleCopyPublicUrl() {
    if (!org || !selectedLocation) return;
    const publicUrl = `${window.location.origin}/go/${org.slug}/${selectedLocation.slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyMessage("URL copiada.");
    } catch {
      setCopyMessage("Nao foi possivel copiar.");
    }
    setTimeout(() => setCopyMessage(null), 1800);
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
        <PanelHeader
          navLinks={[
            { href: "/app", label: "Painel" },
            { href: "/app/locations", label: "Localidades" },
            { href: "/app/tags", label: "Tags" },
            { href: "/app/links", label: "Links" },
            { href: "/app/team", label: "Equipe" },
            { href: "/app/settings", label: "Micro-site" }
          ]}
        />

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

        <section className="dashboard-grid-2" style={{ marginTop: 32 }}>
          <div className="surface-card span-2 compact-card">
            <h3>Localidade ativa</h3>
            <p className="muted-copy">Escolha a unidade que voce quer editar agora. Tudo abaixo acompanha essa selecao.</p>
            <select
              value={selectedLocationId}
              onChange={(event) => setSelectedLocationId(event.target.value)}
              className="admin-select"
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
              <div className="location-context">
                  <span className="public-url-inline">URL publica: /go/{org?.slug}/{selectedLocation.slug}</span>
                <div className="section-toolbar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCopyPublicUrl}
                  >
                    Copiar URL
                  </button>
                  {copyMessage ? (
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>{copyMessage}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {schemaWarning ? (
              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #f2b8b5",
                  borderRadius: 10,
                  padding: 10,
                  color: "#8a1f17",
                  background: "#fff5f4"
                }}
              >
                {schemaWarning}
              </div>
            ) : null}
          </div>

          <div className="surface-card span-2">
            <h3>Novo link</h3>
            <form onSubmit={handleCreate} className="stack-form">
              <label className="field">
                Titulo
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Oferta geral"
                  required
                  className="admin-input"
                />
              </label>
              <label className="field">
                URL
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://"
                  required
                  className="admin-input"
                />
              </label>
              <label className="field">
                Descricao (opcional)
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex: Culto ao vivo, novo video, etc."
                  className="admin-input"
                />
              </label>
              {hasIconUrlColumn ? (
                <>
                  <label className="field">
                    Icone (opcional)
                    <input
                      type="url"
                      value={iconUrl}
                      onChange={(event) => setIconUrl(event.target.value)}
                      placeholder="https://.../icon-16.png"
                      className="admin-input"
                    />
                  </label>
                  <div className="section-toolbar">
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
                </>
              ) : null}
              <label className="field">
                Tipo de link
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as LinkItem["category"])
                  }
                  className="admin-input"
                >
                  <option value="generic">Generico</option>
                  <option value="payment">Pagamento</option>
                </select>
              </label>
              <label className="field">
                Metodo
                <select
                  value={method ?? "pix"}
                  onChange={(event) =>
                    setMethod(event.target.value as LinkItem["method"])
                  }
                  disabled={category === "generic"}
                  className="admin-input"
                >
                  <option value="pix">Pix</option>
                  <option value="digital_wallet">Carteira digital</option>
                  <option value="custom">Outro</option>
                </select>
              </label>
              <label className="field">
                Destaque (opcional)
                <select
                  value={featuredType ?? ""}
                  onChange={(event) =>
                    setFeaturedType(
                      (event.target.value || null) as LinkItem["featured_type"]
                    )
                  }
                  className="admin-input"
                >
                  <option value="">Sem destaque</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="site">Site</option>
                </select>
              </label>
              <label className="field">
                Ordem
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value))}
                  min={0}
                  className="admin-input"
                />
              </label>
              {error ? <span className="form-error">{error}</span> : null}
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar link"}
              </button>
            </form>
          </div>

          <div className="surface-card span-2">
            <h3>Links cadastrados</h3>
            {links.length === 0 ? (
              <p>Sem links para essa localidade.</p>
            ) : (
              <div className="link-admin-list">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="link-admin-item"
                  >
                    {editingId === link.id ? (
                      <form onSubmit={handleUpdate} className="stack-form" style={{ width: "100%" }}>
                        <label className="field">
                          Titulo
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
                            required
                            className="admin-input"
                          />
                        </label>
                        <label className="field">
                          URL
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(event) => setEditUrl(event.target.value)}
                            required
                            className="admin-input"
                          />
                        </label>
                        <label className="field">
                          Descricao (opcional)
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                            className="admin-input"
                          />
                        </label>
                        {hasIconUrlColumn ? (
                          <>
                            <label className="field">
                              Icone (opcional)
                              <input
                                type="url"
                                value={editIconUrl}
                                onChange={(event) => setEditIconUrl(event.target.value)}
                                placeholder="https://.../icon-16.png"
                                className="admin-input"
                              />
                            </label>
                            <div className="section-toolbar">
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
                          </>
                        ) : null}
                        <label className="field">
                          Tipo de link
                          <select
                            value={editCategory}
                            onChange={(event) =>
                              setEditCategory(
                                event.target.value as LinkItem["category"]
                              )
                            }
                            className="admin-input"
                          >
                            <option value="generic">Generico</option>
                            <option value="payment">Pagamento</option>
                          </select>
                        </label>
                        <label className="field">
                          Metodo
                          <select
                            value={editMethod ?? "pix"}
                            onChange={(event) =>
                              setEditMethod(event.target.value as LinkItem["method"])
                            }
                            disabled={editCategory === "generic"}
                            className="admin-input"
                          >
                            <option value="pix">Pix</option>
                            <option value="digital_wallet">Carteira digital</option>
                            <option value="custom">Outro</option>
                          </select>
                        </label>
                        <label className="field">
                          Destaque (opcional)
                          <select
                            value={editFeaturedType ?? ""}
                            onChange={(event) =>
                              setEditFeaturedType(
                                (event.target.value || null) as LinkItem["featured_type"]
                              )
                            }
                            className="admin-input"
                          >
                            <option value="">Sem destaque</option>
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                            <option value="site">Site</option>
                          </select>
                        </label>
                        <label className="field">
                          Ordem
                          <input
                            type="number"
                            value={editSortOrder}
                            onChange={(event) =>
                              setEditSortOrder(Number(event.target.value))
                            }
                            min={0}
                            className="admin-input"
                          />
                        </label>
                        {error ? (
                          <span className="form-error">{error}</span>
                        ) : null}
                        <div className="section-toolbar">
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
                        <div className="link-admin-main">
                          <div className="link-admin-head">
                            <strong>{link.title}</strong>
                            <div className="link-admin-badges">
                              <span className="badge soft-badge">{link.category === "payment" ? "Pagamento" : "Link"}</span>
                              {link.featured_type ? <span className="badge soft-badge">Destaque</span> : null}
                            </div>
                          </div>
                          <a
                            className="link-admin-url"
                            href={normalizeUrl(link.url)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.url}
                          </a>
                          <div className="link-admin-meta">
                            <span>{link.description || "Sem descricao curta cadastrada."}</span>
                            <span>Ordem {link.sort_order}</span>
                          </div>
                        </div>
                        <div className="link-admin-actions">
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
                            className="btn btn-danger"
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

          <div className="surface-card span-2">
            <h3>Previa da pagina</h3>
            <p className="muted-copy">Visual de referencia da pagina publica da localidade.</p>
            <div className="phone link-preview-phone" style={{ marginTop: 16 }}>
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
