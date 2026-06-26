// ============================================================
// Hook auth — session + profil courant (100% côté client)
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { asset } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data as Profile | null);
      setLoading(false);
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadProfile());

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = asset("/login/");
  };

  return { profile, loading, isAdmin: profile?.role === "admin", signOut };
}
