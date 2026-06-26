// ============================================================
// Client Supabase — côté SERVEUR
// Utilisé dans les Server Components et Route Handlers.
// Lit/écrit la session via les cookies Next.js.
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : ignoré (le middleware gère le refresh).
          }
        },
      },
    }
  );
}

// Client "admin" avec la clé service_role — CÔTÉ SERVEUR UNIQUEMENT.
// Contourne la RLS : réservé aux opérations sensibles (création d'utilisateurs).
import { createClient as createAdminClientBase } from "@supabase/supabase-js";

export function createAdminClient() {
  return createAdminClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
