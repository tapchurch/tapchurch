"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import OfferCheckoutForm from "@/app/components/OfferCheckoutForm";

type OrgData = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
};

type LocationData = {
  id: string;
  name: string;
  slug: string;
  welcome_title: string | null;
  welcome_text: string | null;
};

type LinkData = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon_url: string | null;
  category: "payment" | "generic";
  method: "pix" | "digital_wallet" | "custom" | null;
  featured_type: "instagram" | "youtube" | "site" | null;
};

function formatFeatured(type: string) {
  switch (type) {
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "site":
      return "Site";
    default:
      return "Destaque";
  }
}

function iconForFeatured(type: string) {
  switch (type) {
    case "instagram":
      return "https://cdn.simpleicons.org/instagram/111111";
    case "youtube":
      return "https://cdn.simpleicons.org/youtube/111111";
    case "site":
      return "https://cdn.simpleicons.org/googlechrome/111111";
    default:
      return "";
  }
}

function normalizeUrl(value: string) {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `https://${value}`;
}

function initialsFromName(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function PublicPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { orgSlug, locationSlug } = useMemo(() => {
    const parts = (pathname ?? "").split("/").filter(Boolean);
    return {
      orgSlug: parts[1] ?? "",
      locationSlug: parts[2] ?? ""
    };
  }, [pathname]);

  useEffect(() => {
    async function load() {
      if (!orgSlug || !locationSlug) {
        setError("Slug invalido.");
        setLoading(false);
        return;
      }

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url, primary_color, accent_color")
        .eq("slug", orgSlug)
        .maybeSingle();

      if (orgError || !orgData) {
        setError(orgError?.message ?? "Igreja nao encontrada.");
        setLoading(false);
        return;
      }

      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select("id, name, slug, welcome_title, welcome_text")
        .eq("organization_id", orgData.id)
        .eq("slug", locationSlug)
        .maybeSingle();

      if (locationError || !locationData) {
        setError(locationError?.message ?? "Localidade nao encontrada.");
        setLoading(false);
        return;
      }

      const { data: linkData } = await supabase
        .from("links")
        .select("id, title, url, description, icon_url, category, method, featured_type")
        .eq("location_id", locationData.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setOrg(orgData);
      setLocation(locationData);
      setLinks(linkData ?? []);
      setLoading(false);
    }

    load();
  }, [orgSlug, locationSlug]);

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  if (!org || !location) {
    return (
      <main>
        <div className="container">
          <p>Igreja nao encontrada.</p>
          {error ? <p style={{ color: "var(--muted)" }}>{error}</p> : null}
        </div>
      </main>
    );
  }

  const featured = links.filter((link) => link.featured_type);
  const normal = links.filter((link) => !link.featured_type);

  const primaryColor = org.primary_color ?? "#f4f7fb";
  const accentColor = org.accent_color ?? "#0ea5a6";
  const accentColorSoft = `${accentColor}1a`;

  return (
    <main>
      <div className="container" style={{ maxWidth: 680 }}>
        <section className="public-shell">
          <div
            className="public-hero"
            style={{
              background: `linear-gradient(180deg, ${accentColorSoft}, rgba(255,255,255,0.94))`
            }}
          >
            <div
              className="public-avatar"
              style={{ borderColor: accentColor, boxShadow: `0 18px 42px ${accentColorSoft}` }}
            >
              <img
                src={org.logo_url || "/tapchurch.png"}
                alt={org.name}
                onError={(event) => {
                  const img = event.currentTarget;
                  img.style.display = "none";
                  const fallback = img.nextElementSibling as HTMLSpanElement | null;
                  if (fallback) fallback.style.display = "grid";
                }}
              />
              <span className="public-avatar-fallback">{initialsFromName(org.name)}</span>
            </div>

            <div className="public-hero-copy">
              <span className="public-kicker">{org.name}</span>
              <h1>{location.welcome_title ?? location.name}</h1>
              <p>
                {location.welcome_text ??
                  "Ofertas, avisos e links oficiais em uma experiência simples e direta."}
              </p>
            </div>

            {featured.length > 0 ? (
              <div className="public-socials">
                {featured.map((link) => {
                  const icon = iconForFeatured(link.featured_type ?? "");
                  if (!icon) return null;
                  return (
                    <a
                      key={link.id}
                      href={normalizeUrl(link.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="public-social-link"
                      aria-label={formatFeatured(link.featured_type ?? "")}
                    >
                      <img
                        src={icon}
                        alt={formatFeatured(link.featured_type ?? "")}
                        className="micro-header-icon"
                      />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          <section className="public-links-stack">
          <OfferCheckoutForm churchSlug={org.slug} />

            {featured.length > 0 ? (
              <div className="public-section">
                <span className="featured-badge">Destaques</span>
                {featured.map((link) => (
                  <a
                    key={link.id}
                    href={normalizeUrl(link.url)}
                    className="public-link-card is-featured"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      borderColor: accentColor,
                      background: `linear-gradient(180deg, ${accentColorSoft}, rgba(255,255,255,0.98))`
                    }}
                  >
                    <div className="public-link-leading">
                      {link.icon_url ? (
                        <img src={link.icon_url} alt="" className="public-link-icon" />
                      ) : (
                        <span
                          className="public-link-icon public-link-icon-fallback"
                          style={{ color: accentColor }}
                        >
                          +
                        </span>
                      )}
                    </div>
                    <div className="public-link-body">
                      <strong>{link.title}</strong>
                      {link.description ? <span>{link.description}</span> : null}
                    </div>
                    <span className="public-link-arrow">Abrir</span>
                  </a>
                ))}
              </div>
            ) : null}

            {normal.length === 0 && featured.length === 0 ? (
              <div className="public-empty-state">
                <strong>Nenhum link ativo no momento</strong>
                <span>Volte em breve para novos acessos e campanhas.</span>
              </div>
            ) : (
              normal.map((link) => (
                <a
                  key={link.id}
                  href={normalizeUrl(link.url)}
                  className="public-link-card"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    borderColor: accentColor
                  }}
                >
                  <div className="public-link-leading">
                    {link.icon_url ? (
                      <img src={link.icon_url} alt="" className="public-link-icon" />
                    ) : (
                      <span
                        className="public-link-icon public-link-icon-fallback"
                        style={{ color: accentColor }}
                      >
                        +
                      </span>
                    )}
                  </div>
                  <div className="public-link-body">
                    <strong>{link.title}</strong>
                    {link.description ? <span>{link.description}</span> : null}
                  </div>
                  <span className="public-link-arrow">Abrir</span>
                </a>
              ))
            )}

            <div className="public-footer-note">
              <span>Powered by TAP CHURCH</span>
            </div>
          </section>
        </section>
      </div>
      <style>{`
        body { background: ${primaryColor}; }
        .card { background: #ffffff; }
        .public-link-card:hover {
          border-color: ${accentColor};
          box-shadow: 0 20px 38px ${accentColorSoft};
        }
      `}</style>
    </main>
  );
}
