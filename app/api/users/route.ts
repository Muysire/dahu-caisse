// ============================================================
// API — Gestion des utilisateurs (admin uniquement)
// Création d'un compte :
//   - BARMAN : email technique barman+<username>@dahu.local,
//     mot de passe = PIN, + profile (pin_hash bcrypt).
//   - ADMIN  : email réel + mot de passe choisi, + profile.
// Suppression : retire le compte auth + le profil.
// ============================================================
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { role, username } = body;
    const admin = createAdminClient();

    if (role === "barman") {
      const { pin } = body;
      if (!username || !/^\d{4}$/.test(pin ?? "")) {
        return NextResponse.json(
          { error: "Nom d'utilisateur et PIN à 4 chiffres requis." },
          { status: 400 }
        );
      }

      // Vérifie l'unicité du username
      const { data: exists } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (exists) {
        return NextResponse.json(
          { error: "Ce nom d'utilisateur existe déjà." },
          { status: 409 }
        );
      }

      const email = `barman+${username}@dahu.local`;

      // 1) Crée le compte auth (mot de passe = PIN)
      const { data: created, error: authErr } = await admin.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true,
      });
      if (authErr || !created.user) {
        return NextResponse.json(
          { error: authErr?.message ?? "Création du compte impossible." },
          { status: 400 }
        );
      }

      // 2) Crée le profil (pin_hash bcrypt)
      const pin_hash = bcrypt.hashSync(pin, 10);
      const { error: profErr } = await admin.from("profiles").insert({
        id: created.user.id,
        username,
        role: "barman",
        pin_hash,
        active: true,
      });
      if (profErr) {
        // Rollback du compte auth si le profil échoue
        await admin.auth.admin.deleteUser(created.user.id);
        return NextResponse.json({ error: profErr.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    if (role === "admin") {
      const { email, password } = body;
      if (!username || !email || !password || password.length < 6) {
        return NextResponse.json(
          { error: "Nom, email et mot de passe (6+ caractères) requis." },
          { status: 400 }
        );
      }

      const { data: created, error: authErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authErr || !created.user) {
        return NextResponse.json(
          { error: authErr?.message ?? "Création impossible." },
          { status: 400 }
        );
      }

      const { error: profErr } = await admin.from("profiles").insert({
        id: created.user.id,
        username,
        role: "admin",
        active: true,
      });
      if (profErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        return NextResponse.json({ error: profErr.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  try {
    const { id } = await request.json();
    const admin = createAdminClient();
    // Supprime le compte auth (le profil part en cascade via la FK)
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur." },
      { status: 500 }
    );
  }
}
