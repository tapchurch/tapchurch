import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function normalizeUrl(value: string) {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `https://${value}`;
}

export default async function RedirectPage({
  params
}: {
  params: { id: string };
}) {
  if (!params.id || params.id === "undefined") {
    return (
      <main>
        <div className="container">
          <p>Link invalido.</p>
        </div>
      </main>
    );
  }

  const { data: link, error } = await supabase
    .from("links")
    .select("id, url, is_active, location_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!link || !link.is_active) {
    return (
      <main>
        <div className="container">
          <p>Link nao encontrado ou inativo.</p>
          <p style={{ color: "var(--muted)" }}>ID: {params.id}</p>
          {error ? (
            <p style={{ color: "var(--muted)" }}>Erro: {error.message}</p>
          ) : null}
        </div>
      </main>
    );
  }

  await supabase.from("link_clicks").insert({
    link_id: link.id,
    location_id: link.location_id
  });

  redirect(normalizeUrl(link.url));
}
