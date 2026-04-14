import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedOrg, stripeRequest } from "../_lib";

type StripeRequirements = {
  currently_due?: string[];
  eventually_due?: string[];
  pending_verification?: string[];
  past_due?: string[];
  disabled_reason?: string | null;
};

type StripeAccount = {
  id: string;
  email?: string | null;
  country?: string | null;
  default_currency?: string | null;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  business_type?: string | null;
  requirements?: StripeRequirements;
  business_profile?: {
    name?: string | null;
    support_email?: string | null;
    url?: string | null;
  };
};

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId e obrigatorio." }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    const { serviceClient } = await requireAuthorizedOrg(authHeader, organizationId);

    const { data: organization, error } = await serviceClient
      .from("organizations")
      .select("id, name, slug, stripeAccountId, stripe_account_id, contact_email")
      .eq("id", organizationId)
      .maybeSingle();

    if (error || !organization) {
      return NextResponse.json({ error: "Organizacao nao encontrada." }, { status: 404 });
    }

    const stripeAccountId = organization.stripeAccountId ?? organization.stripe_account_id ?? null;
    if (!stripeAccountId) {
      return NextResponse.json({
        configured: false,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          contactEmail: organization.contact_email ?? null
        }
      });
    }

    const account = await stripeRequest<StripeAccount>(`/v1/accounts/${stripeAccountId}`, "GET");

    return NextResponse.json({
      configured: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        contactEmail: organization.contact_email ?? null
      },
      account: {
        id: account.id,
        email: account.email ?? organization.contact_email ?? null,
        country: account.country ?? "BR",
        currency: account.default_currency ?? "brl",
        detailsSubmitted: Boolean(account.details_submitted),
        chargesEnabled: Boolean(account.charges_enabled),
        payoutsEnabled: Boolean(account.payouts_enabled),
        businessType: account.business_type ?? null,
        businessName: account.business_profile?.name ?? null,
        supportEmail: account.business_profile?.support_email ?? null,
        supportUrl: account.business_profile?.url ?? null,
        requirements: {
          currentlyDue: account.requirements?.currently_due ?? [],
          eventuallyDue: account.requirements?.eventually_due ?? [],
          pendingVerification: account.requirements?.pending_verification ?? [],
          pastDue: account.requirements?.past_due ?? [],
          disabledReason: account.requirements?.disabled_reason ?? null
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
