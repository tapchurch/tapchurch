"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
};

type Location = {
  id: string;
  name: string;
  slug: string;
  welcome_title: string | null;
  welcome_text: string | null;
};

const LOGO_BUCKET = "logos";

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f4f7fb");
  const [accentColor, setAccentColor] = useState("#0ea5a6");

  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeText, setWelcomeText] = useState("");

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
        .select(
          "organization_id, organizations(id, name, slug, logo_url, primary_color, accent_color)"
        )
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
      setLogoUrl(orgData.logo_url ?? "");
      setPrimaryColor(orgData.primary_color ?? "#f4f7fb");
      setAccentColor(orgData.accent_color ?? "#0ea5a6");

      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select("id, name, slug, welcome_title, welcome_text")
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
    if (!selectedLocation) {
      setWelcomeTitle("");
      setWelcomeText("");
      return;
    }
    setWelcomeTitle(selectedLocation.welcome_title ?? "");
    setWelcomeText(selectedLocation.welcome_text ?? "");
  }, [selectedLocation]);

  async function handleLogoUpload(file: File) {
    if (!org) return;

    setUploading(true);
    setError(null);

    const fileExt = file.name.split(".").pop();
    const filePath = `${org.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
    setLogoUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleOrgSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!org) return;

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        logo_url: logoUrl || null,
        primary_color: primaryColor || null,
        accent_color: accentColor || null
      })
      .eq("id", org.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
  }

  async function handleLocationSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLocationId) return;

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("locations")
      .update({
        welcome_title: welcomeTitle || null,
        welcome_text: welcomeText || null
      })
      .eq("id", selectedLocationId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === selectedLocationId
          ? { ...loc, welcome_title: welcomeTitle, welcome_text: welcomeText }
          : loc
      )
    );

    setSaving(false);
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando configuracoes...</p>
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
            <h1>Configuracoes do micro-site</h1>
            <p>Logo, cores e textos de boas-vindas.</p>
          </div>
          <div className="hero-card">
            <strong>{org?.name}</strong>
            <span style={{ color: "var(--muted)" }}>Slug: {org?.slug}</span>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 32 }}>
          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Branding</h3>
            <form onSubmit={handleOrgSave} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Logo (upload)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Logo (URL)
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="https://.../logo.png"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--stroke)",
                    background: "#ffffff",
                    color: "var(--ink)"
                  }}
                />
              </label>
              {logoUrl ? (
                <div>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    Preview
                  </span>
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={logoUrl}
                      alt="Logo"
                      style={{ maxWidth: 180 }}
                    />
                  </div>
                </div>
              ) : null}
              <label style={{ display: "grid", gap: 6 }}>
                Cor primaria (hex)
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  placeholder="#000000"
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
                Cor de destaque (hex)
                <input
                  type="text"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  placeholder="#737373"
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
                {saving ? "Salvando..." : "Salvar branding"}
              </button>
              {uploading ? (
                <span style={{ color: "var(--muted)" }}>Enviando logo...</span>
              ) : null}
            </form>
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Boas-vindas por localidade</h3>
            <label style={{ display: "grid", gap: 6 }}>
              Localidade
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
            </label>
            <form
              onSubmit={handleLocationSave}
              style={{ display: "grid", gap: 12, marginTop: 12 }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                Titulo
                <input
                  type="text"
                  value={welcomeTitle}
                  onChange={(event) => setWelcomeTitle(event.target.value)}
                  placeholder="Ex: Bem-vindo"
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
                Texto
                <textarea
                  value={welcomeText}
                  onChange={(event) => setWelcomeText(event.target.value)}
                  placeholder="Escreva uma mensagem curta para os membros."
                  rows={4}
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
                {saving ? "Salvando..." : "Salvar texto"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
