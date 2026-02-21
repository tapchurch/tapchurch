"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PanelHeader from "@/app/components/PanelHeader";

type ProfileData = {
  email: string;
  fullName: string;
  phone: string;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    email: "",
    fullName: "",
    phone: ""
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setProfile({
        email: data.user.email ?? "",
        fullName: String(data.user.user_metadata?.full_name ?? ""),
        phone: String(data.user.user_metadata?.phone ?? "")
      });
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Carregando perfil...</p>
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
            { href: "/app/team", label: "Equipe" }
          ]}
        />

        <section className="hero">
          <div>
            <h1>Meu perfil</h1>
            <p>Informações da sua conta de acesso ao painel.</p>
          </div>
          <div className="hero-card">
            <strong>E-mail</strong>
            <span>{profile.email || "-"}</span>
            <strong>Nome</strong>
            <span>{profile.fullName || "-"}</span>
            <strong>Telefone</strong>
            <span>{profile.phone || "-"}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
