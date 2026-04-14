import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedOrg, stripeRequest } from "../_lib";

type StripeLoginLinkResponse = { url: string };

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { organizationId } = (await request.json()) as { organizationId?: string };

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId e obrigatorio." }, { status: 400 });
    }

    const { serviceClient } = await requireAuthorizedOrg(authHeader, organizationId);

    const { data: organization, error } = await serviceClient
      .from("organizations")
      .select("id, stripeAccountId, stripe_account_id")
      .eq("id", organizationId)
      .maybeSingle();

    if (error || !organization) {
      return NextResponse.json({ error: "Organizacao nao encontrada." }, { status: 404 });
    }

    const stripeAccountId = organization.stripeAccountId ?? organization.stripe_account_id ?? null;
    if (!stripeAccountId) {
      return NextResponse.json({ error: "Conta Stripe ainda nao configurada." }, { status: 400 });
    }

    const loginLink = await stripeRequest<StripeLoginLinkResponse>(
      `/v1/accounts/${stripeAccountId}/login_links`,
      "POST",
      new URLSearchParams()
    );

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
