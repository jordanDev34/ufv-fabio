// Sert à créer une connexion Supabase côté serveur. 
// Il permet un accès à la BDD Supabase en utilisant les cookies de l'user connecté.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Permet de fournir à Supabase la liste complète des cookies actuels
        getAll() {
          return cookieStore
            .getAll()
            .map((c) => ({ name: c.name, value: c.value }));
        },
        // Je laisse Supabase écrire(ou MAJ) tous les cookies nécessaires
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );
}
