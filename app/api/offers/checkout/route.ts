import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StripeCheckoutResponse = {
  id: string;
  url: string;
  error?: {
    message?: string;
  };
};

function parseAmountToCents(amount: unknown) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export async function POST(request: NextRequest) {
  try {
    // Required envs:
    // - STRIPE_SECRET_KEY: Secret key da plataforma Stripe
    // - NEXT_PUBLIC_APP_URL: URL publica do app (ex: https://www.tapchurch.com.br)
    // - NEXT_PUBLIC_SUPABASE_URL: URL do projeto Supabase
    // - SUPABASE_SERVICE_ROLE_KEY: chave service_role do Supabase (apenas server)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey || !appUrl || !supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Configuracao incompleta de variaveis de ambiente." },
        { status: 500 }
      );
    }

    const { slug, amount } = (await request.json()) as {
      slug?: string;
      amount?: number;
    };

    if (!slug) {
      return NextResponse.json({ error: "Slug da igreja e obrigatorio." }, { status: 400 });
    }

    const amountInCents = parseAmountToCents(amount);
    if (!amountInCents || amountInCents < 100) {
      return NextResponse.json(
        { error: "Valor minimo da oferta: R$ 1,00." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json({ error: "Igreja nao encontrada." }, { status: 404 });
    }

    // Suporte para dois formatos de coluna.
    const stripeAccountId =
      organization.stripeAccountId ?? organization.stripe_account_id ?? null;

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Conta Stripe da igreja nao configurada." },
        { status: 400 }
      );
    }

    // Take rate da plataforma: 1% do valor ofertado.
    const applicationFeeAmount = Math.max(1, Math.round(amountInCents * 0.01));

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${appUrl}/link/${slug}?status=success`);
    params.set("cancel_url", `${appUrl}/link/${slug}?status=cancelled`);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "brl");
    params.set("line_items[0][price_data][unit_amount]", String(amountInCents));
    params.set(
      "line_items[0][price_data][product_data][name]",
      `Oferta - ${organization.name ?? "Igreja"}`
    );
    params.set(
      "line_items[0][price_data][product_data][description]",
      "Contribuicao via TAP Church"
    );
    params.set("payment_intent_data[application_fee_amount]", String(applicationFeeAmount));
    params.set("payment_intent_data[transfer_data][destination]", stripeAccountId);
    params.set("metadata[church_slug]", slug);
    params.set("metadata[platform]", "tapchurch");

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const stripeData = (await stripeResponse.json()) as StripeCheckoutResponse;
    if (!stripeResponse.ok || !stripeData.url) {
      return NextResponse.json(
        { error: stripeData.error?.message ?? "Falha ao criar Checkout." },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: stripeData.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
