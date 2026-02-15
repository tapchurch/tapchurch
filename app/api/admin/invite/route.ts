import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Variaveis do Supabase ausentes no servidor." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Token ausente." }, { status: 401 });
    }

    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const organizationId = String(body?.organizationId ?? "").trim();

    if (!email || !organizationId) {
      return NextResponse.json(
        { error: "organizationId e email sao obrigatorios." },
        { status: 400 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      request.nextUrl.origin ??
      "http://localhost:3000";

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/login`,
      data: {
        organization_id: organizationId,
        invited_via: "tapchurch_admin"
      }
    });

    if (inviteError) {
      return NextResponse.json(
        { error: `Falha no envio do convite: ${inviteError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
