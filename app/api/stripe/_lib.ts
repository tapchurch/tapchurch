import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`);
  }
  return value;
}

export function getStripeEnv() {
  return {
    stripeSecretKey: env("STRIPE_SECRET_KEY"),
    appUrl: env("NEXT_PUBLIC_APP_URL"),
    supabaseUrl: env("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY")
  };
}

export function getSupabaseClients(authHeader?: string) {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = getStripeEnv();

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined
  });

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });

  return { userClient, serviceClient };
}

export async function requireAuthorizedOrg(
  authHeader: string | null,
  organizationId: string
): Promise<{ user: User; serviceClient: SupabaseClient; isSuperAdmin: boolean }> {
  if (!authHeader) {
    throw new Error("Sessao invalida. Faça login novamente.");
  }

  const { userClient, serviceClient } = getSupabaseClients(authHeader);
  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Sessao invalida. Faça login novamente.");
  }

  const { data: roleData } = await userClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  const isSuperAdmin = Boolean(roleData);

  if (!isSuperAdmin) {
    const { data: membership } = await userClient
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!membership) {
      throw new Error("Você não tem acesso a esta organização.");
    }
  }

  return { user, serviceClient, isSuperAdmin };
}

type StripeMethod = "GET" | "POST";

export async function stripeRequest<T>(
  path: string,
  method: StripeMethod,
  body?: URLSearchParams
): Promise<T> {
  const { stripeSecretKey } = getStripeEnv();

  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {})
    },
    body: body?.toString()
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Falha ao falar com a Stripe.");
  }

  return payload;
}
