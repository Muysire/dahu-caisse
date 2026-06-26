// ============================================================
// Middleware Next.js — protège /caisse et /admin, refresh session
// ============================================================
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et l'API d'images
    "/((?!_next/static|_next/image|favicon.ico|images|icons|manifest.json|.*\\.png$).*)",
  ],
};
