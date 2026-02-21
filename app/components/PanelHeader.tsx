"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type HeaderLink = {
  href: string;
  label: string;
};

type PanelHeaderProps = {
  navLinks: HeaderLink[];
  logoHref?: string;
};

export default function PanelHeader({
  navLinks,
  logoHref = "/app"
}: PanelHeaderProps) {
  const [email, setEmail] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      setEmail(user.email ?? "");
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      setIsSuperAdmin(Boolean(roleData));
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="nav" style={{ marginBottom: 32 }}>
      <a href={logoHref} className="home-brand" aria-label="Ir para o painel">
        <img
          src="/tapchurch.png"
          alt="TAP CHURCH"
          style={{ width: 150, height: 44, objectFit: "contain" }}
        />
      </a>

      <div className="nav-links">
        {navLinks.map((item) => (
          <a href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </div>

      <div className="profile-menu">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setOpen((prev) => !prev)}
        >
          Perfil
        </button>
        {open ? (
          <div className="profile-popover">
            <strong style={{ fontSize: 14 }}>Conta</strong>
            <span className="admin-muted">{email || "Usuário"}</span>
            <a href="/app/profile">Meus dados</a>
            {isSuperAdmin ? <a href="/app/admin">Painel global</a> : null}
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleLogout}
              style={{ width: "100%" }}
            >
              Sair
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
