// ============================================================
// API — Connexion BARMAN par PIN à 4 chiffres
// Le barman tape juste un PIN. Côté serveur on retrouve le profil
// dont le pin_hash correspond, puis on ouvre sa session Supabase.
//
// Mécanique : chaque barman a un compte auth Supabase
// (email technique: barman+<username>@dahu.local) dont le MOT DE PASSE
// est le PIN lui-même. On vérifie le PIN via bcrypt (pin_hash) pour
// éviter de tester tous les comptes, puis on signe avec email+pin.
// ============================================================
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string" || pin.length !== 4) {
      return NextResponse.json({ error: "PIN invalide." }, { status: 400 });
    }

    // 1) Retrouver le barman dont le PIN correspond (parmi les barmen actifs)
    const admin = createAdminClient();
    const { data: barmen, error } = await admin
      .from("profiles")
      .select("id, username, pin_hash")
      .eq("role", "barman")
      .eq("active", true);

    if (error) throw error;

    let matched: { id: string; username: string } | null = null;
    for (const b of barmen ?? []) {
      if (b.pin_hash && bcrypt.compareSync(pin, b.pin_hash)) {
        matched = { id: b.id, username: b.username };
        break;
      }
    }

    if (!matched) {
      return NextResponse.json({ error: "PIN incorrect." }, { status: 401 });
    }

    // 2) Ouvrir la session : email technique + PIN comme mot de passe
    const email = `barman+${matched.username}@dahu.local`;
    const supabase = await createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (signErr) {
      return NextResponse.json(
        { error: "Connexion impossible. Contacte l'admin." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, username: matched.username });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
