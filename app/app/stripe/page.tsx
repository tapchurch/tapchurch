"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PanelHeader from "@/app/components/PanelHeader";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type StripeStatus = {
  configured: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    contactEmail: string | null;
  };
  account?: {
    id: string;
    email: string | null;
    country: string;
    currency: string;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    businessType: string | null;
    businessName: string | null;
    supportEmail: string | null;
    supportUrl: string | null;
    requirements: {
      currentlyDue: string[];
      eventuallyDue: string[];
      pendingVerification: string[];
      pastDue: string[];
      disabledReason: string | null;
    };
  };
};

function formatRequirement(field: string) {
  return field
    .replace(/_/g, " ")
    .replace(/\./g, " · ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getAuthHeader() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sessao expirada. Faça login novamente.");
  }

  return `Bearer ${session.access_token}`;
}

export default function StripeSettingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Organization | null>(null);
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [workingAction, setWorkingAction] = useState<"onboarding" | "dashboard" | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      setIsSuperAdmin(Boolean(roleData));

      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("organization_id, organizations(id, name, slug)")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (membershipError || !membershipData?.organizations) {
        setError("Nao foi possivel identificar sua organizacao.");
        setLoading(false);
        return;
      }

      const orgValue = Array.isArray(membershipData.organizations)
        ? membershipData.organizations[0]
        : membershipData.organizations;
      const orgData = orgValue as Organization;
      setOrg(orgData);

      try {
        const authHeader = await getAuthHeader();
        const response = await fetch(`/api/stripe/account?organizationId=${orgData.id}`, {
          headers: { Authorization: authHeader }
        });
        const payload = (await response.json()) as StripeStatus & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao carregar configuracao Stripe.");
        }
        setStatus(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Falha inesperada.");
      }

      const connected = searchParams.get("connected");
      const refresh = searchParams.get("refresh");
      if (connected === "1") {
        setBanner("Conta Stripe atualizada. Recarregamos o status desta organizacao.");
      } else if (refresh === "1") {
        setBanner("Fluxo Stripe reaberto. Continue o preenchimento quando estiver pronto.");
      }

      setLoading(false);
    }

    load();
  }, [searchParams]);

  const needsAttention = useMemo(() => {
    const requirements = status?.account?.requirements;
    if (!requirements) return false;
    return (
      requirements.currentlyDue.length > 0 ||
      requirements.pendingVerification.length > 0 ||
      requirements.pastDue.length > 0 ||
      Boolean(requirements.disabledReason)
    );
  }, [status]);

  async function handleOpen(route: "/api/stripe/onboarding" | "/api/stripe/dashboard") {
    if (!org) return;
    setWorkingAction(route === "/api/stripe/onboarding" ? "onboarding" : "dashboard");
    setError(null);

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify({ organizationId: org.id })
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Nao foi possivel abrir a Stripe agora.");
      }

      window.location.href = payload.url;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro inesperado.");
      setWorkingAction(null);
    }
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando configuracao Stripe...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <PanelHeader
          navLinks={[
            { href: "/app", label: "Painel" },
            { href: "/app/locations", label: "Localidades" },
            { href: "/app/tags", label: "Tags" },
            { href: "/app/links", label: "Links" },
            { href: "/app/stripe", label: "Stripe" },
            { href: "/app/team", label: "Equipe" },
            { href: "/app/settings", label: "Micro-site" },
            ...(isSuperAdmin ? [{ href: "/app/admin", label: "Painel global" }] : [])
          ]}
        />

        <section className="hero">
          <div>
            <h1>Stripe</h1>
            <p>
              Configure a conta de recebimento da sua igreja sem sair do portal.
              Quando a conta estiver pronta, os pagamentos por cartao e carteira
              digital passam a funcionar na pagina publica.
            </p>
          </div>
          <div className="hero-card">
            <strong>{org?.name}</strong>
            <span style={{ color: "var(--muted)" }}>Slug: {org?.slug}</span>
            <div className="section-toolbar">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpen("/api/stripe/onboarding")}
                disabled={workingAction !== null}
              >
                {workingAction === "onboarding"
                  ? "Abrindo..."
                  : status?.configured
                    ? "Continuar configuracao"
                    : "Conectar Stripe"}
              </button>
              {status?.configured ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleOpen("/api/stripe/dashboard")}
                  disabled={workingAction !== null}
                >
                  {workingAction === "dashboard" ? "Abrindo..." : "Abrir dashboard Stripe"}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {banner ? <div className="stripe-banner">{banner}</div> : null}
        {error ? <div className="stripe-alert danger">{error}</div> : null}

        <section className="dashboard-grid-2" style={{ marginTop: 32 }}>
          <div className="surface-card span-2">
            <div className="stripe-section-header">
              <div>
                <h3>Status da conta</h3>
                <p className="muted-copy">
                  Este painel mostra se a Stripe ja esta pronta para receber
                  ofertas da igreja e quais passos ainda faltam.
                </p>
              </div>
              <div className="stripe-badge-row">
                <span className={`badge ${status?.configured ? "soft-badge" : ""}`}>
                  {status?.configured ? "Conta conectada" : "Conta nao conectada"}
                </span>
                {needsAttention ? <span className="badge soft-badge">Acao necessaria</span> : null}
              </div>
            </div>

            <div className="stripe-kpi-grid">
              <div className="stripe-kpi-card">
                <span>Recebimentos</span>
                <strong>{status?.account?.chargesEnabled ? "Ativos" : "Aguardando"}</strong>
              </div>
              <div className="stripe-kpi-card">
                <span>Repasses</span>
                <strong>{status?.account?.payoutsEnabled ? "Liberados" : "Bloqueados"}</strong>
              </div>
              <div className="stripe-kpi-card">
                <span>Cadastro</span>
                <strong>{status?.account?.detailsSubmitted ? "Enviado" : "Incompleto"}</strong>
              </div>
              <div className="stripe-kpi-card">
                <span>Conta</span>
                <strong>{status?.account?.id ?? "Nao criada"}</strong>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <h3>O que a igreja precisa informar</h3>
            <div className="stripe-checklist">
              <div className="stripe-checkitem">
                <strong>Dados da organizacao</strong>
                <span>Nome, e-mail, telefone e informacoes legais basicas.</span>
              </div>
              <div className="stripe-checkitem">
                <strong>Responsavel pela conta</strong>
                <span>Quem vai validar identidade e administrar recebimentos.</span>
              </div>
              <div className="stripe-checkitem">
                <strong>Conta bancaria</strong>
                <span>Destino dos repasses e dados para retirada dos valores.</span>
              </div>
              <div className="stripe-checkitem">
                <strong>Documentos e verificacoes</strong>
                <span>A Stripe solicita somente o que for necessario para ativacao.</span>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <h3>Como funciona aqui dentro</h3>
            <div className="stripe-checklist">
              <div className="stripe-checkitem">
                <strong>1. Conectar</strong>
                <span>Criamos a conta Express da igreja e abrimos o fluxo oficial da Stripe.</span>
              </div>
              <div className="stripe-checkitem">
                <strong>2. Validar</strong>
                <span>Voce preenche o necessario e acompanha pendencias por este painel.</span>
              </div>
              <div className="stripe-checkitem">
                <strong>3. Receber</strong>
                <span>Quando tudo estiver ativo, o checkout aparece na pagina publica.</span>
              </div>
            </div>
          </div>

          <div className="surface-card span-2">
            <h3>Pendencias e detalhes</h3>
            {!status?.configured ? (
              <p className="muted-copy">
                A conta Stripe ainda nao foi conectada. Clique em <strong>Conectar Stripe</strong>
                para iniciar o onboarding oficial.
              </p>
            ) : (
              <div className="stripe-detail-grid">
                <div className="stripe-detail-card">
                  <span className="stripe-detail-label">E-mail da conta</span>
                  <strong>{status.account?.email ?? status.organization.contactEmail ?? "Nao informado"}</strong>
                </div>
                <div className="stripe-detail-card">
                  <span className="stripe-detail-label">Pais / moeda</span>
                  <strong>{status.account?.country ?? "BR"} · {(status.account?.currency ?? "brl").toUpperCase()}</strong>
                </div>
                <div className="stripe-detail-card">
                  <span className="stripe-detail-label">Tipo de negocio</span>
                  <strong>{status.account?.businessType ?? "Nao definido"}</strong>
                </div>
                <div className="stripe-detail-card">
                  <span className="stripe-detail-label">Nome de exibicao</span>
                  <strong>{status.account?.businessName ?? status.organization.name}</strong>
                </div>
              </div>
            )}

            {status?.account?.requirements.currentlyDue?.length ? (
              <div className="stripe-requirements-box">
                <strong>Faltando agora</strong>
                <ul>
                  {status.account.requirements.currentlyDue.map((item) => (
                    <li key={item}>{formatRequirement(item)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {status?.account?.requirements.pendingVerification?.length ? (
              <div className="stripe-requirements-box">
                <strong>Em verificacao</strong>
                <ul>
                  {status.account.requirements.pendingVerification.map((item) => (
                    <li key={item}>{formatRequirement(item)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {status?.account?.requirements.disabledReason ? (
              <div className="stripe-alert danger">
                Motivo de bloqueio: {status.account.requirements.disabledReason}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
