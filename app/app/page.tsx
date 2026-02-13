"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserProfile = {
  email: string;
};

type Metrics = {
  locations: number;
  tags: number;
  links: number;
  activeLinks: number;
  clicksTotal: number;
  clicks7d: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setProfile({ email: data.user.email ?? "" });

      const { data: membershipData } = await supabase
        .from("memberships")
        .select("organization_id, organizations(name)")
        .eq("user_id", data.user.id)
        .single();

      const orgId = membershipData?.organization_id;
      const org = membershipData?.organizations as { name?: string } | null;
      setOrgName(org?.name ?? null);

      if (orgId) {
        const [locationsRes, tagsRes, locationIdsRes] = await Promise.all([
          supabase
            .from("locations")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId),
          supabase
            .from("tags")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId),
          supabase.from("locations").select("id").eq("organization_id", orgId)
        ]);

        const locationIds = locationIdsRes.data?.map((item) => item.id) ?? [];

        const linksRes = locationIds.length
          ? await supabase
              .from("links")
              .select("id", { count: "exact", head: true })
              .in("location_id", locationIds)
          : { count: 0 };

        const activeLinksRes = locationIds.length
          ? await supabase
              .from("links")
              .select("id", { count: "exact", head: true })
              .in("location_id", locationIds)
              .eq("is_active", true)
          : { count: 0 };

        const clicksTotalRes = locationIds.length
          ? await supabase
              .from("link_clicks")
              .select("id", { count: "exact", head: true })
              .in("location_id", locationIds)
          : { count: 0 };

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const clicks7dRes = locationIds.length
          ? await supabase
              .from("link_clicks")
              .select("id", { count: "exact", head: true })
              .in("location_id", locationIds)
              .gte("created_at", last7Days.toISOString())
          : { count: 0 };

        setMetrics({
          locations: locationsRes.count ?? 0,
          tags: tagsRes.count ?? 0,
          links: linksRes.count ?? 0,
          activeLinks: activeLinksRes.count ?? 0,
          clicksTotal: clicksTotalRes.count ?? 0,
          clicks7d: clicks7dRes.count ?? 0
        });
      }

      setLoading(false);
    }
    loadSession();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <nav className="nav" style={{ marginBottom: 32 }}>
          <div className="brand">{orgName ?? "TAP CHURCH"}</div>
          <div className="nav-links">
            <span>Logado: {profile?.email}</span>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Sair
          </button>
        </nav>

        <section className="hero">
          <div>
            <h1>Painel administrativo</h1>
            <p>Gerencie localidades, tags, links e micro-site.</p>
          </div>
          <div className="hero-card">
            <div className="grid" style={{ marginTop: 0 }}>
              <a className="card" href="/app/locations">
                <h3>Localidades</h3>
                <p>Crie sedes e filiais com links separados.</p>
              </a>
              <a className="card" href="/app/tags">
                <h3>Tags NFC</h3>
                <p>Associe tags aos locais e ative na hora.</p>
              </a>
              <a className="card" href="/app/links">
                <h3>Links</h3>
                <p>Pix, carteira digital e links genericos.</p>
              </a>
              <a className="card" href="/app/settings">
                <h3>Micro-site</h3>
                <p>Logo, cores e mensagem de boas-vindas.</p>
              </a>
            </div>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 32 }}>
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
            <h3>Links ativos</h3>
            <p>{metrics?.activeLinks ?? 0}</p>
          </div>
          <div className="card">
            <h3>Cliques totais</h3>
            <p>{metrics?.clicksTotal ?? 0}</p>
          </div>
          <div className="card">
            <h3>Cliques 7 dias</h3>
            <p>{metrics?.clicks7d ?? 0}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
