import { NextRequest, NextResponse } from "next/server";
import { getStripeEnv, requireAuthorizedOrg, stripeRequest } from "../_lib";

type StripeAccountCreateResponse = { id: string; details_submitted?: boolean };
type StripeAccountLinkResponse = { url: string };

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { organizationId } = (await request.json()) as { organizationId?: string };

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId e obrigatorio." }, { status: 400 });
    }

    const { serviceClient } = await requireAuthorizedOrg(authHeader, organizationId);
    const { appUrl } = getStripeEnv();

    const { data: organization, error } = await serviceClient
      .from("organizations")
      .select("id, name, slug, stripeAccountId, stripe_account_id, contact_email")
      .eq("id", organizationId)
      .maybeSingle();

    if (error || !organization) {
      return NextResponse.json({ error: "Organizacao nao encontrada." }, { status: 404 });
    }

    let stripeAccountId = organization.stripeAccountId ?? organization.stripe_account_id ?? null;
    let detailsSubmitted = false;

    if (!stripeAccountId) {
      const createParams = new URLSearchParams();
      createParams.set("type", "express");
      createParams.set("country", "BR");
      createParams.set("capabilities[transfers][requested]", "true");
      createParams.set("capabilities[card_payments][requested]", "true");
      createParams.set("business_profile[name]", organization.name ?? "TAP Church Client");
      if (organization.contact_email) {
        createParams.set("email", organization.contact_email);
      }

      const account = await stripeRequest<StripeAccountCreateResponse>(
        "/v1/accounts",
        "POST",
        createParams
      );

      stripeAccountId = account.id;
      detailsSubmitted = Boolean(account.details_submitted);

      const { error: updateError } = await serviceClient
        .from("organizations")
        .update({ stripeAccountId })
        .eq("id", organizationId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    } else {
      const existingAccount = await stripeRequest<StripeAccountCreateResponse>(
        `/v1/accounts/${stripeAccountId}`,
        "GET"
      );
      detailsSubmitted = Boolean(existingAccount.details_submitted);
    }

    const linkParams = new URLSearchParams();
    linkParams.set("account", stripeAccountId);
    linkParams.set("refresh_url", `${appUrl}/app/stripe?refresh=1`);
    linkParams.set("return_url", `${appUrl}/app/stripe?connected=1`);
    linkParams.set("type", detailsSubmitted ? "account_update" : "account_onboarding");

    const accountLink = await stripeRequest<StripeAccountLinkResponse>(
      "/v1/account_links",
      "POST",
      linkParams
    );

    return NextResponse.json({ url: accountLink.url, accountId: stripeAccountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
