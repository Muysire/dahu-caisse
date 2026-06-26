// ============================================================
// Rafraîchissement de session Supabase dans le middleware Next.js
// + protection des routes selon le rôle.
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isCaisse = path.startsWith("/caisse");
  const isAdmin = path.startsWith("/admin");

  // Routes protégées : redirige vers /login si pas connecté
  if ((isCaisse || isAdmin) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Garde de rôle admin : vérifie le profil
  if (isAdmin && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.active) {
      const url = request.nextUrl.clone();
      url.pathname = "/caisse"; // un barman tombe sur la caisse
      return NextResponse.redirect(url);
    }
  }

  return response;
}
