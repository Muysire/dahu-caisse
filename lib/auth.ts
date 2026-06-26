// ============================================================
// Helpers d'authentification / rôle (côté serveur)
// ============================================================
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** Récupère le profil de l'utilisateur connecté (ou null). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

/** Vrai si l'utilisateur connecté est admin actif. */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" && profile.active;
}
